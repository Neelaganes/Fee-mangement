const express = require('express');
const oracledb = require('oracledb');
const { getConnection } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// ═══════════════════════════════════════════
// In-memory fallback data (when DB is unavailable)
// ═══════════════════════════════════════════
let fallbackStudents = [
  { id: 1, name: 'Alice Johnson', class: '10A', totalFee: 5000, paidFee: 2000, pendingFee: 3000 },
  { id: 2, name: 'Bob Smith', class: '10A', totalFee: 5000, paidFee: 5000, pendingFee: 0 },
  { id: 3, name: 'Charlie Brown', class: '10B', totalFee: 5000, paidFee: 1000, pendingFee: 4000 },
  { id: 4, name: 'Diana Prince', class: '10B', totalFee: 6000, paidFee: 3000, pendingFee: 3000 },
  { id: 5, name: 'Ethan Hunt', class: '11A', totalFee: 7000, paidFee: 7000, pendingFee: 0 },
  { id: 6, name: 'Fiona Gallagher', class: '11A', totalFee: 7000, paidFee: 2000, pendingFee: 5000 },
];
let nextFallbackId = 7;

// Helper: map Oracle row to frontend shape
function mapStudent(row) {
  return {
    id: row.ID,
    name: row.NAME,
    class: row.CLASS,
    totalFee: row.TOTAL_FEE,
    paidFee: row.PAID_FEE,
    pendingFee: row.PENDING_FEE
  };
}

// GET /api/students — List all students (optional ?className filter)
router.get('/', async (req, res) => {
  const { className } = req.query;
  let connection;

  try {
    connection = await getConnection();

    if (connection) {
      let sql = `SELECT id, name, class, total_fee, paid_fee, pending_fee FROM students`;
      const binds = [];

      if (className) {
        sql += ` WHERE class = :1`;
        binds.push(className);
      }

      sql += ` ORDER BY id`;

      const result = await connection.execute(sql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });

      return res.json(result.rows.map(mapStudent));
    } else {
      // Fallback
      let result = fallbackStudents;
      if (className) {
        result = result.filter(s => s.class === className);
      }
      return res.json(result);
    }
  } catch (err) {
    console.error('GET /students error:', err);
    return res.status(500).json({ error: 'Failed to fetch students' });
  } finally {
    if (connection) await connection.close();
  }
});

// POST /api/students — Create a new student
router.post('/', authenticateToken, async (req, res) => {
  const { name, class: className, totalFee, paidFee } = req.body;

  if (!name || !className) {
    return res.status(400).json({ error: 'Name and class are required' });
  }

  let connection;
  try {
    connection = await getConnection();

    if (connection) {
      const result = await connection.execute(
        `INSERT INTO students (name, class, total_fee, paid_fee)
         VALUES (:name, :className, :totalFee, :paidFee)
         RETURNING id INTO :id`,
        {
          name,
          className,
          totalFee: totalFee || 0,
          paidFee: paidFee || 0,
          id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        },
        { autoCommit: true }
      );

      const newId = result.outBinds.id[0];

      // Fetch the created student
      const fetched = await connection.execute(
        `SELECT id, name, class, total_fee, paid_fee, pending_fee FROM students WHERE id = :1`,
        [newId],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      return res.status(201).json(mapStudent(fetched.rows[0]));
    } else {
      // Fallback
      const newStudent = {
        id: nextFallbackId++,
        name,
        class: className,
        totalFee: totalFee || 0,
        paidFee: paidFee || 0,
        pendingFee: (totalFee || 0) - (paidFee || 0)
      };
      fallbackStudents.push(newStudent);
      return res.status(201).json(newStudent);
    }
  } catch (err) {
    console.error('POST /students error:', err);
    return res.status(500).json({ error: 'Failed to create student' });
  } finally {
    if (connection) await connection.close();
  }
});

// PUT /api/students/:id — Update a student
router.put('/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, class: className, totalFee, paidFee } = req.body;

  let connection;
  try {
    connection = await getConnection();

    if (connection) {
      // Build dynamic UPDATE
      const sets = [];
      const binds = {};

      if (name !== undefined) { sets.push('name = :name'); binds.name = name; }
      if (className !== undefined) { sets.push('class = :className'); binds.className = className; }
      if (totalFee !== undefined) { sets.push('total_fee = :totalFee'); binds.totalFee = totalFee; }
      if (paidFee !== undefined) { sets.push('paid_fee = :paidFee'); binds.paidFee = paidFee; }

      if (sets.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      binds.id = id;
      const sql = `UPDATE students SET ${sets.join(', ')} WHERE id = :id`;

      const result = await connection.execute(sql, binds, { autoCommit: true });

      if (result.rowsAffected === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Fetch updated student
      const fetched = await connection.execute(
        `SELECT id, name, class, total_fee, paid_fee, pending_fee FROM students WHERE id = :1`,
        [id],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      return res.json(mapStudent(fetched.rows[0]));
    } else {
      // Fallback
      const index = fallbackStudents.findIndex(s => s.id === id);
      if (index === -1) return res.status(404).json({ error: 'Student not found' });

      const updated = { ...fallbackStudents[index] };
      if (name !== undefined) updated.name = name;
      if (className !== undefined) updated.class = className;
      if (totalFee !== undefined) updated.totalFee = totalFee;
      if (paidFee !== undefined) updated.paidFee = paidFee;
      updated.pendingFee = updated.totalFee - updated.paidFee;

      fallbackStudents[index] = updated;
      return res.json(updated);
    }
  } catch (err) {
    console.error('PUT /students error:', err);
    return res.status(500).json({ error: 'Failed to update student' });
  } finally {
    if (connection) await connection.close();
  }
});

// DELETE /api/students/:id — Delete a student
router.delete('/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);

  let connection;
  try {
    connection = await getConnection();

    if (connection) {
      const result = await connection.execute(
        `DELETE FROM students WHERE id = :1`,
        [id],
        { autoCommit: true }
      );

      if (result.rowsAffected === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      return res.json({ success: true, message: 'Student deleted successfully' });
    } else {
      // Fallback
      const initialLength = fallbackStudents.length;
      fallbackStudents = fallbackStudents.filter(s => s.id !== id);
      if (fallbackStudents.length === initialLength) {
        return res.status(404).json({ error: 'Student not found' });
      }
      return res.json({ success: true, message: 'Student deleted successfully' });
    }
  } catch (err) {
    console.error('DELETE /students error:', err);
    return res.status(500).json({ error: 'Failed to delete student' });
  } finally {
    if (connection) await connection.close();
  }
});

module.exports = router;
