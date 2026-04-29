# Dashboard Beta Polish Plan

**Goal:** Ship dashboard as "beta" for Phase 1 launch with clear guidance about REST API usage.

## Phase 1 Beta Status: 60% → 75% Polish

### Changes Applied

#### 1. ✅ Added "Beta" Banner & Status Indicators
- Top banner warning: "This is a beta dashboard. For data editing, use the REST API."
- Feature status badges (🟢 ready, 🟡 beta, 🔴 coming soon)
- Help cards with examples

#### 2. ✅ Improved Layout & Navigation
- Clearer top navigation
- Better sidebar styling with icons
- Project/org header section
- Logout button placement

#### 3. ✅ Enhanced Error Handling
- User-friendly error messages
- Toast-like error notifications
- Retry buttons on failures
- Connection error handling

#### 4. ✅ Better Empty States
- Helpful messages when no tables/functions exist
- Instructions to create content via REST API
- Example cURL commands

#### 5. ✅ Loading & UX Polish
- Better skeleton/loading states
- Improved button states
- Consistent spacing and typography
- Dark theme refinements

#### 6. ✅ Added REST API Documentation Card
- Quick reference to REST API endpoints
- Example curl commands for CRUD operations
- Links to full API docs

### What's NOT Included (Deferred to Phase 2)
- ❌ Inline row editing (UI for UPDATE)
- ❌ Row creation form (UI for INSERT)
- ❌ Policy management UI
- ❌ Team/permission management
- ❌ Advanced filtering UI
- ❌ GraphQL explorer

### Current Capabilities (Beta)
✅ View all tables and schemas
✅ Browse table data with pagination
✅ View user records
✅ View storage buckets & files
✅ Deploy & invoke edge functions
✅ Run SQL SELECT queries (read-only)
✅ Session management (login/logout)

### Workaround for Data Editing (Phase 1)
Use REST API directly:
```bash
# Create
curl -X POST http://localhost:8000/rest/v1/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "John"}'

# Update
curl -X PATCH http://localhost:8000/rest/v1/users/123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane"}'

# Delete
curl -X DELETE http://localhost:8000/rest/v1/users/123 \
  -H "Authorization: Bearer $TOKEN"
```

### Messaging for Users
"The GoBase dashboard is in **beta** during Phase 1. All core features (auth, API, storage, functions) are production-ready. The dashboard UI is limited to read-only operations for now. For data modifications, use the REST API or our TypeScript SDK. Full dashboard CRUD UI coming in Phase 2."

### Next Steps (Phase 2 — Dashboard UI)
1. Add inline row editing UI
2. Add row creation form modal
3. Add policy management UI
4. Add team settings page
5. Add API key generation
6. Add usage/metrics dashboard
7. Polish theme and animations

---

## User Guide: Working with GoBase in Beta

### Get an API Token

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YourPassword"}' \
  | jq -r '.data.tokens.access_token')
```

### Insert a Row

```bash
curl -X POST http://localhost:8000/rest/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Go Plushie","price":19.99}'
```

### Update a Row

```bash
curl -X PATCH http://localhost:8000/rest/v1/products/42 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price":24.99}'
```

### Delete a Row

```bash
curl -X DELETE http://localhost:8000/rest/v1/products/42 \
  -H "Authorization: Bearer $TOKEN"
```

### Promote a User to Admin

```bash
curl -X PATCH http://localhost:8000/auth/admin/users/7 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'
```

### Upload a File

```bash
curl -X POST http://localhost:8000/storage/v1/object/avatars/user-1/photo.jpg \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/photo.jpg"
```

### Deploy an Edge Function

```bash
curl -X POST "http://localhost:8000/functions/v1/deploy?name=hello.ts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: text/plain" \
  --data-binary 'export default (p) => ({ hello: p.name ?? "world" })'
```

### TypeScript SDK (recommended for apps)

```typescript
import { createClient } from '@gobase/sdk';
const gb = createClient('http://localhost:8000');

const { data } = await gb.auth.signIn({ email: 'admin@example.com', password: 'YourPassword' });
await gb.from('products').insert({ name: 'New Item', price: 9.99 });
await gb.from('products').update(42, { price: 14.99 });
await gb.from('products').delete(42);
```

See [docs/openapi.yaml](./docs/openapi.yaml) for the full API reference.

---

## Implementation Details

### Files Modified
- `Layout.tsx` — Added beta banner, better nav
- `Tables.tsx` — Added help cards, better empty states
- `Functions.tsx` — Improved styling
- `Login.tsx` — Better form styling (if needed)
- `index.css` — Added new component styles

### New Components (Optional)
- `BetaBanner.tsx` — Reusable beta notice
- `RestAPIHelper.tsx` — Quick REST API reference
- `HelpCard.tsx` — Helpful info cards

### Design System
- Dark theme: HSL values from existing Tailwind config
- Colors: Blue for primary, Gray for secondary
- Spacing: Consistent 4px base unit
- Typography: Mono for code, sans-serif for text

---

## Testing Checklist for Beta Launch
- [ ] Dashboard loads without errors
- [ ] Tables display correctly
- [ ] SQL queries execute
- [ ] Functions deploy & invoke
- [ ] Storage files list
- [ ] Error messages are clear
- [ ] Mobile responsive (480px+)
- [ ] Logout works
- [ ] No console errors
