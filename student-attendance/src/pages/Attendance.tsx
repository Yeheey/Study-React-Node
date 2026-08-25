import { useEffect, useState } from 'react'
import { fetchMetaOptions, fetchTodayAttendance } from '../api'
import StatusBadge from '../components/StatusBadge'
import type { AttendanceRecord, AttendanceStatus } from '../types'
import './Attendance.css'

const STATUS_OPTIONS: Array<{ value: '' | AttendanceStatus; label: string }> = [
  { value: '', label: '全部状态' },
  { value: 'present', label: '已到' },
  { value: 'late', label: '迟到' },
  { value: 'absent', label: '缺勤' },
  { value: 'leave', label: '请假' },
]

export default function Attendance() {
  const [keyword, setKeyword] = useState('')
  const [className, setClassName] = useState('')
  const [status, setStatus] = useState<'' | AttendanceStatus>('')
  const [classOptions, setClassOptions] = useState<string[]>([])
  const [list, setList] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadMeta() {
      try {
        const meta = await fetchMetaOptions()
        if (!cancelled) setClassOptions(meta.classes)
      } catch {
        // 选项失败不阻断主列表
      }
    }

    void loadMeta()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchTodayAttendance({
          keyword,
          className,
          status,
        })
        if (!cancelled) setList(data.list)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载失败')
          setList([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 200)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [keyword, className, status])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>今日打卡情况</h1>
          <p className="page-desc">按班级、状态筛选学生今日到勤明细。</p>
        </div>
        <p className="count-chip">共 {list.length} 条</p>
      </div>

      <div className="filters" role="search">
        <input
          type="search"
          placeholder="搜索姓名 / 学号"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          aria-label="搜索姓名或学号"
        />
        <select
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          aria-label="筛选班级"
        >
          <option value="">全部班级</option>
          {classOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as '' | AttendanceStatus)}
          aria-label="筛选状态"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="page-state error">加载失败：{error}</p> : null}

      <div className="panel table-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>学号</th>
                <th>班级</th>
                <th>日期</th>
                <th>打卡时间</th>
                <th>状态</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="empty">
                    加载中…
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty">
                    暂无匹配的打卡记录
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.id}>
                    <td>{row.studentName}</td>
                    <td>{row.studentNo}</td>
                    <td>{row.className}</td>
                    <td>{row.date}</td>
                    <td>{row.checkInTime ?? '—'}</td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td>{row.remark ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
