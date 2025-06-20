/**
 * 基础错误类，所有自定义错误都应继承此类
 * @extends Error
 * @property {string} name - 错误名称
 * @property {string} message - 错误消息
 * @property {string} [details] - 错误详情
 */
export class BaseError extends Error {
  details?: string;

  constructor(message: string, details?: string) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Object.setPrototypeOf(this, BaseError.prototype);
  }
}

/**
 * 自定义HTTP错误类
 * @extends BaseError
 * @property {number} status - HTTP状态码
 * @property {string} url - 请求URL
 * @property {string} details - 错误详情
 */
export class HttpError extends BaseError {
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
  }
}

/**
 * URL验证错误类
 * @extends Error
 * @property {string} url - 无效的URL
 */
export class InvalidUrlError extends Error {
  url: string;

  /**
   * 创建URL验证错误实例
   * @param message - 错误消息
   * @param url - 无效的URL
   */
  constructor(message: string, url: string) {
    super(message);
    this.name = 'InvalidUrlError';
    this.url = url;
  }
}

/**
 * 配置验证错误类
 * @extends Error
 * @property {string} param - 验证失败的参数名
 * @property {unknown} value - 无效的参数值
 */
export class ValidationError extends Error {
  param: string;
  value: unknown;

  /**
   * 创建配置验证错误实例
   * @param message - 错误消息
   * @param param - 验证失败的参数名
   * @param value - 无效的参数值
   */
  constructor(message: string, param: string, value: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.param = param;
    this.value = value;
  }
}

/**
 * 文件大小超限错误
 * @extends UploadError
 * @property {number} maxSize - 允许的最大大小(字节)
 * @property {number} actualSize - 实际文件大小(字节)
 */
export class UploadSizeError extends UploadError {
  maxSize: number;
  actualSize: number;

  /**
   * 创建文件大小超限错误实例
   * @param message - 错误消息
   * @param maxSize - 允许的最大大小(字节)
   * @param actualSize - 实际文件大小(字节)
   * @param file - 关联的文件对象
   */
  constructor(message: string, maxSize: number, actualSize: number, file: File | null = null) {
    super(message, 'FILE_TOO_LARGE', file);
    this.name = 'UploadSizeError';
    this.maxSize = maxSize;
    this.actualSize = actualSize;
  }
}

/**
 * 文件类型错误
 * @extends UploadError
 * @property {string[]} allowedTypes - 允许的文件类型
 * @property {string} actualType - 实际文件类型
 */
export class FileTypeError extends UploadError {
  allowedTypes: string[];
  actualType: string;

  /**
   * 创建文件类型错误实例
   * @param message - 错误消息
   * @param allowedTypes - 允许的文件类型
   * @param actualType - 实际文件类型
   * @param file - 关联的文件对象
   */
  constructor(
    message: string,
    allowedTypes: string[],
    actualType: string,
    file: File | null = null
  ) {
    super(message, 'INVALID_FILE_TYPE', file);
    this.name = 'FileTypeError';
    this.allowedTypes = allowedTypes;
    this.actualType = actualType;
  }
}

/**
 * 无效的配置选项错误
 * @extends BaseError
 * @property {string} param - 无效的配置选项名
 * @property {unknown} value - 无效的配置选项值
 */
export class InvalidOptionError extends BaseError {
  param: string;
  value: unknown;

  constructor(message: string, param: string, value: unknown, details?: string) {
    super(message, details);
    this.param = param;
    this.value = value;
  }
}
