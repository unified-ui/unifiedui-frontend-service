import { existsSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

const publicModuleId = 'virtual:custom-extension';
const resolvedModuleId = `\0${publicModuleId}`;

export interface CustomExtensionPaths {
  customDirectory: string;
  customEntry: string;
  fallbackEntry: string;
}

export const resolveCustomExtensionEntry = ({
  customDirectory,
  customEntry,
  fallbackEntry,
}: CustomExtensionPaths): string => {
  if (existsSync(customDirectory) && !existsSync(customEntry)) {
    throw new Error('The custom extension directory exists, but custom/index.ts is missing.');
  }
  return existsSync(customEntry) ? customEntry : fallbackEntry;
};

export const customExtensionPlugin = (root?: string): Plugin => {
  const projectRoot = root ?? (import.meta.dirname.endsWith(`${path.sep}vite`)
    ? path.dirname(import.meta.dirname)
    : process.cwd());
  const customDirectory = path.resolve(projectRoot, 'custom');
  const customEntry = path.resolve(customDirectory, 'index.ts');
  const fallbackEntry = path.resolve(projectRoot, 'src/extensions/emptyManifest.ts');

  return {
    name: 'unified-ui-custom-extension',
    resolveId(id) {
      return id === publicModuleId ? resolvedModuleId : undefined;
    },
    load(id) {
      if (id !== resolvedModuleId) return undefined;

      const entry = resolveCustomExtensionEntry({ customDirectory, customEntry, fallbackEntry });
      return `export { default } from ${JSON.stringify(entry)};`;
    },
    configureServer(server) {
      server.watcher.add([customDirectory, customEntry]);
      const reloadForCustomEntry = (file: string): void => {
        if (path.resolve(file) === customEntry) {
          server.ws.send({ type: 'full-reload' });
        }
      };
      server.watcher.on('add', reloadForCustomEntry);
      server.watcher.on('unlink', reloadForCustomEntry);
    },
  };
};
