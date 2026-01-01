---
applyTo: '**'
---

# unified-ui Frontend - Copilot Instructions

## Project Overview

**unified-ui** is a **multi-tenant integration platform** for AI agent systems with comprehensive role-based access control (RBAC). This frontend application provides the user interface for managing AI agents, conversations, credentials, and tenant settings.

### Core Characteristics
- **Multi-Tenant Architecture**: Strict tenant isolation with granular permissions
- **Multi-Agent Integration**: Support for various AI agent systems and providers
- **Modern React Stack**: React 18+ with TypeScript, Vite, and Mantine UI
- **Enterprise-Ready**: MSAL authentication, RBAC, audit logging
- **Responsive Design**: Light/Dark mode support, mobile-friendly

### Technology Stack
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Mantine v7+
- **Routing**: React Router v6
- **Authentication**: MSAL (Microsoft Authentication Library)
- **State Management**: React Context + Hooks
- **Styling**: CSS Modules + Mantine Theme System

---

## Related Documentation

Before working on this project, **read these instruction files**:

1. **[REACT_STRUCTURE.md](./REACT_STRUCTURE.md)** - Complete project structure and folder organization
2. **[DESIGN_THEMES.md](./DESIGN_THEMES.md)** - Design system, color palettes, typography, spacing

---

## Development Principles

### 1. React Best Practices

#### Component Structure
```typescript
// ✅ DO: Functional components with TypeScript
import { FC } from 'react';
import type { ReactNode } from 'react';

interface MyComponentProps {
  title: string;
  children?: ReactNode;
  onAction?: () => void;
}

export const MyComponent: FC<MyComponentProps> = ({ title, children, onAction }) => {
  // Component logic
  return (/* JSX */);
};
```

#### Hooks Usage
- **Always use hooks** at the top level (never in conditions/loops)
- **Custom hooks** for reusable logic (prefix with `use`)
- **useEffect dependencies** must be complete and correct
- **useMemo/useCallback** only for performance optimization when needed

#### Component Organization
```typescript
// 1. Imports (external, then internal)
import { useState } from 'react';
import { Button, Card } from '@mantine/core';
import { useAuth } from '@/auth';
import classes from './MyComponent.module.css';

// 2. Types/Interfaces
interface Props { /* ... */ }

// 3. Component
export const MyComponent: FC<Props> = (props) => {
  // 4. Hooks
  const [state, setState] = useState();
  const { user } = useAuth();
  
  // 5. Event Handlers
  const handleClick = () => { /* ... */ };
  
  // 6. Effects
  useEffect(() => { /* ... */ }, []);
  
  // 7. Render
  return (/* JSX */);
};
```

### 2. TypeScript Standards

#### Strict Typing
```typescript
// ✅ DO: Explicit types
interface User {
  id: string;
  email: string;
  tenantId: string;
  roles: string[];
}

const fetchUser = async (userId: string): Promise<User> => {
  // Implementation
};

// ❌ DON'T: Any types
const fetchUser = async (userId: any): Promise<any> => { /* ... */ };
```

#### Type-Only Imports
```typescript
// ✅ DO: Type-only imports when needed (verbatimModuleSyntax)
import type { ReactNode, FC } from 'react';
import type { AccountInfo } from '@azure/msal-browser';

// Regular imports for values
import { useState, useEffect } from 'react';
```

#### API Response Types
```typescript
// Define in src/types/api.types.ts
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### 3. Mantine UI Framework

#### Use Mantine Components
```typescript
// ✅ DO: Use Mantine components as base
import { Button, Card, Text, Stack, Group } from '@mantine/core';

<Card shadow="sm" radius="md" padding="lg">
  <Stack gap="md">
    <Text size="xl" fw={600}>Title</Text>
    <Group gap="sm">
      <Button color="primary">Primary Action</Button>
      <Button variant="light">Secondary</Button>
    </Group>
  </Stack>
</Card>

