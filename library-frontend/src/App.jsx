import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Login from "./views/Login";
import Books from "./views/Books";
import Circulation from "./views/Circulation";
import History from "./views/History";
import Dashboard from "./views/Dashboard";
import Students from "./views/Students";
import Faculty from "./views/Faculty";
import FacultyCirculation from "./views/FacultyCirculation";
import Reports from "./views/Reports";
import DepartmentAnalytics from "./views/DepartmentAnalytics";
import UserManagement from "./views/UserManagement";
import Settings from "./views/Settings";
import AttendanceLog from "./views/AttendanceLog";
import { ToastProvider } from "./components/ui/Toast";
import { ThemeProvider } from "./context/ThemeContext";
import { LibrarySettingsProvider } from "./context/LibrarySettingsContext";
import MainLayout from "./components/MainLayout";
import axiosClient from "./axios-client";



import PublicCatalog from "./views/PublicCatalog";
import PublicAttendance from "./views/PublicAttendance";
import PrintLibraryCard from "./views/PrintLibraryCard";

// Helper: normalize pathname by stripping the /app prefix (Docker serves SPA at /app/)
function getAppPath(path) {
  // Strip /app prefix if present (Docker), otherwise use as-is (dev)
  if (path.startsWith('/app/')) return path.replace(/^\/app/, '');
  if (path === '/app') return '/';
  return path;
}

export default function App() {
  const location = useLocation();
  const appPath = getAppPath(location.pathname);

  // PUBLIC KIOSK ROUTE - Bypass Auth
  if (appPath === '/catalog') {
    return (
      <ThemeProvider>
        <LibrarySettingsProvider>
          <ToastProvider>
            <PublicCatalog />
          </ToastProvider>
        </LibrarySettingsProvider>
      </ThemeProvider>
    );
  }

  // PUBLIC ATTENDANCE KIOSK - Bypass Auth
  if (appPath === '/attendance') {
    return (
      <ThemeProvider>
        <LibrarySettingsProvider>
          <ToastProvider>
            <PublicAttendance />
          </ToastProvider>
        </LibrarySettingsProvider>
      </ThemeProvider>
    );
  }

  // PRINT ROUTE - Bypass Main Layout
  if (appPath === '/print/card') {
    return <PrintLibraryCard />;
  }

  const [token, setToken] = useState(localStorage.getItem("ACCESS_TOKEN"));
  const [userName, setUserName] = useState(localStorage.getItem("USER_NAME"));
  const [verifying, setVerifying] = useState(!!localStorage.getItem("ACCESS_TOKEN"));
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // State for passing scanned barcode from Circulation to Books for registration
  const [pendingBarcode, setPendingBarcode] = useState("");

  // Notification count (can be connected to real data later)
  const [notificationCount, setNotificationCount] = useState(3);

  // Verify token with the server on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("ACCESS_TOKEN");
    if (!storedToken) {
      setVerifying(false);
      return;
    }

    axiosClient.get('/user')
      .then(({ data }) => {
        // Token is valid — update state with server data
        setToken(storedToken);
        setUserName(data.name || localStorage.getItem("USER_NAME"));
        setVerifying(false);
      })
      .catch(() => {
        // Token is invalid or expired — clear and show login
        localStorage.removeItem("ACCESS_TOKEN");
        localStorage.removeItem("USER_NAME");
        localStorage.removeItem("USER_ROLE");
        setToken(null);
        setUserName(null);
        setVerifying(false);
      });
  }, []);

  const onLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Navigation handler for registering new books from scanner
  const handleNavigateToBooks = (barcode) => {
    setPendingBarcode(barcode);
    setActiveTab("books");
  };

  // Clear pending barcode when Books form is closed
  const handleClearPendingBarcode = () => {
    setPendingBarcode("");
  };

  // Toggle mobile sidebar
  const handleMenuToggle = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  // SHOW LOADING WHILE VERIFYING TOKEN
  if (verifying) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Verifying session...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // IF NOT LOGGED IN -> SHOW LOGIN PAGE
  if (!token) {
    return (
      <ThemeProvider>
        <LibrarySettingsProvider>
          <ToastProvider>
            <Login />
          </ToastProvider>
        </LibrarySettingsProvider>
      </ThemeProvider>
    );
  }

  // IF LOGGED IN -> SHOW MAIN LAYOUT
  return (
    <ThemeProvider>
      <LibrarySettingsProvider>
        <ToastProvider>
          <MainLayout
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={onLogout}
            userName={userName}
          >
            {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
            {activeTab === 'students' && <Students />}
            {activeTab === 'faculty' && <Faculty />}
            {activeTab === 'faculty-circulation' && <FacultyCirculation />}
            {activeTab === 'books' && <Books pendingBarcode={pendingBarcode} onClearPendingBarcode={handleClearPendingBarcode} />}
            {activeTab === 'circulation' && <Circulation onNavigateToBooks={handleNavigateToBooks} />}
            {activeTab === 'history' && <History />}
            {activeTab === 'reports' && <Reports />}
            {activeTab === 'department-analytics' && <DepartmentAnalytics />}
            {activeTab === 'user-management' && <UserManagement />}
            {activeTab === 'settings' && <Settings />}
            {activeTab === 'attendance-log' && <AttendanceLog />}
          </MainLayout>
        </ToastProvider>
      </LibrarySettingsProvider>
    </ThemeProvider >
  );
}