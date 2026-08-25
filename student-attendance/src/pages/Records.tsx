import { useEffect, useState } from 'react'
import { Alert, App, Button, Card, Dropdown, Flex, Popconfirm, Select, Space, Table, Upload } from 'antd'
import { DownloadOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import {
  createAttendanceRecord,
  deleteAttendanceRecord,
  fetchAttendanceRecords,
  fetchMetaOptions,
  fetchStudents,
  importAttendanceRecords,
  updateAttendanceRecord,
} from '../api'
import { useAuth } from '../auth/AuthContext'
import PageShell from '../components/PageShell'
import RecordEditorModal, { type RecordFormValues } from '../components/RecordEditorModal'
import StatusTag from '../components/StatusTag'
import { statusFilterOptions } from '../constants/status'
import type { AttendanceRecord, AttendanceStatus, Student } from '../types'
import { validateImportFile, downloadImportTemplate } from '../utils/importAttendance'

export default function Records() {
  const { isAdmin } = useAuth()
  const { message } = App.useApp()
  const [date, setDate] = useState('')
  const [status, setStatus] = useState<AttendanceStatus | ''>('')
  const [dates, setDates] = useState<string[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [list, setList] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<AttendanceRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [importing, setImporting] = useState(false)

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
  }, [reloadTick])

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false

    async function loadStudents() {
      try {
        const data = await fetchStudents()
        if (!cancelled) setStudents(data.list)
      } catch {
        // ignore
      }
    }

    void loadStudents()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

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
  }, [date, status, reloadTick])

  function openCreate() {
    setEditing(null)
    setEditorOpen(true)
  }

  function openEdit(record: AttendanceRecord) {
    setEditing(record)
    setEditorOpen(true)
  }

  function closeEditor() {
    setEditorOpen(false)
    setEditing(null)
  }

  async function handleSubmit(values: RecordFormValues) {
    setSubmitting(true)
    try {
      const payload = {
        studentId: values.studentId,
        date: values.date,
        status: values.status,
        checkInTime: values.checkInTime ? values.checkInTime.slice(0, 5) : null,
        remark: values.remark?.trim() ?? '',
      }

      if (editing) {
        await updateAttendanceRecord(editing.id, payload)
        message.success('更新成功')
      } else {
        await createAttendanceRecord(payload)
        message.success('新增成功')
      }

      closeEditor()
      setReloadTick((tick) => tick + 1)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAttendanceRecord(id)
      message.success('删除成功')
      setReloadTick((tick) => tick + 1)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  async function handleImport(file: File) {
    const formatError = await validateImportFile(file)
    if (formatError) {
      message.error(formatError)
      return
    }

    setImporting(true)
    try {
      const result = await importAttendanceRecords(file)
      const failedCount = result.failed.length
      if (failedCount === 0) {
        message.success(`导入完成：新增 ${result.created} 条，覆盖 ${result.updated} 条`)
      } else {
        const first = result.failed[0]
        message.warning(
          `导入完成：新增 ${result.created} 条，覆盖 ${result.updated} 条，失败 ${failedCount} 条。首条失败：第 ${first.row} 行 ${first.message}`,
        )
      }
      setReloadTick((tick) => tick + 1)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '导入失败')
    } finally {
      setImporting(false)
    }
  }

  const columns = [
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
    ...(isAdmin
      ? [
          {
            title: '操作',
            key: 'actions',
            width: 140,
            render: (_: unknown, row: AttendanceRecord) => (
              <Space>
                <Button type="link" size="small" onClick={() => openEdit(row)}>
                  编辑
                </Button>
                <Popconfirm
                  title="确认删除该考勤记录？"
                  okText="删除"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleDelete(row.id)}
                >
                  <Button type="link" size="small" danger>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ]

  return (
    <PageShell
      title="考勤记录"
      description={
        isAdmin ? '按日期与状态查阅历史打卡明细，支持新增、编辑和删除。' : '按日期与状态查阅历史打卡明细。'
      }
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

      {isAdmin ? (
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增记录
          </Button>
          <Upload
            accept=".xlsx,.xls,.csv"
            showUploadList={false}
            beforeUpload={(file) => {
              void handleImport(file)
              return false
            }}
          >
            <Button icon={<UploadOutlined />} loading={importing}>
              批量导入
            </Button>
          </Upload>
          <Dropdown
            menu={{
              items: [
                { key: 'xlsx', label: 'Excel 工作簿 (.xlsx)' },
                { key: 'xls', label: 'Excel 97-2003 (.xls)' },
              ],
              onClick: ({ key }) => downloadImportTemplate(key as 'xlsx' | 'xls'),
            }}
          >
            <Button icon={<DownloadOutlined />}>下载模板</Button>
          </Dropdown>
        </Space>
      ) : null}

      {error ? <Alert type="error" showIcon message="加载失败" description={error} /> : null}

      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        scroll={{ x: isAdmin ? 980 : 880 }}
        locale={{ emptyText: '暂无匹配记录' }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        columns={columns}
      />

      {isAdmin ? (
        <RecordEditorModal
          open={editorOpen}
          record={editing}
          students={students}
          submitting={submitting}
          onCancel={closeEditor}
          onSubmit={handleSubmit}
        />
      ) : null}
    </PageShell>
  )
}
