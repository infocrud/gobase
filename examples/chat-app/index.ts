/**
 * GoBase Real-time Chat
 * Demonstrates: Auth + WebSocket subscriptions for live messaging
 *
 * Setup:
 *   CREATE TABLE messages (
 *     id         INT AUTO_INCREMENT PRIMARY KEY,
 *     room       VARCHAR(100) NOT NULL,
 *     user_id    INT NOT NULL,
 *     user_email VARCHAR(255) NOT NULL,
 *     body       TEXT NOT NULL,
 *     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 *   );
 */
import { createClient } from '@gobase/sdk';
import WebSocket from 'ws';

const GOBASE_URL = process.env.GOBASE_URL ?? 'http://localhost:8000';
const WS_URL     = GOBASE_URL.replace(/^http/, 'ws');
const ROOM       = process.env.ROOM ?? 'general';

const gb = createClient(GOBASE_URL);

async function startChat(email: string, password: string, name: string) {
  // Auth
  let result = await gb.auth.signIn({ email, password });
  if (result.error) {
    const signup = await gb.auth.signUp({ email, password });
    if (signup.error) throw new Error(`Auth failed: ${signup.error}`);
    result = await gb.auth.signIn({ email, password });
  }

  const { user, tokens } = result.data!;
  console.log(`[${name}] connected as ${user.email}`);

  // Subscribe to messages via WebSocket
  const ws = new WebSocket(`${WS_URL}/realtime/ws?token=${tokens.access_token}`);

  ws.on('open', () => {
    ws.send(JSON.stringify({ type: 'subscribe', channel: `table:messages` }));
    console.log(`[${name}] subscribed to messages`);
  });

  ws.on('message', (raw: Buffer) => {
    try {
      const event = JSON.parse(raw.toString());
      if (event.type === 'INSERT' && event.table === 'messages') {
        const msg = event.record;
        if (msg.room === ROOM && msg.user_id !== user.id) {
          console.log(`[${ROOM}] <${msg.user_email}>: ${msg.body}`);
        }
      }
    } catch (_) {}
  });

  ws.on('error', (err: Error) => console.error(`[${name}] WS error:`, err.message));

  // Send a message
  async function send(body: string) {
    await gb.from('messages').insert({
      room: ROOM,
      user_id: user.id,
      user_email: user.email,
      body,
    });
    console.log(`[${name}] sent: "${body}"`);
  }

  return { send, ws, gb };
}

async function demo() {
  console.log('=== GoBase Chat Demo ===');
  console.log(`Room: ${ROOM}\n`);

  // Simulate two users chatting
  const alice = await startChat('alice@chat.example', 'Alice@12345', 'Alice');
  const bob   = await startChat('bob@chat.example',   'Bob@12345',   'Bob');

  await new Promise(r => setTimeout(r, 500));

  await alice.send('Hey Bob! Are you there?');
  await new Promise(r => setTimeout(r, 300));
  await bob.send('Hi Alice! Yes, this chat runs on GoBase 🚀');
  await new Promise(r => setTimeout(r, 300));
  await alice.send('Nice! Real-time with WebSockets and zero config.');
  await new Promise(r => setTimeout(r, 300));
  await bob.send('And it persists in MySQL. Pull history any time.');

  // Load message history
  await new Promise(r => setTimeout(r, 500));
  const { data } = await gb.from('messages')
    .select('user_email,body,created_at')
    .eq('room', ROOM)
    .get();
  console.log(`\n--- ${ROOM} history (${data?.rows?.length ?? 0} messages) ---`);
  for (const m of data?.rows ?? []) {
    console.log(`<${m.user_email}>: ${m.body}`);
  }

  alice.ws.close();
  bob.ws.close();
}

demo().catch(console.error);
