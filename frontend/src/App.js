import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { ChatProvider } from './context/ChatContext';
import { JobChatProvider } from './context/JobChatContext';
import { ThemeProvider } from './context/ThemeContext';

import Header from './components/Header';
import Footer from './components/Footer';

import Home from './pages/Home';
import Jobs from './pages/Jobs';
import Login from './pages/Login';
import Register from './pages/Register';

import WorkerDashboard from './pages/WorkerDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminWelcome from './pages/AdminWelcome';

import AdminUsers from './pages/AdminUsers';
import AdminJobs from './pages/AdminJobs';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';
import AdminBackup from './pages/AdminBackup';

import ProtectedRoute from './components/ProtectedRoute';

import WorkerProfile from './pages/WorkerProfile';
import WorkerDocuments from './pages/WorkerDocuments';
import MyApplications from './pages/MyApplications';

import EmployerSubmissions from './pages/EmployerSubmissions';
import EmployerAnalytics from './pages/EmployerAnalytics';
import EmployerPostJob from './pages/EmployerPostJob';
import EmployerJobs from './pages/EmployerJobs';
import EmployerSettings from './pages/EmployerSettings';

import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import Messages from './pages/Messages';
import JobChatWindow from './pages/JobChatWindow';
import AiChat from './pages/AiChat';
import ChatWidget from './components/ChatWidget/ChatWidget';

// About Page
const About = () => {
  const { t } = useTranslation();

  return (
  <div className="container py-5">
    <h1 className="text-center text-primary">{t('about.title')}</h1>
    <p className="text-center text-muted mb-4">
      {t('about.subtitle')}
    </p>

    <div className="row g-4">
      <div className="col-md-6">
        <div className="p-4 border rounded-3 h-100 bg-light">
          <h5 className="text-primary">{t('about.whatIs')}</h5>
          <p className="mb-0 text-muted">
            {t('about.whatIsDesc')}
          </p>
        </div>
      </div>

      <div className="col-md-6">
        <div className="p-4 border rounded-3 h-100 bg-light">
          <h5 className="text-primary">{t('about.forWorkers')}</h5>
          <p className="mb-0 text-muted">
            {t('about.forWorkersDesc')}
          </p>
        </div>
      </div>

      <div className="col-md-6">
        <div className="p-4 border rounded-3 h-100 bg-light">
          <h5 className="text-primary">{t('about.forEmployers')}</h5>
          <p className="mb-0 text-muted">
            {t('about.forEmployersDesc')}
          </p>
        </div>
      </div>

      <div className="col-md-6">
        <div className="p-4 border rounded-3 h-100 bg-light">
          <h5 className="text-primary">{t('about.trust')}</h5>
          <p className="mb-0 text-muted">
            {t('about.trustDesc')}
          </p>
        </div>
      </div>
    </div>
  </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ChatProvider>
          <JobChatProvider>
            <AdminProvider>

            <div className="d-flex flex-column min-vh-100">
              
              <Header />

              <main className="flex-grow-1" style={{ paddingTop: '100px' }}>
                <Routes>

              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Worker Routes */}
              <Route path="/worker/dashboard" element={<ProtectedRoute allowedRole="worker"><WorkerDashboard /></ProtectedRoute>} />
              <Route path="/worker/profile" element={<ProtectedRoute allowedRole="worker"><WorkerProfile /></ProtectedRoute>} />
              <Route path="/worker/applications" element={<ProtectedRoute allowedRole="worker"><MyApplications /></ProtectedRoute>} />
              <Route path="/worker/documents" element={<ProtectedRoute allowedRole="worker"><WorkerDocuments /></ProtectedRoute>} />

              {/* Employer Routes */}
              <Route path="/employer/dashboard" element={<ProtectedRoute allowedRole="employer"><EmployerDashboard /></ProtectedRoute>} />
              <Route path="/employer/submissions" element={<ProtectedRoute allowedRole="employer"><EmployerSubmissions /></ProtectedRoute>} />
              <Route path="/employer/analytics" element={<ProtectedRoute allowedRole="employer"><EmployerAnalytics /></ProtectedRoute>} />
              <Route path="/employer/post-job" element={<ProtectedRoute allowedRole="employer"><EmployerPostJob /></ProtectedRoute>} />
              <Route path="/employer/jobs" element={<ProtectedRoute allowedRole="employer"><EmployerJobs /></ProtectedRoute>} />
              <Route path="/employer/settings" element={<ProtectedRoute allowedRole="employer"><EmployerSettings /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminWelcome /></ProtectedRoute>} />
              <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRole="admin"><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/jobs" element={<ProtectedRoute allowedRole="admin"><AdminJobs /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute allowedRole="admin"><AdminReports /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute allowedRole="admin"><AdminSettings /></ProtectedRoute>} />
              <Route path="/admin/backup" element={<ProtectedRoute allowedRole="admin"><AdminBackup /></ProtectedRoute>} />

              {/* Chat Routes (IMPORTANT) */}
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/chat/:jobId" element={<JobChatWindow />} />
              <Route path="/ai-chat" element={<AiChat />} />

            </Routes>
              </main>

              <Footer />
              <ChatWidget />

            </div>

          </AdminProvider>
        </JobChatProvider>
      </ChatProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;