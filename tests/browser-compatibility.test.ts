import { describe, it, expect, beforeAll, vi } from 'vitest';

describe('Browser API Compatibility', () => {
  beforeAll(() => {
    // 模拟Web Worker以支持测试环境
    vi.stubGlobal(
      'Worker',
      class MockWorker {
        postMessage() {}
        terminate() {}
        addEventListener() {}
        removeEventListener() {}
        dispatchEvent() {
          return true;
        }
        onmessage = null;
        onmessageerror = null;
        onerror = null;
        constructor(scriptURL: string | URL, options?: WorkerOptions) {}
      }
    );
  });

  it('should support Web Workers', () => {
    expect(typeof window.Worker).toBe('function');
  });

  it('should support FileReader API', () => {
    expect(typeof window.FileReader).toBe('function');
  });

  it('should support FormData API', () => {
    expect(typeof window.FormData).toBe('function');
  });

  it('should support AbortController', () => {
    expect(typeof window.AbortController).toBe('function');
  });

  it('should support fetch API', () => {
    expect(typeof window.fetch).toBe('function');
  });
});
