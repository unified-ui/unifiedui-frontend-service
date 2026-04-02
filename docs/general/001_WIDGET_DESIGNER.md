# Widget Designer — Redesign Concept

> **Status**: Draft · **Version**: 0.5 · **Date**: 2026-03-23

---

## 1. Vision & Purpose

The Widget Designer is a visual form builder that lets tenant admins create structured data-capture forms ("Widgets") which are embedded in AI agent chat conversations. Users fill out these forms during a chat, and the structured data is sent to the agent as a machine-readable payload.

**Goal of the redesign**: Transform the current minimal prototype into a **professional-grade, low-code form builder** with advanced validation, dynamic behavior, responsive grid layout, external data integration, and a secure JavaScript scripting layer.

---

## 2. Field Types (Comprehensive)

### 2.1 Input Fields

| Field Type | Description                                   | Key Config                                   |
| ---------- | --------------------------------------------- | -------------------------------------------- |
| `text`     | Single-line text input                        | placeholder, min/maxLength, regex pattern    |
| `textarea` | Multi-line text area                          | placeholder, min/maxLength, rows, autoResize |
| `number`   | Numeric input with stepper                    | min, max, step, decimals, unit suffix        |
| `email`    | Email input with built-in validation          | placeholder                                  |
| `url`      | URL input with protocol validation            | placeholder, allowedProtocols                |
| `phone`    | Phone number input                            | placeholder, format mask                     |
| `password` | Masked input (**⚠️ see Security Note below**) | minLength, strength indicator                |
| `date`     | Date picker                                   | minDate, maxDate, disabledDates              |
| `time`     | Time picker                                   | minTime, maxTime, step (15min, 30min..)      |
| `datetime` | Combined date + time picker                   | all date + time config                       |
| `color`    | Color picker                                  | format (hex/rgb), swatches                   |

#### ⚠️ Security Note: `password` Field

The `password` field type displays a masked input but the submitted value is sent as **plain text** in the form payload to the agent/LLM. This means:

- **Never use `password` for actual authentication credentials** — the value will be visible in the chat payload and potentially processed by an LLM
- Valid use cases: temporary PINs, confirmation codes, form-internal masked inputs where the user simply doesn't want the value visible on screen
- The widget designer should show a **warning banner** when a `password` field is added: _"Password field values are sent as plain text in the form payload. Do not use for real credentials."_
- Consider whether this field type should be excluded entirely (decided: **keep with warning**, as there are legitimate masked-input use cases)

### 2.2 Selection Fields

| Field Type     | Description             | Key Config                                    |
| -------------- | ----------------------- | --------------------------------------------- |
| `select`       | Single-select dropdown  | options (static / dynamic), searchable        |
| `multi_select` | Multi-select with tags  | options, maxSelections                        |
| `radio`        | Radio button group      | options, layout (vertical/horizontal)         |
| `checkbox`     | Checkbox group          | options, minSelections, maxSelections         |
| `toggle`       | Boolean switch          | defaultValue, onLabel, offLabel               |
| `rating`       | Star / emoji rating     | maxRating, icon (star/heart/emoji), allowHalf |
| `slider`       | Range slider            | min, max, step, marks, showValue              |
| `range_slider` | Dual-thumb range slider | min, max, step                                |

### 2.3 Rich Content Fields

| Field Type  | Description                            | Key Config                                 |
| ----------- | -------------------------------------- | ------------------------------------------ |
| `file`      | File upload (multiple)                 | acceptedTypes, maxSize, maxFiles, dragDrop |
| `image`     | Image upload with preview              | acceptedTypes, maxSize, crop, aspectRatio  |
| `signature` | Signature pad (draw)                   | penColor, penWidth, backgroundColor        |
| `rich_text` | Rich text editor (bold, italic, lists) | toolbar config, maxLength                  |

### 2.4 Layout & Display Fields (non-input)

| Field Type      | Description              | Key Config                                                      |
| --------------- | ------------------------ | --------------------------------------------------------------- |
| `heading`       | Section heading          | level (h2–h5), text                                             |
| `paragraph`     | Informational text block | content (markdown), style (info/warning/success)                |
| `divider`       | Visual separator line    | style (solid/dashed), label                                     |
| `spacer`        | Vertical whitespace      | height (sm/md/lg/xl)                                            |
| `alert`         | Callout / banner         | variant (info/warning/error/success), title, content (markdown) |
| `image_display` | Static image display     | src (URL), alt, maxWidth                                        |

### 2.5 Composite / Advanced Fields

| Field Type    | Description                                                                           | Key Config                                      |
| ------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `address`     | Structured address (street, city, zip, country)                                       | requiredParts, countries                        |
| `repeater`    | Dynamic row list — user adds/removes rows of a field group (single level, no nesting) | fields[] (flat, with colSpan), minRows, maxRows |
| `key_value`   | Dynamic key-value pair list                                                           | keyLabel, valueLabel, maxPairs                  |
| `table_input` | Editable table grid                                                                   | columns[], minRows, maxRows                     |

#### Repeater Detail

A repeater defines a set of sub-fields that the user can duplicate as rows. Each row is its own **12-column grid container** — sub-fields support individual `colSpan` values for side-by-side layout within each row.

Example: "Contact Persons" with Name (colSpan: 4) + Email (colSpan: 5) + Phone (colSpan: 3) per row:

```
Kontaktpersonen:
┌───────────────────────────────────────────────────────────────┐
│  Name: [Max Mustermann]  Email: [max@test.de]  Tel: [0170..] [🗑]│
├───────────────────────────────────────────────────────────────┤
│  Name: [Erika Muster]   Email: [erika@t.de]   Tel: [0171..] [🗑]│
├───────────────────────────────────────────────────────────────┤
│  [+ Kontaktperson hinzufügen]                                    │
└───────────────────────────────────────────────────────────────┘
```

- Admin defines the sub-field set once; user adds 1–N rows at runtime
- Config: `minRows`, `maxRows`, sub-fields with individual `colSpan` (flat only — **no nested repeaters**)
- Each sub-field has a `minWidth` (in px) — if the repeater container is too narrow for the grid layout, the repeater becomes **horizontally scrollable** instead of collapsing fields to single column
- Output: Array of objects, e.g. `{ "contacts": [{ "name": "Max", "email": "max@test.de", "phone": "0170..." }, ...] }`

---

## 3. Layout System

### 3.1 Grid System

A responsive **12-column grid** system that allows placing fields side-by-side:

