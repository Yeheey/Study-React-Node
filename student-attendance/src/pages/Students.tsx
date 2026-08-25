import { useEffect, useState } from 'react'
import { Alert, App, Button, Card, Flex, Input, Popconfirm, Select, Space, Table } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import {
  createStudent,
  deleteStudent,
  fetchMetaOptions,
  fetchStudents,
  updateStudent,
} from '../api'
import PageShell from '../components/PageShell'
import StudentEditorModal, { type StudentFormValues } from '../components/StudentEditorModal'
import type { Student } from '../types'

export default function Students() {
  const { message } = App.useApp()
  const [keyword, setKeyword] = useState('')
  const [grade, setGrade] = useState('')
  const [grades, setGrades] = useState<string[]>([])
  const [list, setList] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
  }, [reloadTick])

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
  }, [keyword, grade, reloadTick])

  function openCreate() {
    setEditing(null)
    setEditorOpen(true)
  }

  function openEdit(student: Student) {
    setEditing(student)
    setEditorOpen(true)
  }

  async function onSubmit(values: StudentFormValues) {
    setSubmitting(true)
    try {
      if (editing) {
        await updateStudent(editing.id, values)
        message.success('更新成功')
      } else {
        await createStudent(values)
        message.success('新增成功')
      }
      setEditorOpen(false)
      setReloadTick((tick) => tick + 1)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(student: Student) {
    try {
      await deleteStudent(student.id)
      message.success('删除成功')
      setReloadTick((tick) => tick + 1)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <PageShell
      title="学生管理"
      description="维护在册学生信息，数据保存在后端数据库中。"
    >
      <Card size="small">
        <Flex wrap="wrap" gap={12} role="search" justify="space-between">
          <Flex wrap="wrap" gap={12}>
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
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增学生
          </Button>
        </Flex>
      </Card>

      {error ? <Alert type="error" showIcon message="加载失败" description={error} /> : null}

      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        scroll={{ x: 720 }}
        locale={{ emptyText: '暂无学生，请先新增' }}
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
          {
            title: '操作',
            key: 'actions',
            width: 160,
            render: (_, student) => (
              <Space>
                <Button type="link" size="small" onClick={() => openEdit(student)}>
                  编辑
                </Button>
                <Popconfirm
                  title="删除学生"
                  description="删除后，该学生的考勤记录也会一并删除。"
                  okText="删除"
                  cancelText="取消"
                  onConfirm={() => onDelete(student)}
                >
                  <Button type="link" size="small" danger>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <StudentEditorModal
        open={editorOpen}
        student={editing}
        submitting={submitting}
        onCancel={() => setEditorOpen(false)}
        onSubmit={onSubmit}
      />
    </PageShell>
  )
}
