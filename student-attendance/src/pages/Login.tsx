import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { App, Button, Card, Form, Input, Typography } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/AuthContext'
import { homePath } from '../auth/paths'
import './Login.css'

interface LoginFormValues {
  username: string
  password: string
}

export default function Login() {
  const { login } = useAuth()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)

  const from =
    typeof location.state === 'object' && location.state && 'from' in location.state
      ? String((location.state as { from?: string }).from || '/')
      : '/'

  async function onFinish(values: LoginFormValues) {
    setLoading(true)
    try {
      const loggedIn = await login(values.username.trim(), values.password)
      message.success('登录成功')
      const fallback = homePath(loggedIn.role)
      if (from === '/login' || from === '/') {
        navigate(fallback, { replace: true })
        return
      }
      if (loggedIn.role === 'student' && from !== '/leave') {
        navigate('/leave', { replace: true })
        return
      }
      navigate(from, { replace: true })
    } catch (err) {
      message.error(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <Card className="login-card" variant="borderless">
        <div className="login-brand">
          <img className="login-mark" src="/brand-mark.png" alt="守课" />
          <div>
            <Typography.Title level={3} style={{ margin: 0, color: '#163528' }}>
              守课
            </Typography.Title>
            <Typography.Text type="secondary">学生打卡考勤系统</Typography.Text>
          </div>
        </div>

        <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
          请登录后查看考勤数据。
        </Typography.Paragraph>

        <Form layout="vertical" onFinish={onFinish} autoComplete="on">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