```
┌──────────────────────────────────────────────────────────┐
│  12-Column Grid                                          │
│                                                          │
│  ┌────────────────────────┐ ┌────────────────────────┐   │
│  │  First Name (span: 6)  │ │  Last Name (span: 6)   │   │
│  └────────────────────────┘ └────────────────────────┘   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Email (span: 12)                                  │   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────────┐  │
│  │ City (4) │ │ ZIP (3)  │ │ Country (5)              │  │
│  └──────────┘ └──────────┘ └──────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

Each field gets a `colSpan` property (1–12, default: 12 = full width).

**Responsive collapse**: Below a configurable breakpoint (default: 600px), all fields collapse to `colSpan: 12` (single column), ensuring mobile-friendly rendering inside the chat widget.

### 3.2 Sections & Tabs

For complex forms that need multiple logical groups:

```
┌──────────────────────────────────────────────────────────┐
│  Tab Bar: [ Personal Info ] [ Address ] [ Preferences ]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  (Fields of the active tab are shown here)               │
│                                                          │
│  ┌────────────────────────┐ ┌────────────────────────┐   │
│  │  First Name            │ │  Last Name             │   │
│  └────────────────────────┘ └────────────────────────┘   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Date of Birth                                     │   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- **Sections** are collapsible groups within a single page (accordion-style)
- **Tabs** are **optional** — disabled by default. Can be enabled in the form-level settings (page settings). When enabled, the tab bar appears and the admin can create/manage tabs
- Forms with tabs get **Previous / Next** navigation buttons + a **Submit** on the last tab
- Forms without tabs always show a **Submit** button at the bottom of the form
- Tab-level validation: tab label shows ⚠️ icon if any field inside has validation errors
- **Conditional tabs**: Tabs support visibility rules (declarative + JS) — entire tabs can be shown/hidden based on field values

### 3.3 Field Config for Layout

Every field carries these layout properties:

```typescript
interface FieldLayoutConfig {
  colSpan: number; // 1–12, default 12
  colSpanMobile?: number; // override for mobile, default 12
  marginTop?: "sm" | "md" | "lg";
}
```

---

## 4. Validation System

### 4.1 Built-in Validators

Every field type supports a composable set of built-in validation rules:

| Validator       | Applies to                          | Config                                               |
| --------------- | ----------------------------------- | ---------------------------------------------------- |
| `required`      | All input fields                    | `{ message?: string }`                               |
| `minLength`     | text, textarea, password, rich_text | `{ value: number, message?: string }`                |
| `maxLength`     | text, textarea, password, rich_text | `{ value: number, message?: string }`                |
| `min`           | number, slider, rating              | `{ value: number, message?: string }`                |
| `max`           | number, slider, rating              | `{ value: number, message?: string }`                |
| `pattern`       | text, email, url, phone             | `{ regex: string, flags?: string, message: string }` |
| `email`         | email                               | built-in RFC 5322 pattern                            |
| `url`           | url                                 | built-in URL pattern + optional `allowedProtocols`   |
| `minSelections` | multi_select, checkbox              | `{ value: number, message?: string }`                |
| `maxSelections` | multi_select, checkbox              | `{ value: number, message?: string }`                |
| `minDate`       | date, datetime                      | `{ value: string, message?: string }`                |
| `maxDate`       | date, datetime                      | `{ value: string, message?: string }`                |
| `maxFileSize`   | file, image                         | `{ value: number (MB), message?: string }`           |
| `maxFiles`      | file, image                         | `{ value: number, message?: string }`                |
| `acceptedTypes` | file, image                         | `{ value: string[], message?: string }`              |

- Multiple validators per field, evaluated in order
- Custom error messages per validator (falls back to i18n defaults)

### 4.2 Custom JavaScript Validation

For complex business rules, users can write custom JS validators per field:

```javascript
// Available in the iframe sandbox:
// - value: current field value
// - fields: map of all field values by field ID { [fieldId]: value }
// - context: { tenantId, userId, locale }
// - document.getElementById(fieldId): direct DOM access to form fields

function validate(value, fields, context) {
  if (fields.country === "DE" && !value.match(/^\d{5}$/)) {
    return "German ZIP codes must be exactly 5 digits";
  }
  return null; // null = valid
}

// Returning a string = error message for this field
// Returning null = valid
// Returning an object = error with additional context:
//   { message: 'Error text', severity: 'error' | 'warning' }
```

**Security model for JS execution** → see Section 7.

### 4.3 Validation Triggers

| Trigger    | Behavior                                  |
| ---------- | ----------------------------------------- |
| `onBlur`   | Validate when field loses focus (default) |
| `onChange` | Validate on every keystroke/change        |
| `onSubmit` | Validate only on form submission          |

Configurable per field. Default is `onBlur` for text inputs, `onChange` for selections.

---

## 5. Dynamic Behavior System

### 5.1 Conditional Visibility (Show/Hide)

Fields and tabs can have visibility rules that depend on other fields:

```json
{
  "visibility": {
    "condition": "AND",
    "rules": [
      { "fieldId": "country", "operator": "equals", "value": "DE" },
      { "fieldId": "is_business", "operator": "equals", "value": true }
    ]
  }
}
```

**Supported operators**: `equals`, `not_equals`, `contains`, `not_contains`, `gt`, `lt`, `gte`, `lte`, `is_empty`, `is_not_empty`, `in`, `not_in`

**Condition combinators**: `AND`, `OR`

Hidden fields are excluded from the submitted payload and their validations are skipped.

Tabs can also carry a `visibility` config — when a tab is hidden, all its fields are excluded.

### 5.2 Cross-Field Filtering (Cascading)

Dependent dropdowns where the options of one field depend on the value of another:

```json
{
  "id": "city",
  "type": "select",
  "dataSource": {
    "type": "dependent",
    "dependsOn": "country",
    "mapping": {
      "DE": ["Berlin", "München", "Hamburg"],
      "US": ["New York", "San Francisco", "Chicago"],
      "FR": ["Paris", "Lyon", "Marseille"]
    }
  }
}
```

When the parent field changes, the dependent field:

1. Clears its current value
2. Updates its options
3. Re-validates

### 5.3 Computed / Derived Fields

Fields whose value is calculated from other fields (read-only display):

```json
{
  "id": "total_price",
  "type": "number",
  "computed": {
    "expression": "fields.quantity * fields.unit_price",
    "watchFields": ["quantity", "unit_price"]
  }
}
```

### 5.4 Custom Dynamic Logic (JavaScript)

For advanced scenarios beyond declarative rules, user-authored JS runs inside the sandboxed iframe and has **full DOM access** to form elements via their HTML IDs:

```javascript
// onFieldChange hook — called when any watched field changes
// Available:
//   - fields: all field values by ID
//   - fieldId: ID of the changed field
//   - document.getElementById(id): direct DOM access
//   - Helper actions: setFieldValue, setFieldOptions, setFieldVisible,
//                     setFieldDisabled, setFieldRequired

function onFieldChange(fieldId, fields, actions) {
  if (fieldId === "role") {
    actions.setFieldVisible("admin_notes", fields.role === "admin");
    actions.setFieldRequired("department", fields.role !== "guest");

    // Direct DOM manipulation also possible:
    const el = document.getElementById("department");
    if (el) el.style.borderColor = fields.role === "admin" ? "red" : "";
  }
}
```

Both the helper `actions` API and direct `document.getElementById()` are available. The `actions` API is recommended for common operations (it handles re-rendering), while DOM access enables advanced styling and behavior.

---

## 6. External Data Integration

### 6.1 Data Sources

Fields can load their options or content from external APIs:

```json
{
  "id": "product",
  "type": "select",
  "dataSource": {
    "type": "api",
    "url": "/api/products",
    "method": "GET",
    "headers": {
      "$credential": "product-api-key"
    },
    "responsePath": "data.items",
    "labelField": "name",
    "valueField": "id",
    "refreshOn": ["category"],
    "cache": { "ttl": 300 }
  }
}
```

### 6.2 Credential References

External APIs often require authentication. Instead of embedding secrets:

- `$credential:credentialId` references a credential stored in the unified-ui credential vault
- At runtime, the **Platform Service** (Python backend) resolves the credential and proxies the request
- The frontend **never** sees the raw secret — it sends the credential reference to the backend, which fetches and injects it

```
┌───────────┐     credential ref      ┌──────────────────┐  actual key   ┌──────────────┐
│  Frontend  │ ─────────────────────► │ Platform Service  │ ────────────► │ External API │
│  (Widget)  │ ◄───────────────────── │ (Python backend)  │ ◄──────────── │              │
│            │     response data      │                  │    response    │              │
└───────────┘                         └──────────────────┘                └──────────────┘
                                           │
                                           │ resolve
                                           ▼
                                    ┌──────────────┐
                                    │  Vault /      │
                                    │  Credential   │
                                    │  Store        │
                                    └──────────────┘
```

**Why Platform Service (not Agent Service):** The Platform Service already manages widgets, credentials, and tenant configuration. The Agent Service is focused on agent execution and SSE streaming. Keeping the data source proxy in the Platform Service avoids cross-service dependency for credential resolution and keeps the Agent Service lean.

### 6.3 Available Context in JavaScript

```typescript
interface WidgetScriptContext {
  tenantId: string;
  userId: string;
  locale: string;
  agentId: string;
  conversationId: string;
  fetchData: (
    dataSourceId: string,
    params?: Record<string, string>,
  ) => Promise<unknown>;
}
```

The `fetchData` function calls the **Platform Service proxy endpoint** that resolves credentials and forwards the request. User-authored JS never gets direct access to tokens or credentials — `fetch()` from within the iframe is blocked by the sandbox (no `allow-same-origin`), so `fetchData` via `postMessage` is the only way to reach external APIs.

### 6.4 Proxy Endpoint (Platform Service)

```
POST /api/v1/tenants/{tenantId}/widgets/{widgetId}/data-sources/{dataSourceId}/fetch
Body: { "params": { "category": "electronics" } }
→ Platform Service resolves data source config, injects credentials, calls external API
→ Returns sanitized response to frontend
```

---

## 7. Security Model

### 7.1 JavaScript Sandbox — Sandboxed iframe

User-authored JavaScript (validation, dynamic logic, computed fields, DOM manipulation) runs inside a **sandboxed `<iframe>`**. This is a pure browser feature — no containers or server-side execution needed.

#### How it works

The widget form renders entirely inside an `<iframe>` with restricted sandbox flags:

```html
<iframe sandbox="allow-scripts" srcdoc="..."></iframe>
```

| Sandbox Flag           | Status     | Effect                                                                   |
| ---------------------- | ---------- | ------------------------------------------------------------------------ |
| `allow-scripts`        | ✅ Enabled | JS can execute inside the iframe                                         |
| `allow-same-origin`    | ❌ Blocked | Cannot access parent page cookies, localStorage, auth tokens, API client |
| `allow-top-navigation` | ❌ Blocked | Cannot redirect the main application URL                                 |
| `allow-popups`         | ❌ Blocked | Cannot open new windows/tabs                                             |
| `allow-forms`          | ❌ Blocked | Native form submission disabled (we handle submit via postMessage)       |

#### What user-authored JS CAN do (inside iframe)

- Access `document.getElementById(fieldId)` — all fields get their user-defined ID as HTML `id` attribute
- Read/write field values, styles, classes via standard DOM APIs
- Use `console.log()` for debugging
- Use the sandboxed `actions` API (setFieldValue, setFieldVisible, etc.)
- Use `fetchData()` to load external data (proxied through Platform Service via `postMessage`)

#### What user-authored JS CANNOT do

- Access parent page DOM, cookies, localStorage, sessionStorage (blocked by missing `allow-same-origin`)
- Read auth tokens or API client credentials
- Make direct `fetch()` / `XMLHttpRequest` calls (treated as cross-origin, no CORS headers)
- Navigate away from the page
- Open popups or new tabs
- Access `window.parent` properties (cross-origin restriction)

#### Communication Protocol

```
┌──────────────────────┐                    ┌──────────────────────┐
│    Parent Page        │                    │    Sandboxed iframe   │
│    (React App)        │                    │    (Widget Form)      │
│                       │   postMessage      │                       │
│   Send widget config ─┼──────────────────►─┼─► Render form         │
│                       │                    │    with field IDs     │
│                       │   postMessage      │                       │
│   Receive form data ◄─┼─◄──────────────────┼── User clicks submit  │
│                       │                    │                       │
│   Resolve fetchData  ─┼──────────────────►─┼─► Receive API data    │
│   (proxy call)        │   postMessage      │                       │
└──────────────────────┘                    └──────────────────────┘
```

#### Additional Runtime Protections

| Protection             | Mechanism                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Script timeout**     | Parent sets a 2-second timeout per script invocation; if no response, the script is considered failed            |
| **Input sanitization** | All data passed via `postMessage` is structured-cloned by the browser (no prototype pollution)                   |
| **Output validation**  | Parent validates return values from the iframe before using them                                                 |
| **CSP header**         | The iframe `srcdoc` includes a Content-Security-Policy meta tag blocking `connect-src`, `object-src`, `base-uri` |

### 7.2 Content Security

