export type UploadStatus = "idle" | "ready" | "uploading" | "paused" | "complete" | "error";
export interface Chunk {
    index: number;
    start: number;
    end: number;
    size: number;
    blob: Blob;
}
export interface UploadOptions {
    /** 分片大小 (MB)，默认2MB */
    chunkSize?: number;
    /** 允许的文件类型数组，如 ['image/jpeg', 'application/pdf'] */
    allowedTypes?: string[];
    /** 最大文件大小 (MB) */
    maxSize?: number;
    /** 并发上传数量，默认3 */
    concurrency?: number;
    /** 分片检查超时时间(ms)，默认5000 */
    checkTimeout?: number;
    /** 上传接口URL */
    uploadUrl: string;
    /** 上传进度回调函数 */
    onProgress?: (progress: number) => void;
    /** 上传完成回调函数 */
    onComplete?: (result: any) => void;
    /** 上传错误回调函数 */
    onError?: (error: string) => void;
}
export interface UploaderInstance {
    /** 设置要上传的文件 */
    setFile: (file: File) => boolean;
    /** 开始上传 */
    start: () => Promise<void>;
    /** 暂停上传 */
    pause: () => void;
    /** 继续上传 */
    resume: () => void;
    /** 取消上传 */
    cancel: () => void;
    /** 获取当前上传状态 */
    getStatus: () => UploadStatus;
    /** 获取当前上传进度 (0-100) */
    getProgress: () => number;
}
