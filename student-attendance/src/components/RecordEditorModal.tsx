import { useEffect } from 'react'
import { Form, Input, Modal, Select } from 'antd'
import { statusFilterOptions } from '../constants/status'
import type { AttendanceRecord, AttendanceStatus, Student } from '../types'

export interface RecordFormValues {
  studentId: string
  date: string
  status: AttendanceStatus
  checkInTime?: string
  remark?: string
}

interface RecordEditorModalProps {
  open: boolean
  record: AttendanceRecord | null
  students: Student[]
  submitting: boolean
  onCancel: () => void
  onSubmit: (values: RecordFormValues) => void
}

function toTimeValue(value: string | null | undefined) {
  if (!value) return undefined
  return value.slice(0, 5)
}

export default function RecordEditorModal({
  open,
  record,
  students,
  submitting,
  onCancel,
  onSubmit,
}: RecordEditorModalProps) {
  const [form] = Form.useForm<RecordFormValues>()
  const isEdit = Boolean(record)

  useEffect(() => {
    if (!open) return

    if (!record) {
      form.resetFields()
      return
    }

    form.setFieldsValue({
      studentId: record.studentId,
      date: record.date,
      status: record.status,
      checkInTime: toTimeValue(record.checkInTime),
      remark: record.remark,
    })
  }, [open, record, form])

  return (
    <Modal
      title={isEdit ? '编辑考勤记录' : '新增考勤记录'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      destroyOnHidden
    >
      <Form layout="vertical" form={form} onFinish={onSubmit} style={{ marginTop: 16 }}>
        <Form.Item name="studentId" label="学生" rules={[{ required: true, message: '请选择学生' }]}>
          <Select
            showSearch
            optionFilterProp="label"
            disabled={isEdit}
            placeholder="请选择学生"
            options={students.map((item) => ({
              value: item.id,
              label: `${item.name} · ${item.studentNo} · ${item.className}`,
            }))}
          />
        </Form.Item>
        <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
          <Input type="date" />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
          <Select options={statusFilterOptions} placeholder="请选择状态" />
        </Form.Item>
        <Form.Item name="checkInTime" label="打卡时间">
          <Input type="time" />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} placeholder="可选" maxLength={80} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