- Field labels, placeholders, and user content are **always** rendered via React's default escaping (no `dangerouslySetInnerHTML`) in the parent app
- Inside the iframe, content is rendered with a safe markdown renderer (for `paragraph` and `alert` fields) that supports standard markdown syntax but strips raw HTML tags
- File uploads are validated on both client (type + size) and server (MIME type verification, virus scan if available)

### 7.3 Data Source Security

- External API URLs are validated against an admin-configurable allowlist per tenant (no arbitrary SSRF)
- All external requests are proxied through the **Platform Service** — the browser/iframe never makes direct calls
- Request/response logging for audit (excluding credential values)
- Rate limiting on the proxy endpoint: max 10 requests per widget per minute

---

## 8. Field ID System

### 8.1 Rules

- Every field gets a **user-defined ID** that is unique across the entire form (all tabs)
- The ID is set when the field is first created (auto-generated from the label, e.g. "First Name" → `first_name`)
- The ID is **editable** in the Properties panel at any time
- **Validation on blur**: when the user leaves the ID input field, uniqueness is checked — if a duplicate exists, an error is shown and the user must resolve it before saving

### 8.2 ID Format

- Must match: `/^[a-z][a-z0-9_]*$/` (lowercase, starts with letter, underscores allowed)
- Max length: 64 characters
- Reserved IDs: `submit`, `form`, `tab`, `widget` (cannot be used)

### 8.3 HTML ID Attribute

At runtime (both in the designer Demo Mode and in the chat), every field element gets the user-defined ID as its **HTML `id` attribute**:

```html
<input id="first_name" type="text" ... />
<select id="country" ... />
```

This enables user-authored JS to use `document.getElementById('first_name')` for direct DOM access inside the sandboxed iframe.

---

## 9. Designer Layout (Redesign)

### 9.1 Current Layout (Problems)

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back    Widget Name                              [💾 Save]  │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│  Field       │  Canvas (list of field labels)                   │
│  Palette     │                                                  │
│  (buttons)   │                                                  │
│              ├──────────────────────────────────────────────────┤
│  ─────────── │                                                  │
│              │  Live Preview (rendered form)                    │
│  Field       │                                                  │
│  Properties  │                                                  │
│  (config)    │                                                  │
│              │                                                  │
│  280px       │  1fr                                             │
└──────────────┴──────────────────────────────────────────────────┘
```

**Problems:**

- Canvas and Preview are separate — redundant, confusing
- Flat black background, no visual depth, no container elevation
- Field palette is a vertical list of buttons, not space-efficient
- Properties mixed below palette — cramped on smaller screens
- No visual distinction between sections
- Cannot see form as user would experience it while editing

### 9.2 New Layout

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  ← Back     Widget: "Onboarding Form"            [📐 Edit / 🎮 Demo]  [💾 Save]│
├─────────────────────────────────────────────────────────────┬────────────────────┤
│                                                             │                    │
│   ┌──────────────────────────────────────────────────────┐  │  ┌──────────────┐  │
│   │  Tab Bar: [Personal] [Address] [Prefs]    [+ Tab]    │  │  │ ≡ Properties │  │
│   └──────────────────────────────────────────────────────┘  │  ├──────────────┤  │
│                                                             │  │              │  │
│   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐    │  │  ID: fname   │  │
│                                                             │  │  Label: ...  │  │
│   │  ┌─────────────────────┐ ┌──────────────────────┐  │   │  │  Required: ☑ │  │
│      │ ○ First Name █████  │ │ ○ Last Name ████████ │       │  │  MaxLen: 100 │  │
│   │  └─────────────────────┘ └──────────────────────┘  │   │  │  Pattern: .. │  │
│                                                             │  │  Tooltip: .. │  │
│   │  ┌──────────────────────────────────────────────┐  │   │  │              │  │
│      │ ○ Email ████████████████████████████████████  │      │  │  ── Valid ── │  │
│   │  └──────────────────────────────────────────────┘  │   │  │  [+Rule]     │  │
│                                                             │  │  [JS Valid.] │  │
│   │  ┌──────────────────────┐ ┌──────────────────────┐ │   │  │              │  │
│      │ ○ City ██████████████│ │ ○ Country ▼ ████████ │      │  │  ── Vis. ──  │  │
│   │  └──────────────────────┘ └──────────────────────┘ │   │  │  [+Rule]     │  │
│                                                             │  │              │  │
│   │                                                    │   │  │  ── Data ──  │  │
│      ┌─────────────────────────────────────────────┐        │  │  Source: ... │  │
│   │  │  + Add Field  (opens field type grid)       │   │   │  │              │  │
│      └─────────────────────────────────────────────┘        │  │  ── Layout ─ │  │
│   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘    │  │  Span: 6    │  │
│                                                             │  │              │  │
│   ┌──────────────────────────────────────────────────────┐  │  └──────────────┘  │
│   │  [Submit]                                            │  │                    │
│   └──────────────────────────────────────────────────────┘  │                    │
│                                                             │                    │
│   Main content area ~  flex 1                               │  Sidebar ~ 320px   │
└─────────────────────────────────────────────────────────────┴────────────────────┘

**Note:** Tab bar is only shown if tabs are enabled in page settings. Otherwise, the canvas starts directly with the field area.
```

### 9.3 Layout Details

#### Header Bar

- Back navigation, editable widget name
- **Mode toggle**: Edit Mode (📐) / Demo Mode (🎮)
- Save button (active only when changes exist)
- Undo/Redo buttons

#### Main Content Area (Center) — "The Canvas"

**Edit Mode:**

- Fields are rendered as **interactive preview cards** in their actual form appearance
- Each field shows a subtle selection outline on hover, becomes visually selected on click
- Selected field shows grab handle (⋮⋮) for drag reorder + up/down arrows + delete (×)
- Fields respect the grid layout (colSpan) — a field with `colSpan: 6` shows at half width
- A persistent **"+ Add Field"** bar sits at the bottom of the canvas
  - Clicking it opens a popover / inline panel with a **grid of field type icons** (4 columns)
  - Each icon has a tooltip on hover with the field type name and a short description
  - Alternatively: drag a field from this panel to a specific position on the canvas
- **Tab bar** (if enabled) appears at the **top** of the canvas — alternatively, tabs can render as a **left sidebar** within the canvas for forms with many tabs
- A **Submit button** is always visible at the bottom of the canvas. In Edit Mode it is non-functional (visual only); in Demo Mode it triggers the simulated submission
- The canvas itself has an elevated card style with subtle shadow and padding, against a slightly tinted background — giving it a "paper on desk" feel

**Demo Mode:**

