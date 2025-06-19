import { FileTypeError, UploadSizeError, ValidationError, InvalidUrlError } from './errors';
/**
 * 获取文件扩展名
 * @param fileName 文件名
 * @returns 文件扩展名（小写），不带点
 */
// utils.ts
export function getFileExt(filename: string): string {
  // 使用正则表达式检查文件名是否以点开头且没有其他点
  if (/^\.[^.]+$/.test(filename)) {
    return '';
  }
  const parts = filename.split('.');
  const ext = parts.pop() || '';
  return ext === filename ? '' : ext.toLowerCase(); // 处理无扩展名的情况
}

/**
 * 格式化文件大小为人类可读格式
 * @param bytes 文件大小（字节）
 * @param decimals 保留小数位数
 * @returns 格式化后的大小字符串
 * @throws {ValidationError} 当输入不是有效数字时抛出错误
 */
export function formatSize(bytes: number, decimals: number = 2): string {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) {
    throw new ValidationError('无效的文件大小: 必须是非负数字', 'bytes', bytes);
  }

  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  const value = bytes / Math.pow(k, i);

  // 使用Number.EPSILON处理浮点数精度问题
  const roundedValue = Math.round((value + Number.EPSILON) * Math.pow(10, dm)) / Math.pow(10, dm);

  return `${roundedValue.toFixed(dm)} ${sizes[i]}`;
}

/**
 * 验证文件类型
 * @param file File对象
 * @param allowedTypes 允许的MIME类型数组
 * @returns 是否验证通过
 */
/**
 * 验证文件类型（支持MIME类型和文件扩展名）
 * @param file File对象
 * @param allowedTypes 允许的类型数组，可包含MIME类型或文件扩展名（带点或不带点）
 * @returns 是否验证通过
 * @throws {FileTypeError} 当文件类型不匹配时抛出错误
 * @example
 * validateFileType(file, ['image/jpeg', '.png', 'gif'])
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  if (allowedTypes.length === 0) return true;

  const fileExt = getFileExt(file.name).toLowerCase();
  const isValid = allowedTypes.some((type) => {
    const normalizedType = type.toLowerCase().replace(/^\./, '');
    return file.type === type || fileExt === normalizedType;
  });
  if (!isValid) {
    throw new FileTypeError('文件类型不匹配', allowedTypes, file.type, file);
  }
  return true;
}

/**
 * 验证文件大小
 * @param file File对象
 * @param maxSize 最大允许大小（字节）
 * @returns 是否验证通过
 * @throws {UploadSizeError} 当文件大小超出限制时抛出错误
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  if (typeof maxSize !== 'number' || isNaN(maxSize) || maxSize < 0) {
    throw new UploadSizeError('无效的最大文件大小: 必须是非负数字', maxSize, file.size, file);
  }

  if (file.size > maxSize) {
    throw new UploadSizeError(
      `文件大小超出限制: ${formatSize(file.size)} > ${formatSize(maxSize)}`,
      maxSize,
      file.size,
      file
    );
  }
  return true;
}

/**
 * 验证URL格式是否有效
 * @param url 待验证的URL字符串
 * @returns 如果URL格式有效则返回true，否则返回false
 * @throws {InvalidUrlError} 当URL格式无效时抛出错误
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    throw new InvalidUrlError('无效的URL格式', url);
  }
}

/**
 * 带重试机制的fetch请求
 * @param url 请求URL
 * @param options fetch选项
 * @param retries 最大重试次数
 * @param backoffMs 初始退避时间(毫秒)
 * @returns Promise<Response>
 * @throws {Error} 当所有重试失败时抛出错误
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = 3,
  backoffMs: number = 1000
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    // 仅对5xx服务器错误进行重试
    if (response.status >= 500 && response.status < 600 && retries > 0) {
      throw new Error(`服务器错误: ${response.status}`);
    }

    return response;
  } catch (error) {
    if (retries > 0 && isNetworkError(error)) {
      const delay = backoffMs * Math.pow(2, 3 - retries); // 指数退避
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, backoffMs);
    }
    throw error;
  }
}

/**
 * 判断错误是否为网络错误
 * @param error 错误对象
 * @returns 是否为网络错误
 */
function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'AbortError' ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('NetworkError')
  );
}
