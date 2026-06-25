import { Code, H2, P, Table } from '../../components/DocElements';

const ic = { color: '#da5d04', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' } as const;

export default function AuthPage() {
  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Authentication</h1>
      <P>GoBase provides a complete authentication system with email/password, OAuth2, email verification, and password reset.</P>

      <H2>Endpoints</H2>
      <Table
        headers={['Method', 'Endpoint', 'Auth', 'Description']}
        rows={[
          ['POST', '/auth/signup', 'Public', 'Create account + sends verification email'],
          ['POST', '/auth/login', 'Public', 'Sign in with email/password'],
          ['POST', '/auth/refresh', 'Public', 'Rotate refresh token'],
          ['GET', '/auth/verify?token=', 'Public', 'Verify email address'],
          ['POST', '/auth/verify/resend', 'Public', 'Resend verification email'],
          ['POST', '/auth/forgot-password', 'Public', 'Send password reset email'],
          ['POST', '/auth/reset-password', 'Public', 'Reset password with token'],
          ['GET', '/auth/me', 'JWT', 'Get current user'],
          ['POST', '/auth/logout', 'JWT', 'Revoke all refresh tokens'],
          ['GET', '/auth/oauth/:provider', 'Public', 'Redirect to OAuth provider'],
        ]}
      />

      <H2>Sign Up</H2>
      <Code>{`curl -X POST http://localhost:8000/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'`}</Code>
      <P>Response includes access_token (15min), refresh_token (7 days), and user object. A verification email is sent automatically.</P>

      <H2>Sign In</H2>
      <Code>{`curl -X POST http://localhost:8000/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "securepassword"}'`}</Code>

      <H2>Using the SDK</H2>
      <Code>{`import { createClient } from '@gobase/sdk'

const gb = createClient('http://localhost:8000')

// Sign up
await gb.auth.signUp({ email: 'user@example.com', password: 'password' })

// Sign in
await gb.auth.signIn({ email: 'user@example.com', password: 'password' })

// Get current user
const user = await gb.auth.getUser()

// Sign out
await gb.auth.signOut()`}</Code>

      <H2>OAuth2</H2>
      <P>GoBase supports Google and GitHub OAuth2. Set the client credentials in your .env:</P>
      <Code>{`GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
GITHUB_CLIENT_ID=your-github-id
GITHUB_CLIENT_SECRET=your-github-secret`}</Code>
      <P>Redirect users to <code style={ic}>/auth/oauth/google</code> or <code style={ic}>/auth/oauth/github</code> to initiate the flow.</P>

      <H2>Admin Endpoints</H2>
      <Table
        headers={['Method', 'Endpoint', 'Description']}
        rows={[
          ['GET', '/auth/admin/users', 'List all users (paginated)'],
          ['GET', '/auth/admin/users/:id', 'Get user details'],
          ['PATCH', '/auth/admin/users/:id', 'Update user role'],
          ['DELETE', '/auth/admin/users/:id', 'Delete user and tokens'],
        ]}
      />
      <P>Admin endpoints require a JWT with <code style={ic}>role: "admin"</code>.</P>
    </div>
  );
}
