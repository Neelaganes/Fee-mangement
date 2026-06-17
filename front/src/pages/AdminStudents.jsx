import { useState, useEffect } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../services/api';
import { Pencil, Trash2, Plus, Filter, ChevronDown, AlertCircle } from 'lucide-react';
import './TeacherDashboard.css'; // Reusing shared dashboard styles

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedClass, setSelectedClass] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ name: '', class: '', totalFee: 5000, paidFee: 0 });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getStudents();
      setStudents(res.data);
    } catch (err) {
      setError('Failed to fetch student data.');
    } finally {
      setLoading(false);
    }
  };

  const classes = ['All', ...Array.from(new Set(students.map(s => s.class)))];
  const filteredStudents = selectedClass === 'All' ? students : students.filter(s => s.class === selectedClass);

  const handleOpenModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({ 
        name: student.name, 
        class: student.class, 
        totalFee: student.totalFee, 
        paidFee: student.paidFee 
      });
    } else {
      setEditingStudent(null);
      setFormData({ name: '', class: '', totalFee: 5000, paidFee: 0 });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, formData);
      } else {
        await createStudent(formData);
      }
      handleCloseModal();
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save student.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this student? This action cannot be undone.')) return;
    try {
      await deleteStudent(id);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete student.');
    }
  };

  return (
    <div className="dashboard-page animate-fadeIn">
      <div className="dashboard-container">
        
        {/* Header & Actions */}
        <div className="dashboard-header-card">
          <div>
            <h1 className="page-title">Student Profiles</h1>
            <p className="page-subtitle">Manage enrollment and universal fee parameters.</p>
          </div>
          <div className="filter-wrapper">
            <div className="filter-select-container">
              <Filter size={16} className="filter-icon" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="filter-select"
              >
                {classes.map(cls => (
                  <option key={cls} value={cls}>{cls === 'All' ? 'All Classes' : `Class ${cls}`}</option>
                ))}
              </select>
              <ChevronDown size={16} className="filter-arrow" />
            </div>
            <button onClick={() => handleOpenModal()} className="btn-primary">
              <Plus size={18} /> New Student
            </button>
          </div>
        </div>

        {error && !showModal && (
          <div className="alert-error animate-fadeIn">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Data Table */}
        <div className="table-card">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading student profiles...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Class</th>
                    <th className="text-right">Total Fee</th>
                    <th className="text-right">Paid</th>
                    <th className="text-right">Balance</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                     <tr>
                       <td colSpan="7">
                         <div className="empty-state">
                            <Filter size={32} className="empty-icon" />
                            <p>No enrollment records found for this view.</p>
                         </div>
                       </td>
                     </tr>
                  ) : (
                    filteredStudents.map((s) => (
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
                        <td>
                           <span className="badge badge-outline">{s.class}</span>
                        </td>
                        <td className="text-right font-mono">${s.totalFee.toLocaleString()}</td>
                        <td className="text-right font-mono text-success">${s.paidFee.toLocaleString()}</td>
                        <td className="text-right font-mono font-medium">
                           {s.pendingFee > 0 ? (
                              <span className="text-danger">${s.pendingFee.toLocaleString()}</span>
                           ) : (
                              <span className="text-success">Cleared</span>
                           )}
                        </td>
                        <td className="text-right">
                          <div className="action-buttons">
                            <button onClick={() => handleOpenModal(s)} className="btn-icon" title="Edit Profile">
                              <Pencil size={18} />
                            </button>
                            <button onClick={() => handleDelete(s.id)} className="btn-icon danger" title="Delete Ledger">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Overlay */}
        {showModal && (
          <div className="modal-overlay animate-fadeIn">
            <div className="modal-content animate-scaleIn">
              <div className="modal-header">
                <h2>{editingStudent ? 'Update Academic Profile' : 'Register New Student'}</h2>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && (
                    <div className="alert-error">
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Full Name</label>
                    <div className="input-wrapper">
                      <input 
                        type="text" required value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Jane Doe"
                        style={{ paddingLeft: '14px' }}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Class Cohort</label>
                    <div className="input-wrapper">
                      <input 
                        type="text" required value={formData.class}
                        onChange={e => setFormData({...formData, class: e.target.value})}
                        placeholder="e.g. 10A"
                        style={{ paddingLeft: '14px' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group">
                      <label>Total Assessment ($)</label>
                      <div className="input-wrapper">
                        <input 
                          type="number" required min="0" value={formData.totalFee}
                          onChange={e => setFormData({...formData, totalFee: Number(e.target.value)})}
                          className="font-mono"
                          style={{ paddingLeft: '14px' }}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Initial Payment ($)</label>
                      <div className="input-wrapper">
                        <input 
                          type="number" required min="0" value={formData.paidFee}
                          onChange={e => setFormData({...formData, paidFee: Number(e.target.value)})}
                          className="font-mono"
                          style={{ paddingLeft: '14px' }}
                          disabled={!!editingStudent}
                          title={editingStudent ? "Use the Payment Portal to record new payments" : ""}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={handleCloseModal} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingStudent ? 'Save Updates' : 'Confirm Registration'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
