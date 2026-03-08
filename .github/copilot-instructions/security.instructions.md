---
applyTo: "**"
---

# Security Guidelines — Frontend Service (React/TypeScript)

## CRITICAL: Read This First

These rules are **mandatory** for all code generation. Violations introduce client-side security vulnerabilities.

---

## 1. XSS Prevention (Cross-Site Scripting)

**Threat**: User-controlled data rendered as HTML → attacker executes JavaScript in other users' browsers.

### Rules

- **NEVER** use `dangerouslySetInnerHTML` — no exceptions. If you think you need it, find another approach (Mantine components, markdown renderer with sanitization).
- **NEVER** construct HTML strings from user input.
- **ALWAYS** rely on React's built-in JSX escaping — it auto-escapes `{}` expressions.
- **NEVER** use `document.write()`, `document.createElement()` with user data, or `eval()`.
- **NEVER** set `innerHTML` via DOM refs.

### Correct Pattern

```tsx
// React auto-escapes — safe
<Text>{userInput}</Text>
<span>{message.content}</span>
```

### Wrong Pattern

```tsx
// WRONG — XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userInput }} />;
// WRONG — bypasses React escaping
ref.current.innerHTML = userInput;
```

---

## 2. No Secrets in Frontend

### Rules

- **NEVER** include API keys, tokens, or secrets in frontend code — not in source files, environment variables exposed to the browser (`VITE_*`), or localStorage.
- **ONLY** store the MSAL access token in memory (handled by `@azure/msal-browser`).
- **NEVER** log tokens or authentication headers to the console.
- API keys belong in backend services only.

### Correct Pattern

```tsx
// Authentication via MSAL — token managed by library
const { getAccessToken } = useIdentity();
const token = await getAccessToken();
// Token used in Authorization header, never stored manually
```

### Wrong Pattern

```tsx
// WRONG — secret in frontend code
const API_KEY = "sk-abc123...";
// WRONG — secret in env var exposed to browser
const key = import.meta.env.VITE_SECRET_KEY;
// WRONG — storing token in localStorage
localStorage.setItem("token", accessToken);
```

---

## 3. Secure API Communication

### Rules

- **ALWAYS** use the centralized API client (`src/api/client/`) for all HTTP requests — it handles auth headers, base URL, and error handling consistently.
- **NEVER** use raw `fetch()` or `axios` directly in components.
- **ALWAYS** send authentication tokens via `Authorization: Bearer` header — never in URL query params.
- **NEVER** include sensitive data in URL query parameters (visible in logs, browser history).

---

## 4. URL & Navigation Safety

### Rules

- **ALWAYS** use React Router's `navigate()` or `<Link>` for navigation — never `window.location`.
- **NEVER** construct URLs from user input without sanitization.
- **NEVER** use `javascript:` or `data:` schemes in any URL, href, or src.
- **ALWAYS** validate external URLs before opening them (check `https://` scheme).

### Correct Pattern

```tsx
// Safe navigation
const navigate = useNavigate();
navigate(`/agents/${encodeURIComponent(agentId)}`);

// External link validation
const isValidURL = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
};
```

---

## 5. CSRF Protection

### Rules

- **ALWAYS** use `Authorization: Bearer` header for API calls — this inherently prevents CSRF (cookies not used for auth).
- **NEVER** rely on cookies for authentication without SameSite and CSRF tokens.

---

## 6. Input Handling

### Rules

- **ALWAYS** trim and validate user input before sending to the API.
- **ALWAYS** enforce max length on text inputs (`maxLength` prop).
- **NEVER** trust client-side validation alone — it's for UX, not security. Backend must validate too.
- **ALWAYS** encode path parameters with `encodeURIComponent()` when constructing URLs.

---

## 7. Dependency Security

### Rules

- **NEVER** add dependencies without checking their maintenance status and security record.
- **ALWAYS** prefer well-maintained libraries with frequent updates.
- Review Dependabot alerts promptly.

---

## Quick Checklist Before Committing

- [ ] No `dangerouslySetInnerHTML` usage
- [ ] No secrets/API keys in frontend code or `VITE_*` env vars
- [ ] All API calls use the centralized client
- [ ] No `eval()`, `document.write()`, or `innerHTML` with user data
- [ ] All URL construction uses proper encoding
- [ ] No sensitive data in URL query params
- [ ] External links validated for `https://` scheme
- [ ] Input fields have max length constraints
