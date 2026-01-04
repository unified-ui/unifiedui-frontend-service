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

| Category | Technology |
|----------|------------|
| **Framework** | React 19 |
| **Language** | TypeScript 5.9 |
| **Build Tool** | Vite 7 |
| **UI Library** | Mantine 8 |
| **Icons** | Tabler Icons |
| **Routing** | React Router 7 |
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

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Configuration

### Azure AD Setup

1. Register an app in [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App registrations**
2. Set **Redirect URI** to `http://localhost:5173` (SPA)
3. Copy the **Application (client) ID**
4. Configure in `src/authConfig.ts`:

```typescript
export const msalConfig: Configuration = {
  auth: {
    clientId: "YOUR_CLIENT_ID",
    authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
    redirectUri: window.location.origin,
  },
};
```

### Environment Variables

Create a `.env` file for environment-specific configuration:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
```

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