// ❌ DON'T: Rebuild existing Mantine components
// Extend Mantine components if customization needed
```

#### Theme System
```typescript
// ✅ DO: Use theme tokens
import { useMantineTheme } from '@mantine/core';

const theme = useMantineTheme();
const primaryColor = theme.colors.primary[6]; // Light mode
const spacing = theme.spacing.md;

// Or with CSS Custom Properties
<div style={{ 
  backgroundColor: 'var(--bg-paper)',
  color: 'var(--text-primary)',
  padding: 'var(--spacing-md)'
}}>

// ❌ DON'T: Hardcoded colors/spacing
<div style={{ backgroundColor: '#1e88e5', padding: '16px' }}>
```

### 4. Styling Guidelines

#### **CRITICAL: Always Use CSS Custom Properties**

**Never hard-code design values in CSS/SCSS!** Always use CSS Custom Properties from `src/styles/variables.css`.

```css
/* ✅ DO: Use CSS Custom Properties */
.myComponent {
  color: var(--color-primary-600);
  background-color: var(--bg-paper);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-bold);
  gap: var(--spacing-lg);
}

/* ❌ DON'T: Hard-code values */
.myComponent {
  color: #1e88e5;              /* ❌ Use var(--color-primary-600) */
  background-color: #ffffff;    /* ❌ Use var(--bg-paper) */
  padding: 16px;               /* ❌ Use var(--spacing-md) */
  border-radius: 8px;          /* ❌ Use var(--radius-md) */
  font-weight: 700;            /* ❌ Use var(--font-weight-bold) */
  gap: 24px;                   /* ❌ Use var(--spacing-lg) */
}
```

**Available CSS Custom Properties:**
- **Colors**: `var(--color-primary-{50-900})`, `var(--color-secondary-{50-900})`, `var(--color-gray-{0-900})`, `var(--color-success/warning/error/info-{50-900})`
- **Semantic Colors**: `var(--bg-app)`, `var(--bg-paper)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--border-default)`, etc.
- **Spacing**: `var(--spacing-xs/sm/md/lg/xl/2xl/3xl)` (4px, 8px, 16px, 24px, 32px, 48px, 64px)
- **Border Radius**: `var(--radius-xs/sm/md/lg/xl/full)` (2px, 4px, 8px, 12px, 16px, 9999px)
- **Font Weight**: `var(--font-weight-light/regular/medium/semibold/bold)` (300, 400, 500, 600, 700)
- **Font Size**: `var(--font-size-xs/sm/md/lg/xl/2xl/3xl/4xl)`
- **Shadows**: `var(--shadow-xs/sm/md/lg/xl)`
- **Z-Index**: `var(--z-dropdown/sticky/overlay/modal/notification/max)`

**Benefits:**
- ✅ Light/Dark Mode works automatically
- ✅ Consistent design across the app
- ✅ Easy theme updates (change once, applies everywhere)
- ✅ No hard-coded "magic numbers"

#### CSS Modules
```typescript
// MyComponent.module.css
.container {
  background-color: var(--bg-paper);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.title {
  color: var(--text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

// MyComponent.tsx
import classes from './MyComponent.module.css';

<div className={classes.container}>
  <h2 className={classes.title}>Title</h2>
</div>
```

#### Responsive Design
```css
/* Use CSS custom properties for breakpoints */
@media (min-width: 768px) {
  .container {
    padding: var(--spacing-xl);
  }
}

/* Or use Mantine's responsive props */
<Stack gap={{ base: 'sm', md: 'lg' }}>
```

### 5. API Integration

#### API Service Pattern
```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

#### Service Functions
```typescript
// src/services/userService.ts
import api from './api';
import type { User, ApiResponse } from '@/types';

export const userService = {
  async getUser(userId: string): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>(`/users/${userId}`);
    return data.data;
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data } = await api.patch<ApiResponse<User>>(`/users/${userId}`, updates);
    return data.data;
  },
};
```

#### Error Handling
```typescript
// ✅ DO: Proper error handling
try {
  const user = await userService.getUser(userId);
  setUser(user);
} catch (error) {
  if (axios.isAxiosError(error)) {
    // Handle API errors
    showNotification({
      title: 'Error',
      message: error.response?.data?.message || 'Failed to load user',
      color: 'error',
    });
  } else {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
  }
}
```

### 6. Multi-Tenant Awareness

#### Tenant Context
```typescript
// All API calls must include tenant context
// Automatically handled via auth token, but be aware

// User permissions are tenant-scoped
const { hasPermission } = useAuth();

if (hasPermission('credentials:read')) {
  // Show credentials
}
```

#### Data Isolation
```typescript
// ✅ DO: Filter data by current tenant (if needed client-side)
const tenantApplications = applications.filter(
  app => app.tenantId === currentTenant.id
);

// Server should enforce this, but validate client-side for UX
```

### 7. Authentication & Authorization

#### MSAL Integration
```typescript
// Use custom hook
import { useAuth } from '@/auth';

const { isAuthenticated, user, login, logout, getAccessToken } = useAuth();

// Protected route
if (!isAuthenticated) {
  return <Navigate to="/login" />;
}
```

#### Permission Checks
```typescript
// Role-based rendering
{hasPermission('applications:create') && (
  <Button onClick={handleCreate}>Create Application</Button>
)}

// Permission-based routes
<ProtectedRoute 
  path="/tenant-settings" 
  requiredPermission="tenant:admin"
  component={TenantSettingsPage}
/>
```

### 8. State Management

#### Local State
```typescript
// ✅ DO: Use local state for component-specific data
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState<FormData>(initialData);
```

#### Context for Global State
```typescript
// ✅ DO: Use Context for app-wide state
// src/context/AppContext.tsx
export const AppProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  
  return (
    <AppContext.Provider value={{ currentTenant, setCurrentTenant }}>
      {children}
    </AppContext.Provider>
  );
};

// Use with custom hook
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
```

### 9. Performance Optimization

#### Code Splitting
```typescript
// ✅ DO: Lazy load pages
import { lazy, Suspense } from 'react';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ApplicationsPage = lazy(() => import('@/pages/ApplicationsPage'));

// In routes
<Suspense fallback={<Loader />}>
  <Route path="/dashboard" element={<DashboardPage />} />
</Suspense>
```

#### Memoization
```typescript
// ✅ DO: Memoize expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// ✅ DO: Memoize callbacks passed to children
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

### 10. Accessibility (a11y)

```typescript
// ✅ DO: Semantic HTML and ARIA attributes
<button
  aria-label="Close modal"
  onClick={handleClose}
>
  <IconX />
</button>

<input
  id="email"
  type="email"
  aria-describedby="email-error"
  aria-invalid={!!errors.email}
/>
{errors.email && (
  <span id="email-error" role="alert">
    {errors.email}
  </span>
)}

// Mantine components have built-in a11y support
<Modal
  opened={opened}
  onClose={close}
  title="Modal Title"
  aria-labelledby="modal-title"
>
```

---

## Code Generation Guidelines for Copilot

### When Creating Components

1. **Read REACT_STRUCTURE.md** to understand folder structure
2. **Check DESIGN_THEMES.md** for colors, spacing, typography
3. **Use TypeScript** with explicit types (no `any`)
4. **Import Mantine components** instead of building from scratch
5. **Use CSS Modules** for custom styles with theme variables
6. **Add proper error handling** for async operations
7. **Include loading states** for data fetching
8. **Implement responsive design** using Mantine's responsive props or media queries

### When Working with API

1. **Create service functions** in `src/services/`
2. **Define types** in `src/types/`
3. **Use the auth hook** to get access tokens
4. **Handle errors gracefully** with user-friendly messages
5. **Show loading states** during API calls
6. **Use Mantine notifications** for feedback

### When Styling

1. **Use CSS custom properties** from `src/styles/variables.css`
2. **Use Mantine theme tokens** via `useMantineTheme()` or theme props
3. **Support Light/Dark mode** automatically via theme variables
4. **Follow spacing system** (xs, sm, md, lg, xl)
5. **Use semantic colors** (primary, success, error, etc.)

### File Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Styles**: Component name + `.module.css` (e.g., `UserProfile.module.css`)
- **Types**: camelCase + `.types.ts` (e.g., `user.types.ts`)
- **Services**: camelCase + `Service.ts` (e.g., `userService.ts`)
- **Utils**: camelCase (e.g., `formatDate.ts`)

---

## Common Patterns

### Page Component Pattern
```typescript
// src/pages/MyPage/MyPage.tsx
import { FC, useState, useEffect } from 'react';
import { Container, Title, Stack, Loader } from '@mantine/core';
import { useAuth } from '@/auth';
import { myService } from '@/services';
import classes from './MyPage.module.css';

export const MyPage: FC = () => {
  const { hasPermission } = useAuth();
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await myService.getData();
        setData(result);
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (loading) return <Loader />;
  if (error) return <Alert color="error">{error}</Alert>;

  return (
    <Container size="xl" className={classes.container}>
      <Stack gap="lg">
        <Title order={1}>Page Title</Title>
        {/* Page content */}
      </Stack>
    </Container>
  );
};
```

### Form Pattern
```typescript
import { useForm } from '@mantine/form';
import { TextInput, Button, Stack } from '@mantine/core';

const form = useForm({
  initialValues: {
    name: '',
    email: '',
  },
  validate: {
    name: (value) => (value.length < 2 ? 'Name too short' : null),
    email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
  },
});

const handleSubmit = form.onSubmit(async (values) => {
  try {
    await myService.create(values);
    notifications.show({ title: 'Success', message: 'Created!' });
  } catch (error) {
    notifications.show({ title: 'Error', message: 'Failed to create' });
  }
});

return (
  <form onSubmit={handleSubmit}>
    <Stack gap="md">
      <TextInput label="Name" {...form.getInputProps('name')} />
      <TextInput label="Email" {...form.getInputProps('email')} />
      <Button type="submit">Submit</Button>
    </Stack>
  </form>
);
```

### List with Actions Pattern
```typescript
import { Table, ActionIcon, Group } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';

const rows = items.map((item) => (
  <Table.Tr key={item.id}>
    <Table.Td>{item.name}</Table.Td>
    <Table.Td>{item.description}</Table.Td>
    <Table.Td>
      <Group gap="xs">
        <ActionIcon color="primary" onClick={() => handleEdit(item)}>
          <IconEdit size={16} />
        </ActionIcon>
        <ActionIcon color="error" onClick={() => handleDelete(item)}>
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    </Table.Td>
  </Table.Tr>
));

return <Table>{rows}</Table>;
```

### DataTable Row Click vs Menu Action Pattern
```typescript
// Pattern: Unterschiedliches Verhalten für Row-Click und Menu-Actions

// In Page Component:
const handleRowClick = (id: string) => {
  // Navigation zu Detail-Page
  navigate(`/development-platforms/${id}`);
};

const handleOpen = (id: string) => {
  // Externe URL öffnen (z.B. iframe_url)
  const platform = items.find(p => p.id === id);
  if (platform?.iframe_url) {
    window.open(platform.iframe_url, '_blank');
  }
};

<DataTable
  items={items}
  onRowClick={handleRowClick}  // Klick auf Row → Navigation
  onOpen={handleOpen}          // Menu "Öffnen" → externe URL
  onDelete={handleDelete}
/>
```

### stopPropagation Pattern für nested Interactive Elements
```typescript
// In DataTableRow.tsx:
// Wenn Row klickbar ist, müssen nested Elements (Switch, Menu) stopPropagation verwenden

<Paper 
  onClick={() => onRowClick?.(item.id)}
  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
>
  {/* Switch verhindert Row-Click */}
  <Switch
    checked={item.isActive}
    onClick={(e) => e.stopPropagation()}  // Wichtig!
    onChange={() => onStatusChange?.(item.id)}
  />
  
  {/* Menu ActionIcon verhindert Row-Click */}
  <ActionIcon onClick={(e) => e.stopPropagation()}>  // Wichtig!
    <IconDots />
  </ActionIcon>
</Paper>
```

### Iframe Detail Page Pattern
```typescript
// Pattern für Pages die externe URLs in Iframe anzeigen
// Beispiel: DevelopmentPlatformDetailsPage

export const DevelopmentPlatformDetailsPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { apiClient, selectedTenant } = useIdentity();
  const [platform, setPlatform] = useState<DevelopmentPlatformResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlatform = async () => {
      if (!apiClient || !selectedTenant || !id) return;
      try {
        const data = await apiClient.getDevelopmentPlatform(selectedTenant.id, id);
        setPlatform(data);
      } catch {
        setError('Platform konnte nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };
    fetchPlatform();
  }, [apiClient, selectedTenant, id]);

  if (loading) return <Skeleton height="100%" />;
  if (error) return <Alert color="red">{error}</Alert>;
  if (!platform?.iframe_url) return <Alert>Keine iframe_url vorhanden</Alert>;

  return (
    <iframe
      src={platform.iframe_url}
      style={{ width: '100%', height: '100%', border: 'none' }}
      title={platform.name}
    />
  );
};
```

---

## Environment Variables

```bash
# .env
VITE_API_BASE_URL=https://api.example.com
VITE_MSAL_CLIENT_ID=your-client-id
VITE_MSAL_AUTHORITY=https://login.microsoftonline.com/common
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

---

## Testing Guidelines

```typescript
// Use Vitest + React Testing Library
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

---

## Summary

This is a **modern React application** for an **unified-ui multi-tenant platform**. When developing:

1. ✅ **Follow React best practices** (hooks, functional components, TypeScript)
2. ✅ **Use Mantine UI framework** for all components
3. ✅ **Respect the theme system** (no hardcoded colors/spacing)
4. ✅ **Handle multi-tenant context** in all features
5. ✅ **Implement proper auth/permissions** checks
6. ✅ **Write type-safe code** with explicit TypeScript types
7. ✅ **Create reusable components** following the project structure
8. ✅ **Test thoroughly** with proper error handling
9. ✅ **Use SidebarDataContext** for sidebar entity lists (5 types: applications, autonomous-agents, credentials, chat-widgets, development-platforms)
10. ✅ **Use stopPropagation** when nested interactive elements are inside clickable containers

### Entity Types Overview
The application supports **5 main entity types** with consistent CRUD patterns:
- **Applications** - AI agent applications
- **Autonomous Agents** - Self-running AI agents
- **Credentials** - Secure credentials storage (types: API_KEY, PASSWORD, TOKEN, SECRET, CONNECTION_STRING, CERTIFICATE, OTHER)
- **Chat Widgets** - Embeddable chat interfaces (types: IFRAME, FORM)
- **Development Platforms** - External development tools (with iframe_url for embedding)

### Key Patterns to Follow
- **DataTable**: Use `onRowClick` for navigation, `onOpen` for external URLs
- **SidebarDataList**: Shows on hover, except when on exact list page path
- **Edit Dialogs**: Fetch entity data fresh, don't rely on URL-based state alone
- **Iframe Pages**: Use for displaying external URLs within the app

**Before generating code, always reference**:
- [REACT_STRUCTURE.md](./REACT_STRUCTURE.md) for project organization
- [DESIGN_THEMES.md](./DESIGN_THEMES.md) for design tokens
- [API_CLIENT_GUIDE.md](./API_CLIENT_GUIDE.md) for API integration

Happy coding! 🚀
