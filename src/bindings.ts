/* eslint-disable */
// This file was generated by [tauri-specta](https://github.com/oscartbeaumont/tauri-specta). Do not edit this file manually.

declare global {
  interface Window {
    __TAURI_INVOKE__<T>(
      cmd: string,
      args?: Record<string, unknown>
    ): Promise<T>;
  }
}

// Function avoids 'window not defined' in SSR
const invoke = () => window.__TAURI_INVOKE__;

export function getContents(path: string) {
  return invoke()<FileFolderMetadata[]>("get_contents", { path });
}

export function search(
  searchString: string,
  searchLocation: string,
  extension: string | null
) {
  return invoke()<string[]>("search", {
    searchString,
    searchLocation,
    extension,
  });
}

export type FileFolderMetadata = {
  name: string;
  path: string;
  size: FileSize;
  modified: number | null;
  is_folder: boolean;
};
export type FileSize = { size: number; order: number };
