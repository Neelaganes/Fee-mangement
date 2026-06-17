import { useState, useEffect } from 'react';
import { getStudents } from '../services/api';
import { BookOpen, Users, LayoutGrid, AlertCircle, Filter, ChevronDown } from 'lucide-react';
import './TeacherDashboard.css';

export default function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClass, setSelectedClass] = useState('10A');

  useEffect(() => {
    fetchStudents();
  }, [selectedClass]);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getStudents(selectedClass);
      setStudents(res.data);
    } catch (err) {
      setError('Failed to fetch class records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalCollected = students.reduce((sum, s) => sum + s.paidFee, 0);
  const totalPending = students.reduce((sum, s) => sum + s.pendingFee, 0);

  return (
    <div className="dashboard-page animate-fadeIn">
      <div className="dashboard-container">
        
        {/* Header & Filter */}
        <div className="dashboard-header-card">
          <div>
            <h1 className="page-title">Class Financial Overview</h1>
            <p className="page-subtitle">Read-only fee records for assigned classes.</p>
          </div>
          <div className="filter-wrapper">
            <div className="filter-select-container">
              <Filter size={16} className="filter-icon" />
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="filter-select"
              >
                <option value="10A">Cohort 10A</option>
                <option value="10B">Cohort 10B</option>
                <option value="11A">Cohort 11A</option>
              </select>
              <ChevronDown size={16} className="filter-arrow" />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon blue">
              <Users size={24} />
            </div>
            <div className="summary-content">
              <div className="summary-label">Enrolled Students</div>
              <div className="summary-value">{students.length}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon emerald">
              <BookOpen size={24} />
            </div>
            <div className="summary-content">
              <div className="summary-label">Collected Revenue</div>
              <div className="summary-value font-mono">${totalCollected.toLocaleString()}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon red">
              <LayoutGrid size={24} />
            </div>
            <div className="summary-content">
              <div className="summary-label">Outstanding Dues</div>
              <div className="summary-value font-mono">${totalPending.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-card">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading ledger records...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Student Name</th>
                    <th className="text-right">Total Assessed</th>
                    <th className="text-right">Paid Amount</th>
                    <th className="text-right">Arrears</th>
                    <th className="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <div className="empty-state">
                          <Filter size={32} className="empty-icon" />
                          <p>No enrollment records found for this cohort.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    students.map((s) => (
                      <tr key={s.id}>
                        <td className="text-muted font-mono">#{s.id}</td>
                        <td className="font-medium">
                          <div className="student-name-cell">
                            <div className="avatar">
                              {s.name.substring(0, 2).toUpperCase()}
                            </div>
                            {s.name}
                          </div>
                        </td>
                        <td className="text-right font-mono">${s.totalFee.toLocaleString()}</td>
                        <td className="text-right font-mono text-success">${s.paidFee.toLocaleString()}</td>
                        <td className="text-right font-mono text-danger font-medium">${s.pendingFee.toLocaleString()}</td>
                        <td className="text-right">
                          {s.pendingFee <= 0 ? (
                            <span className="badge badge-success">Clear</span>
                          ) : (
                            <span className="badge badge-danger">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
