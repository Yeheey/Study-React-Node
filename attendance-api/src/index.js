import cors from 'cors'
import express from 'express'
import { initDb } from './db/index.js'
import { ensureStudentLogins } from './db/users.js'
import { requireAdmin, requireAuth, requireStudent } from './middleware/auth.js'
import attendanceRouter from './routes/attendance.js'
import authRouter from './routes/auth.js'
import leaveRouter from './routes/leave.js'
import leaveAdminRouter from './routes/leaveAdmin.js'
import studentsRouter from './routes/students.js'

initDb()
ensureStudentLogins()

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors({ origin: true }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      service: 'attendance-api',
      time: new Date().toISOString(),
    },
  })
})

app.use('/api/auth', authRouter)
app.use('/api/students', requireAuth, requireAdmin, studentsRouter)
app.use('/api/leave-requests', requireAuth, requireStudent, leaveRouter)
app.use('/api/admin/leave-requests', requireAuth, requireAdmin, leaveAdminRouter)
app.use('/api', attendanceRouter)

app.use((err, _req, res, _next) => {
  if (err?.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE' ? '文件过大，最大 2MB' : '文件上传失败'
    return res.status(400).json({ code: 1, message, data: null })
  }

  if (err?.status) {
    return res.status(err.status).json({ code: 1, message: err.message, data: null })
  }

  console.error(err)
  res.status(500).json({ code: 500, message: err.message || '服务器错误', data: null })
})

app.listen(PORT, () => {
  console.log(`attendance-api running at http://localhost:${PORT}`)
  console.log(`health check: http://localhost:${PORT}/api/health`)
})
