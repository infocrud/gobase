import { Code, H2, P } from '../../components/DocElements';

const ic = { color: '#da5d04', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' } as const;
const li = { color: '#475569', paddingLeft: '20px', marginBottom: '16px', lineHeight: 2.2 } as const;

export default function RLSPage() {
  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Row-Level Security</h1>
      <P>GoBase enforces row-level security (RLS) on all REST API operations. Policies are stored in the database and evaluated at query time. If no policy exists, access is denied by default.</P>

      <H2>How It Works</H2>
      <ol style={{ ...li, listStyle: 'decimal' }}>
        <li>Create a policy in the <code style={ic}>policies</code> table</li>
        <li>GoBase loads policies into memory (cached, refreshed periodically)</li>
        <li>Each REST API request is checked against matching policies</li>
        <li>The policy expression is rendered with the user's context and appended as a WHERE clause</li>
      </ol>

      <H2>Create a Policy</H2>
      <Code>{`INSERT INTO policies (name, "table", operation, role, expression, enabled)
VALUES
  -- Users can only read their own todos
  ('user_select_todos', 'todos', 'SELECT', 'authenticated',
   'user_id = {{.UserID}}', true),

  -- Users can insert their own todos
  ('user_insert_todos', 'todos', 'INSERT', 'authenticated',
   'user_id = {{.UserID}}', true),

  -- Public read access to published posts
  ('public_read_posts', 'posts', 'SELECT', 'public',
   'published = true', true),

  -- Full access policy (admin use)
  ('admin_all', 'todos', 'ALL', 'authenticated',
   '1=1', true);`}</Code>

      <H2>Template Variables</H2>
      <P>Policy expressions support Go template syntax with user context:</P>
      <ul style={li}>
        <li><code style={ic}>{'{{.UserID}}'}</code> — The authenticated user's ID</li>
        <li><code style={ic}>{'{{.Email}}'}</code> — The authenticated user's email</li>
      </ul>

      <H2>Deny by Default</H2>
      <P>If no policy matches a table + operation, the request is <strong style={{ color: '#dc2626' }}>denied</strong>. This is secure by default — you must explicitly grant access.</P>

      <H2>Operations</H2>
      <ul style={li}>
        <li><code style={ic}>SELECT</code> — Read rows</li>
        <li><code style={ic}>INSERT</code> — Create rows</li>
        <li><code style={ic}>UPDATE</code> — Modify rows</li>
        <li><code style={ic}>DELETE</code> — Remove rows</li>
        <li><code style={ic}>ALL</code> — Applies to all operations</li>
      </ul>
    </div>
  );
}
