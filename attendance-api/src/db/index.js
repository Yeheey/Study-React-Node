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
    role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'student')),
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

  CREATE TABLE IF NOT EXISTS leave_requests (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('personal', 'sick')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TEXT NOT NULL,
    review_remark TEXT,
    reviewed_at TEXT,
    reviewed_by TEXT,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_leave_requests_username ON leave_requests(username);
  CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
`

/** @type {import('better-sqlite3').Database | null} */
let db = null

export function getDb() {
  if (!db) {
    throw new Error('数据库未初始化')
  }
  return db
}

function migrateUsersRole(database) {
  const row = database
    .prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'`)
    .get()
  if (!row?.sql) return
  if (row.sql.includes("'student'")) return

  database.pragma('foreign_keys = OFF')
  const migrate = database.transaction(() => {
    database.exec(`
      CREATE TABLE users_new (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'student')),
        display_name TEXT NOT NULL
      );
      INSERT INTO users_new (username, password, role, display_name)
      SELECT username, password, role, display_name FROM users;
      DROP TABLE users;
      ALTER TABLE users_new RENAME TO users;
    `)
  })
  migrate()
  database.pragma('foreign_keys = ON')
}

function migrateLeaveReviewColumns(database) {
  const columns = database.prepare(`PRAGMA table_info(leave_requests)`).all()
  const names = new Set(columns.map((col) => col.name))

  if (!names.has('review_remark')) {
    database.exec(`ALTER TABLE leave_requests ADD COLUMN review_remark TEXT`)
  }
  if (!names.has('reviewed_at')) {
    database.exec(`ALTER TABLE leave_requests ADD COLUMN reviewed_at TEXT`)
  }
  if (!names.has('reviewed_by')) {
    database.exec(`ALTER TABLE leave_requests ADD COLUMN reviewed_by TEXT`)
  }
}

function ensureUser(database, user) {
  const exists = database.prepare('SELECT 1 AS ok FROM users WHERE username = ?').get(user.username)
  if (exists) return

  database
    .prepare(
      `INSERT INTO users (username, password, role, display_name)
       VALUES (@username, @password, @role, @displayName)`,
    )
    .run(user)
}

function bootstrapUsers(database) {
  ensureUser(database, {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || '123456',
    role: 'admin',
    displayName: '管理员',
  })
  ensureUser(database, {
    username: process.env.USER_USERNAME || 'user1',
    password: process.env.USER_PASSWORD || '123456',
    role: 'user',
    displayName: '普通用户',
  })
  ensureUser(database, {
    username: process.env.STUDENT_USERNAME || 'student1',
    password: process.env.STUDENT_PASSWORD || '123456',
    role: 'student',
    displayName: '小小胖',
  })
}

function ensureDemoStudent(database) {
  const studentNo = process.env.STUDENT_USERNAME || 'student1'
  const name = '小小胖'
  const grade = '高三'
  const className = '高三（1）班'
  const existing = database.prepare('SELECT id FROM students WHERE student_no = ?').get(studentNo)

  if (existing) {
    database
      .prepare(
        `UPDATE students
         SET name = @name, grade = @grade, class_name = @className
         WHERE student_no = @studentNo`,
      )
      .run({ name, grade, className, studentNo })
  } else {
    database
      .prepare(
        `INSERT INTO students (id, name, student_no, class_name, grade, phone)
         VALUES (@id, @name, @studentNo, @className, @grade, '')`,
      )
      .run({
        id: crypto.randomUUID(),
        name,
        studentNo,
        className,
        grade,
      })
  }

  database
    .prepare(`UPDATE users SET display_name = ? WHERE username = ?`)
    .run(name, studentNo)
}

export function initDb() {
  if (db) return db

  fs.mkdirSync(dataDir, { recursive: true })
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  migrateUsersRole(db)
  migrateLeaveReviewColumns(db)
  bootstrapUsers(db)
  ensureDemoStudent(db)
  return db
}

export function isUniqueError(err) {
  const code = String(err?.code ?? '')
  return code.startsWith('SQLITE_CONSTRAINT')
}
