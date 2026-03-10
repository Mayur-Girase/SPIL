import React from 'react';
import { Link, useLocation } from 'react-router';
import { LayoutDashboard, FolderKanban, UserCheck, BarChart3, Users, Plus } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/attendance', label: 'Attendance', icon: UserCheck },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/contractors', label: 'Contractors', icon: Users },
    { path: '/add-project', label: 'Add Project', icon: Plus },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pharma Project Management</h1>
              <p className="text-sm text-gray-600">Multi-Plant Operations Dashboard</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-xs text-gray-600">Real-time Project Monitoring</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path || 
                             (path !== '/' && location.pathname.startsWith(path));
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    isActive
                      ? 'text-blue-600 border-blue-600 bg-blue-50'
                      : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-6 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
