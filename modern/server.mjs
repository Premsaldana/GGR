import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import next from 'next';
import Database from 'better-sqlite3';
import { WebSocketServer } from 'ws';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = Number(process.env.PORT || 3000);
const dbUrl = process.env.DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;
if (!dbUrl || !sessionSecret) throw new Error('DATABASE_URL and SESSION_SECRET are required');

const db = new Database(path.resolve(process.cwd(), dbUrl), { readonly: true });
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const wss = new WebSocketServer({ noServer: true });

function safeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function verifyToken(token) {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature) return null;
  const expected = crypto.createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  if (!safeEqual(signature, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!parsed.invoiceId || !parsed.role || parsed.exp * 1000 < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getState(invoiceId, role) {
  const proofs = db.prepare(`
    SELECT id, invoice_id AS invoiceId, storage_key AS storageKey, mime_type AS mimeType,
      status, submitted_at AS submittedAt, reviewed_at AS reviewedAt,
      verified_amount_minor_units AS verifiedAmountMinorUnits, payment_mode AS paymentMode,
      payment_reference AS paymentReference, admin_note AS adminNote, updated_at AS updatedAt
    FROM payment_proofs WHERE invoice_id = ? ORDER BY submitted_at DESC
  `).all(invoiceId);
  const latest = db.prepare(`SELECT finalized_at AS finalizedAt, balance_minor_units AS balanceMinorUnits FROM invoices WHERE id = ?`).get(invoiceId);
  const fingerprint = JSON.stringify({ proofs, latest });
  return role === 'guest'
    ? { fingerprint, isVerified: Boolean(latest && (latest.finalizedAt || latest.balanceMinorUnits <= 0) || proofs.some((proof) => proof.status === 'verified')), latestStatus: proofs[0]?.status || null }
    : { fingerprint, proofs, latest };
}

wss.on('connection', (socket, request, auth) => {
  let lastFingerprint = '';
  const sendState = () => {
    if (socket.readyState !== socket.OPEN) return;
    const state = getState(auth.invoiceId, auth.role);
    if (state.fingerprint === lastFingerprint) return;
    lastFingerprint = state.fingerprint;
    socket.send(JSON.stringify({ type: 'proof.state', invoiceId: auth.invoiceId, state }));
  };
  sendState();
  const interval = setInterval(sendState, 1000);
  socket.on('close', () => clearInterval(interval));
  socket.on('error', () => clearInterval(interval));
});

await app.prepare();
const server = http.createServer((request, response) => handle(request, response));
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (url.pathname !== '/api/realtime') {
    socket.destroy();
    return;
  }
  const auth = verifyToken(url.searchParams.get('token'));
  if (!auth) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request, auth));
});
server.listen(port, hostname, () => console.log(`> Ready on http://${hostname}:${port}`));
