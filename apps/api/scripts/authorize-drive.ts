import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { buildConsentUrl, createLibraryFolder, exchangeCode } from '../src/storage/drive-authorization';

const FOLDER_NAME = 'Bendike Library';

function waitForCode(state: string): Promise<{ code: string; redirectUri: string; close: () => void }> {
  return new Promise((resolvePromise, reject) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1');
      const code = url.searchParams.get('code');
      if (!code || url.searchParams.get('state') !== state) {
        response.writeHead(400).end('Nothing to do here.');
        return;
      }
      response.writeHead(200, { 'Content-Type': 'text/plain' }).end('Bendike is authorised. You can close this tab.');
      const { port } = server.address() as AddressInfo;
      resolvePromise({ code, redirectUri: `http://127.0.0.1:${port}`, close: () => server.close() });
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      const redirectUri = `http://127.0.0.1:${port}`;
      const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID ?? '';
      console.log('Open this address in your browser and allow access:\n');
      console.log(buildConsentUrl({ clientId, redirectUri, state }));
      console.log('\nWaiting for Google to send you back here...');
    });
  });
}

async function main(): Promise<void> {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      'Set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET (a Google Cloud OAuth client of type Desktop app) first',
    );
  }
  const { code, redirectUri, close } = await waitForCode(randomUUID());
  close();
  const { accessToken, refreshToken } = await exchangeCode({ clientId, clientSecret, code, redirectUri });
  const folderId = await createLibraryFolder(accessToken, FOLDER_NAME);
  console.log('\nAdd these to apps/api/.env (and to the settings of wherever the API runs):\n');
  console.log(`GOOGLE_DRIVE_CLIENT_ID=${clientId}`);
  console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${clientSecret}`);
  console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}`);
  console.log(`GOOGLE_DRIVE_FOLDER_ID=${folderId}`);
  console.log(`\nA folder called "${FOLDER_NAME}" now exists in your Google Drive; Bendike keeps the manuals in it.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
