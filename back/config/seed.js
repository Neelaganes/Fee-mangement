/*
 * Oracle Live SQL - Database Schema & Seed Data
 * Run this file to create tables and insert initial data
 * Usage: node config/seed.js
 */

const oracledb = require('oracledb');
require('dotenv').config();

const SQL_STATEMENTS = [
  // ──────────────────────────────────────────────
  // DROP existing tables (in reverse dependency order)
  // ──────────────────────────────────────────────
  `BEGIN
     EXECUTE IMMEDIATE 'DROP TABLE payments CASCADE CONSTRAINTS';
   EXCEPTION
     WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
   END;`,

  `BEGIN
     EXECUTE IMMEDIATE 'DROP TABLE students CASCADE CONSTRAINTS';
   EXCEPTION
     WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
   END;`,

  `BEGIN
     EXECUTE IMMEDIATE 'DROP TABLE users CASCADE CONSTRAINTS';
   EXCEPTION
     WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
   END;`,

  `BEGIN
     EXECUTE IMMEDIATE 'DROP SEQUENCE students_seq';
   EXCEPTION
     WHEN OTHERS THEN IF SQLCODE != -2289 THEN RAISE; END IF;
   END;`,

  `BEGIN
     EXECUTE IMMEDIATE 'DROP SEQUENCE payments_seq';
   EXCEPTION
     WHEN OTHERS THEN IF SQLCODE != -2289 THEN RAISE; END IF;
   END;`,

  `BEGIN
     EXECUTE IMMEDIATE 'DROP SEQUENCE users_seq';
   EXCEPTION
     WHEN OTHERS THEN IF SQLCODE != -2289 THEN RAISE; END IF;
   END;`,

  // ──────────────────────────────────────────────
  // CREATE SEQUENCES (Oracle doesn't have AUTO_INCREMENT)
  // ──────────────────────────────────────────────
  `CREATE SEQUENCE users_seq START WITH 1 INCREMENT BY 1 NOCACHE`,
  `CREATE SEQUENCE students_seq START WITH 1 INCREMENT BY 1 NOCACHE`,
  `CREATE SEQUENCE payments_seq START WITH 1 INCREMENT BY 1 NOCACHE`,

  // ──────────────────────────────────────────────
  // CREATE TABLES
  // ──────────────────────────────────────────────
  `CREATE TABLE users (
     id          NUMBER DEFAULT users_seq.NEXTVAL PRIMARY KEY,
     username    VARCHAR2(100) NOT NULL UNIQUE,
     password    VARCHAR2(255) NOT NULL,
     full_name   VARCHAR2(200) NOT NULL,
     role        VARCHAR2(20) DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher')),
     created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   )`,

  `CREATE TABLE students (
     id          NUMBER DEFAULT students_seq.NEXTVAL PRIMARY KEY,
     name        VARCHAR2(200) NOT NULL,
     class       VARCHAR2(20) NOT NULL,
     total_fee   NUMBER(10,2) DEFAULT 0,
     paid_fee    NUMBER(10,2) DEFAULT 0,
     pending_fee NUMBER(10,2) GENERATED ALWAYS AS (total_fee - paid_fee) VIRTUAL,
     created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   )`,

  `CREATE TABLE payments (
     id          NUMBER DEFAULT payments_seq.NEXTVAL PRIMARY KEY,
     student_id  NUMBER NOT NULL,
     amount      NUMBER(10,2) NOT NULL CHECK (amount > 0),
     payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
   )`,
];

// Seed data (passwords will be hashed at insert time)
const SEED_USERS = [
  { username: 'admin', password: 'admin123', full_name: 'Administrator', role: 'admin' },
  { username: 'teacher', password: 'teacher123', full_name: 'Mr. Teacher', role: 'teacher' },
];

const SEED_STUDENTS = [
  { name: 'Alice Johnson', class: '10A', total_fee: 5000, paid_fee: 2000 },
  { name: 'Bob Smith', class: '10A', total_fee: 5000, paid_fee: 5000 },
  { name: 'Charlie Brown', class: '10B', total_fee: 5000, paid_fee: 1000 },
  { name: 'Diana Prince', class: '10B', total_fee: 6000, paid_fee: 3000 },
  { name: 'Ethan Hunt', class: '11A', total_fee: 7000, paid_fee: 7000 },
  { name: 'Fiona Gallagher', class: '11A', total_fee: 7000, paid_fee: 2000 },
];

const SEED_PAYMENTS = [
  { student_id: 1, amount: 2000 },
  { student_id: 2, amount: 5000 },
  { student_id: 3, amount: 1000 },
  { student_id: 4, amount: 3000 },
  { student_id: 5, amount: 7000 },
  { student_id: 6, amount: 2000 },
];

async function seed() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING,
    });

    console.log('🔗 Connected to Oracle Database');

    // Execute schema statements
    for (const sql of SQL_STATEMENTS) {
      try {
        await connection.execute(sql);
        console.log('✅ Executed SQL statement');
      } catch (err) {
        console.error('⚠️  SQL Error:', err.message);
      }
    }

    // Insert users with hashed passwords
    const bcrypt = require('bcryptjs');
    for (const user of SEED_USERS) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await connection.execute(
        `INSERT INTO users (username, password, full_name, role) VALUES (:1, :2, :3, :4)`,
        [user.username, hashedPassword, user.full_name, user.role]
      );
      console.log(`✅ Inserted user: ${user.username}`);
    }

    // Insert students
    for (const student of SEED_STUDENTS) {
      await connection.execute(
        `INSERT INTO students (name, class, total_fee, paid_fee) VALUES (:1, :2, :3, :4)`,
        [student.name, student.class, student.total_fee, student.paid_fee]
      );
      console.log(`✅ Inserted student: ${student.name}`);
    }

    // Insert payments
    for (const payment of SEED_PAYMENTS) {
      await connection.execute(
        `INSERT INTO payments (student_id, amount) VALUES (:1, :2)`,
        [payment.student_id, payment.amount]
      );
      console.log(`✅ Inserted payment for student ${payment.student_id}`);
    }

    await connection.commit();
    console.log('\n🎉 Database seeded successfully!');
  } catch (err) {
    console.error('❌ Seed Error:', err.message);
    console.log('\n📋 If you are using Oracle Live SQL, you can run these SQL statements manually:');
    console.log('─'.repeat(60));
    SQL_STATEMENTS.forEach(sql => console.log(sql + ';\n'));
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

seed();
