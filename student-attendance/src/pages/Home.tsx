import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Col, Flex, Progress, Row, Space, Spin, Statistic, Table } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExceptionOutlined,
  TeamOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons'
import { fetchDashboardStats, fetchTodayAttendance } from '../api'
import StatusTag from '../components/StatusTag'
import type { AttendanceRecord, DashboardStats } from '../types'

const emptyStats: DashboardStats = {
  totalStudents: 0,
  presentToday: 0,
  lateToday: 0,
  absentToday: 0,
  leaveToday: 0,
  attendanceRate: 0,
}

export default function Home() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>(emptyStats)
  const [recent, setRecent] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [statsData, todayData] = await Promise.all([
          fetchDashboardStats(),
          fetchTodayAttendance(),
        ])
        if (cancelled) return
        setStats(statsData)
        setRecent(todayData.list.slice(0, 6))
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="加载失败"
        description={`${error}（请确认后端 attendance-api 已启动）`}
      />
    )
  }

  return (
    <Spin spinning={loading}>
      <Flex vertical gap={16}>
        <Card
          variant="borderless"
          styles={{ body: { padding: 28 } }}
          style={{
            background: 'linear-gradient(125deg, #1f6b4a 0%, #163528 100%)',
            color: '#fff',
          }}
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={16}>
              <div style={{ color: 'rgba(255,255,255,0.72)', marginBottom: 8 }}>今日概览</div>
              <h1 style={{ margin: 0, fontSize: 28, color: '#fff' }}>守课 · 打卡考勤</h1>
              <p style={{ margin: '12px 0 0', color: 'rgba(255,255,255,0.82)', maxWidth: 480 }}>
                掌握全校到勤情况，快速定位迟到、缺勤与请假学生。
              </p>
              <Space style={{ marginTop: 20 }} wrap>
                <Button type="primary" onClick={() => navigate('/attendance')}>
                  查看今日打卡
                </Button>
                <Button ghost onClick={() => navigate('/records')}>
                  历史记录
                </Button>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Flex vertical align="center" gap={4}>
                <Progress
                  type="circle"
                  percent={stats.attendanceRate}
                  strokeColor="#7dcea0"
                  trailColor="rgba(255,255,255,0.16)"
                  format={(percent) => (
                    <span style={{ color: '#fff' }}>{percent}%</span>
                  )}
                />
                <span style={{ color: 'rgba(255,255,255,0.72)' }}>今日出勤率</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                  已到 + 迟到 / 在册学生
                </span>
              </Flex>
            </Col>
          </Row>
        </Card>

        <Flex wrap="wrap" gap={16}>
          <Card style={{ flex: '1 1 160px' }}>
            <Statistic title="在册学生" value={stats.totalStudents} prefix={<TeamOutlined />} />
          </Card>
          <Card style={{ flex: '1 1 160px' }}>
            <Statistic
              title="已到"
              value={stats.presentToday}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1f6b4a' }}
            />
          </Card>
          <Card style={{ flex: '1 1 160px' }}>
            <Statistic
              title="迟到"
              value={stats.lateToday}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#b86a1c' }}
            />
          </Card>
          <Card style={{ flex: '1 1 160px' }}>
            <Statistic
              title="缺勤"
              value={stats.absentToday}
              prefix={<UserDeleteOutlined />}
              valueStyle={{ color: '#b42318' }}
            />
          </Card>
          <Card style={{ flex: '1 1 160px' }}>
            <Statistic
              title="请假"
              value={stats.leaveToday}
              prefix={<ExceptionOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Flex>

        <Card
          title="今日最新打卡"
          extra={
            <Button type="link" onClick={() => navigate('/attendance')}>
              全部记录
            </Button>
          }
        >
          <Table
            rowKey="id"
            size="middle"
            pagination={false}
            scroll={{ x: 640 }}
            dataSource={recent}
            locale={{ emptyText: '暂无打卡数据' }}
            columns={[
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
                render: (status: AttendanceRecord['status']) => <StatusTag status={status} />,
              },
            ]}
          />
        </Card>
      </Flex>
    </Spin>
  )
}
