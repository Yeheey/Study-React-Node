import { useEffect, useState } from 'react'
import { Alert, Card, Flex, Select, Table, Tag } from 'antd'
import { fetchAttendanceRecords, fetchMetaOptions } from '../api'
import PageShell from '../components/PageShell'
import StatusTag from '../components/StatusTag'
import { statusFilterOptions } from '../constants/status'
import type { AttendanceRecord, AttendanceStatus } from '../types'

export default function Records() {
  const [date, setDate] = useState('')
  const [status, setStatus] = useState<AttendanceStatus | ''>('')
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
        if (cancelled) return
        setError(err instanceof Error ? err.message : '加载失败')
        setList([])
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
    <PageShell
      title="考勤记录"
      description="按日期与状态查阅历史打卡明细。"
      extra={<Tag color="green">共 {list.length} 条</Tag>}
    >
      <Card size="small">
        <Flex wrap="wrap" gap={12} role="search">
          <Select
            allowClear
            placeholder="全部日期"
            value={date || undefined}
            onChange={(value) => setDate(value ?? '')}
            options={dates.map((item) => ({ value: item, label: item }))}
            style={{ width: 180 }}
            aria-label="筛选日期"
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
        locale={{ emptyText: '暂无匹配记录' }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        columns={[
          { title: '日期', dataIndex: 'date' },
          { title: '姓名', dataIndex: 'studentName' },
          { title: '学号', dataIndex: 'studentNo' },
          { title: '班级', dataIndex: 'className' },
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
