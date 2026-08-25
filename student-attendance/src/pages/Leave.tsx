import { useEffect, useState } from 'react'
import { Alert, App, Button, Card, DatePicker, Form, Input, Select, Table, Tag } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { createLeaveRequest, fetchLeaveRequests } from '../api'
import PageShell from '../components/PageShell'
import {
  leaveStatusColor,
  leaveStatusLabel,
  leaveTypeLabel,
  leaveTypeOptions,
} from '../constants/leave'
import type { LeaveRequest, LeaveStatus, LeaveType } from '../types'

interface LeaveFormValues {
  leaveType: LeaveType
  startDate?: string
  endDate?: string
  reason: string
}

function toDateString(value: Dayjs | null) {
  if (!value) return undefined
  return value.format('YYYY-MM-DD')
}

function toDayjs(value?: string) {
  if (!value) return undefined
  const parsed = dayjs(value)
  if (!parsed.isValid()) return undefined
  return parsed
}

function disableBeforeStart(current: Dayjs, startDate?: string) {
  if (!startDate) return false
  return current.isBefore(dayjs(startDate), 'day')
}

function disableAfterEnd(current: Dayjs, endDate?: string) {
  if (!endDate) return false
  return current.isAfter(dayjs(endDate), 'day')
}

export default function Leave() {
  const { message } = App.useApp()
  const [form] = Form.useForm<LeaveFormValues>()
  const [list, setList] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)
  const startDate = Form.useWatch('startDate', form)
  const endDate = Form.useWatch('endDate', form)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchLeaveRequests()
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
  }, [reloadTick])

  async function onSubmit(values: LeaveFormValues) {
    const start = values.startDate?.trim()
    const end = values.endDate?.trim()
    if (!start) {
      message.error('请选择开始日期')
      return
    }
    if (!end) {
      message.error('请选择结束日期')
      return
    }
    if (end < start) {
      message.error('结束日期不能早于开始日期')
      return
    }

    setSubmitting(true)
    try {
      await createLeaveRequest({
        leaveType: values.leaveType,
        startDate: start,
        endDate: end,
        reason: values.reason.trim(),
      })
      message.success('请假申请已提交')
      form.resetFields()
      setReloadTick((tick) => tick + 1)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell title="申请请假" description="填写请假时间与原因并提交，可在下方查看申请记录。">
      <Card size="small" title="提交申请">
        <Form layout="vertical" form={form} onFinish={onSubmit} style={{ maxWidth: 560 }}>
          <Form.Item
            name="leaveType"
            label="请假类型"
            rules={[{ required: true, message: '请选择请假类型' }]}
          >
            <Select options={leaveTypeOptions} placeholder="请选择请假类型" />
          </Form.Item>
          <Form.Item
            name="startDate"
            label="开始日期"
            rules={[{ required: true, message: '请选择开始日期' }]}
            getValueFromEvent={(value) => toDateString(value)}
            getValueProps={(value) => ({ value: toDayjs(value) })}
          >
            <DatePicker
              allowClear
              style={{ width: '100%' }}
              placeholder="请选择开始日期"
              disabledDate={(current) => disableAfterEnd(current, endDate)}
            />
          </Form.Item>
          <Form.Item
            name="endDate"
            label="结束日期"
            rules={[{ required: true, message: '请选择结束日期' }]}
            getValueFromEvent={(value) => toDateString(value)}
            getValueProps={(value) => ({ value: toDayjs(value) })}
          >
            <DatePicker
              allowClear
              style={{ width: '100%' }}
              placeholder="请选择结束日期"
              disabledDate={(current) => disableBeforeStart(current, startDate)}
            />
          </Form.Item>
          <Form.Item
            name="reason"
            label="请假原因"
            rules={[{ required: true, message: '请填写请假原因' }]}
          >
            <Input.TextArea rows={4} maxLength={200} showCount placeholder="请说明请假原因" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={submitting}>
              提交申请
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {error ? <Alert type="error" showIcon message="加载失败" description={error} /> : null}

      <Card size="small" title="我的申请">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={list}
          scroll={{ x: 720 }}
          locale={{ emptyText: '暂无请假申请' }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          columns={[
            {
              title: '类型',
              dataIndex: 'leaveType',
              render: (value: LeaveType) => leaveTypeLabel[value],
            },
            { title: '开始日期', dataIndex: 'startDate' },
            { title: '结束日期', dataIndex: 'endDate' },
            { title: '原因', dataIndex: 'reason', ellipsis: true },
            {
              title: '状态',
              dataIndex: 'status',
              width: 120,
              render: (value: LeaveStatus) => (
                <Tag color={leaveStatusColor[value]}>{leaveStatusLabel[value]}</Tag>
              ),
            },
            { title: '审批意见', dataIndex: 'reviewRemark', ellipsis: true },
            {
              title: '提交时间',
              dataIndex: 'createdAt',
              render: (value: string) => value.slice(0, 16).replace('T', ' '),
            },
          ]}
        />
      </Card>
    </PageShell>
  )
}
