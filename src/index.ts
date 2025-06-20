/**
 * 上传插件核心入口
 * @module byron-vue-upload-file
 */
import UploaderPlugin from './plugin';
import { useUploader } from './plugin';
import { Uploader } from './instance';
import * as Errors from './utils/errors';

/**
 * 版本信息
 * @version 1.2.0
 */
const version = '1.2.0';

// 扩展插件类型以包含版本信息
declare module './types' {}

/**
 * 公共API导出
 * @namespace
 */
export const ByronVueUploadFile = {
  /** 插件默认导出 */
  default: UploaderPlugin,
  /** 安装方法 */
  install: UploaderPlugin.install,
  /** 版本号 */
  version,
  /** 上传核心类 */
  Uploader,
  /** 组合式API */
  useUploader,
  /** 错误类型 */
  Errors,
};

export default UploaderPlugin;
// 导出命名空间以便按需导入
export * from './types/index';
export * from './utils/errors';
export { Uploader, useUploader, version };

// 保持向后兼容性
export const install = UploaderPlugin.install;
