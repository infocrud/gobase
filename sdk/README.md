# GoBase JS/TS Client SDK

> **Phase 4** — Will provide a JavaScript/TypeScript client for Auth, DB, Storage, and Realtime.

```ts
// Future usage:
import { createClient } from '@gobase/sdk'

const gobase = createClient('http://localhost:8000', 'your-api-key')
await gobase.auth.signUp({ email, password })
await gobase.from('todos').select('*')
```

## Planned Features
- Auth: signup, login, OAuth, session management
- Database: query builder with filtering, pagination
- Storage: upload, download, signed URLs
- Realtime: WebSocket subscriptions to table changes
