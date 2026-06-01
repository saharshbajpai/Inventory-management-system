import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Menu, 
  X, 
  Activity,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/products', label: 'Products', icon: <Package size={20} /> },
    { to: '/customers', label: 'Customers', icon: <Users size={20} /> },
    { to: '/orders', label: 'Orders', icon: <ShoppingCart size={20} /> },
  ];

  return (
    <div className="app-container">
      {/* Mobile Top Bar */}
      <header className="mobile-header">
        <Link to="/" className="mobile-logo">
          <Activity className="logo-icon" size={24} />
          <span>Veloce IMS</span>
        </Link>
        <button className="menu-toggle-btn" onClick={toggleSidebar} aria-label="Toggle Menu">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={closeSidebar}></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`app-sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Activity className="logo-icon" size={28} />
          <h2 className="brand-text">Veloce IMS</h2>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeSidebar}
              className={({ isActive }) => 
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              <span className="nav-link-icon">{item.icon}</span>
              <span className="nav-link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="sidebar-user-section">
            <div className="user-profile-info">
              <div className="user-avatar-wrapper">
                <UserIcon size={18} />
              </div>
              <div className="user-text-details">
                <div className="user-name-truncate" title={user.full_name}>{user.full_name}</div>
                <div className="user-role-badge">{user.role}</div>
              </div>
            </div>
            
            <button className="btn-logout-sidebar" onClick={logout} title="Sign Out">
              <LogOut size={18} />
              <span className="logout-text">Sign Out</span>
            </button>
          </div>
        )}

        <div className="sidebar-footer">
          <div className="system-status">
            <div className="status-dot"></div>
            <span className="status-text">System Operational</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-main-content">
        <div className="content-inner">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
