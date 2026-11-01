import { Directory, File, Paths } from 'expo-file-system';
import type { WorkspaceFile } from '../types/editor';

const root = new Directory(Paths.document, 'workspace');
export function ensureWorkspace() { if (!root.exists) root.create({ intermediates: true }); }
export function workspaceUri() { ensureWorkspace(); return root.uri; }
export function listWorkspace(): WorkspaceFile[] {
  ensureWorkspace();
  return root.list().map((entry) => ({ name: entry.name, path: entry.uri, isDirectory: entry instanceof Directory }))
    .sort((a,b) => Number(b.isDirectory)-Number(a.isDirectory) || a.name.localeCompare(b.name));
}
export function readWorkspaceFile(uri: string) { return new File(uri).textSync(); }
export function writeWorkspaceFile(uri: string, text: string) { const file = new File(uri); if (!file.exists) file.create({ intermediates: true }); file.write(text); }
export function createWorkspaceFile(name: string) {
  ensureWorkspace(); const safe = name.trim().replace(/^\/+/, '');
  if (!safe || safe.includes('..')) throw new Error('Enter a valid file name.');
  const file = new File(root, safe); if (file.exists) throw new Error('That file already exists.'); file.create({ intermediates: true });
  if (safe.endsWith('.html')) file.write('<!doctype html>\n<html>\n  <head><title>New page</title></head>\n  <body>\n    <h1>Hello, world!</h1>\n  </body>\n</html>\n');
  else if (safe.endsWith('.py')) file.write('print("Hello, world!")\n'); else file.write('');
  return { name: file.name, path: file.uri };
}
export function createWorkspaceFolder(name: string) {
  ensureWorkspace(); const safe = name.trim().replace(/^\/+/, '');
  if (!safe || safe.includes('..')) throw new Error('Enter a valid folder name.');
  const folder = new Directory(root, safe); if (folder.exists) throw new Error('That folder already exists.'); folder.create({ intermediates: true });
}
