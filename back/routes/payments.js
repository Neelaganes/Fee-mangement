const express = require('express');
const oracledb = require('oracledb');
const { getConnection } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

let fallbackPayments = [
  { id: 1, studentId: 1, amount: 2000, date: '2026-06-01T10:00:00Z' },
  { id: 2, studentId: 2, amount: 5000, date: '2026-06-02T11:30:00Z' },
  { id: 3, studentId: 3, amount: 1000, date: '2026-06-05T09:15:00Z' },
  { id: 4, studentId: 4, amount: 3000, date: '2026-06-07T14:00:00Z' },
  { id: 5, studentId: 5, amount: 7000, date: '2026-06-08T08:45:00Z' },
  { id: 6, studentId: 6, amount: 2000, date: '2026-06-10T16:30:00Z' },
];
let nextPaymentId = 7;

// GET /api/payments/:studentId
router.get('/:studentId', async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  let connection;
  try {
    connection = await getConnection();
    if (connection) {
      const result = await connection.execute(
        `SELECT id, student_id, amount, payment_date FROM payments WHERE student_id = :1 ORDER BY payment_date DESC`,
        [studentId],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const payments = result.rows.map(row => ({
        id: row.ID, studentId: row.STUDENT_ID, amount: row.AMOUNT,
        date: row.PAYMENT_DATE ? row.PAYMENT_DATE.toISOString() : null
      }));
      return res.json(payments);
    } else {
      const payments = fallbackPayments.filter(p => p.studentId === studentId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.json(payments);
    }
  } catch (err) {
    console.error('GET /payments error:', err);
    return res.status(500).json({ error: 'Failed to fetch payments' });
  } finally {
    if (connection) await connection.close();
  }
});

// POST /api/payments
router.post('/', authenticateToken, async (req, res) => {
  const { studentId, amount } = req.body;
  const parsedAmount = parseFloat(amount);
  const parsedStudentId = parseInt(studentId);

  if (!parsedStudentId || isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Valid studentId and amount are required' });
  }

  let connection;
  try {
    connection = await getConnection();
    if (connection) {
      const studentResult = await connection.execute(
        `SELECT id, name, class, total_fee, paid_fee, pending_fee FROM students WHERE id = :1`,
        [parsedStudentId], { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      if (studentResult.rows.length === 0) return res.status(404).json({ error: 'Student not found' });

      const payResult = await connection.execute(
        `INSERT INTO payments (student_id, amount) VALUES (:sid, :amt) RETURNING id INTO :id`,
        { sid: parsedStudentId, amt: parsedAmount, id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }
      );
      await connection.execute(
        `UPDATE students SET paid_fee = paid_fee + :amt WHERE id = :id`,
        { amt: parsedAmount, id: parsedStudentId }
      );
      await connection.commit();

      const updatedResult = await connection.execute(
        `SELECT id, name, class, total_fee, paid_fee, pending_fee FROM students WHERE id = :1`,
        [parsedStudentId], { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const u = updatedResult.rows[0];
      return res.status(201).json({
        payment: { id: payResult.outBinds.id[0], studentId: parsedStudentId, amount: parsedAmount, date: new Date().toISOString() },
        student: { id: u.ID, name: u.NAME, class: u.CLASS, totalFee: u.TOTAL_FEE, paidFee: u.PAID_FEE, pendingFee: u.PENDING_FEE }
      });
    } else {
      const newPayment = { id: nextPaymentId++, studentId: parsedStudentId, amount: parsedAmount, date: new Date().toISOString() };
      fallbackPayments.push(newPayment);
      return res.status(201).json({ payment: newPayment, student: { id: parsedStudentId } });
    }
  } catch (err) {
    console.error('POST /payments error:', err);
    return res.status(500).json({ error: 'Failed to record payment' });
  } finally {
    if (connection) await connection.close();
  }
});

module.exports = router;
