import { describe, it, expect } from 'vitest';
import { normalizeMimeType } from '../../utils/fileUtils';

describe('normalizeMimeType', () => {
  it('should convert text/markdown to text/plain', () => {
    expect(normalizeMimeType('text/markdown', 'file.md')).toBe('text/plain');
  });

  it('should convert text/x-markdown to text/plain', () => {
    expect(normalizeMimeType('text/x-markdown', 'readme.md')).toBe('text/plain');
  });

  it('should convert application/x-markdown to text/plain', () => {
    expect(normalizeMimeType('application/x-markdown', 'doc.md')).toBe('text/plain');
  });

  it('should return text/plain for .md files with empty MIME type', () => {
    expect(normalizeMimeType('', 'notes.md')).toBe('text/plain');
  });

  it('should keep text/plain unchanged', () => {
    expect(normalizeMimeType('text/plain', 'file.txt')).toBe('text/plain');
  });

  it('should keep image MIME types unchanged', () => {
    expect(normalizeMimeType('image/png', 'photo.png')).toBe('image/png');
    expect(normalizeMimeType('image/jpeg', 'photo.jpg')).toBe('image/jpeg');
  });

  it('should keep application/pdf unchanged', () => {
    expect(normalizeMimeType('application/pdf', 'document.pdf')).toBe('application/pdf');
  });

  it('should keep audio MIME types unchanged', () => {
    expect(normalizeMimeType('audio/mpeg', 'song.mp3')).toBe('audio/mpeg');
  });
});
