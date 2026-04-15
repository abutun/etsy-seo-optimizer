import { createServer } from 'http';
import { URL } from 'url';
import { getConfig } from '../utils/config.js';
import { generateCodeVerifier, generateCodeChallenge, generateState, buildAuthorizationUrl, REQUIRED_SCOPES } from './pkce.js';
import { exchangeCodeForTokens } from './tokens.js';
import { outputJSON } from '../utils/formatter.js';

export async function startAuthFlow(): Promise<void> {
  const config = getConfig();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();

  const authUrl = buildAuthorizationUrl({
    apiKey: config.apiKey,
    redirectUri: config.redirectUri,
    codeChallenge,
    state,
    scopes: REQUIRED_SCOPES,
  });

  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url || '/', `http://localhost:${config.authPort}`);

        if (url.pathname === '/oauth/callback') {
          const receivedState = url.searchParams.get('state');
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`<html><body><h1>Authorization Failed</h1><p>${error}</p><p>You can close this tab.</p></body></html>`);
            server.close();
            reject(new Error(`OAuth error: ${error}`));
            return;
          }

          if (receivedState !== state) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<html><body><h1>Invalid State</h1><p>CSRF check failed. Please try again.</p></body></html>');
            server.close();
            reject(new Error('OAuth state mismatch - possible CSRF attack'));
            return;
          }

          if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<html><body><h1>Missing Code</h1><p>No authorization code received.</p></body></html>');
            server.close();
            reject(new Error('No authorization code in callback'));
            return;
          }

          await exchangeCodeForTokens(code, codeVerifier);

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h1>Authorization Successful!</h1><p>You can close this tab and return to your terminal.</p></body></html>');

          outputJSON({ status: 'auth_complete', message: 'Tokens saved successfully.' });

          server.close();
          resolve();
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<html><body><h1>Error</h1><p>${err instanceof Error ? err.message : 'Unknown error'}</p></body></html>`);
        server.close();
        reject(err);
      }
    });

    server.listen(config.authPort, () => {
      outputJSON({
        status: 'auth_required',
        authUrl,
        message: `Open the URL below in your browser to authorize the app. The callback server is listening on port ${config.authPort}.`,
      });
    });

    server.on('error', (err) => {
      reject(new Error(`Auth server failed to start: ${err.message}`));
    });
  });
}

// Direct execution: run the auth flow
const isDirectRun = process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js');
if (isDirectRun) {
  startAuthFlow().catch((err) => {
    outputJSON({ status: 'error', error: err.message });
    process.exit(1);
  });
}
