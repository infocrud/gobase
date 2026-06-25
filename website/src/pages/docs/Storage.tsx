import { Code, H2, P, Table } from '../../components/DocElements';

export default function StoragePage() {
  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Storage</h1>
      <P>GoBase Storage provides S3-compatible file management via MinIO. Upload, download, delete files and generate presigned URLs.</P>

      <H2>Endpoints</H2>
      <Table headers={['Method', 'Endpoint', 'Description']} rows={[
        ['POST', '/storage/v1/object/:bucket/*path', 'Upload a file (multipart)'],
        ['GET', '/storage/v1/object/:bucket/*path', 'Download a file'],
        ['DELETE', '/storage/v1/object/:bucket/*path', 'Delete a file'],
        ['GET', '/storage/v1/object/:bucket', 'List files in a bucket'],
        ['POST', '/storage/v1/sign/:bucket/*path', 'Generate presigned download URL'],
        ['POST', '/storage/v1/sign/upload/:bucket/*path', 'Generate presigned upload URL'],
        ['GET', '/storage/v1/bucket', 'List all buckets'],
        ['POST', '/storage/v1/bucket', 'Create a bucket'],
        ['DELETE', '/storage/v1/bucket/:name', 'Delete a bucket'],
      ]} />

      <H2>Upload a File</H2>
      <Code>{`curl -X POST http://localhost:8000/storage/v1/object/my-bucket/photos/avatar.jpg \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@/path/to/avatar.jpg"`}</Code>

      <H2>Presigned URLs</H2>
      <P>Generate time-limited download links without exposing credentials:</P>
      <Code>{`curl -X POST http://localhost:8000/storage/v1/sign/my-bucket/photos/avatar.jpg \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"expires_in": "1h"}'`}</Code>

      <H2>SDK Usage</H2>
      <Code>{`// Upload
await gb.storage.upload('my-bucket', 'photos/avatar.jpg', file)

// Download
const blob = await gb.storage.download('my-bucket', 'photos/avatar.jpg')

// List
const { data } = await gb.storage.list('my-bucket', 'photos/')

// Signed URL
const { data } = await gb.storage.createSignedUrl('my-bucket', 'photos/avatar.jpg', '1h')`}</Code>
    </div>
  );
}
