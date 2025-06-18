import SparkMD5 from 'spark-md5';

/**
 * 获取文件扩展名
 * @param fileName 文件名
 * @returns 文件扩展名（小写），不带点
 */
/**
 * 格式化文件大小为人类可读格式
 * @param bytes 文件大小（字节）
 * @param decimals 保留小数位数
 * @returns 格式化后的大小字符串
 */
function formatSize(bytes, decimals = 2) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

class Uploader {
    options;
    file = null;
    chunks = [];
    fileId = "";
    uploadedChunks = new Set();
    totalProgress = 0;
    status = "idle";
    abortController = null;
    constructor(options) {
        this.options = {
            chunkSize: 2 * 1024 * 1024,
            allowedTypes: [],
            maxSize: 50,
            concurrency: 3,
            checkTimeout: 5000,
            onProgress: () => { },
            onComplete: () => { },
            onError: () => { },
            ...options,
        };
        // 将maxSize和chunkSize从MB转换为字节
        this.options.maxSize = this.options.maxSize * 1024 * 1024;
        this.options.chunkSize = this.options.chunkSize * 1024 * 1024;
    }
    // 设置文件
    setFile(file) {
        if (!this.validateFile(file))
            return false;
        this.file = file;
        this.status = "ready";
        return true;
    }
    // 文件验证
    validateFile(file) {
        // 类型验证
        if (this.options.allowedTypes.length &&
            !this.options.allowedTypes.includes(file.type)) {
            this.options.onError?.(`不支持的文件类型: ${file.type}`);
            return false;
        }
        // 大小验证
        if (file.size > this.options.maxSize) {
            this.options.onError?.(`文件大小超出限制: ${formatSize(file.size)} > ${formatSize(this.options.maxSize)}`);
            return false;
        }
        return true;
    }
    // 生成文件唯一ID (用于断点续传)
    async generateFileId(file) {
        return new Promise((resolve) => {
            const fileReader = new FileReader();
            const spark = new SparkMD5.ArrayBuffer();
            fileReader.onload = (e) => {
                spark.append(e.target?.result);
                resolve(`${spark.end(true)}-${file.name}-${file.size}`);
            };
            fileReader.readAsArrayBuffer(file);
        });
    }
    // 分割文件为分片
    splitFile(file) {
        const chunks = [];
        const chunkCount = Math.ceil(file.size / this.options.chunkSize);
        for (let i = 0; i < chunkCount; i++) {
            const start = i * this.options.chunkSize;
            const end = Math.min(start + this.options.chunkSize, file.size);
            chunks.push({
                index: i,
                start,
                end,
                size: end - start,
                blob: file.slice(start, end),
            });
        }
        return chunks;
    }
    // 检查已上传分片 (断点续传核心)
    async checkUploadedChunks() {
        if (!this.fileId || !this.file)
            return new Set();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.checkTimeout); // 使用配置的超时时间
        try {
            // 实际项目中应该调用后端接口查询已上传分片
            const response = await fetch(`${this.options.uploadUrl}/check?fileId=${this.fileId}`, { signal: controller.signal });
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            const { uploadedIndexes } = await response.json();
            return new Set(uploadedIndexes);
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            const isAbort = error.name === "AbortError";
            this.options.onError?.(`${isAbort ? "查询超时" : "检查已上传分片失败"}: ${errorMsg}`);
            return new Set(); // 失败时重新上传所有分片
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    // 上传单个分片
    async uploadChunk(chunk) {
        return new Promise((resolve, reject) => {
            if (!this.file || !this.fileId) {
                reject(new Error("文件未初始化"));
                return;
            }
            const formData = new FormData();
            formData.append("fileId", this.fileId);
            formData.append("chunkIndex", chunk.index.toString());
            formData.append("chunk", chunk.blob, `${this.file.name}.part${chunk.index}`);
            formData.append("totalChunks", this.chunks.length.toString());
            this.abortController = new AbortController();
            const { signal } = this.abortController;
            fetch(this.options.uploadUrl, {
                method: "POST",
                body: formData,
                signal,
            })
                .then((response) => {
                if (!response.ok)
                    throw new Error(`上传失败: ${response.statusText}`);
                resolve(true);
            })
                .catch((error) => {
                if (error.name !== "AbortError") {
                    reject(error);
                }
            });
        });
    }
    // 计算总体进度
    updateProgress() {
        const uploadedSize = this.chunks
            .filter((chunk) => this.uploadedChunks.has(chunk.index))
            .reduce((sum, chunk) => sum + chunk.size, 0);
        this.totalProgress = this.file
            ? Math.round((uploadedSize / this.file.size) * 100)
            : 0;
        this.options.onProgress?.(this.totalProgress);
    }
    // 并行上传分片
    async uploadChunks() {
        if (!this.file)
            throw new Error("未选择文件");
        this.status = "uploading";
        const uploadPromises = [];
        const remainingChunks = this.chunks.filter((chunk) => !this.uploadedChunks.has(chunk.index));
        // 控制并发上传数量
        for (let i = 0; i < remainingChunks.length; i++) {
            if (i % this.options.concurrency === 0) {
                await Promise.all(uploadPromises.splice(0, this.options.concurrency));
            }
            const chunk = remainingChunks[i];
            const promise = this.uploadChunk(chunk)
                .then(() => {
                this.uploadedChunks.add(chunk.index);
                this.updateProgress();
            })
                .catch((error) => {
                this.status = "error";
                this.options.onError?.(`分片 ${chunk.index} 上传失败: ${error.message}`);
                throw error; // 触发Promise.all捕获错误
            });
            uploadPromises.push(promise);
        }
        // 等待剩余的上传任务完成
        await Promise.all(uploadPromises);
        // 所有分片上传完成后，通知服务器合并文件
        if (this.uploadedChunks.size === this.chunks.length) {
            await this.mergeChunks();
        }
    }
    // 通知服务器合并分片
    async mergeChunks() {
        if (!this.fileId || !this.file)
            return;
        try {
            const response = await fetch(`${this.options.uploadUrl}/merge`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileId: this.fileId,
                    fileName: this.file.name,
                    totalChunks: this.chunks.length,
                }),
            });
            if (!response.ok)
                throw new Error("合并文件失败");
            const result = await response.json();
            this.status = "complete";
            this.options.onComplete?.(result);
        }
        catch (error) {
            this.status = "error";
            this.options.onError?.(`合并文件失败: ${error.message}`);
        }
    }
    // 开始上传
    async start() {
        if (!this.file || this.status === "uploading")
            return;
        try {
            // 生成文件ID
            this.fileId = await this.generateFileId(this.file);
            // 分割文件
            this.chunks = this.splitFile(this.file);
            // 检查已上传分片
            this.uploadedChunks = await this.checkUploadedChunks();
            // 更新进度
            this.updateProgress();
            // 如果所有分片都已上传，直接触发完成回调
            if (this.uploadedChunks.size === this.chunks.length) {
                this.status = "complete";
                this.options.onComplete?.({
                    fileId: this.fileId,
                    fileName: this.file.name,
                });
                return;
            }
            // 开始上传分片
            await this.uploadChunks();
        }
        catch (error) {
            this.status = "error";
            this.options.onError?.(`上传失败: ${error.message}`);
        }
    }
    // 暂停上传
    pause() {
        if (this.status === "uploading" && this.abortController) {
            this.abortController.abort();
            this.status = "paused";
        }
    }
    // 继续上传
    resume() {
        if (this.status === "paused") {
            this.start();
        }
    }
    // 取消上传
    cancel() {
        this.pause();
        this.file = null;
        this.chunks = [];
        this.fileId = "";
        this.uploadedChunks = new Set();
        this.totalProgress = 0;
        this.status = "idle";
    }
    // 获取当前状态
    getStatus() {
        return this.status;
    }
    // 获取当前进度
    getProgress() {
        return this.totalProgress;
    }
}

var plugin = {
    install: (app) => {
        // 注册全局上传方法
        app.config.globalProperties.$uploader = (options) => new Uploader(options);
    },
};

export { Uploader, plugin as uploadPlugin };
