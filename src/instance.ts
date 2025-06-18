import SparkMD5 from "spark-md5";
import { UploadOptions, UploadStatus, Chunk } from "./types";
import { formatSize, fetchWithRetry, isValidUrl } from "./utils";
import { HttpError } from "./errors";

export class Uploader {
  private options: Required<UploadOptions>;
  private file: File | null = null;
  private chunks: Chunk[] = [];
  private fileId: string = "";
  private uploadedChunks: Set<number> = new Set();
  private totalProgress: number = 0;
  private status: UploadStatus = "idle";
  private abortControllers: Set<AbortController> = new Set();

  constructor(options: UploadOptions) {
    // 配置验证
    if (
      options.chunkSize !== undefined &&
      (typeof options.chunkSize !== "number" || options.chunkSize <= 0)
    ) {
      throw new Error("无效的分片大小: 必须是正数");
    }
    if (
      options.maxSize !== undefined &&
      (typeof options.maxSize !== "number" || options.maxSize < 0)
    ) {
      throw new Error("无效的最大文件大小: 必须是非负数");
    }
    if (
      options.concurrency !== undefined &&
      (typeof options.concurrency !== "number" ||
        options.concurrency <= 0 ||
        !Number.isInteger(options.concurrency))
    ) {
      throw new Error("无效的并发数: 必须是正整数");
    }

    this.options = {
      fileIdFieldName: options.fileIdFieldName || "fileId",
      useChunkedUpload: options.useChunkedUpload || true,
      chunkSize: 2 * 1024 * 1024, // 默认2MB分片
      // 默认为空数组，表示允许所有文件类型
      // 如需限制文件类型，可指定具体MIME类型数组，如 ['image/jpeg', 'image/png']
      allowedTypes: [],
      maxSize: 50, // 默认50MB
      concurrency: 3,
      checkTimeout: 5000, // 默认5秒超时
      onProgress: () => {},
      onComplete: () => {},
      onError: () => {},
      ...options,
    };

    // 将maxSize和chunkSize从MB转换为字节
    this.options.maxSize = this.options.maxSize * 1024 * 1024;
    this.options.chunkSize = this.options.chunkSize * 1024 * 1024;
  }

  /**
   * 解析上传相关URL配置
   * @param action - 上传动作类型 ('upload' | 'check' | 'merge')
   * @returns 解析后的完整URL
   * @throws {Error} 当URL配置无效或缺失时抛出错误
   */
  private getResolvedUrl(action: "upload" | "check" | "merge"): string {
    const { uploadUrl } = this.options;
    if (!uploadUrl) {
      throw new Error("uploadUrl配置未提供");
    }

    if (typeof uploadUrl === "string") {
      // 处理字符串类型URL
      const baseUrl = uploadUrl.replace(/\/$/, ""); // 移除末尾斜杠
      const resolvedUrl = `${baseUrl}/${action}`;
      if (!isValidUrl(resolvedUrl)) {
        throw new Error(`无效的URL格式: ${resolvedUrl}`);
      }
      return resolvedUrl;
    }

    // 处理对象类型URL
    if (!uploadUrl[action]) {
      throw new Error(`uploadUrl对象缺少必要的'${action}'属性`);
    }
    if (!isValidUrl(uploadUrl[action])) {
      throw new Error(`无效的${action} URL格式: ${uploadUrl[action]}`);
    }
    return uploadUrl[action];
  }

