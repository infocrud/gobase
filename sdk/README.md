# GoBase SDKs

Client libraries for the GoBase BaaS platform. Available in four languages:

| Language | Path | Install |
|---|---|---|
| **TypeScript / JavaScript** | [typescript/](./typescript/) | `npm install @gobase/sdk` |
| **Go** | [go/](./go/) | `go get github.com/infocrud/gobase/sdk/go` |
| **Python** | [python/](./python/) | `pip install gobase` |
| **Ruby** | [ruby/](./ruby/) | `gem install gobase` |

## Quick Example (TypeScript)

```ts
import { createClient } from '@gobase/sdk';

const gb = createClient('http://localhost:8000');
await gb.auth.signIn({ email: 'user@example.com', password: 'secret' });

const { data } = await gb.from('posts').select('id,title').eq('published', '1').get();
```

## Quick Example (Go)

```go
gb := gobase.NewClient("http://localhost:8000")
gb.Auth.SignIn(ctx, "user@example.com", "secret")
rows, _ := gb.From("posts").Select("id,title").Eq("published", "1").Get(ctx)
```

## Quick Example (Python)

```python
from gobase import create_client
gb = create_client("http://localhost:8000")
gb.auth.sign_in("user@example.com", "secret")
rows = gb.from_("posts").select("id,title").eq("published", "1").get()
```

## Quick Example (Ruby)

```ruby
require 'gobase'
gb = Gobase.create_client("http://localhost:8000")
gb.auth.sign_in(email: "user@example.com", password: "secret")
rows = gb.from("posts").select("id,title").eq("published", "1").get
```

All SDKs expose the same surface: `auth`, `storage`, `functions`, and a fluent `from(table)` query builder.
