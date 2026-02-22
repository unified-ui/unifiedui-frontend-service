# unified-ui Frontend

> **One interface for all your AI agents** — The unified frontend for managing and interacting with heterogeneous AI systems.

## Overview

**unified-ui** transforms the complexity of managing multiple AI systems into a single, cohesive experience. Organizations deploy agents across diverse platforms—Microsoft Foundry, n8n, LangGraph, Copilot, and custom solutions—resulting in fragmented user experiences. This frontend eliminates that chaos by providing one consistent interface where every agent converges.

### Key Features

- 🎯 **Unified Chat Interface** — Single chat experience for all AI agents
- 🔌 **Multi-Platform Support** — Microsoft Foundry, n8n, LangGraph, Copilot, custom agents
- 🎨 **Widget Designer** — Create custom UI components for conversations
- 📊 **Centralized Tracing** — Monitor all agent activity in one place
- 🔐 **Enterprise Authentication** — Microsoft Entra ID integration
- 🏢 **Multi-Tenant Architecture** — Role-based access control per tenant

---

## Tech Stack

| Category           | Technology      |
| ------------------ | --------------- |
| **Framework**      | React 19        |
| **Language**       | TypeScript 5.9  |
| **Build Tool**     | Vite 7          |
| **UI Library**     | Mantine 8       |
| **Icons**          | Tabler Icons    |
| **Routing**        | React Router 7  |
| **Authentication** | MSAL (Azure AD) |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm** or **yarn**
- Azure AD App Registration (for authentication)

### Installation

```bash
# Clone the repository
git clone https://github.com/enricogoerlitz/unified-ui-frontend.git
cd unified-ui-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs at `http://localhost:5173`

### Available Scripts

| Command            | Description                       |
| ------------------ | --------------------------------- |
| `npm run dev`      | Start development server with HMR |
| `npm run build`    | Build for production              |
| `npm run preview`  | Preview production build          |
| `npm run lint`     | Run ESLint                        |
| `npx vitest run`   | Run tests                         |
| `npx tsc --noEmit` | Type check                        |

> **See [TOOLING.md](TOOLING.md)** for detailed tooling documentation, pre-commit hooks, and code quality guidelines.

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# API endpoints
VITE_API_BASE_URL=http://localhost:8000
VITE_AGENT_SERVICE_URL=http://localhost:8085

# Azure AD / MSAL — from the App Registration (see platform service SETUP.md)
VITE_MSAL_CLIENT_ID=your-app-registration-client-id
VITE_MSAL_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
VITE_MSAL_API_SCOPE=api://your-client-id/access_as_user
```

| Variable                 | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| `VITE_API_BASE_URL`      | Platform service URL                                      |
| `VITE_AGENT_SERVICE_URL` | Agent service URL                                         |
| `VITE_MSAL_CLIENT_ID`    | Azure App Registration client ID                          |
| `VITE_MSAL_AUTHORITY`    | Azure AD authority URL (with tenant ID for single-tenant) |
| `VITE_MSAL_API_SCOPE`    | API scope from App Registration → "Expose an API"         |

### Authentication (OBO Flow)

The frontend uses MSAL to authenticate users via Microsoft Entra ID. Instead of requesting Graph API permissions directly, it requests an API-scoped token (`api://{client_id}/access_as_user`). The platform service then exchanges this token for a Graph token using the OAuth 2.0 On-Behalf-Of (OBO) flow.

For full App Registration setup instructions, see the **platform service** [SETUP.md](../unified-ui-platform-service/SETUP.md).

---

## Project Structure

```
src/
├── api/                 # API client and types
├── auth/                # Authentication (MSAL) setup
├── components/          # Reusable UI components
│   ├── common/          # Generic components
│   ├── dialogs/         # Modal dialogs
│   └── layout/          # Layout components
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── pages/               # Page components
│   ├── ApplicationsPage/
│   ├── ConversationsPage/
│   ├── CredentialsPage/
│   ├── DashboardPage/
│   └── ...
├── routes/              # Route definitions
├── styles/              # Global styles
└── theme/               # Mantine theme config
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.
