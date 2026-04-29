# Contributing to GoBase

Thank you for your interest in contributing! GoBase is an open-source Go BaaS platform and we welcome contributions of all kinds.

## Getting Started

1. **Fork** the repo and clone your fork
2. Copy `.env.example` to `.env` and fill in values
3. Start infrastructure: `make docker-up`
4. Run migrations: `make migrate`
5. Build all services: `make build`
6. Run tests: `make test`

## Development Workflow

```bash
# Run a single service in watch mode
make run-gateway    # port 8000
make run-auth       # port 8001
make run-rest       # port 8002

# Lint
make vet

# Run a single package test
go test ./pkg/jwt/... -v -run TestTokenGeneration
```

## Pull Request Guidelines

- **One feature/fix per PR** — keep diffs focused and reviewable
- **Tests required** — new code must include unit or integration tests
- **Follow existing patterns** — handlers on structs, `response.Success()`/`response.Error()`, `pkg/apperror` for errors
- **No global state** — services receive dependencies via constructor injection
- **Pass CI** — all tests, `go vet`, and golangci-lint must be green

## Reporting Bugs

Open a [GitHub Issue](https://github.com/infocrud/gobase/issues/new?template=bug_report.md) with:
- GoBase version / commit SHA
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs

## Suggesting Features

Open a [GitHub Issue](https://github.com/infocrud/gobase/issues/new?template=feature_request.md) with:
- The problem you're solving
- Your proposed solution
- Alternatives considered

## Code Style

- Go: standard `gofmt` + `golangci-lint` (see `.golangci.yml`)
- TypeScript (SDK/Dashboard): Prettier defaults
- Commit messages: conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](../LICENSE).
