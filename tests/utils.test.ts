import { describe, it, expect } from 'vitest';
import { getFileExt, formatSize, validateFileType, isValidUrl } from '../src/utils';
import { FileTypeError, InvalidUrlError } from '../src/utils/errors';

describe('getFileExt', () => {
  it('should return lowercase extension without dot', () => {
    expect(getFileExt('document.pdf')).toBe('pdf');
    expect(getFileExt('IMAGE.JPG')).toBe('jpg');
  });

  it('should return empty string for files without extension', () => {
    expect(getFileExt('README')).toBe('');
    expect(getFileExt('.gitignore')).toBe('');
  });
});

describe('formatSize', () => {
  it('should format bytes correctly', () => {
    expect(formatSize(1024)).toBe('1.00 KB');
    expect(formatSize(1500)).toBe('1.46 KB');
    expect(formatSize(1048576)).toBe('1.00 MB');
  });

  it('should throw error for invalid input', () => {
    expect(() => formatSize(-100)).toThrow('无效的文件大小: 必须是非负数字');
    expect(() => formatSize(NaN)).toThrow('无效的文件大小: 必须是非负数字');
  });
});

describe('validateFileType', () => {
  it('should validate MIME types', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    expect(validateFileType(file, ['image/jpeg'])).toBe(true);
    expect(() => validateFileType(file, ['image/png'])).toThrow(FileTypeError);
  });

  it('should validate file extensions', () => {
    const file = new File([''], 'document.pdf');
    expect(validateFileType(file, ['.pdf'])).toBe(true);
    expect(validateFileType(file, ['pdf'])).toBe(true);
    expect(() => validateFileType(file, ['.doc'])).toThrow(FileTypeError);
  });
});

describe('isValidUrl', () => {
  it('should return true for valid URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://localhost:3000')).toBe(true);
  });

  it('should return false for invalid URLs', () => {
    expect(() => isValidUrl('invalid-url')).toThrow(InvalidUrlError);
    expect(isValidUrl('ftp://example.com')).toBe(true); // FTP is valid URL
  });
});
