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
const subscribers = new Map();

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
  return role === 'guest'
    ? { isVerified: Boolean(latest && (latest.finalizedAt || latest.balanceMinorUnits <= 0) || proofs.some((proof) => proof.status === 'verified')), latestStatus: proofs[0]?.status || null }
    : { proofs, latest };
}

function sendState(socket, auth) {
  if (socket.readyState !== socket.OPEN) return;
  socket.send(JSON.stringify({ type: 'proof.state', invoiceId: auth.invoiceId, state: getState(auth.invoiceId, auth.role) }));
}

function broadcast(event) {
  const clients = subscribers.get(event.invoiceId) || new Set();
  for (const subscriber of clients) {
    if (subscriber.socket.readyState !== subscriber.socket.OPEN) continue;
    const guestEvent = {
      type: event.type,
      invoiceId: event.invoiceId,
      reservationId: event.reservationId,
      proof: event.proof ? { id: event.proof.id, invoiceId: event.proof.invoiceId, status: event.proof.status, submittedAt: event.proof.submittedAt, reviewedAt: event.proof.reviewedAt, verifiedAmountMinorUnits: event.proof.verifiedAmountMinorUnits } : undefined,
      invoice: event.invoice ? { id: event.invoice.id, status: event.invoice.status, balanceMinorUnits: event.invoice.balanceMinorUnits, finalizedAt: event.invoice.finalizedAt } : undefined,
    };
    subscriber.socket.send(JSON.stringify({ type: 'proof.event', invoiceId: event.invoiceId, event: subscriber.auth.role === 'guest' ? guestEvent : event }));
  }
}

wss.on('connection', (socket, request, auth) => {
  const clients = subscribers.get(auth.invoiceId) || new Set();
  const subscriber = { socket, auth };
  clients.add(subscriber);
  subscribers.set(auth.invoiceId, clients);
  sendState(socket, auth);
  const cleanup = () => {
    clients.delete(subscriber);
    if (clients.size === 0) subscribers.delete(auth.invoiceId);
  };
  socket.on('close', cleanup);
  socket.on('error', cleanup);
});

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => { body += chunk; if (body.length > 1024 * 1024) reject(new Error('Payload too large')); });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

await app.prepare();
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (url.pathname === '/api/realtime/publish' && request.method === 'POST') {
    if (!safeEqual(String(request.headers['x-realtime-secret'] || ''), sessionSecret)) {
      response.writeHead(401, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    try {
      const event = JSON.parse(await readBody(request));
      if (!event.invoiceId || !event.reservationId || !event.type) throw new Error('Invalid event');
      broadcast(event);
      response.writeHead(202, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ accepted: true }));
    } catch (error) {
      response.writeHead(400, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: error.message || 'Invalid event' }));
    }
    return;
  }
  handle(request, response);
});

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
