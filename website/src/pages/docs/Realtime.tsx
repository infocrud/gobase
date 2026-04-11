import { Code, H2, P } from '../../components/DocElements';

export default function RealtimePage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-2">Realtime</h1>
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
  .on('INSERT', (payload) => {
    console.log('New todo:', payload.record)
  })
  .on('UPDATE', (payload) => {
    console.log('Updated:', payload.record)
  })
  .on('DELETE', (payload) => {
    console.log('Deleted:', payload.record)
  })
  .on('*', (payload) => {
    console.log('Any change:', payload)
  })
  .subscribe()

// Disconnect
gb.realtime.disconnect()`}</Code>

      <H2>How It Works</H2>
      <P>GoBase uses a polling-based change detection system:</P>
      <ol className="list-decimal list-inside text-[var(--text-secondary)] space-y-2 mb-4">
        <li>Changes are written to a <code className="text-blue-400">realtime_changes</code> table (via triggers or application logic)</li>
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
