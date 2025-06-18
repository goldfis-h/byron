import { UploadOptions, UploadStatus } from "./types";
export declare class Uploader {
    private options;
    private file;
    private chunks;
    private fileId;
    private uploadedChunks;
    private totalProgress;
    private status;
    private abortController;
    constructor(options: UploadOptions);
    setFile(file: File): boolean;
    private validateFile;
    private generateFileId;
    private splitFile;
    private checkUploadedChunks;
    private uploadChunk;
    private updateProgress;
    private uploadChunks;
    private mergeChunks;
    start(): Promise<void>;
    pause(): void;
    resume(): void;
    cancel(): void;
    getStatus(): UploadStatus;
    getProgress(): number;
}
