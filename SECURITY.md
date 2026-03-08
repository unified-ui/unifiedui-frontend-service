# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email: **rico.goerlitz@gmail.com**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact

We will respond within **48 hours** and work with you to resolve the issue before any public disclosure.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| Latest  | ✅        |

## Security Measures

- **CodeQL** — automated security scanning on every push and weekly
- **Dependency Review** — blocks PRs with high-severity vulnerabilities or GPL-3.0/AGPL-3.0 licenses
- **Dependabot** — automated dependency updates (weekly)
- **Pre-commit hooks** — `detect-private-key` prevents accidental credential commits
- **Content Security** — no inline scripts, strict CSP headers recommended for deployment