- Canvas renders the widget form inside the **sandboxed iframe** — identical to how it appears in the chat
- Fields are fully interactive — users can type, select, toggle
- User-authored JS executes (validation, dynamic logic, DOM manipulation)
- Validation fires on configured triggers, showing real error messages
- Submit button simulates form submission and shows the resulting JSON payload in a dialog
- A floating "📋 Show Payload" button displays the data that would be sent to the agent
- No selection outlines, no drag handles — pure user experience

#### Right Sidebar — "Properties Panel" (320px)

- Only visible in **Edit Mode** (hides in Demo Mode)
- Collapsible via a toggle button on its left edge
- **Scrollable** using the project's standard scrollbar offset pattern: outer wrapper with `margin-right: calc(-1 * var(--spacing-md))` + `overflow: hidden`, inner scroll area with `max-height: calc(100vh - Xpx)` + `min-height: 200px` + `overflow-y: auto` + `padding-right: var(--spacing-md)`. This keeps the scrollbar outside the content area
- Shows configuration based on current selection state (see **Selection Concept** below), organized in **collapsible sections**:

```
┌─────────────────────────────────┐
│  📝 Field Properties            │
│  ID: [first_name] [📋]  [✏️]   │
│  Type: Text Field               │
├─────────────────────────────────┤
│  ▼ General                      │
│    Label: [First Name         ] │
│    Placeholder: [Enter name.. ] │
│    Default Value: [            ]│
│    Tooltip: [Help text here   ] │
│    Disabled: [ ] (toggle)       │
├─────────────────────────────────┤
│  ▼ Validation                   │
│    Required: [✓]                │
│    Min Length: [ 2 ]            │
│    Max Length: [ 100 ]          │
│    Pattern: [                 ] │
│    ┌──────────────────────────┐ │
│    │ + Add Custom JS Validator│ │
│    └──────────────────────────┘ │
│    Error Message: [            ]│
├─────────────────────────────────┤
│  ▶ Visibility Rules (2)        │
├─────────────────────────────────┤
│  ▶ Data Source                  │
├─────────────────────────────────┤
│  ▼ Layout                       │
│    Column Span: [  6  ] / 12   │
│    Mobile Span: [ 12  ] / 12   │
│    Margin Top: [ None ▼ ]      │
├─────────────────────────────────┤
│  ▶ Advanced                    │
│    Custom CSS Class: [        ] │
│    Field Events (JS): [Edit]   │
└─────────────────────────────────┘
```

#### Selection Concept (Select / Deselect)

The Properties Panel content depends entirely on the current selection state:

**No field selected → Page Settings:**

- Form title / description
- Enable/disable tabs (toggle) — only when enabled, tab management UI appears
- Tab management (add / rename / reorder / delete tabs)
- Tab visibility rules (conditional tabs via declarative rules or JS)
- Form-wide settings (submit button text, success message)
- Global JS hooks (onFormLoad, onBeforeSubmit)
- Data source configurations

**Field selected → Field Properties** (as shown above)

**How to deselect:**

- Click on empty canvas area (not on a field) → deselects, sidebar switches to page settings
- Press `Escape` → deselects current field
- Click on another field → switches selection to that field

**Visual feedback:**

- Selected field: `border: 2px solid var(--mantine-color-primary-5)` + subtle shadow
- Sidebar header shows either "📝 Field Properties" or "⚙️ Page Settings" depending on state

#### Add-Field Panel (Popover / Inline)

When clicking "+ Add Field", a panel appears with all field types in a compact grid:

```
┌──────────────────────────────────────────────────────────────┐
│  Add Field                                        [×]        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Input Fields                                                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │ Aa   │ │ ¶    │ │ 123  │ │  @   │ │ 🔗   │ │  📞  │     │
│  │ Text │ │T.Area│ │Number│ │Email │ │ URL  │ │Phone │     │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                       │
│  │ 🔒⚠️ │ │ 📅   │ │ 🕐   │ │ 🎨   │                       │
│  │Passw.│ │ Date │ │ Time │ │Color │                       │
│  └──────┘ └──────┘ └──────┘ └──────┘                       │
│  ⚠️ Password: value sent as plain text — not for real creds │
│                                                              │
│  Selection Fields                                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │  ▼   │ │ ☰▼   │ │  ◉   │ │ ☑    │ │ ⇌    │ │  ⭐  │     │
│  │Select│ │Multi │ │Radio │ │Check │ │Toggle│ │Rating│     │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │
│  ┌──────┐ ┌──────┐                                          │
│  │ ──●──│ │●───● │                                          │
│  │Slider│ │Range │                                          │
│  └──────┘ └──────┘                                          │
│                                                              │
│  Rich Content                                                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                       │
│  │  📎  │ │ 🖼️  │ │  ✍️  │ │ 📝   │                       │
│  │ File │ │Image │ │Sign. │ │Rich  │                       │
│  └──────┘ └──────┘ └──────┘ └──────┘                       │
│                                                              │
│  Layout & Display                                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │  H   │ │  ¶   │ │ ──── │ │  ↕   │ │  ⚠   │ │ 🖼   │     │
│  │Head. │ │Para. │ │Divid.│ │Space │ │Alert │ │Img.  │     │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │
│                                                              │
│  Composite                                                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                       │
│  │  🏠  │ │  ➕   │ │ K:V  │ │ 📊   │                       │
│  │Addr. │ │Repeat│ │KeyVal│ │Table │                       │
│  └──────┘ └──────┘ └──────┘ └──────┘                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 9.4 Visual Design Language

The redesigned Widget Designer adopts a **container elevation** system:

| Element                 | Style                                                                     |
| ----------------------- | ------------------------------------------------------------------------- |
| Page background         | `var(--surface-secondary)` — subtle tint, not pure black                  |
| Canvas area             | `var(--surface-primary)` + `box-shadow: var(--shadow-md)` + border-radius |
| Field cards (edit mode) | `var(--surface-primary)` + `box-shadow: var(--shadow-xs)` on hover        |
| Selected field          | `border: 2px solid var(--mantine-color-primary-5)` + `var(--shadow-sm)`   |
| Properties sidebar      | `var(--surface-primary)` + left border accent                             |
| Add-field panel         | `var(--surface-primary)` + `var(--shadow-lg)` (popover-style)             |
| Collapsible sections    | Subtle top border separator, chevron toggle icon                          |

---

## 10. Info Tooltips

Every field can optionally have a **tooltip** that appears as an info icon (ℹ️) next to the field label:

```
  First Name ℹ️
  ┌──────────────────────────────────┐
  │                                  │
  └──────────────────────────────────┘
