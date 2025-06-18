import { App } from "vue";
import type { UploadOptions, UploaderInstance } from "./types";
declare module "@vue/runtime-core" {
    interface ComponentCustomProperties {
        $uploader: (options: UploadOptions) => UploaderInstance;
    }
}
declare const _default: {
    install: (app: App) => void;
};
export default _default;
