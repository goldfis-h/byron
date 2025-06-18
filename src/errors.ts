/**
 * 自定义HTTP错误类
 * @extends Error
 * @property {number} status - HTTP状态码
 * @property {string} url - 请求URL
 * @property {string} details - 错误详情
 */
export class HttpError extends Error {
  status: number;
  url: string;
  details?: string;

  /**
   * 创建HTTP错误实例
   * @param message - 错误消息
   * @param status - HTTP状态码
   * @param url - 请求URL
   * @param details - 额外错误详情
   */
  constructor(message: string, status: number, url: string, details?: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.url = url;
    this.details = details;

    // 修复原型链指向，确保instanceof正常工作
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

/**
 * 自定义上传错误类
 * @extends Error
 * @property {string} code - 错误代码
 * @property {File | null} file - 关联的文件对象
 */
export class UploadError extends Error {
  code: string;
  file: File | null;

  /**
   * 创建上传错误实例
   * @param message - 错误消息
   * @param code - 错误代码
   * @param file - 关联的文件对象
   */
  constructor(message: string, code: string, file: File | null = null) {
    super(message);
    this.name = 'UploadError';
    this.code = code;
    this.file = file;

    // 修复原型链指向，确保instanceof正常工作
    Object.setPrototypeOf(this, UploadError.prototype);
  }
}