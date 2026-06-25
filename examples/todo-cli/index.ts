/**
 * GoBase Todo — sample application
 *
 * Demonstrates a real multi-user app on GoBase using the TypeScript SDK:
 *   • Auth        — sign up / sign in (JWT)
 *   • REST CRUD   — create / list / update / delete rows on the `todos` table
 *   • RLS         — each user can only see and modify THEIR OWN todos
 *
 * Prereqs (already set up by the local dev stack):
 *   - GoBase gateway running on http://localhost:8000
 *   - `todos` table + per-user RLS policies (see SETUP.md)
 *
 * Run:  npm start   (from examples/todo-cli)
 */
import { createClient } from '../../sdk/typescript/src/index';

const URL = process.env.GOBASE_URL ?? 'http://localhost:8000';

// A small helper that signs a user in (or signs them up the first time).
async function loginOrRegister(email: string, password: string) {
  const gb = createClient(URL);
  let res = await gb.auth.signIn({ email, password });
  if (!res.success) {
    await gb.auth.signUp({ email, password });
    res = await gb.auth.signIn({ email, password });
  }
  if (!res.success || !res.data) throw new Error(`auth failed for ${email}: ${res.error}`);
  return { gb, user: res.data.user };
}

// List the current user's todos (RLS scopes this to the caller automatically).
async function listTodos(gb: ReturnType<typeof createClient>) {
  const { data, error } = await gb.from('todos').select('*').order('id', 'asc').get();
  if (error) throw new Error(`list failed: ${error}`);
  return (data ?? []) as any[]; // REST returns the rows array directly in `data`
}

async function addTodo(gb: ReturnType<typeof createClient>, userId: number, email: string, title: string) {
  const { error } = await gb.from('todos').insert({
    user_id: userId,
    user_email: email,
    title,
    done: false,
  });
  if (error) throw new Error(`insert failed: ${error}`);
}

function printTodos(label: string, todos: any[]) {
  console.log(`\n  ${label} (${todos.length}):`);
  if (todos.length === 0) console.log('    (none)');
  for (const t of todos) {
    console.log(`    [${t.done ? '✓' : ' '}] #${t.id}  ${t.title}`);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('   GoBase Todo — sample app  (' + URL + ')');
  console.log('═══════════════════════════════════════════');

  // ── Two independent users ────────────────────────────────
  const alice = await loginOrRegister('alice@todo.app', 'Alice@12345');
  const bob = await loginOrRegister('bob@todo.app', 'Bob@12345');
  console.log(`\n✓ Signed in: Alice (id=${alice.user.id}) and Bob (id=${bob.user.id})`);

  // ── Each user creates their own todos ────────────────────
  await addTodo(alice.gb, alice.user.id, alice.user.email, 'Buy groceries');
  await addTodo(alice.gb, alice.user.id, alice.user.email, 'Finish GoBase demo');
  await addTodo(alice.gb, alice.user.id, alice.user.email, 'Call the dentist');
  await addTodo(bob.gb, bob.user.id, bob.user.email, 'Bob: review pull request');
  await addTodo(bob.gb, bob.user.id, bob.user.email, 'Bob: book flights');
  console.log('\n✓ Alice created 3 todos, Bob created 2 todos');

  // ── RLS in action: each user sees ONLY their own rows ────
  const aliceTodos = await listTodos(alice.gb);
  const bobTodos = await listTodos(bob.gb);
  printTodos("Alice's todos", aliceTodos);
  printTodos("Bob's todos", bobTodos);

  console.log('\n  → RLS proof: Alice sees ' + aliceTodos.length +
    ' todos, Bob sees ' + bobTodos.length + ' — neither can see the other\'s.');

  // ── Update: Alice marks her first todo done ──────────────
  const first = aliceTodos[0];
  await alice.gb.from('todos').update(first.id, { done: true });
  console.log(`\n✓ Alice completed: "${first.title}"`);

  // ── Cross-user safety: Bob tries to modify Alice's todo ──
  const hack = await bob.gb.from('todos').update(first.id, { title: 'HACKED BY BOB' });
  const stillSafe = (await listTodos(alice.gb)).find((t) => t.id === first.id);
  console.log(`\n✓ Bob attempted to edit Alice's todo #${first.id} → ` +
    (hack.error || stillSafe?.title !== 'HACKED BY BOB'
      ? 'BLOCKED by RLS (Alice\'s data unchanged)'
      : 'SUCCEEDED (this would be a bug!)'));

  // ── Delete: Alice removes a todo ─────────────────────────
  const toDelete = aliceTodos[aliceTodos.length - 1];
  await alice.gb.from('todos').delete(toDelete.id);
  console.log(`\n✓ Alice deleted: "${toDelete.title}"`);

  // ── Final state ──────────────────────────────────────────
  printTodos("Alice's final todos", await listTodos(alice.gb));

  await alice.gb.auth.signOut();
  await bob.gb.auth.signOut();
  console.log('\n═══════════════════════════════════════════');
  console.log('   Demo complete — auth + REST CRUD + RLS ✓');
  console.log('═══════════════════════════════════════════');
}

main().catch((e) => {
  console.error('\n✗ Demo failed:', e.message);
  process.exit(1);
});
