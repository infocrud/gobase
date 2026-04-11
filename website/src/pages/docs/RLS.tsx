import { Code, H2, P } from '../../components/DocElements';

export default function RLSPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-2">Row-Level Security</h1>
      <P>GoBase enforces row-level security (RLS) on all REST API operations. Policies are stored in the database and evaluated at query time. If no policy exists, access is denied by default.</P>

      <H2>How It Works</H2>
      <ol className="list-decimal list-inside text-[var(--text-secondary)] space-y-2 mb-4">
        <li>Create a policy in the <code className="text-blue-400">policies</code> table</li>
        <li>GoBase loads policies into memory (cached, refreshed periodically)</li>
        <li>Each REST API request is checked against matching policies</li>
        <li>The policy expression is rendered with the user's context and appended as a WHERE clause</li>
      </ol>

      <H2>Create a Policy</H2>
      <Code>{`INSERT INTO policies (name, \`table\`, operation, role, expression, enabled)
VALUES
  -- Users can only read their own todos
  ('user_select_todos', 'todos', 'SELECT', 'authenticated',
   'user_id = {{.UserID}}', true),

  -- Users can insert their own todos
  ('user_insert_todos', 'todos', 'INSERT', 'authenticated',
   'user_id = {{.UserID}}', true),

  -- Public read access to published posts
  ('public_read_posts', 'posts', 'SELECT', 'public',
   'published = 1', true),

  -- Full access policy (admin use)
  ('admin_all', 'todos', 'ALL', 'authenticated',
   '1=1', true);`}</Code>

      <H2>Template Variables</H2>
      <P>Policy expressions support Go template syntax with user context:</P>
      <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-1 mb-4">
        <li><code className="text-blue-400">{'{{.UserID}}'}</code> — The authenticated user's ID</li>
        <li><code className="text-blue-400">{'{{.Email}}'}</code> — The authenticated user's email</li>
      </ul>

      <H2>Deny by Default</H2>
      <P>If no policy matches a table + operation, the request is <strong className="text-red-400">denied</strong>. This is secure by default — you must explicitly grant access.</P>

      <H2>Operations</H2>
      <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-1 mb-4">
        <li><code className="text-blue-400">SELECT</code> — Read rows</li>
        <li><code className="text-blue-400">INSERT</code> — Create rows</li>
        <li><code className="text-blue-400">UPDATE</code> — Modify rows</li>
        <li><code className="text-blue-400">DELETE</code> — Remove rows</li>
        <li><code className="text-blue-400">ALL</code> — Applies to all operations</li>
      </ul>
    </div>
  );
}
