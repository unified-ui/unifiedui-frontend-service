import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { ProtectedRoute } from './ProtectedRoute';
import { ChatSidebarProvider } from '../contexts';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';

const LoginTokenPage = lazy(() => import('../pages/LoginTokenPage').then(m => ({ default: m.LoginTokenPage })));
const DashboardPage = lazy(() => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const TenantSettingsPage = lazy(() => import('../pages/TenantSettingsPage').then(m => ({ default: m.TenantSettingsPage })));
const ChatAgentsPage = lazy(() => import('../pages/ChatAgentsPage').then(m => ({ default: m.ChatAgentsPage })));
const ConversationsPage = lazy(() => import('../pages/ConversationsPage').then(m => ({ default: m.ConversationsPage })));
const WorkflowsPage = lazy(() => import('../pages/WorkflowsPage').then(m => ({ default: m.WorkflowsPage })));
const WorkflowDetailsPage = lazy(() => import('../pages/WorkflowDetailsPage').then(m => ({ default: m.WorkflowDetailsPage })));
const ChatWidgetsPage = lazy(() => import('../pages/ChatWidgetsPage').then(m => ({ default: m.ChatWidgetsPage })));
const WidgetDesignerPage = lazy(() => import('../pages/WidgetDesignerPage').then(m => ({ default: m.WidgetDesignerPage })));
const IframeWidgetPreviewPage = lazy(() => import('../pages/IframeWidgetPreviewPage').then(m => ({ default: m.IframeWidgetPreviewPage })));
const ReActAgentDeveloperPage = lazy(() => import('../pages/ReActAgentDeveloperPage').then(m => ({ default: m.ReActAgentDeveloperPage })));
const EmbedChatPage = lazy(() => import('../pages/EmbedChatPage').then(m => ({ default: m.EmbedChatPage })));
const HowEmbedChatPage = lazy(() => import('../pages/HowEmbedChatPage').then(m => ({ default: m.HowEmbedChatPage })));
const TracingDialogDevelopmentPage = lazy(() => import('../pages/TracingDialogDevelopmentPage').then(m => ({ default: m.TracingDialogDevelopmentPage })));
const ExternalAppsPage = lazy(() => import('../pages/ExternalAppsPage').then(m => ({ default: m.ExternalAppsPage })));
const ExternalAppPage = lazy(() => import('../pages/ExternalAppPage').then(m => ({ default: m.ExternalAppPage })));

const IS_DEV = import.meta.env.DEV;

const LazyFallback = () => (
  <Center h="100vh">
    <Loader size="xl" />
  </Center>
);

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <ChatSidebarProvider>
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login/token" element={<LoginTokenPage />} />
            <Route path="/auth/callback/cognito" element={<LoginPage />} />
            <Route path="/auth/callback/oidc" element={<LoginPage />} />
            <Route path="/embed/chat/:agentId" element={<EmbedChatPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route path="/home" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/tenant-settings" element={<ProtectedRoute><TenantSettingsPage /></ProtectedRoute>} />
            <Route path="/chat-agents" element={<ProtectedRoute><ChatAgentsPage /></ProtectedRoute>} />
            <Route path="/chat-agents/:id/embed-chat" element={<ProtectedRoute><HowEmbedChatPage /></ProtectedRoute>} />
            <Route path="/conversations/:conversationId?" element={<ProtectedRoute><ConversationsPage /></ProtectedRoute>} />
            <Route path="/workflows" element={<ProtectedRoute><WorkflowsPage /></ProtectedRoute>} />
            <Route path="/workflows/:agentId" element={<ProtectedRoute><WorkflowDetailsPage /></ProtectedRoute>} />
            <Route path="/chat-widgets" element={<ProtectedRoute><ChatWidgetsPage /></ProtectedRoute>} />
            <Route path="/chat-widgets/:widgetId/preview" element={<ProtectedRoute><IframeWidgetPreviewPage /></ProtectedRoute>} />
            <Route path="/widget-designer/:widgetId" element={<ProtectedRoute><WidgetDesignerPage /></ProtectedRoute>} />
            <Route path="/chat-agents/:agentId/develop" element={<ProtectedRoute><ReActAgentDeveloperPage /></ProtectedRoute>} />
            <Route path="/external-apps" element={<ProtectedRoute><ExternalAppsPage /></ProtectedRoute>} />
            <Route path="/external-apps/:id" element={<ProtectedRoute><ExternalAppPage /></ProtectedRoute>} />

            {IS_DEV && (
              <Route path="/dev/tracing" element={<ProtectedRoute><TracingDialogDevelopmentPage /></ProtectedRoute>} />
            )}

            <Route path="/" element={<Navigate to="/home" replace />}
            />
            <Route path="/dashboard" element={<Navigate to="/home" replace />} />
            <Route path="/autonomous-agents" element={<Navigate to="/workflows" replace />} />
            <Route path="/autonomous-agents/:agentId" element={<Navigate to="/workflows/:agentId" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ChatSidebarProvider>
    </BrowserRouter>
  );
};
