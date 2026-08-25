import { useEffect, useState } from 'react'
import { Alert, App, Button, Card, Flex, Input, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { fetchAdminLeaveRequests, reviewLeaveRequest } from '../api'
import PageShell from '../components/PageShell'
import {
  leaveStatusColor,
  leaveStatusFilterOptions,
  leaveStatusLabel,
  leaveTypeLabel,
} from '../constants/leave'
import type { LeaveRequest, LeaveStatus, LeaveType } from '../types'

export default function LeaveReview() {
  const { message } = App.useApp()
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<LeaveStatus | ''>('')
  const [list, setList] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)
  const [rejecting, setRejecting] = useState<LeaveRequest | null>(null)
  const [rejectRemark, setRejectRemark] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchAdminLeaveRequests({ keyword, status })
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
  }, [keyword, status, reloadTick])

  async function onApprove(record: LeaveRequest) {
    setSubmitting(true)
    try {
      await reviewLeaveRequest(record.id, { status: 'approved' })
      message.success('已通过')
      setReloadTick((tick) => tick + 1)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  function openReject(record: LeaveRequest) {
    setRejecting(record)
    setRejectRemark(record.reviewRemark ?? '')
  }

  async function onReject() {
    const remark = rejectRemark.trim()
    if (!rejecting) return
    if (!remark) {
      message.error('驳回时请填写原因')
      return
    }

    setSubmitting(true)
    try {
      await reviewLeaveRequest(rejecting.id, { status: 'rejected', reviewRemark: remark })
      message.success('已驳回')
      setRejecting(null)
      setRejectRemark('')
      setReloadTick((tick) => tick + 1)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell title="审批请假" description="查看全部学生请假申请。待审批、已通过、已拒绝均可改为通过或驳回。">
      <Card size="small">
        <Flex wrap="wrap" gap={12} role="search">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索姓名 / 学号 / 班级"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 260 }}
            aria-label="搜索请假申请"
          />
          <Select
            allowClear
            placeholder="全部状态"
            value={status || undefined}
            onChange={(value) => setStatus(value ?? '')}
            options={leaveStatusFilterOptions}
            style={{ width: 180 }}
            aria-label="筛选审批状态"
          />
        </Flex>
      </Card>

      {error ? <Alert type="error" showIcon message="加载失败" description={error} /> : null}

      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        scroll={{ x: 1100 }}
        locale={{ emptyText: '暂无请假申请' }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        columns={[
          { title: '姓名', dataIndex: 'studentName', width: 100 },
          { title: '学号', dataIndex: 'studentNo', width: 120 },
          { title: '班级', dataIndex: 'className', width: 120 },
          {
            title: '类型',
            dataIndex: 'leaveType',
            width: 80,
            render: (value: LeaveType) => leaveTypeLabel[value],
          },
          { title: '开始日期', dataIndex: 'startDate', width: 120 },
          { title: '结束日期', dataIndex: 'endDate', width: 120 },
          { title: '请假原因', dataIndex: 'reason', ellipsis: true },
          {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (value: LeaveStatus) => (
              <Tag color={leaveStatusColor[value]}>{leaveStatusLabel[value]}</Tag>
            ),
          },
          { title: '审批意见', dataIndex: 'reviewRemark', ellipsis: true, width: 160 },
          {
            title: '操作',
            key: 'actions',
            width: 168,
            fixed: 'right',
            render: (_, record) => {
              const canApprove = record.status !== 'approved'
              const canReject = record.status !== 'rejected'

              return (
                <Space>
                  {canApprove ? (
                    <Popconfirm
                      title={record.status === 'rejected' ? '改为通过' : '通过申请'}
                      description={
                        record.status === 'rejected'
                          ? '确认将该已拒绝申请改为通过？'
                          : '确认通过该请假申请？'
                      }
                      okText="通过"
                      cancelText="取消"
                      onConfirm={() => onApprove(record)}
                    >
                      <Button type="link" size="small" disabled={submitting}>
                        {record.status === 'rejected' ? '改为通过' : '通过'}
                      </Button>
                    </Popconfirm>
                  ) : null}
                  {canReject ? (
                    <Button type="link" size="small" danger disabled={submitting} onClick={() => openReject(record)}>
                      {record.status === 'approved' ? '改为驳回' : '驳回'}
                    </Button>
                  ) : null}
                </Space>
              )
            },
          },
        ]}
      />

      <Modal
        title={rejecting?.status === 'approved' ? '改为驳回' : '驳回请假申请'}
        open={Boolean(rejecting)}
        onCancel={() => setRejecting(null)}
        onOk={() => void onReject()}
        confirmLoading={submitting}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
        destroyOnHidden
      >
        <Input.TextArea
          rows={4}
          maxLength={200}
          showCount
          placeholder="请填写驳回原因"
          value={rejectRemark}
          onChange={(e) => setRejectRemark(e.target.value)}
        />
      </Modal>
    </PageShell>
  )
}
