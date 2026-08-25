import { useEffect, useState } from 'react'
import { Alert, Card, Flex, Input, Select, Table } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { fetchMetaOptions, fetchStudents } from '../api'
import PageShell from '../components/PageShell'
import type { Student } from '../types'

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
        if (cancelled) return
        setError(err instanceof Error ? err.message : '加载失败')
        setList([])
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
    <PageShell
      title="学生管理"
      description="查看在册学生基本信息，支持按年级检索。"
    >
      <Card size="small">
        <Flex wrap="wrap" gap={12} role="search">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索姓名 / 学号 / 班级"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 260 }}
            aria-label="搜索学生"
          />
          <Select
            allowClear
            placeholder="全部年级"
            value={grade || undefined}
            onChange={(value) => setGrade(value ?? '')}
            options={grades.map((item) => ({ value: item, label: item }))}
            style={{ width: 180 }}
            aria-label="筛选年级"
          />
        </Flex>
      </Card>

      {error ? <Alert type="error" showIcon message="加载失败" description={error} /> : null}

      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        scroll={{ x: 720 }}
        locale={{ emptyText: '暂无匹配学生' }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 人`,
        }}
        columns={[
          { title: '姓名', dataIndex: 'name' },
          { title: '学号', dataIndex: 'studentNo' },
          { title: '年级', dataIndex: 'grade' },
          { title: '班级', dataIndex: 'className' },
          { title: '联系电话', dataIndex: 'phone' },
        ]}
      />
    </PageShell>
  )
}
