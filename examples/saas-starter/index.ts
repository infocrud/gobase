/**
 * GoBase SaaS Starter
 * Demonstrates: Auth, per-user data (REST + RLS), file uploads, Edge Functions
 *
 * Setup:
 *   CREATE TABLE projects (
 *     id         INT AUTO_INCREMENT PRIMARY KEY,
 *     owner_id   INT NOT NULL,
 *     name       VARCHAR(255) NOT NULL,
 *     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 *   );
 *
 *   CREATE TABLE tasks (
 *     id         INT AUTO_INCREMENT PRIMARY KEY,
 *     project_id INT NOT NULL,
 *     owner_id   INT NOT NULL,
 *     title      VARCHAR(255) NOT NULL,
 *     done       TINYINT(1) DEFAULT 0,
 *     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 *   );
 */
import { createClient } from '@gobase/sdk';

const gb = createClient(process.env.GOBASE_URL ?? 'http://localhost:8000');

// ── Auth ──────────────────────────────────────────────────────────────────────
async function demo() {
  console.log('=== GoBase SaaS Starter ===\n');

  // 1. Sign up
  const { data: signupData, error: signupErr } = await gb.auth.signUp({
    email: 'alice@saas.example',
    password: 'Alice@12345',
  });
  if (signupErr) console.log('(signup):', signupErr); // already exists on re-run
  else console.log('Signed up:', signupData.user.email);

  // 2. Login
  const { data: loginData, error: loginErr } = await gb.auth.signIn({
    email: 'alice@saas.example',
    password: 'Alice@12345',
  });
  if (loginErr) throw new Error(`Login failed: ${loginErr}`);
  console.log('Logged in as:', loginData.user.email);

  const userId = loginData.user.id;

  // 3. Create a project
  const { data: project, error: projErr } = await gb
    .from('projects')
    .insert({ name: 'My First SaaS', owner_id: userId })
    .single();
  if (projErr) throw new Error(`Create project: ${projErr}`);
  console.log('Created project:', project.row.name, '(id:', project.row.id, ')');

  const projectId = project.row.id;

  // 4. Add tasks to the project
  const tasks = ['Build landing page', 'Set up billing', 'Launch on HackerNews'];
  for (const title of tasks) {
    await gb.from('tasks').insert({ project_id: projectId, owner_id: userId, title });
  }
  console.log('Added', tasks.length, 'tasks');

  // 5. Query tasks with filter
  const { data: openTasks } = await gb
    .from('tasks')
    .select('id,title,done')
    .eq('project_id', String(projectId))
    .eq('done', '0')
    .get();
  console.log('Open tasks:', openTasks?.rows?.length ?? 0);

  // 6. Complete the first task
  if (openTasks?.rows?.[0]) {
    const firstId = openTasks.rows[0].id;
    await gb.from('tasks').update(firstId, { done: 1 });
    console.log('Completed task:', openTasks.rows[0].title);
  }

  // 7. Upload a project logo
  const logoBlob = new Blob(['<svg>GoBase Logo Placeholder</svg>'], { type: 'image/svg+xml' });
  const { data: uploadData, error: uploadErr } = await gb.storage
    .from('assets')
    .upload(`projects/${projectId}/logo.svg`, logoBlob);
  if (uploadErr) console.log('(storage skip — bucket may not exist):', uploadErr);
  else console.log('Uploaded logo:', uploadData?.key);

  // 8. Generate a signed URL for the logo
  if (!uploadErr) {
    const { data: signed } = await gb.storage
      .from('assets')
      .createSignedUrl(`projects/${projectId}/logo.svg`, 3600);
    if (signed) console.log('Signed URL expires in 1h:', signed.signed_url.slice(0, 60) + '...');
  }

  // 9. Logout
  await gb.auth.signOut();
  console.log('\nDone. Session ended.');
}

demo().catch(console.error);
