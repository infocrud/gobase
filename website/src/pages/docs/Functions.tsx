import { Code, H2, P, Table } from '../../components/DocElements';

export default function FunctionsDocPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-2">Edge Functions</h1>
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
      <P>The payload is available via the <code className="text-blue-400">GOBASE_PAYLOAD</code> environment variable and stdin.</P>

      <H2>Timeout</H2>
      <P>Default timeout is 30 seconds. Override per invocation:</P>
      <Code>{`curl -X POST "http://localhost:8000/functions/v1/hello.ts?timeout=10s" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}</Code>

      <H2>Runtime Requirements</H2>
      <P>Install either Deno or Node.js on the server:</P>
      <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-1 mb-4">
        <li><strong>Deno</strong> — Preferred. Auto-sandboxed with <code className="text-blue-400">--allow-net --allow-env</code></li>
        <li><strong>Node.js</strong> — Fallback. Used if Deno is not available.</li>
      </ul>
    </div>
  );
}
