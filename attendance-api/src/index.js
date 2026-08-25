import cors from 'cors'
import express from 'express'
import attendanceRouter from './routes/attendance.js'
import studentsRouter from './routes/students.js'

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

app.use('/api/students', studentsRouter)
app.use('/api', attendanceRouter)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ code: 500, message: err.message || '服务器错误', data: null })
})

app.listen(PORT, () => {
  console.log(`attendance-api running at http://localhost:${PORT}`)
  console.log(`health check: http://localhost:${PORT}/api/health`)
})
