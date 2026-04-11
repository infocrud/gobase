import { Code, H2, P, Table } from '../../components/DocElements';

export default function DatabasePage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-2">Database</h1>
      <P>GoBase auto-generates a REST API from your MySQL schema. Create tables in MySQL, and GoBase instantly provides Supabase-compatible CRUD endpoints.</P>

      <H2>Endpoints</H2>
      <Table headers={['Method', 'Endpoint', 'Description']} rows={[
        ['GET', '/rest/v1/_schema', 'List all tables and columns'],
        ['GET', '/rest/v1/:table', 'Select rows (with filters)'],
        ['POST', '/rest/v1/:table', 'Insert a row'],
        ['PATCH', '/rest/v1/:table/:id', 'Update a row'],
        ['DELETE', '/rest/v1/:table/:id', 'Delete a row'],
      ]} />

      <H2>Query Filters</H2>
      <P>Use Supabase-style query parameters to filter results:</P>
      <Table headers={['Operator', 'Example', 'SQL Equivalent']} rows={[
        ['eq', '?status=eq.active', "status = 'active'"],
        ['neq', '?role=neq.admin', "role != 'admin'"],
        ['gt', '?age=gt.18', 'age > 18'],
        ['gte', '?score=gte.90', 'score >= 90'],
        ['lt', '?price=lt.100', 'price < 100'],
        ['like', '?name=like.%john%', "name LIKE '%john%'"],
        ['in', '?id=in.(1,2,3)', 'id IN (1,2,3)'],
        ['is', '?deleted=is.null', 'deleted IS NULL'],
      ]} />

      <H2>Usage Examples</H2>
      <Code>{`# Get all todos
curl http://localhost:8000/rest/v1/todos \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Get active todos, ordered by creation date
curl "http://localhost:8000/rest/v1/todos?done=eq.0&order=created_at.desc&limit=10" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Insert a todo
curl -X POST http://localhost:8000/rest/v1/todos \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Buy groceries", "done": 0}'`}</Code>

      <H2>SDK Usage</H2>
      <Code>{`// Select with filters
const { data } = await gb.from('todos')
  .select('id,title,done')
  .eq('done', false)
  .order('created_at', 'desc')
  .limit(10)
  .get()

// Insert
await gb.from('todos').insert({ title: 'New task', done: false })

// Update
await gb.from('todos').update(1, { done: true })

// Delete
await gb.from('todos').delete(1)`}</Code>
    </div>
  );
}
