// 整合所有类型定义
import { App } from 'vue';
import type { Uploader } from '../instance';

export type UploadStatus = 'idle' | 'ready' | 'uploading' | 'paused' | 'complete' | 'error';

/**
 * 上传实例工厂函数类型
 * @param options - 上传配置选项
 * @returns 上传实例
 */
export type UploaderFactory = (options: UploadOptions) => Uploader;

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
 * @property {string|UploadUrlObject} uploadUrl - 上传相关接口配置，可以是字符串或包含上传相关接口的对象
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
/**
 * 上传URL配置对象接口
 * @interface UploadUrlObject
 * @property {string} upload - 分片上传接口URL
 * @property {string} check - 分片检查接口URL
 * @property {string} merge - 文件合并接口URL
 */
export interface UploadUrlObject {
  upload: string;
  check: string;
  merge: string;
}

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
   * @TJS-type integer
   */
  chunkSize?: number;
  /**
   * 允许的文件类型数组
   * 支持MIME类型(如'image/jpeg')或文件扩展名(如'.png')
   * @default [] (允许所有类型)
   * @example ['image/jpeg', 'image/png', '.pdf', '.doc']
   */
  allowedTypes?: (string | `.${string}`)[];
  /**
   * 最大文件大小(字节)
   * @default Infinity (无限制)
   * @minimum 0
   * @TJS-type integer
   */
  maxSize?: number;
  /**
   * 并发上传数量
   * @default 3
   * @minimum 1
   * @maximum 10
   * @TJS-type integer
   */
  concurrency?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
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
  /** 哈希计算进度回调函数 */
  onHashProgress?: (progress: number) => void;
  /** 上传完成回调函数 */
  onComplete?: (result: unknown) => void;
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

/**
 * 上传插件接口定义
 */
export interface UploaderPlugin {
  /**
   * 安装插件
   * @param app - Vue应用实例
   * @param options - 插件配置选项
   * @param globalUploadOptions - 全局上传配置选项
   */
  install: (app: App, options?: UploaderPluginOptions, globalUploadOptions?: UploadOptions) => void;
  /** 插件版本号 */
  version: string;
}

/**
 * 上传插件实例类型
 */
export interface UploaderPluginInstance {
  /**
   * 创建上传实例
   * @param options 上传配置选项
   */
  create(options: UploadOptions): UploaderInstance;
  /** 插件版本 */
  version: string;
}

// 扩展Vue类型
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    /** 全局上传插件实例 */
    $uploader: UploaderPluginInstance;
  }
}

/**
 * 上传插件
 */
declare const UploaderPlugin: {
  install(app: App, options?: UploaderPluginOptions): void;
};

/**
 * 组合式API: 创建上传实例
 * 支持两种使用方式：
 * 1. 独立使用：直接调用，使用默认配置
 * 2. 插件模式：通过app.use安装后使用全局配置
 * @param options - 上传配置选项
 * @returns 上传实例
 * @example
 * ```typescript
 * // 独立使用
 * const uploader = useUploader({
 *   url: '/api/upload',
 *   chunkSize: 2 * 1024 * 1024
 * });
 *
 * // 插件模式 (需先通过app.use安装)
 * const uploader = useUploader();
 * ```
 */
export declare function useUploader(_options?: UploadOptions): UploaderInstance;

export default UploaderPlugin;
