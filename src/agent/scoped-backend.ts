import { LocalShellBackend } from 'deepagents';
import type { GlobResult, GrepResult, LsResult } from 'deepagents';

type Options = ConstructorParameters<typeof LocalShellBackend>[0];

// With virtualMode off, deepagents' resolvePath no longer remaps "/" into the
// project root. grep defaults its path to "/", so a grep without an explicit
// path scans the entire real filesystem and dies on EPERM (e.g. /Library/Trial).
// Pin the root sentinels (undefined, "", "/") back to the project dir so search
// tools stay scoped without touching read/write absolute-path behaviour.
const scope = (dir?: string | null): string =>
  dir == null || dir === '' || dir === '/' ? '.' : dir;

export class ScopedLocalShellBackend extends LocalShellBackend {
  override async grep(
    pattern: string,
    dirPath?: string,
    glob?: string | null
  ): Promise<GrepResult> {
    return super.grep(pattern, scope(dirPath), glob);
  }

  override async ls(dirPath?: string): Promise<LsResult> {
    return super.ls(scope(dirPath));
  }

  override async glob(pattern: string, searchPath?: string): Promise<GlobResult> {
    return super.glob(pattern, scope(searchPath));
  }

  static async createScoped(options?: Options): Promise<ScopedLocalShellBackend> {
    const backend = new ScopedLocalShellBackend(options);
    await backend.initialize();
    return backend;
  }
}
