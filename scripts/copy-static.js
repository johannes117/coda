import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const source = join(rootDir, 'src', 'renderer', 'index.html');
const destination = join(rootDir, 'dist', 'src', 'renderer', 'index.html');

async function copyRendererHtml() {
  await fs.mkdir(dirname(destination), { recursive: true });
  await fs.copyFile(source, destination);
}

copyRendererHtml().catch((error) => {
  console.error('Failed to copy renderer HTML:', error);
  process.exit(1);
});
