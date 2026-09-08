import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

const toolRoot = path.resolve(import.meta.dirname, '..');
const MIME_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
]);

function send(response, status, body = '', headers = {}) {
  response.writeHead(status, {
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'self'; img-src 'self' blob:; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'",
    'x-content-type-options': 'nosniff',
    ...headers,
  });
  response.end(body);
}

function resolveRequestPath(requestUrl, root) {
  const url = new URL(requestUrl, 'http://127.0.0.1');
  if (url.pathname === '/') return { redirect: '/ui/' };
  if (!(url.pathname.startsWith('/ui/') || url.pathname.startsWith('/src/'))) return null;

  let decoded;
  try {
    decoded = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;
  const relativeName = decoded === '/ui/' ? 'ui/index.html' : decoded.replace(/^\/+/, '');
  const absoluteName = path.resolve(root, relativeName);
  if (absoluteName !== root && !absoluteName.startsWith(`${root}${path.sep}`)) return null;
  return { absoluteName };
}

export function createStaticServer({ root = toolRoot } = {}) {
  const resolvedRoot = path.resolve(root);
  return createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      send(response, 405, 'Method not allowed.\n', { allow: 'GET, HEAD' });
      return;
    }

    const target = resolveRequestPath(request.url, resolvedRoot);
    if (target?.redirect) {
      send(response, 302, '', { location: target.redirect });
      return;
    }
    if (!target) {
      send(response, 404, 'Not found.\n');
      return;
    }

    try {
      const fileStat = await stat(target.absoluteName);
      if (!fileStat.isFile()) {
        send(response, 404, 'Not found.\n');
        return;
      }
      const contentType = MIME_TYPES.get(path.extname(target.absoluteName).toLowerCase());
      if (!contentType) {
        send(response, 404, 'Not found.\n');
        return;
      }
      const bytes = request.method === 'HEAD' ? '' : await readFile(target.absoluteName);
      send(response, 200, bytes, {
        'content-type': contentType,
        'content-length': String(fileStat.size),
      });
    } catch {
      send(response, 404, 'Not found.\n');
    }
  });
}

function openDefaultBrowser(url) {
  const command = process.platform === 'win32'
    ? { file: 'cmd.exe', arguments: ['/d', '/s', '/c', 'start', '', url] }
    : process.platform === 'darwin'
      ? { file: 'open', arguments: [url] }
      : { file: 'xdg-open', arguments: [url] };
  const child = spawn(command.file, command.arguments, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.on('error', () => {});
  child.unref();
}

export async function startUi({ port = 0, openBrowser = true } = {}) {
  const server = createStaticServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/ui/`;
  process.stdout.write(`Hogwarts Legacy CK Thumbnail Extractor\n${url}\nPress Ctrl+C to stop.\n`);
  if (openBrowser) openDefaultBrowser(url);
  return { server, url };
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) await startUi();
