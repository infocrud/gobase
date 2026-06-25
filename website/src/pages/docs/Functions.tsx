import { Code, H2, P, Table } from '../../components/DocElements';

const ic = { color: '#da5d04', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' } as const;

export default function FunctionsDocPage() {
  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Edge Functions</h1>
      <P>Deploy and invoke serverless JavaScript/TypeScript functions. GoBase executes them via Deno or Node.js subprocess.</P>

      <H2>Endpoints</H2>
      <Table headers={['Method', 'Endpoint', 'Description']} rows={[
        ['POST', '/functions/v1/deploy?name=hello.ts', 'Deploy a function'],
        ['POST', '/functions/v1/hello.ts', 'Invoke a function'],
        ['GET', '/functions/v1/', 'List deployed functions'],
        ['DELETE', '/functions/v1/hello.ts', 'Delete a function'],
      ]} />

      <H2>Deploy a Function</H2>
      <Code>{`curl -X POST "http://localhost:8000/functions/v1/deploy?name=hello.ts" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: text/plain" \\
  -d 'const payload = JSON.parse(Deno.env.get("GOBASE_PAYLOAD") || "{}");
console.log(JSON.stringify({ message: "Hello from GoBase!", input: payload }));'`}</Code>

      <H2>Invoke a Function</H2>
      <Code>{`curl -X POST http://localhost:8000/functions/v1/hello.ts \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "World"}'`}</Code>
      <P>The payload is available via the <code style={ic}>GOBASE_PAYLOAD</code> environment variable and stdin.</P>

      <H2>Timeout</H2>
      <P>Default timeout is 30 seconds. Override per invocation:</P>
      <Code>{`curl -X POST "http://localhost:8000/functions/v1/hello.ts?timeout=10s" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}</Code>

      <H2>Runtime Requirements</H2>
      <P>Install either Deno or Node.js on the server:</P>
      <ul style={{ color: '#475569', paddingLeft: '20px', marginBottom: '16px', lineHeight: 2.2 }}>
        <li><strong style={{ color: '#0f172a' }}>Deno</strong> — Preferred. Auto-sandboxed with <code style={ic}>--allow-net --allow-env</code></li>
        <li><strong style={{ color: '#0f172a' }}>Node.js</strong> — Fallback. Used if Deno is not available.</li>
      </ul>
    </div>
  );
}
