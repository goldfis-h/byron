/**
 * 获取文件扩展名
 * @param fileName 文件名
 * @returns 文件扩展名（小写），不带点
 */
export function getFileExt(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

/**
 * 格式化文件大小为人类可读格式
 * @param bytes 文件大小（字节）
 * @param decimals 保留小数位数
 * @returns 格式化后的大小字符串
 */
/**
 * 格式化文件大小为人类可读格式
 * @param bytes 文件大小（字节）
 * @param decimals 保留小数位数
 * @returns 格式化后的大小字符串
 * @throws {Error} 当输入不是有效数字时抛出错误
 */
export function formatSize(bytes: number, decimals: number = 2): string {
  if (typeof bytes !== "number" || isNaN(bytes) || bytes < 0) {
    throw new Error("无效的文件大小: 必须是非负数字");
  }

  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    sizes.length - 1
  );
  const value = bytes / Math.pow(k, i);

  // 使用Number.EPSILON处理浮点数精度问题
  const roundedValue =
    Math.round((value + Number.EPSILON) * Math.pow(10, dm)) / Math.pow(10, dm);

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
 * @example
 * validateFileType(file, ['image/jpeg', '.png', 'gif'])
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  if (allowedTypes.length === 0) return true;

  // 检查MIME类型
  if (allowedTypes.includes(file.type)) return true;

  // 获取文件扩展名（带点）
  const fileExtWithDot = `.${getFileExt(file.name)}`;
  // 获取文件扩展名（不带点）
  const fileExtWithoutDot = getFileExt(file.name);

  // 检查扩展名（支持带点和不带点的形式）
  return allowedTypes.some(
    (type) => type === fileExtWithDot || type === fileExtWithoutDot
  );
}

/**
 * 验证文件大小
 * @param file File对象
 * @param maxSize 最大允许大小（字节）
 * @returns 是否验证通过
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

/**
 * 验证URL格式是否有效
 * @param url 待验证的URL字符串
 * @returns 如果URL格式有效则返回true，否则返回false
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
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
    error.name === "AbortError" ||
    error.message.includes("Failed to fetch") ||
    error.message.includes("NetworkError")
  );
}
