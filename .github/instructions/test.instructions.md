---
applyTo: '**/*.spec.{ts,tsx}'
---

# Testing Conventions

## MANDATORY: After Test Changes

Run scoped tests after editing or adding tests:

```bash
npm run test:unit -w @bendike/api -- path/to/file.spec.ts
npm run test:unit -w @bendike/web -- path/to/file.spec.tsx
```

Run the full validation suite before committing:

```bash
npm run validate
```

## Stack

- **Runner:** Jest 30 with `ts-jest` in every workspace (never Vitest)
- **API wiring:** `@nestjs/testing` `Test.createTestingModule`
- **Repositories:** mocked through `getRepositoryToken(Entity)`; unit specs never open a database connection
- **Web rendering:** `@testing-library/react` + `@testing-library/user-event` on `jest-environment-jsdom`
- **Web network:** `jest.spyOn(globalThis, 'fetch')` in `api/http.spec.ts`; everywhere else mock the module
  `auth/auth-api.ts` with `jest.mock`
- **Test data:** `apps/api/src/users/user.factory.ts` builds a valid `User`; override only the field under test

## Test File Structure

Tests live next to the code as `*.spec.ts` (API, shared) or `*.spec.tsx` (web).

```typescript
describe('ComponentName', () => {
  describe('when [condition]', () => {
    test('[expected behavior]', () => {
      // Arrange
      const input = 'test-value';

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe('expected-value');
    });
  });
});
```

## Test Design Rules

1. Arrange-Act-Assert for every test.
2. `describe` / `test` blocks; describe behavior, not implementation details.
3. Extract fixture values to variables. Never hardcode the same literal in setup and assertion.
4. Tests MUST be isolated (no shared mutable state) and deterministic.
5. Tests MUST run identically locally and in CI.
6. Test unhappy paths: wrong password, duplicate email, forbidden role, unknown id, expired token.
7. Every role-gated behavior gets a test for an allowed role AND a forbidden role.
8. Tests must FAIL if production code regresses.
9. **NEVER export functions or variables from production code solely for testing.**
10. **NEVER use module-level mutable state for DI.**
11. Anything that serializes an account must be asserted not to leak the password hash, for example
    `expect(JSON.stringify(result)).not.toContain(hash)`.

## Dependency Injection in API Tests

Build the unit under test through the Nest testing module in a single `beforeEach`, with the unit and every
collaborator mock declared as closured `let`s. Each test overrides only the one thing it exercises.

```typescript
let service: AuthService;
let users: { findByEmail: jest.Mock; create: jest.Mock };

beforeEach(async () => {
  users = { findByEmail: jest.fn(), create: jest.fn() };
  const ref = await Test.createTestingModule({
    providers: [AuthService, { provide: UsersService, useValue: users }],
  }).compile();
  service = ref.get(AuthService);
});
```

Do not `new AuthService(...)` with hand-built dependencies, and do not extract per-test `makeService()` helpers.
The one exception is a pure class with no dependencies, such as `PasswordHasher`.

## Web Component Tests

- Wrap routed components in `MemoryRouter` with `initialEntries` set to the route under test.
- Mock `useAuth` via `jest.mock('../auth/use-auth')` and `jest.mocked(useAuth).mockReturnValue(...)` to put
  the component in a specific role. Provide all six fields of `AuthState`.
- Query by role and accessible name (`getByRole('heading', { level: 1, name })`), not by CSS class.
- Use `userEvent` for interactions and `waitFor` for async state.

## Dependencies

Install new test deps with an exact version: `npm install --save-dev <pkg>@<exact-version> -w <workspace>`.
