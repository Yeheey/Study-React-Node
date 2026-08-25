import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, '../../data')
const dbPath = process.env.DB_PATH || path.join(dataDir, 'attendance.db')

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    display_name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    student_no TEXT NOT NULL UNIQUE,
    class_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    date TEXT NOT NULL,
    check_in_time TEXT,
    status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent', 'leave')),
    remark TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE (student_id, date)
  );

  CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
  CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
  CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance_records(student_id, date);
`

/** @type {import('better-sqlite3').Database | null} */
let db = null

export function getDb() {
  if (!db) {
    throw new Error('数据库未初始化')
  }
  return db
}

function bootstrapUsers(database) {
  const count = database.prepare('SELECT COUNT(*) AS total FROM users').get()
  if (count.total > 0) return

  const insert = database.prepare(`
    INSERT INTO users (username, password, role, display_name)
    VALUES (@username, @password, @role, @displayName)
  `)

  insert.run({
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || '123456',
    role: 'admin',
    displayName: '管理员',
  })
  insert.run({
    username: process.env.USER_USERNAME || 'user1',
    password: process.env.USER_PASSWORD || '123456',
    role: 'user',
    displayName: '普通用户',
  })
}

export function initDb() {
  if (db) return db

  fs.mkdirSync(dataDir, { recursive: true })
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  bootstrapUsers(db)
  return db
}

export function isUniqueError(err) {
  const code = String(err?.code ?? '')
  return code.startsWith('SQLITE_CONSTRAINT')
}
