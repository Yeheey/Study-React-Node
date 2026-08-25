import { useEffect, useState } from 'react'
import { Alert, Card, Flex, Input, Select, Table } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { fetchMetaOptions, fetchTodayAttendance } from '../api'
import PageShell from '../components/PageShell'
import StatusTag from '../components/StatusTag'
import { statusFilterOptions } from '../constants/status'
import type { AttendanceRecord, AttendanceStatus } from '../types'

export default function Attendance() {
  const [keyword, setKeyword] = useState('')
  const [className, setClassName] = useState('')
  const [status, setStatus] = useState<AttendanceStatus | ''>('')
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
  }, [keyword, className, status])

  return (
    <PageShell
      title="今日打卡情况"
      description="按班级、状态筛选学生今日到勤明细。"
    >
      <Card size="small">
        <Flex wrap="wrap" gap={12} role="search">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索姓名 / 学号"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 240 }}
            aria-label="搜索姓名或学号"
          />
          <Select
            allowClear
            placeholder="全部班级"
            value={className || undefined}
            onChange={(value) => setClassName(value ?? '')}
            options={classOptions.map((item) => ({ value: item, label: item }))}
            style={{ width: 180 }}
            aria-label="筛选班级"
          />
          <Select
            allowClear
            placeholder="全部状态"
            value={status || undefined}
            onChange={(value) => setStatus(value ?? '')}
            options={statusFilterOptions}
            style={{ width: 160 }}
            aria-label="筛选状态"
          />
        </Flex>
      </Card>

      {error ? <Alert type="error" showIcon message="加载失败" description={error} /> : null}

      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        scroll={{ x: 880 }}
        locale={{ emptyText: '暂无匹配的打卡记录' }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        columns={[
          { title: '姓名', dataIndex: 'studentName' },
          { title: '学号', dataIndex: 'studentNo' },
          { title: '班级', dataIndex: 'className' },
          { title: '日期', dataIndex: 'date' },
          {
            title: '打卡时间',
            dataIndex: 'checkInTime',
            render: (value: string | null) => value ?? '—',
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value: AttendanceStatus) => <StatusTag status={value} />,
          },
          {
            title: '备注',
            dataIndex: 'remark',
            render: (value?: string) => value ?? '—',
          },
        ]}
      />
    </PageShell>
  )
}
