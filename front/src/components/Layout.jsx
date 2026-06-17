import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, GraduationCap, CreditCard, BarChart3, Menu, X } from 'lucide-react';
import { useState } from 'react';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="layout">
      {/* ─── Header ─── */}
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo" onClick={() => setMobileMenuOpen(false)}>
            <div className="logo-icon">
              <GraduationCap size={20} />
            </div>
            <div className="logo-text">
              <span className="logo-title">Springfield Academy</span>
              <span className="logo-subtitle">Fee Management</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="nav-desktop">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <div className="nav-links">
                    <Link to="/admin/students" className={`nav-link ${isActive('/admin/students') ? 'active' : ''}`}>
                      <BarChart3 size={15} /> Students DB
                    </Link>
                    <Link to="/admin/pay" className={`nav-link ${isActive('/admin/pay') ? 'active' : ''}`}>
                      <CreditCard size={15} /> Pay Portal
                    </Link>
                  </div>
                )}
                {user.role === 'teacher' && (
                  <div className="nav-links">
                    <Link to="/teacher" className={`nav-link ${isActive('/teacher') ? 'active' : ''}`}>
                      <BarChart3 size={15} /> Class Fees
                    </Link>
                  </div>
                )}
                <div className="nav-divider" />
                <div className="user-badge">
                  <User size={14} />
                  <span>{user.name}</span>
                  <span className="user-role">{user.role}</span>
                </div>
                <button onClick={handleLogout} className="btn-logout" title="Sign out">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-portal">Staff Portal Login</Link>
            )}
          </nav>

          {/* Mobile Toggle */}
          <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="nav-mobile animate-fadeIn">
            {user ? (
              <>
                <div className="mobile-user-info">
                  <User size={16} />
                  <span>{user.name}</span>
                  <span className="user-role">{user.role}</span>
                </div>
                {user.role === 'admin' && (
                  <>
                    <Link to="/admin/students" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      <BarChart3 size={16} /> Students DB
                    </Link>
                    <Link to="/admin/pay" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      <CreditCard size={16} /> Pay Portal
                    </Link>
                  </>
                )}
                {user.role === 'teacher' && (
                  <Link to="/teacher" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                    <BarChart3 size={16} /> Class Fees
                  </Link>
                )}
                <button onClick={handleLogout} className="mobile-nav-link mobile-logout">
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                Staff Portal Login
              </Link>
            )}
          </nav>
        )}
      </header>

      {/* ─── Main ─── */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ─── Footer ─── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-links">
            <span>Privacy Policy</span>
            <span className="footer-dot">&bull;</span>
            <span>Terms of Service</span>
            <span className="footer-dot">&bull;</span>
            <span>Contact Administration</span>
          </div>
          <p className="footer-copy">&copy; {new Date().getFullYear()} Springfield Academy Educational Trust. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