```

- In the designer: Configure via `tooltip` property in the Properties panel (text input)
- At runtime: Renders an `ActionIcon` with `IconInfoCircle` next to the label
- Behavior: Show tooltip on hover (desktop) / on tap (mobile)
- Supports plain text only (no HTML/markdown for security)

---

## 11. JavaScript Editor

### 11.1 Editor Dialog

When users click "Edit" on a JS validation or JS dynamic logic field, a **full-screen dialog** opens:

```
┌──────────────────────────────────────────────────────────────────────┐
│  JavaScript Editor — Custom Validation for "zip_code"       [× Close]│
├────────────────────────────────────────────────┬─────────────────────┤
│                                                │                     │
│  // Available: value, fields, context          │  ▼ Mock Data        │
│  // document.getElementById(id) for DOM access │                     │
│                                                │  value:             │
│  function validate(value, fields, context) {   │  ┌────────────────┐ │
│    if (fields.country === 'DE') {              │  │ "10115"        │ │
│      if (!/^\d{5}$/.test(value)) {             │  └────────────────┘ │
│        return 'German ZIP: 5 digits';          │                     │
│      }                                         │  fields:            │
│    }                                           │  ┌────────────────┐ │
│    return null;                                │  │ { "country":   │ │
│  }                                             │  │   "DE",        │ │
│                                                │  │   "city": ""   │ │
│                                                │  │ }              │ │
│                                                │  └────────────────┘ │
│                                                │                     │
│                                                │  [▶ Run Test]       │
│                                                │                     │
│                                                │  ── Test Result ──  │
│                                                │  ✅ Valid (null)     │
│                                                │                     │
│  Editor area (Monaco / CodeMirror, ~70%)       │  Mock panel (~30%)  │
├────────────────────────────────────────────────┴─────────────────────┤
│  [Cancel]                                            [Apply Changes] │
└──────────────────────────────────────────────────────────────────────┘
```

### 11.2 Features

- **Syntax highlighting** with JavaScript/TypeScript support
- **Auto-complete** for the `fields`, `context`, `actions`, and `document` objects
- **Mock data panel**: define test values for all fields
- **Run Test**: executes the script inside a sandboxed iframe (same sandbox as runtime) and shows the result
- **Multiple test cases**: Users can define several mock data sets and run all
- **Error display**: Runtime errors, timeout errors shown inline
- **Templates**: Dropdown with common patterns (required-if, cross-field comparison, regex match, DOM manipulation, etc.)

---

## 12. Form Schema (Data Model)

The complete form configuration stored in the backend:

```typescript
interface WidgetFormSchema {
  version: 2;
  settings: {
    title?: string;
    description?: string;
    submitButtonText?: string;
    successMessage?: string;
    enableTabs?: boolean; // default false — tabs hidden until explicitly enabled
    showProgressBar?: boolean; // for tabbed forms (only relevant if enableTabs: true)
    validateOnTabChange?: boolean; // only relevant if enableTabs: true
  };
  tabs: WidgetTab[];
  dataSources: DataSourceConfig[];
  scripts: {
    onFormLoad?: string; // JS function body
    onBeforeSubmit?: string; // JS function body, can cancel
    onFieldChange?: string; // JS function body
  };
}

interface WidgetTab {
  id: string;
  label: string;
  fields: WidgetFieldConfig[];
  visibility?: VisibilityConfig; // conditional tab visibility
}

interface WidgetFieldConfig {
  id: string; // user-defined, unique across form, used as HTML id
  type: FieldType;
  label?: string;
  placeholder?: string;
  defaultValue?: unknown;
  tooltip?: string;
  disabled?: boolean;
  layout: FieldLayoutConfig;
  validation: ValidationRule[];
  visibility?: VisibilityConfig;
  dataSource?: FieldDataSourceRef;
  computed?: ComputedFieldConfig;
  config: Record<string, unknown>; // type-specific: rows, options, maxSize, etc.
}

interface ValidationRule {
  type:
    | "required"
    | "minLength"
    | "maxLength"
    | "min"
    | "max"
    | "pattern"
    | "email"
    | "url"
    | "minSelections"
    | "maxSelections"
    | "custom";
  params?: Record<string, unknown>;
  message?: string;
  trigger?: "onBlur" | "onChange" | "onSubmit";
  script?: string; // only for type: 'custom'
}

interface VisibilityConfig {
  condition: "AND" | "OR";
  rules: VisibilityRule[];
}

interface VisibilityRule {
  fieldId: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "gt"
    | "lt"
    | "gte"
    | "lte"
    | "is_empty"
    | "is_not_empty"
    | "in"
    | "not_in";
  value: unknown;
}

interface DataSourceConfig {
  id: string;
  type: "static" | "api" | "dependent";
  url?: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>; // supports $credential:id
  body?: Record<string, unknown>;
  responsePath?: string; // JSONPath to array
  labelField?: string;
  valueField?: string;
  refreshOn?: string[]; // field IDs that trigger refresh
  cache?: { ttl: number };
  dependsOn?: string; // for dependent type
  mapping?: Record<string, unknown[]>;
}

interface FieldDataSourceRef {
  dataSourceId: string;
  params?: Record<string, string>; // field ID → param name mappings
}

interface ComputedFieldConfig {
  expression: string; // JS expression
  watchFields: string[];
}

