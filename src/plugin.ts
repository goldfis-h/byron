import { App, InjectionKey, inject, warn } from 'vue';
import { Uploader } from './instance';
import type { UploadOptions, UploaderPluginOptions, UploaderFactory } from './types';
import { InvalidOptionError } from './utils/errors';

/**
 * 上传插件注入键
 * @internal
 */
export const uploaderKey: InjectionKey<UploaderFactory> = Symbol('uploader');

/**
 * 验证插件配置选项
 * @param options - 待验证的配置选项
 * @throws {InvalidOptionError} 当配置选项无效时抛出
 */
function validatePluginOptions(options?: UploaderPluginOptions): void {
  if (!options) return;

  if (options.globalMethodName) {
    if (typeof options.globalMethodName !== 'string') {
      throw new InvalidOptionError('globalMethodName 必须是字符串类型');
    }
    if (!/^[$_a-zA-Z][$_a-zA-Z0-9]*$/.test(options.globalMethodName)) {
      throw new InvalidOptionError('globalMethodName 必须是有效的 JavaScript 标识符');
    }
  }
}

/**
 * 创建上传实例工厂函数
 * @param options - 全局上传配置选项
 * @returns 上传实例创建函数
 */
function createUploaderFactory(globalOptions?: UploadOptions): UploaderFactory {
  return (options: UploadOptions) =>
    new Uploader({
      ...globalOptions,
      ...options,
    });
}

/**
 * Vue 上传插件
 * @version 1.2.0
 * @example
 * ```typescript
 * import { createApp } from 'vue';
 * import UploaderPlugin from 'byron-vue-upload-file';
 *
 * const app = createApp(App);
 * app.use(UploaderPlugin, {
 *   globalMethodName: '$myUploader',
 *   chunkSize: 2 * 1024 * 1024
 * });
 * ```
 */
export const UploaderPlugin = {
  /**
   * 安装插件
   * @param app - Vue 应用实例
   * @param options - 插件配置选项
   * @param globalUploadOptions - 全局上传配置选项
   */
  install: (app: App, options?: UploaderPluginOptions, globalUploadOptions?: UploadOptions) => {
    try {
      // 验证插件配置
      validatePluginOptions(options);

      // 创建上传实例工厂
      const createUploader = createUploaderFactory(globalUploadOptions);
      const methodName = options?.globalMethodName || '$uploader';

      // 注册全局属性
      app.config.globalProperties[methodName] = createUploader;
      // 提供依赖注入
      app.provide(uploaderKey, createUploader);
    } catch (error) {
      if (error instanceof InvalidOptionError) {
        warn(`[uploader-plugin] 配置错误: \${error.message}`);
      } else {
        warn(`[uploader-plugin] 初始化失败: \${(error as Error).message}`);
      }
    }
  },
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
export function useUploader(options: UploadOptions): Uploader {
  const createUploader = inject(uploaderKey);
  // 如果插件已安装则使用全局配置，否则创建独立实例
  if (createUploader) {
    return createUploader(options);
  }
  // 独立模式：直接创建上传实例
  return new Uploader(options);
}

export default UploaderPlugin;
