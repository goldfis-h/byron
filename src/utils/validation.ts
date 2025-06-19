import { UploadOptions } from '@/types';
import { ValidationError } from './errors';

/**
 * 配置验证规则接口
 */
export interface ValidationRule {
  param: keyof UploadOptions;
  validate: (value: unknown) => boolean;
  error: string;
}

/**
 * 验证上传配置选项
 * @param options - 上传配置选项
 * @param rules - 验证规则数组
 * @throws {Error} 当验证失败时抛出错误
 */
export function validateOptions(options: UploadOptions, rules: ValidationRule[]): void {
  for (const rule of rules) {
    const value = options[rule.param];
    if (value !== undefined && !rule.validate(value)) {
      throw new ValidationError(rule.error, rule.param, value);
    }
  }
}