  /**
   * 验证HTTP响应状态并解析JSON
   * @template T - 预期的响应数据类型
   * @param response - fetch API返回的Response对象
   * @returns 解析后的响应数据
   * @throws {Error} 当响应状态非OK或JSON解析失败时抛出错误
   */
  private async validateResponse<T = any>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorDetails = await response
        .text()
        .catch(() => "无法获取错误详情");
      throw new HttpError(
        `HTTP错误: ${response.status} ${response.statusText}`,
        response.status,
        response.url,
        errorDetails
      );
    }

    try {
      // 检查Content-Type是否为JSON
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }
      // 如果不是JSON，返回空对象或原始文本
      return { data: await response.text() } as T;
    } catch (error) {
      throw new Error(
        `响应解析失败 (${response.url}): ${(error as Error).message}`
      );
    }
  }

  // 设置文件
  setFile(file: File): boolean {
    if (!this.validateFile(file)) return false;
    this.file = file;
    this.status = "ready";
    return true;
  }

  // 文件验证
  private validateFile(file: File): boolean {
    // 类型验证
    if (
      this.options.allowedTypes.length &&
      !this.options.allowedTypes.includes(file.type)
    ) {
      this.options.onError?.(`不支持的文件类型: ${file.type}`);
      return false;
    }

    // 大小验证
    if (file.size > this.options.maxSize) {
      this.options.onError?.(
        `文件大小超出限制: ${formatSize(file.size)} > ${formatSize(
          this.options.maxSize
        )}`
      );
      return false;
    }

    return true;
  }

  // 生成文件唯一ID (用于断点续传)
  private async generateFileId(file: File): Promise<string> {
    return new Promise((resolve) => {
      const fileReader = new FileReader();
      const spark = new SparkMD5.ArrayBuffer();

      fileReader.onload = (e) => {
        spark.append(e.target?.result as ArrayBuffer);
        resolve(`${spark.end()}-${file.name}-${file.size}`);
      };

      fileReader.readAsArrayBuffer(file);
    });
  }

  // 分割文件为分片
  private splitFile(file: File): Chunk[] {
    const chunks: Chunk[] = [];
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
  private async checkUploadedChunks(): Promise<Set<number>> {
    if (!this.fileId || !this.file) return new Set();

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.options.checkTimeout
    ); // 使用配置的超时时间

    try {
      // 默认实现：调用后端接口查询已上传分片
      const response = await fetchWithRetry(
        this.getResolvedUrl("check") +
          `?${this.options.fileIdFieldName}=${this.fileId}`,
        { signal: controller.signal }
      );
      const { uploadedIndexes } = await this.validateResponse<{
        uploadedIndexes: number[];
      }>(response);
      return new Set(uploadedIndexes);
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isAbort = error.name === "AbortError";
      this.options.onError?.(
        `${isAbort ? "查询超时" : "检查已上传分片失败"}: ${errorMsg}`
      );
      return new Set(); // 失败时重新上传所有分片
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 上传单个分片
  private async uploadChunk(chunk: Chunk): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (!this.file || !this.fileId) {
        reject(new Error("文件未初始化"));
        return;
      }

      // 默认实现：使用FormData上传分片
      const formData = new FormData();
      formData.append(this.options.fileIdFieldName, this.fileId);
      formData.append("chunkIndex", chunk.index.toString());
      formData.append(
        "chunk",
        chunk.blob,
        `${this.file.name}.part${chunk.index}`
      );
      formData.append("totalChunks", this.chunks.length.toString());

      const abortController = new AbortController();
      this.abortControllers.add(abortController);
      const { signal } = abortController;
      const uploadUrl = this.getResolvedUrl("upload");
      fetchWithRetry(uploadUrl, {
        method: "POST",
        body: formData,
        signal,
      })
        .then((response) => {
          return this.validateResponse(response);
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            throw error;
          }
        })
        .finally(() => {
          this.abortControllers.delete(abortController);
        })
        .then(() => {
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
  private updateProgress(): void {
    const uploadedSize = this.chunks
      .filter((chunk) => this.uploadedChunks.has(chunk.index))
      .reduce((sum, chunk) => sum + chunk.size, 0);

    this.totalProgress = this.file
      ? Math.round((uploadedSize / this.file.size) * 100)
      : 0;
    this.options.onProgress?.(this.totalProgress);
  }

  // 并行上传分片
  private async uploadChunks(): Promise<void> {
    if (!this.file) throw new Error("未选择文件");

    this.status = "uploading";
    const uploadPromises: Promise<void>[] = [];
    const remainingChunks = this.chunks.filter(
      (chunk) => !this.uploadedChunks.has(chunk.index)
    );

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
          this.options.onError?.(
            `分片 ${chunk.index} 上传失败: ${error.message}`
          );
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
  private async mergeChunks(): Promise<void> {
    if (!this.fileId || !this.file) return;

    try {
      // 默认实现：调用后端合并接口
      const response = await fetchWithRetry(this.getResolvedUrl("merge"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [this.options.fileIdFieldName]: this.fileId,
          fileName: this.file.name,
          totalChunks: this.chunks.length,
        }),
      });
      const result = await this.validateResponse(response);
      this.status = "complete";
      this.options.onComplete?.(result);
    } catch (error) {
      this.status = "error";
      this.options.onError?.(`合并文件失败: ${(error as Error).message}`);
    }
  }

  // 开始上传
  async start(): Promise<void> {
    if (!this.file || this.status === "uploading") return;

    try {
      // 生成文件ID
      this.fileId = await this.generateFileId(this.file);

      if (this.options.useChunkedUpload) {
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
      } else {
        // 直接上传整个文件
        await this.uploadWholeFile();
      }
    } catch (error) {
      this.status = "error";
      this.options.onError?.(`上传失败: ${(error as Error).message}`);
    }
  }

  // 直接上传整个文件
  private async uploadWholeFile(): Promise<void> {
    if (!this.file || !this.fileId) {
      throw new Error("文件未初始化");
    }

    this.status = "uploading";

    const formData = new FormData();
    formData.append(this.options.fileIdFieldName, this.fileId);
    formData.append("file", this.file, this.file.name);

    try {
      const response = await fetchWithRetry(this.getResolvedUrl("upload"), {
        method: "POST",
        body: formData,
      });
      const result = await this.validateResponse(response);
      this.status = "complete";
      this.totalProgress = 100;
      this.options.onProgress?.(100);
      this.options.onComplete?.(result);
    } catch (error) {
      this.status = "error";
      this.options.onError?.(`文件上传失败: ${(error as Error).message}`);
      throw error;
    }
  }

  // 暂停上传
  pause(): void {
    if (this.status === "uploading") {
      this.abortControllers.forEach((controller) => controller.abort());
      this.status = "paused";
    }
  }

  // 继续上传
  resume(): void {
    if (this.status === "paused") {
      this.start();
    }
  }

  // 取消上传
  cancel(): void {
    this.pause();
    this.abortControllers.clear();
    this.file = null;
    this.chunks = [];
    this.fileId = "";
    this.uploadedChunks = new Set();
    this.totalProgress = 0;
    this.status = "idle";
  }

  // 获取当前状态
  getStatus(): UploadStatus {
    return this.status;
  }

  // 获取当前进度
  getProgress(): number {
    return this.totalProgress;
  }
}
