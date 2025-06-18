export type UploadStatus =
  | "idle"
  | "ready"
  | "uploading"
  | "paused"
  | "complete"
  | "error";

export interface Chunk {
  index: number;
  start: number;
  end: number;
  size: number;
  blob: Blob;
}

/**
 * 上传配置选项接口
 * @interface UploadOptions
 * @property {number} [chunkSize=2*1024*1024] - 分片大小(字节)，默认2MB
 * @property {string[]} [allowedTypes=[]] - 允许的文件类型数组，支持MIME类型或文件扩展名
 * @property {number} [maxSize=Infinity] - 最大文件大小(字节)，默认无限制
 * @property {number} [concurrency=3] - 并发上传数量，必须是正整数
 * @property {number} [checkTimeout=5000] - 分片检查超时时间(毫秒)
 * @property {string|Object} uploadUrl - 上传相关接口配置
 * @property {string} [fileIdFieldName='fileId'] - 自定义fileId参数名
 * @property {boolean} [useChunkedUpload=true] - 是否启用分片上传，设为false将直接上传整个文件
 * @example
 * // 基础配置示例
 * const options: UploadOptions = {
 *   chunkSize: 4 * 1024 * 1024, // 4MB分片
 *   allowedTypes: ['image/jpeg', 'image/png', '.pdf'],
 *   maxSize: 100 * 1024 * 1024, // 100MB
 *   concurrency: 5,
 *   fileIdFieldName: 'uploadId', // 自定义参数名为uploadId
 *   uploadUrl: 'https://api.example.com/upload'
 * }
 * @example
 * // 对象形式的URL配置
 * const options: UploadOptions = {
 *   uploadUrl: {
 *     upload: 'https://api.example.com/upload/chunk',
 *     check: 'https://api.example.com/check/chunks',
 *     merge: 'https://api.example.com/merge/chunks'
 *   }
 * }
 */
export interface UploadOptions {
  /**
   * 自定义fileId参数名
   * @default 'fileId'
   */
  fileIdFieldName?: string;
  useChunkedUpload?: boolean;
  /**
   * 分片大小(字节)
   * @default 2*1024*1024 (2MB)
   * @minimum 1024 (1KB)
   */
  chunkSize?: number;
  /**
   * 允许的文件类型数组
   * @default [] (允许所有类型)
   * @example ['image/jpeg', 'application/pdf', '.png']
   */
  allowedTypes?: string[];
  /**
   * 最大文件大小(字节)
   * @default Infinity (无限制)
   * @minimum 0
   */
  maxSize?: number;
  /**
   * 并发上传数量
   * @default 3
   * @minimum 1
   * @integer
   */
  concurrency?: number;
  /**
   * 分片检查超时时间(毫秒)
   * @default 5000
   * @minimum 1000
   */
  checkTimeout?: number;
  /**
   * 上传相关接口配置
   * 可以是字符串(基础URL)或包含upload/check/merge字段的对象
   */
  uploadUrl:
    | string
    | {
        upload: string;
        check: string;
        merge: string;
      };
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

export interface UploaderPluginOptions {
  /** 自定义全局方法名称，默认值: 'uploader' */
  globalMethodName?: string;
}
