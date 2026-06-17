import { useState, useEffect } from 'react';
import { getStudents, getPayments, recordPayment } from '../services/api';
import { Search, DollarSign, History, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import './AdminPayPortal.css';
import './TeacherDashboard.css'; // Reusing some shared dashboard styles

export default function AdminPayPortal() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchPaymentHistory(selectedStudent.id);
    } else {
      setPaymentHistory([]);
    }
  }, [selectedStudent]);

  const fetchStudents = async () => {
    try {
      const res = await getStudents();
      setStudents(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async (studentId) => {
    try {
      const res = await getPayments(studentId);
      setPaymentHistory(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!selectedStudent || typeof amount !== 'number' || amount <= 0) return;

    try {
      const res = await recordPayment(selectedStudent.id, amount);
      
      setMessage({ type: 'success', text: `Successfully recorded payment of $${amount} for ${selectedStudent.name}.` });
      setAmount('');
      setSelectedStudent(res.data.student);
      fetchPaymentHistory(res.data.student.id);
      fetchStudents();
      
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Payment failed.' });
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.id.toString() === search
  );

  return (
    <div className="dashboard-page animate-fadeIn">
      <div className="dashboard-container">
        <div className="dashboard-header-simple">
          <h1 className="page-title">Fee Payment Portal</h1>
          <p className="page-subtitle">Record incoming student fee payments and view transaction histories.</p>
        </div>

        <div className="portal-grid">
          {/* ─── Search & Select Section ─── */}
          <div className="portal-sidebar">
            <div className="portal-panel">
              <div className="panel-header">
                <h2>1. Select Student</h2>
              </div>
              <div className="search-bar">
                <Search className="search-icon" size={18} />
                <input 
                  type="text" 
                  placeholder="Search name or ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              
              <div className="student-list">
                {loading ? (
                  <div className="list-loading">
                    <div className="spinner-small" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }}></div>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="list-empty">No students found</div>
                ) : (
                  filteredStudents.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStudent(s)}
                      className={`student-item ${selectedStudent?.id === s.id ? 'active' : ''}`}
                    >
                      <div className="student-item-name">{s.name}</div>
                      <div className="student-item-meta">
                         <span>ID: #{s.id} &bull; Class: {s.class}</span>
                         {s.pendingFee > 0 ? (
                            <span className="text-danger font-medium">Pending: ${s.pendingFee}</span>
                         ) : (
                            <span className="text-success font-medium">Clear</span>
                         )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ─── Action Panel ─── */}
          <div className="portal-main">
            
            {/* Payment Section */}
            <div className="portal-panel">
               <div className="panel-header">
                 <h2>2. Record Payment</h2>
               </div>
               
               <div className="panel-body">
                  {selectedStudent ? (
                    <div className="payment-flow animate-fadeIn">
                      <div className="student-summary">
                        <div>
                          <div className="summary-label">Accounting Profile</div>
                          <div className="summary-name">{selectedStudent.name}</div>
                          <div className="summary-meta">Class {selectedStudent.class} &bull; Student ID #{selectedStudent.id}</div>
                        </div>
                        <div className="summary-balance">
                          <div className="summary-label">Outstanding Balance</div>
                          <div className="balance-amount font-mono">
                             ${selectedStudent.pendingFee}
                          </div>
                        </div>
                      </div>

                      {message && (
                        <div className={`alert-message animate-scaleIn ${message.type}`}>
                          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                          {message.text}
                        </div>
                      )}

                      <form onSubmit={handlePay} className="payment-form">
                        <div className="form-group">
                          <label>Payment Amount (USD)</label>
                          <div className="amount-input-wrapper">
                            <DollarSign className="amount-icon" size={24} />
                            <input 
                              type="number"
                              required min="1" max={selectedStudent.pendingFee}
                              value={amount}
                              onChange={e => setAmount(Number(e.target.value))}
                              className="amount-input font-mono"
                              placeholder="0.00"
                              disabled={selectedStudent.pendingFee <= 0}
                            />
                          </div>
                        </div>
                        <button 
                          type="submit"
                          disabled={typeof amount !== 'number' || amount <= 0 || amount > selectedStudent.pendingFee || selectedStudent.pendingFee <= 0}
                          className="btn-pay"
                        >
                          {selectedStudent.pendingFee <= 0 ? "Account Cleared" : "Process Payment"}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="empty-selection animate-fadeIn">
                      <History size={48} className="empty-icon-large" />
                      <p>Select a student to view details and record payments</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Payment History */}
            {selectedStudent && (
               <div className="portal-panel animate-fadeInUp">
                  <div className="panel-header with-icon">
                     <History size={18} className="text-muted" />
                     <h2>Transaction History</h2>
                  </div>
                  
                  <div className="table-responsive">
                     {paymentHistory.length === 0 ? (
                        <div className="list-empty">
                           No payment records found for this student.
                        </div>
                     ) : (
                        <table className="data-table">
                           <thead>
                              <tr>
                                 <th>Transaction ID</th>
                                 <th>Date & Time</th>
                                 <th className="text-right">Amount Applied</th>
                              </tr>
                           </thead>
                           <tbody>
                              {paymentHistory.map(record => (
                                 <tr key={record.id}>
                                    <td className="font-mono text-muted">TXN-{record.id.toString().padStart(5, '0')}</td>
                                    <td className="history-date">
                                       <Calendar size={14} className="text-muted" />
                                       {new Date(record.date).toLocaleString(undefined, {
                                          dateStyle: 'medium',
                                          timeStyle: 'short'
                                       })}
                                    </td>
                                    <td className="text-right text-success font-medium font-mono">
                                       +${record.amount.toFixed(2)}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     )}
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
