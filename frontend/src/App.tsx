import { useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Sidebar } from './components/layout/Sidebar';
import { Login } from './pages/Login/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { TemperaturePage } from './pages/Temperature/TemperaturePage';
import { AccessLogs } from './pages/AccessLogs/AccessLogs';
import { Menu, Server } from 'lucide-react';
import { useAuth } from './context/AuthContext';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="font-bold text-slate-800 flex items-center gap-2">
               <Server className="text-indigo-600 w-5 h-5" />
               SysAdmin
            </h1>
          </div>
          {user && (
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/temperature" element={<TemperaturePage />} />
            <Route path="/access-logs" element={<AccessLogs />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
