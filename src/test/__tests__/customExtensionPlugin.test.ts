import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveCustomExtensionEntry } from '../../../vite/customExtensionPlugin';

const temporaryDirectories: string[] = [];

const createPaths = () => {
  const root = mkdtempSync(path.join(tmpdir(), 'unified-ui-custom-'));
  temporaryDirectories.push(root);
  return {
    customDirectory: path.join(root, 'custom'),
    customEntry: path.join(root, 'custom/index.ts'),
    fallbackEntry: path.join(root, 'src/extensions/emptyManifest.ts'),
  };
};

describe('resolveCustomExtensionEntry', () => {
  afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('uses the empty manifest when custom is absent', () => {
    const paths = createPaths();
    expect(resolveCustomExtensionEntry(paths)).toBe(paths.fallbackEntry);
  });

  it('uses custom/index.ts when present', () => {
    const paths = createPaths();
    mkdirSync(paths.customDirectory);
    writeFileSync(paths.customEntry, 'export default {};');
    expect(resolveCustomExtensionEntry(paths)).toBe(paths.customEntry);
  });

  it('rejects a custom directory without its entry point', () => {
    const paths = createPaths();
    mkdirSync(paths.customDirectory);
    expect(() => resolveCustomExtensionEntry(paths)).toThrow('custom/index.ts is missing');
  });
});
