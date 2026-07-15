import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import ProtectedLayout from '../components/layout/ProtectedLayout';
import GlobalDashboard from '../pages/dashboard/GlobalDashboard';
import SalesPage from '../pages/sales/SalesPage';
import ExportPage from '../pages/export/ExportPage';
import AttendancePage from '../pages/attendance/AttendancePage';
import UserManagementPage from '../pages/users/UserManagementPage';
import AuditLogPage from '../pages/audit-logs/AuditLogPage';
import AiAssistantPage from '../pages/ai-assistant/AiAssistantPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<GlobalDashboard />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/users" element={<UserManagementPage />} />
        <Route path="/audit-logs" element={<AuditLogPage />} />
        <Route path="/ai-assistant" element={<AiAssistantPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}