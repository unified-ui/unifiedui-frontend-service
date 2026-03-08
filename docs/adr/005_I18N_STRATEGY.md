# ADR-005: Internationalization (i18n) Strategy

|                     |                 |
| ------------------- | --------------- |
| **Status**          | Accepted        |
| **Date**            | 2025-02-15      |
| **Decision Makers** | Enrico Goerlitz |

## Context

The frontend must support internationalization for:

- All user-visible strings (labels, messages, errors, tooltips)
- Date and number formatting
- Future multi-language support (de-DE, fr-FR, etc.)

The app currently has ~500+ translatable strings across 15 pages and 30+ components.

## Decision

Use **i18next** with **react-i18next** and a **namespace-per-domain** strategy.

### Namespace Structure

```
src/i18n/
├── index.ts                          # i18n configuration (production)
├── i18nForTests.ts                   # i18n configuration (tests)
└── locales/
    └── en-US/
        ├── common.json               # Shared strings (buttons, labels, errors)
        ├── dashboard.json            # Dashboard page
        ├── login.json                # Login page
        ├── header.json               # Header component
        ├── conversations.json        # Conversations page
        ├── settings.json             # Tenant settings
        ├── tracing.json              # Tracing views
        ├── credentials.json          # Credentials page
        ├── token.json                # Token management
        ├── widgetDesigner.json        # Widget designer
        └── reactAgent.json           # ReACT agent developer
```

### Usage Patterns

```typescript
// In React components
const { t } = useTranslation('conversations');
return <Text>{t('conversations:sidebar.title')}</Text>;

// Outside React (callbacks, contexts)
import i18next from 'i18next';
const message = i18next.t('common:errors.networkError');
```

### Rules

1. **Never hardcode user-visible strings** — always use `t()`
2. **Namespace prefix** in all keys: `t('namespace:key')`
3. **Flat keys** within namespaces: `sidebar.title` not deeply nested objects
4. **Common namespace** for shared strings (buttons, validation messages, errors)
5. **One test i18n instance** that returns keys as-is (no translation lookup in tests)

## Rationale

### Why i18next?

- Most mature i18n library for React (~10M weekly npm downloads)
- Namespace support is first-class — aligns with domain-driven organization
- Browser language detection plugin (`i18next-browser-languagedetector`)
- Pluralization, interpolation, and context support built-in
- Separate test configuration avoids brittle translation-dependent tests

### Why Namespaces (not a single JSON file)?

- 500+ strings in one file would be unmaintainable
- Namespaces align with page/feature boundaries
- Enables code-splitting translations per route in the future
- Multiple developers can work on different namespaces without merge conflicts

## Consequences

### Positive

- Ready for multi-language support without code changes (add `de-DE/` folder)
- Clear organization: each page/feature owns its translations
- Tests are translation-independent (use key-based assertions)

### Negative

- Only `en-US` exists today — adding a new language requires translating 12 namespace files
- Namespace prefixes add verbosity to translation keys
- No automatic detection of unused translation keys (manual cleanup needed)
