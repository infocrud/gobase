import { Code, H2, P } from '../../components/DocElements';

export default function SDKPage() {
  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>JavaScript SDK</h1>
      <P>The official GoBase SDK provides a Supabase-compatible TypeScript client for Auth, Database, Storage, and Realtime.</P>

      <H2>Install</H2>
      <Code>{`npm install @gobase/sdk`}</Code>

      <H2>Initialize</H2>
      <Code>{`import { createClient } from '@gobase/sdk'

const gb = createClient('http://localhost:8000')`}</Code>

      <H2>Auth</H2>
      <Code>{`// Sign up
const { data } = await gb.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword'
})

// Sign in
await gb.auth.signIn({ email, password })

// Get session
const user = await gb.auth.getUser()

// Sign out
await gb.auth.signOut()`}</Code>

      <H2>Database Query Builder</H2>
      <Code>{`// Select
const { data } = await gb.from('todos')
  .select('id,title,done')
  .eq('done', false)
  .order('created_at', 'desc')
  .limit(10)
  .get()

// Insert
await gb.from('todos').insert({ title: 'New task', done: false, user_id: 1 })

// Update
await gb.from('todos').update(1, { done: true })

// Delete
await gb.from('todos').delete(1)

// Available filters
.eq('col', val)       // Equal
.neq('col', val)      // Not equal
.gt('col', val)       // Greater than
.gte('col', val)      // Greater than or equal
.lt('col', val)       // Less than
.lte('col', val)      // Less than or equal
.like('col', '%val%') // LIKE pattern
.in('col', [1,2,3])   // IN list
.is('col', 'null')    // IS NULL`}</Code>

      <H2>Storage</H2>
      <Code>{`// Upload
await gb.storage.upload('bucket', 'path/file.jpg', file)

// Download
const blob = await gb.storage.download('bucket', 'path/file.jpg')

// List
const { data } = await gb.storage.list('bucket', 'path/')

// Signed URL
const { data } = await gb.storage.createSignedUrl('bucket', 'path/file.jpg', '1h')

// Delete
await gb.storage.remove('bucket', 'path/file.jpg')`}</Code>

      <H2>Realtime</H2>
      <Code>{`// Connect
gb.realtime.connect()

// Subscribe to table changes
gb.realtime.channel('todos')
  .on('INSERT', (payload) => console.log('New:', payload.record))
  .on('UPDATE', (payload) => console.log('Updated:', payload.record))
  .on('DELETE', (payload) => console.log('Deleted:', payload.record))
  .on('*', (payload) => console.log('Any:', payload))
  .subscribe()

// Disconnect
gb.realtime.disconnect()`}</Code>
    </div>
  );
}
