import { useEffect, useState } from 'react'
import { fetchAttendanceRecords, fetchMetaOptions } from '../api'
import StatusBadge from '../components/StatusBadge'
import type { AttendanceRecord, AttendanceStatus } from '../types'
import './Records.css'

export default function Records() {
  const [date, setDate] = useState('')
  const [status, setStatus] = useState<'' | AttendanceStatus>('')
  const [dates, setDates] = useState<string[]>([])
  const [list, setList] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadMeta() {
      try {
        const meta = await fetchMetaOptions()
        if (!cancelled) setDates(meta.dates)
      } catch {
        // ignore
      }
    }

    void loadMeta()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchAttendanceRecords({ date, status })
        if (!cancelled) setList(data.list)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载失败')
          setList([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [date, status])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>考勤记录</h1>
          <p className="page-desc">按日期与状态查阅历史打卡明细。</p>
        </div>
        <p className="count-chip">共 {list.length} 条</p>
      </div>

      <div className="filters" role="search">
        <select value={date} onChange={(e) => setDate(e.target.value)} aria-label="筛选日期">
          <option value="">全部日期</option>
          {dates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as '' | AttendanceStatus)}
          aria-label="筛选状态"
        >
          <option value="">全部状态</option>
          <option value="present">已到</option>
          <option value="late">迟到</option>
          <option value="absent">缺勤</option>
          <option value="leave">请假</option>
        </select>
      </div>

      {error ? <p className="page-state error">加载失败：{error}</p> : null}

      <div className="panel table-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>姓名</th>
                <th>学号</th>
                <th>班级</th>
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
                    暂无匹配记录
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td>{row.studentName}</td>
                    <td>{row.studentNo}</td>
                    <td>{row.className}</td>
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
