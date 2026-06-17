import { Link } from 'react-router-dom';
import { BookOpen, Users, Trophy, ChevronRight, Shield, Clock, Award } from 'lucide-react';
import './Home.css';

export default function Home() {
  return (
    <div className="home animate-fadeIn">
      {/* ─── Hero ─── */}
      <section className="hero">
        <div className="hero-bg">
          <img
            src="https://images.pexels.com/photos/256490/pexels-photo-256490.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            alt="Springfield Academy Campus"
            referrerPolicy="no-referrer"
          />
          <div className="hero-overlay" />
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <Shield size={14} /> Trusted Since 1985
          </div>
          <h1 className="hero-title">Nurturing Tomorrow's Leaders</h1>
          <p className="hero-subtitle">
            A tradition of excellence, innovation, and holistic development at Springfield Academy.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn-hero-primary">
              Access Faculty Portal <ChevronRight size={18} />
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">2,400+</span>
              <span className="hero-stat-label">Students</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">98%</span>
              <span className="hero-stat-label">Pass Rate</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">150+</span>
              <span className="hero-stat-label">Faculty</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="features">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary)' }}>
              <BookOpen size={28} />
            </div>
            <h3>Academic Rigor</h3>
            <p>Our curriculum challenges students and fosters critical thinking for the modern world.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: '#eef2ff', color: 'var(--color-accent)' }}>
              <Users size={28} />
            </div>
            <h3>Expert Faculty</h3>
            <p>Learn from distinguished educators passionate about teaching and mentorship.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
              <Trophy size={28} />
            </div>
            <h3>Holistic Growth</h3>
            <p>Character development alongside academics through extensive extracurricular programs.</p>
          </div>
        </div>
      </section>

      {/* ─── Fee System Highlights ─── */}
      <section className="highlights">
        <div className="highlights-inner">
          <div className="highlights-header">
            <h2>Smart Fee Management</h2>
            <p>Streamlined, transparent, and efficient financial administration for your institution.</p>
          </div>
          <div className="highlights-grid">
            <div className="highlight-item">
              <div className="highlight-icon">
                <Clock size={22} />
              </div>
              <div>
                <h4>Real-Time Tracking</h4>
                <p>Monitor fee collections and outstanding balances instantly across all classes.</p>
              </div>
            </div>
            <div className="highlight-item">
              <div className="highlight-icon">
                <Shield size={22} />
              </div>
              <div>
                <h4>Role-Based Access</h4>
                <p>Secure admin and teacher portals with granular permission controls.</p>
              </div>
            </div>
            <div className="highlight-item">
              <div className="highlight-icon">
                <Award size={22} />
              </div>
              <div>
                <h4>Complete Audit Trail</h4>
                <p>Full transaction history for every student with timestamped records.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Quote ─── */}
      <section className="quote-section">
        <div className="quote-inner">
          <blockquote className="quote-text">
            "Education is not the learning of facts, but the training of the mind to think."
          </blockquote>
          <div className="quote-bar" />
          <cite className="quote-author">— Albert Einstein</cite>
        </div>
      </section>
    </div>
  );
}
