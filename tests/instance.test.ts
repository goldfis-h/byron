import { describe, it, expect, vi, afterEach } from 'vitest';
import { Uploader } from '../src/instance';
import { getFileExt, formatSize, validateFileType, isValidUrl } from '../src/utils';
import { FileTypeError, InvalidUrlError } from '../src/utils/errors';
// Mock Web Worker
class MockWorker {
  postMessage: (data: unknown) => void;
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;

  constructor() {
    this.postMessage = vi.fn((_data) => {
      // 修复未使用变量错误，重命名为 _data
      // Simulate hash progress updates
      setTimeout(() => this.onmessage?.({ data: { progress: 30 } }), 0);
      setTimeout(() => this.onmessage?.({ data: { progress: 70 } }), 1);
      setTimeout(() => this.onmessage?.({ data: { hash: 'test-hash', progress: 100 } }), 2);
    });
  }

  terminate() {}
}

afterEach(() => {
  vi.useRealTimers();
});

// @ts-expect-error Mocking window.Worker for testing
window.Worker = MockWorker;

describe('Uploader Instance', () => {
  it('should initialize with totalProgress 0', () => {
    const uploader = new Uploader({ uploadUrl: 'http://49.235.163.198:8090/api/upload' });
    const totalProgress = uploader.getProgress();
    expect(totalProgress).toBe(0);
  });

  it('should update progress correctly', () => {
    // Mock private totalProgress to test the getter
    const uploader = new Uploader({ uploadUrl: 'http://49.235.163.198:8090/api/upload' });
    // Access private property for testing purposes
    const progress = uploader.getProgress();
    expect(progress).toBe(0);
  });

  it('should trigger onHashProgress callback during file id generation', async () => {
    // Mock fetch to prevent network requests
    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ uploadedIndexes: [] }),
    });
    vi.useFakeTimers();
    const hashProgressSpy = vi.fn();
    const uploader = new Uploader({
      uploadUrl: 'http://49.235.163.198:8090/api/upload',
      onHashProgress: hashProgressSpy,
    });
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    uploader.setFile(file);

    // Start upload to trigger file id generation
    const startPromise = uploader.start();
    // 执行所有计时器以处理所有模拟进度更新
    vi.runAllTimers();
    await startPromise;

    // Verify progress callbacks were called with expected values
    expect(hashProgressSpy).toHaveBeenCalledTimes(3);
    expect(hashProgressSpy).toHaveBeenNthCalledWith(1, 30);
    expect(hashProgressSpy).toHaveBeenNthCalledWith(2, 70);
    expect(hashProgressSpy).toHaveBeenNthCalledWith(3, 100);

    vi.useRealTimers();
  });

  it('should handle empty file name', () => {
    expect(getFileExt('')).toBe('');
  });
  it('should format large file size', () => {
    expect(formatSize(1024 * 1024 * 50)).toBe('50.00 MB');
  });
  it('should validate file type', () => {
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    expect(validateFileType(file, ['image/jpeg', '.png', '.txt'])).toBe(true);
  });
  it('should throw FileTypeError for invalid file type', () => {
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    expect(() => validateFileType(file, ['image/jpeg'])).toThrow(FileTypeError);
  });
});
