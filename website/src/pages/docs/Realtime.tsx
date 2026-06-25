import { Code, H2, P } from '../../components/DocElements';

const ic = { color: '#da5d04', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' } as const;

export default function RealtimePage() {
  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Realtime</h1>
      <P>GoBase Realtime provides WebSocket pub/sub for live data. Subscribe to table changes (INSERT, UPDATE, DELETE) and receive events instantly.</P>

      <H2>Connect via WebSocket</H2>
      <Code>{`ws://localhost:8000/realtime/ws?token=YOUR_TOKEN`}</Code>

      <H2>Subscribe to a Table</H2>
      <P>Send a JSON message to subscribe to changes on a specific table:</P>
      <Code>{`// Subscribe
{"type": "subscribe", "channel": "realtime:public:todos"}

// Unsubscribe
{"type": "unsubscribe", "channel": "realtime:public:todos"}`}</Code>

      <H2>Receive Events</H2>
      <P>When a row changes, the server sends:</P>
      <Code>{`{
  "type": "INSERT",
  "channel": "realtime:public:todos",
  "table": "todos",
  "record": {"id": 1, "title": "New todo", "done": false},
  "timestamp": "2025-01-01T00:00:00Z"
}`}</Code>

      <H2>SDK Usage</H2>
      <Code>{`// Connect to realtime
gb.realtime.connect()

// Subscribe to changes
gb.realtime.channel('todos')
  .on('INSERT', (payload) => console.log('New todo:', payload.record))
  .on('UPDATE', (payload) => console.log('Updated:', payload.record))
  .on('DELETE', (payload) => console.log('Deleted:', payload.record))
  .on('*', (payload) => console.log('Any change:', payload))
  .subscribe()

// Disconnect
gb.realtime.disconnect()`}</Code>

      <H2>How It Works</H2>
      <P>GoBase uses a polling-based change detection system:</P>
      <ol style={{ color: '#475569', paddingLeft: '20px', marginBottom: '16px', lineHeight: 2.2 }}>
        <li>Changes are written to a <code style={ic}>realtime_changes</code> table via application logic</li>
        <li>The Notifier service polls this table every second</li>
        <li>New changes are broadcast to all subscribed WebSocket clients</li>
        <li>Processed changes are cleaned up automatically</li>
      </ol>

      <H2>Testing with wscat</H2>
      <Code>{`npm install -g wscat
wscat -c "ws://localhost:8000/realtime/ws?token=YOUR_TOKEN"

# Type:
> {"type":"subscribe","channel":"realtime:public:todos"}`}</Code>
    </div>
  );
}
