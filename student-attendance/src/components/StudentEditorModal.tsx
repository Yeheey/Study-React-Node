import { useEffect } from 'react'
import { Form, Input, Modal } from 'antd'
import type { Student } from '../types'

export interface StudentFormValues {
  name: string
  studentNo: string
  className: string
  grade: string
  phone?: string
}

interface StudentEditorModalProps {
  open: boolean
  student: Student | null
  submitting: boolean
  onCancel: () => void
  onSubmit: (values: StudentFormValues) => void
}

export default function StudentEditorModal({
  open,
  student,
  submitting,
  onCancel,
  onSubmit,
}: StudentEditorModalProps) {
  const [form] = Form.useForm<StudentFormValues>()
  const isEdit = Boolean(student)

  useEffect(() => {
    if (!open) return

    if (!student) {
      form.resetFields()
      return
    }

    form.setFieldsValue({
      name: student.name,
      studentNo: student.studentNo,
      className: student.className,
      grade: student.grade,
      phone: student.phone,
    })
  }, [open, student, form])

  return (
    <Modal
      title={isEdit ? '编辑学生' : '新增学生'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      destroyOnHidden
    >
      <Form layout="vertical" form={form} onFinish={onSubmit} style={{ marginTop: 16 }}>
        <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
          <Input placeholder="请输入姓名" maxLength={20} />
        </Form.Item>
        <Form.Item name="studentNo" label="学号" rules={[{ required: true, message: '请输入学号' }]}>
          <Input placeholder="请输入学号" maxLength={32} />
        </Form.Item>
        <Form.Item name="grade" label="年级" rules={[{ required: true, message: '请输入年级' }]}>
          <Input placeholder="例如：高一" maxLength={20} />
        </Form.Item>
        <Form.Item name="className" label="班级" rules={[{ required: true, message: '请输入班级' }]}>
          <Input placeholder="例如：高一(1)班" maxLength={40} />
        </Form.Item>
        <Form.Item name="phone" label="联系电话">
          <Input placeholder="可选" maxLength={20} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
