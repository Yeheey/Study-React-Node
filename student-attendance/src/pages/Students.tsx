import { useEffect, useState } from 'react'
import { fetchMetaOptions, fetchStudents } from '../api'
import type { Student } from '../types'
import './Students.css'

export default function Students() {
  const [keyword, setKeyword] = useState('')
  const [grade, setGrade] = useState('')
  const [grades, setGrades] = useState<string[]>([])
  const [list, setList] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadMeta() {
      try {
        const meta = await fetchMetaOptions()
        if (!cancelled) setGrades(meta.grades)
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
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchStudents({ keyword, grade })
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
  }, [keyword, grade])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>学生管理</h1>
          <p className="page-desc">查看在册学生基本信息，支持按年级检索。</p>
        </div>
        <p className="count-chip">共 {list.length} 人</p>
      </div>

      <div className="filters" role="search">
        <input
          type="search"
          placeholder="搜索姓名 / 学号 / 班级"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          aria-label="搜索学生"
        />
        <select value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="筛选年级">
          <option value="">全部年级</option>
          {grades.map((g) => (
            <option key={g} value={g}>
              {g}
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
                <th>年级</th>
                <th>班级</th>
                <th>联系电话</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="empty">
                    加载中…
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty">
                    暂无匹配学生
                  </td>
                </tr>
              ) : (
                list.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.studentNo}</td>
                    <td>{s.grade}</td>
                    <td>{s.className}</td>
                    <td>{s.phone}</td>
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
