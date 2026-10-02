import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Thermometer, Users, LogOut, X, Server } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { logout } = useAuth();
  
  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/temperature', icon: <Thermometer size={20} />, label: 'Temperatura' },
    { to: '/access-logs', icon: <Users size={20} />, label: 'Accesos' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Server className="text-indigo-500 w-7 h-7" />
            SysAdmin Pro
          </h1>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white p-1">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 mt-6 overflow-y-auto">
          <ul className="space-y-2 px-4">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => {
                    // Cierra el menú en móvil al navegar
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 p-3.5 rounded-xl transition-all font-medium ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                        : 'hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex w-full items-center space-x-3 p-3.5 text-left rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors font-medium group"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};
