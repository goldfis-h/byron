// src/types/index.d.ts
import { App } from 'vue';
import type { UploadOptions, UploaderInstance } from '../src/types';

/**
 * 上传插件配置选项
 */
export interface UploaderPluginOptions {
  /** 全局方法名称，默认: '$uploader' */
  globalMethodName?: string;
  /** 默认上传配置 */
  defaultUploadOptions?: Omit<UploadOptions, 'uploadUrl'>;
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
  version: string;
};

/**
 * 组合式API: 创建上传实例
 * @param options - 上传配置选项
 * @returns 上传实例
 */
export declare function useUploader(options: UploadOptions): UploaderInstance;

export default UploaderPlugin;
