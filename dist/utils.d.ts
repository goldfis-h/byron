/**
 * 获取文件扩展名
 * @param fileName 文件名
 * @returns 文件扩展名（小写），不带点
 */
export declare function getFileExt(fileName: string): string;
/**
 * 获取文件大小（字节）
 * @param file File对象
 * @returns 文件大小（字节）
 */
export declare function getFileSize(file: File): number;
/**
 * 格式化文件大小为人类可读格式
 * @param bytes 文件大小（字节）
 * @param decimals 保留小数位数
 * @returns 格式化后的大小字符串
 */
export declare function formatSize(bytes: number, decimals?: number): string;
/**
 * 验证文件类型
 * @param file File对象
 * @param allowedTypes 允许的MIME类型数组
 * @returns 是否验证通过
 */
export declare function validateFileType(file: File, allowedTypes: string[]): boolean;
/**
 * 验证文件大小
 * @param file File对象
 * @param maxSize 最大允许大小（字节）
 * @returns 是否验证通过
 */
export declare function validateFileSize(file: File, maxSize: number): boolean;
