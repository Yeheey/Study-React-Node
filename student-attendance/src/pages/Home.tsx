import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDashboardStats, fetchTodayAttendance } from '../api'
import StatusBadge from '../components/StatusBadge'
import type { AttendanceRecord, DashboardStats } from '../types'
import './Home.css'

const emptyStats: DashboardStats = {
  totalStudents: 0,
  presentToday: 0,
  lateToday: 0,
  absentToday: 0,
  leaveToday: 0,
  attendanceRate: 0,
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats)
  const [recent, setRecent] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [statsData, todayData] = await Promise.all([
          fetchDashboardStats(),
          fetchTodayAttendance(),
        ])
        if (cancelled) return
        setStats(statsData)
        setRecent(todayData.list.slice(0, 6))
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <p className="page-state">正在加载首页数据…</p>
  }

  if (error) {
    return <p className="page-state error">加载失败：{error}（请确认后端 attendance-api 已启动）</p>
  }

  return (
    <div className="home">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">今日概览</p>
          <h1>守课 · 打卡考勤</h1>
          <p className="lead">掌握全校到勤情况，快速定位迟到、缺勤与请假学生。</p>
          <div className="hero-actions">
            <Link className="btn primary" to="/attendance">
              查看今日打卡
            </Link>
            <Link className="btn ghost" to="/records">
              历史记录
            </Link>
          </div>
        </div>
        <div className="rate-block" aria-label="今日出勤率">
          <p className="rate-label">今日出勤率</p>
          <p className="rate-value">{stats.attendanceRate}%</p>
          <p className="rate-hint">已到 + 迟到 / 在册学生</p>
        </div>
      </section>

      <section className="stats-row" aria-label="关键指标">
        <article className="stat">
          <p className="stat-label">在册学生</p>
          <p className="stat-value">{stats.totalStudents}</p>
        </article>
        <article className="stat">
          <p className="stat-label">已到</p>
          <p className="stat-value present">{stats.presentToday}</p>
        </article>
        <article className="stat">
          <p className="stat-label">迟到</p>
          <p className="stat-value late">{stats.lateToday}</p>
        </article>
        <article className="stat">
          <p className="stat-label">缺勤</p>
          <p className="stat-value absent">{stats.absentToday}</p>
        </article>
        <article className="stat">
          <p className="stat-label">请假</p>
          <p className="stat-value leave">{stats.leaveToday}</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>今日最新打卡</h2>
          <Link to="/attendance" className="text-link">
            全部记录 →
          </Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>学号</th>
                <th>班级</th>
                <th>打卡时间</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty">
                    暂无打卡数据
                  </td>
                </tr>
              ) : (
                recent.map((row) => (
                  <tr key={row.id}>
                    <td>{row.studentName}</td>
                    <td>{row.studentNo}</td>
                    <td>{row.className}</td>
                    <td>{row.checkInTime ?? '—'}</td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
