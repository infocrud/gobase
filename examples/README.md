# GoBase Example Projects

Ready-to-run examples showing how to build real apps with GoBase.

| Example | Description | Key features |
|---|---|---|
| [saas-starter](./saas-starter/) | SaaS boilerplate with auth, billing hooks, and per-user data | Auth, REST, RLS, Storage |
| [chat-app](./chat-app/) | Real-time group chat | Realtime WebSocket, Auth |
| [blog](./blog/) | Headless CMS / blog backend | REST CRUD, Auth, Storage |
| [file-manager](./file-manager/) | S3-compatible file manager | Storage, Signed URLs |

## Prerequisites

```bash
# GoBase running locally
make docker-up && make migrate
make run-gateway & make run-auth & make run-rest & make run-storage & make run-realtime &

# Node.js 18+
node --version
```

## Running Any Example

```bash
cd examples/<example-name>
npm install
cp .env.example .env   # set GOBASE_URL if needed
npm start
```
