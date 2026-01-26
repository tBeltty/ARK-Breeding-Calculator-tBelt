import { Routes, Route, Navigate } from 'react-router-dom';
import CalculatorPage from './pages/CalculatorPage';
import DashboardPage from './pages/DashboardPage';
import ServerTrackingPage from './pages/ServerTrackingPage';
import AuthCallback from './pages/AuthCallback';
import HelpPage from './pages/HelpPage';
import { MainLayout } from './components/Layout/MainLayout';
import './styles/globals.css';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<CalculatorPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/servers" element={<ServerTrackingPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Route>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
