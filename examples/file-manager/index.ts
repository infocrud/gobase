/**
 * GoBase File Manager
 * Demonstrates: Bucket management, file upload, list, signed URLs, delete
 */
import { createClient } from '@gobase/sdk';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const gb = createClient(process.env.GOBASE_URL ?? 'http://localhost:8000');
const BUCKET = 'demo-files';

async function demo() {
  console.log('=== GoBase File Manager ===\n');

  // Auth
  let { data, error } = await gb.auth.signIn({
    email: 'files@example.com',
    password: 'Files@12345',
  });
  if (error) {
    await gb.auth.signUp({ email: 'files@example.com', password: 'Files@12345' });
    ({ data } = await gb.auth.signIn({ email: 'files@example.com', password: 'Files@12345' }));
  }
  console.log('Logged in as:', data!.user.email);

  // ── Buckets ──────────────────────────────────────────────────────────────
  // List existing buckets
  const { data: bucketList } = await gb.storage.listBuckets();
  console.log('\nExisting buckets:', bucketList?.buckets?.map((b: any) => b.name).join(', ') || 'none');

  // Create demo bucket
  const { error: createErr } = await gb.storage.createBucket(BUCKET);
  if (createErr) console.log('(bucket may already exist)');
  else console.log('Created bucket:', BUCKET);

  // ── Upload files ──────────────────────────────────────────────────────────
  const files = [
    { path: 'docs/readme.txt',     content: 'GoBase file manager demo\n', type: 'text/plain' },
    { path: 'images/logo.svg',     content: '<svg><text>GoBase</text></svg>', type: 'image/svg+xml' },
    { path: 'data/config.json',    content: JSON.stringify({ version: '1.0', env: 'demo' }), type: 'application/json' },
  ];

  console.log('\nUploading files...');
  for (const f of files) {
    const blob = new Blob([f.content], { type: f.type });
    const { data: up, error: upErr } = await gb.storage.from(BUCKET).upload(f.path, blob);
    if (upErr) console.log(' ✗', f.path, '-', upErr);
    else console.log(' ✓', f.path, `(${up?.size ?? '?'} bytes)`);
  }

  // ── List files ────────────────────────────────────────────────────────────
  console.log('\nAll files in bucket:');
  const { data: allFiles } = await gb.storage.from(BUCKET).list();
  for (const obj of allFiles?.objects ?? []) {
    console.log(' -', obj.key, `(${obj.size} bytes, ${obj.content_type})`);
  }

  // List with prefix filter
  console.log('\nFiles under docs/:');
  const { data: docsFiles } = await gb.storage.from(BUCKET).list('docs/');
  for (const obj of docsFiles?.objects ?? []) {
    console.log(' -', obj.key);
  }

  // ── Signed URLs ───────────────────────────────────────────────────────────
  console.log('\nGenerating signed URLs...');
  for (const f of files.slice(0, 2)) {
    const { data: signed } = await gb.storage
      .from(BUCKET)
      .createSignedUrl(f.path, 3600);
    if (signed) console.log(' GET', f.path, '→', signed.signed_url.slice(0, 70) + '...');
  }

  // Signed upload URL (for direct browser uploads)
  const { data: uploadUrl } = await gb.storage
    .from(BUCKET)
    .createSignedUploadUrl('uploads/user-avatar.png');
  if (uploadUrl) {
    console.log('\nSigned upload URL (PUT directly to storage):');
    console.log(' ', uploadUrl.signed_url.slice(0, 70) + '...');
  }

  // ── Delete a file ─────────────────────────────────────────────────────────
  const { error: delErr } = await gb.storage.from(BUCKET).remove('data/config.json');
  if (!delErr) console.log('\nDeleted: data/config.json');

  // ── Final listing ─────────────────────────────────────────────────────────
  const { data: remaining } = await gb.storage.from(BUCKET).list();
  console.log('\nRemaining files:', remaining?.count ?? 0);

  await gb.auth.signOut();
  console.log('\nFile manager demo complete.');
}

demo().catch(console.error);
