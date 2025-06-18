import { App, InjectionKey } from "vue";
import { Uploader } from "./instance";
import type { UploadOptions, UploaderPluginOptions } from "./types";

/**
 * 上传插件注入键
 */
export const uploaderKey: InjectionKey<(options: UploadOptions) => Uploader> =
  Symbol("uploader");

/**
 * Vue 上传插件
 * @version 1.1.0
 */
export const UploaderPlugin = {
  /**
   * 安装插件
   * @param app - Vue 应用实例
   * @param options - 插件配置选项
   */
  install: (app: App, pluginOptions?: UploaderPluginOptions) => {
    if (
      pluginOptions?.globalMethodName &&
      typeof pluginOptions.globalMethodName !== "string"
    ) {
      console.error("[uploader-plugin] globalMethodName 必须是字符串类型");
      return;
    }

    try {
      const methodName = pluginOptions?.globalMethodName || "$uploader";
      const createUploader = (options: UploadOptions) => new Uploader(options);

      // 注册全局属性
      app.config.globalProperties[methodName] = createUploader;
      // 提供依赖注入
      app.provide(uploaderKey, createUploader);
    } catch (error) {
      console.error("[uploader-plugin] 初始化失败:", error);
    }
  },
  version: "1.1.0",
};

/**
 * 组合式API: 创建上传实例
 * @param options - 上传配置选项
 * @returns 上传实例
 */
export function useUploader(options: UploadOptions): Uploader {
  const UploaderInstance = new Uploader(options);
  if (!UploaderInstance) {
    throw new Error("[uploader-plugin] 请先安装 UploaderPlugin");
  }
  return UploaderInstance;
}

export default UploaderPlugin;
