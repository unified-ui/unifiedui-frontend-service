import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { ChatSidebarProvider } from '../contexts';
import { LoginPage } from '../pages/LoginPage';
import { LoginTokenPage } from '../pages/LoginTokenPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TenantSettingsPage } from '../pages/TenantSettingsPage';
import { ApplicationsPage } from '../pages/ApplicationsPage';
import { ConversationsPage } from '../pages/ConversationsPage';
import { AutonomousAgentsPage } from '../pages/AutonomousAgentsPage';
import { AutonomousAgentDetailsPage } from '../pages/AutonomousAgentDetailsPage';
import { ChatWidgetsPage } from '../pages/ChatWidgetsPage';
import { WidgetDesignerPage } from '../pages/WidgetDesignerPage';
import { IframeWidgetPreviewPage } from '../pages/IframeWidgetPreviewPage';
import { ReActAgentsPage } from '../pages/ReActAgentsPage';
import { ReActAgentDeveloperPage } from '../pages/ReActAgentDeveloperPage';
import { EmbedChatPage } from '../pages/EmbedChatPage';
import { TracingDialogDevelopmentPage } from '../pages/TracingDialogDevelopmentPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <ChatSidebarProvider>
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/token" element={<LoginTokenPage />} />
        <Route path="/embed/chat/:agentId" element={<EmbedChatPage />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/tenant-settings" element={<ProtectedRoute><TenantSettingsPage /></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute><ApplicationsPage /></ProtectedRoute>} />
        <Route path="/conversations" element={<ProtectedRoute><ConversationsPage /></ProtectedRoute>} />
        <Route path="/conversations/:conversationId" element={<ProtectedRoute><ConversationsPage /></ProtectedRoute>} />
        <Route path="/autonomous-agents" element={<ProtectedRoute><AutonomousAgentsPage /></ProtectedRoute>} />
        <Route path="/autonomous-agents/:agentId" element={<ProtectedRoute><AutonomousAgentDetailsPage /></ProtectedRoute>} />
        <Route path="/chat-widgets" element={<ProtectedRoute><ChatWidgetsPage /></ProtectedRoute>} />
        <Route path="/chat-widgets/:widgetId/preview" element={<ProtectedRoute><IframeWidgetPreviewPage /></ProtectedRoute>} />
        <Route path="/widget-designer/:widgetId" element={<ProtectedRoute><WidgetDesignerPage /></ProtectedRoute>} />
        <Route path="/re-act-agents" element={<ProtectedRoute><ReActAgentsPage /></ProtectedRoute>} />
        <Route path="/re-act-agents/:agentId" element={<ProtectedRoute><ReActAgentDeveloperPage /></ProtectedRoute>} />
        
        <Route path="/dev/tracing" element={<ProtectedRoute><TracingDialogDevelopmentPage /></ProtectedRoute>} />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </ChatSidebarProvider>
    </BrowserRouter>
  );
};
