import { App } from "vue";
import { Uploader } from "./instance";
import { UploaderPlugin, useUploader } from "./plugin";

export * from "./types";
export * from "./errors";
export { Uploader, useUploader };

export default UploaderPlugin;

// 保持向后兼容性
export const install = UploaderPlugin.install;

declare module "./types" {
  interface UploaderPlugin {
    install: typeof UploaderPlugin.install;
    version: string;
  }
}
