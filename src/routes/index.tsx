import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { LoginTokenPage } from '../pages/LoginTokenPage';
import { DashboardPage } from '../pages/DashboardPage';
import { CredentialsPage } from '../pages/CredentialsPage';
import { TenantSettingsPage } from '../pages/TenantSettingsPage';
import { ApplicationsPage } from '../pages/ApplicationsPage';
import { ConversationsPage } from '../pages/ConversationsPage';
import { AutonomousAgentsPage } from '../pages/AutonomousAgentsPage';
import { ChatWidgetsPage } from '../pages/ChatWidgetsPage';
import { WidgetDesignerPage } from '../pages/WidgetDesignerPage';
import { DevelopmentPlatformsPage } from '../pages/DevelopmentPlatformsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/token" element={<LoginTokenPage />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/credentials" element={<ProtectedRoute><CredentialsPage /></ProtectedRoute>} />
        <Route path="/tenant-settings" element={<ProtectedRoute><TenantSettingsPage /></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute><ApplicationsPage /></ProtectedRoute>} />
        <Route path="/conversations" element={<ProtectedRoute><ConversationsPage /></ProtectedRoute>} />
        <Route path="/autonomous-agents" element={<ProtectedRoute><AutonomousAgentsPage /></ProtectedRoute>} />
        <Route path="/chat-widgets" element={<ProtectedRoute><ChatWidgetsPage /></ProtectedRoute>} />
        <Route path="/widget-designer" element={<ProtectedRoute><WidgetDesignerPage /></ProtectedRoute>} />
        <Route path="/development-platforms" element={<ProtectedRoute><DevelopmentPlatformsPage /></ProtectedRoute>} />
        
        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