interface FieldLayoutConfig {
  colSpan: number; // 1–12
  colSpanMobile?: number; // 1–12, default 12
  marginTop?: "sm" | "md" | "lg";
}
```

### 12.1 Migration from v1

The current simple `FormFieldConfig[]` is version 1. A migration function converts v1 → v2:

```
v1: { fields: FormFieldConfig[] }
v2: { version: 2, settings: {}, tabs: [{ id: 'default', label: 'Form', fields: [...] }], ... }
```

All existing fields are placed into a single default tab. New properties get sensible defaults (colSpan: 12, no validation rules, no visibility rules).

### 12.2 Schema Validation

The `WidgetFormSchema` must be validated in **both** the frontend (before save) and the **Platform Service backend** (before persisting):

**Frontend validation** (before save request):

- All field IDs are unique across all tabs
- Field IDs match the required format (`/^[a-z][a-z0-9_]*$/`)
- No reserved IDs used (`submit`, `form`, `tab`, `widget`)
- All `colSpan` values are 1–12
- All `dataSource` references point to valid data source IDs
- All `visibility` rules reference existing field IDs
- Tab configuration is valid (at least one tab if tabs enabled, unique tab IDs)

**Backend validation** (Platform Service, on create/update):

- Full schema structure validation (Pydantic model)
- Same field ID uniqueness + format checks as frontend
- Data source URL allowlist validation per tenant
- Credential reference validation (referenced credentials exist and user has access)
- Max schema size limit (prevent abuse)
- Schema version is supported

Both validations use the **same rule set** — frontend catches errors early, backend enforces them as the source of truth.

---

## 13. Pre-fill via Agent Context

### 13.1 Mechanism

The agent sends a widget tag with a `d=` attribute containing a JSON dict. Keys in the dict correspond to **field IDs**:

```
<$_WGET _id=550e8400-e29b-41d4-a716-446655440000 d={"first_name": "John", "country": "DE"} />
```

**Note:** `_id` is **always a UUID** — except for the built-in `yesno` and `survey` widget types which use fixed string IDs.

### 13.2 Behavior

- The `d=` dict is parsed and each key is matched against field IDs in the widget schema
- Matching fields get their `defaultValue` overridden with the pre-fill value
- Non-matching keys are silently ignored
- Field IDs must be "key-conformant" (lowercase, underscores) to work reliably in JSON

### 13.3 Agent-Side Usage

The agent (N8N, Foundry, Custom) constructs the widget tag dynamically, inserting context data:

```
You asked about your account. Please confirm your details:
<$_WGET _id=550e8400-e29b-41d4-a716-446655440000 d={"email": "user@example.com", "plan": "premium"} />
```

---

## 14. Draft Auto-Save (Widget Designer Only)

### 14.1 Behavior

The **Widget Designer** (the admin form builder) auto-saves the widget **schema/config** to localStorage to prevent data loss when the admin is designing a form.

**Important:** This does NOT apply to chat runtime. Users filling out widgets in chat do NOT get draft auto-save — if they navigate away, the data is lost. This is intentional (simplicity, privacy).

### 14.2 Implementation

- **Key**: `widget-designer-draft:{widgetId}`
- **Value**: JSON with the current `WidgetFormSchema` + timestamp
- **On designer load**: Check if a draft exists for this widget. If yes, show a banner: "You have unsaved changes from {timestamp}. [Restore] [Discard]"
- **On successful save**: Delete the draft from localStorage
- **Expiry**: Drafts older than 7 days are cleaned up on next designer load
- **Scope**: localStorage only — no backend persistence (simple, privacy-friendly)

---

## 15. Chat Runtime Rendering

### 15.1 Widget Tag Protocol

The agent sends a widget tag in the chat message:

```
<$_WGET _id=550e8400-e29b-41d4-a716-446655440000 d={"first_name": "John"} />
```

Optional `mode=readonly` for non-editable display:

```
<$_WGET _id=550e8400-e29b-41d4-a716-446655440000 d={"first_name": "John", "email": "john@test.de"} mode=readonly />
```

### 15.2 Runtime Behavior

1. Chat UI detects the widget tag via `parseWidgetTag()`
2. Fetches the widget schema from the API (cached)
3. Checks the `mode` attribute — if `mode=readonly`, renders in **readonly mode** (see 15.4)
4. Renders the form inside a **sandboxed iframe** using the `WidgetFormRenderer`:
   - Fields get their user-defined IDs as HTML `id` attributes
   - Respects grid layout (colSpan)
   - Applies conditional visibility in real time (both declarative rules and JS)
   - Runs validation on the configured triggers
   - Loads external data sources via the Platform Service proxy
   - Applies pre-fill data from the `d=` attribute
5. On submit:
   - All validations run (including custom JS in sandbox)
   - If valid: structured JSON payload is sent as a user message
   - If invalid: error states shown on fields, submit blocked
6. After successful submission, the form becomes **read-only** (values locked, submit disabled)

### 15.4 Readonly Mode

When the widget tag contains `mode=readonly`, the form renders in a non-editable display mode:

- All fields are rendered with their pre-filled values from `d={}` but **disabled / non-interactive**
- No submit button is shown
- No validation runs
- No draft auto-save
- No JS dynamic logic or computed fields execute
- Visual styling: fields appear with a muted/disabled look (e.g. `opacity: 0.8`, no focus outlines)
- Use case: the agent shows a summary of collected data ("Here are your details:") as a structured widget rather than plain text

### 15.3 Responsive Behavior

- Chat panel width ≥ 600px: grid layout as designed
- Chat panel width < 600px: all fields collapse to full width
- Tabs render as a scrollable tab bar on narrow screens
- File upload areas adapt to available width

---

## 16. Keyboard Shortcuts & Accessibility

| Shortcut               | Action                            |
| ---------------------- | --------------------------------- |
| `Ctrl/⌘ + S`           | Save widget                       |
| `Ctrl/⌘ + Z`           | Undo                              |
| `Ctrl/⌘ + Shift + Z`   | Redo                              |
| `Delete` / `Backspace` | Remove selected field             |
| `↑` / `↓`              | Move selected field up/down       |
| `Tab`                  | Navigate between fields in canvas |
| `Escape`               | Deselect field / close popover    |
| `Ctrl/⌘ + D`           | Toggle Edit/Demo mode             |

All fields support ARIA labels. The canvas announces field additions/removals via `aria-live` regions.

---

## 17. Drag & Drop

### 17.1 Canvas Reordering

Fields in the canvas can be reordered via drag & drop:

- Grab handle (⋮⋮) on the left edge of each field activates dragging
- Drop indicator (blue line) shows the target position
- Grid-aware: dropping in a row shows the column position
- Library: `@dnd-kit/core` or `react-beautiful-dnd` (evaluate for grid support)

### 17.2 Add Field via Drag

Fields from the "Add Field" panel can be dragged directly to a canvas position (optional enhancement — click-to-add works as the primary flow).

---

## 18. Undo / Redo

A lightweight undo/redo stack for the form schema:

- Every change pushes the previous state to the undo stack (max 50 entries)
- Undo pops from the undo stack and pushes current state to the redo stack
- Redo pops from the redo stack and pushes current state to the undo stack
- Stack is preserved across mode switches (Edit ↔ Demo) but cleared on save
- Implementation: `useReducer` with action history or a dedicated `useUndoRedo` hook

---

## 19. Import / Export

- **Export**: Download the widget schema as a `.json` file
- **Import**: Upload a `.json` file to replace the current schema (with validation)
- **Copy Widget**: Duplicate an existing widget (backend API)
- **Template Gallery**: Pre-built form templates (Contact Form, Feedback Survey, Bug Report, etc.)

---

## 20. Markdown Support

### 20.1 Where Markdown is Supported

| Field Type     | Markdown Support                    |
| -------------- | ----------------------------------- |
| `paragraph`    | Full markdown (rendered)            |
| `alert`        | Full markdown in content (rendered) |
| `heading`      | Plain text only                     |
| `tooltip`      | Plain text only                     |
| `field labels` | Plain text only                     |

### 20.2 Safe Rendering

- Use a battle-tested markdown library (e.g. `react-markdown` with `rehype-sanitize`)
- **Allowed**: headings, bold, italic, lists, links (`target="_blank" rel="noopener"`), code blocks, tables, blockquotes
- **Stripped**: raw HTML tags, `<script>`, `<iframe>`, `<img>` (use `image_display` field instead), `<style>`, event handlers
- Inside the sandboxed iframe: markdown is rendered at load time, the resulting HTML is static

---

## 21. Implementation Phases

### Phase 1 — Foundation (MVP Redesign)

- [ ] New layout (canvas + sidebar, edit/demo toggle)
- [ ] Container elevation design system
- [ ] Expanded field types (number, email, date, radio, checkbox, slider)
- [ ] Grid layout system (colSpan)
- [ ] Add-field panel with icon grid
- [ ] Field ID system (user-defined, validated, HTML id attribute)
- [ ] Info tooltips on fields
- [ ] Basic undo/redo
- [ ] Schema v2 with migration from v1
- [ ] Schema validation (frontend + Platform Service backend)
- [ ] Updated chat runtime renderer (sandboxed iframe)
- [ ] Pre-fill via `d={}` with field ID matching

### Phase 2 — Validation & Logic

- [ ] Full built-in validation system (all validators)
- [ ] Conditional visibility (declarative rules for fields + tabs)
- [ ] Cross-field filtering (cascading dropdowns)
- [ ] Validation trigger configuration (onBlur/onChange/onSubmit)
- [ ] Tab support (optional, enabled via page settings, conditional tabs)
- [ ] Draft auto-save for widget designer schema (localStorage)

### Phase 3 — JavaScript & Advanced

- [ ] Sandboxed iframe runtime with DOM access (document.getElementById)
- [ ] Custom JS validation editor (Monaco/CodeMirror dialog)
- [ ] Mock data + test runner in editor
- [ ] Computed / derived fields
- [ ] Custom dynamic logic (onFieldChange JS with actions API + DOM access)
- [ ] Global form scripts (onFormLoad, onBeforeSubmit)
- [ ] Markdown rendering in paragraph/alert fields

### Phase 4 — External Data

- [ ] Data source configuration UI
- [ ] Backend proxy endpoint (Platform Service)
- [ ] Credential reference resolution
- [ ] Dependent data sources (refreshOn)
- [ ] Data source caching
- [ ] fetchData() bridge via postMessage

### Phase 5 — Polish & Extras

- [ ] Drag & drop reordering
- [ ] Field type: signature, rich_text, image, table_input
- [ ] Repeater field (single-level dynamic rows)
- [ ] Import / Export / Templates
- [ ] Keyboard shortcuts
- [ ] Full accessibility audit

### Phase 6 — Documentation

- [ ] **Widget Designer Admin Guide** — step-by-step guide for creating, editing, and publishing widgets
- [ ] **JavaScript Scripting Reference** — comprehensive docs for writing JS validation, dynamic logic, and computed fields:
  - Available APIs (`value`, `fields`, `context`, `actions`, `document.getElementById()`)
  - `fetchData()` usage with data sources
  - Validation return types (string, null, object with severity)
  - Common patterns and recipes (required-if, cross-field, regex, DOM manipulation)
  - Security model: what's allowed vs blocked in the sandbox
  - Debugging tips (`console.log`, mock data panel, test runner)
- [ ] **Widget Schema Reference** — full schema documentation (WidgetFormSchema, all field types, config options)
- [ ] **Data Source Configuration Guide** — how to connect external APIs, credential references, caching, dependent sources
- [ ] **Migration Guide** — upgrading from v1 (simple fields) to v2 (full schema)
- [ ] **Platform Service API Reference** — proxy endpoint, schema validation endpoint, widget CRUD
- [ ] **Widget Tag Reference** — `<$_WGET>` tag format, attributes (`_id`, `d`, `mode`), parsing behavior

---

## 22. Decided Questions

| #   | Question                      | Decision                                                                                                                                                                                                                                                                                   |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Markdown in paragraph fields? | **Yes** — full markdown with safe rendering (rehype-sanitize), raw HTML stripped                                                                                                                                                                                                           |
| 2   | Nested repeaters?             | **No** — single level only. Repeater cannot contain another repeater                                                                                                                                                                                                                       |
| 3   | Widget versioning?            | **Schema format versioning only** — the `WidgetFormSchema` carries a `version` field (v1→v2). When the schema structure changes, old widgets are auto-migrated on load. No historical widget instance versioning, no version history UI. The widget tag does NOT carry a version attribute |
| 4   | Conditional tabs?             | **Yes** — tabs support declarative visibility rules AND JS-based show/hide                                                                                                                                                                                                                 |
| 5   | Pre-fill from agent?          | **Yes** — via `d={}` dict in widget tag. Keys = field IDs. Agent constructs the dict dynamically                                                                                                                                                                                           |
| 6   | Offline / draft support?      | **Designer only** — localStorage draft for the widget schema in the designer. 7-day expiry. Restore banner on next designer load. No draft for chat runtime (intentional)                                                                                                                  |
| 7   | Analytics?                    | **No** — not in scope                                                                                                                                                                                                                                                                      |
| 8   | Max form complexity?          | **No limit** — if it's needed, it's needed                                                                                                                                                                                                                                                 |
| 9   | Collaborative editing?        | **No** — single-user editing only. No real-time collaboration or conflict resolution                                                                                                                                                                                                       |
| 10  | Widget permissions / RBAC?    | **Already implemented** — everyone can query/use widgets in chat (GET by ID, GET by `?ids`). Only authorized users (with tenant role) can edit widgets and access the widget list/designer                                                                                                 |
| 11  | Repeater row layout?          | **Yes, side-by-side with colSpan** — each repeater row acts as its own 12-column grid container. Sub-fields support individual `colSpan`. Uses `minWidth` per sub-field; if container too narrow, repeater scrolls horizontally instead of collapsing                                      |
| 12  | Readonly widget mode?         | **Yes** — `mode=readonly` attribute on widget tag. Agent can send pre-filled, non-editable forms as structured summaries. No submit button, no validation, disabled fields                                                                                                                 |
| 13  | Password field?               | **Keep with warning** — masked input is useful for PINs/codes, but value is sent as plain text in payload. Designer shows warning banner when password field is added                                                                                                                      |
| 14  | Tabs default state?           | **Disabled by default** — tabs must be explicitly enabled in page settings. Single-page forms are the default                                                                                                                                                                              |
| 15  | Widget `_id` format?          | **Always UUID** — except built-in `yesno` and `survey` widgets which use fixed string IDs                                                                                                                                                                                                  |
