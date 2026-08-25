import { useMemo, useState } from 'react'
import { Avatar, Flex, Layout, Menu, Typography } from 'antd'
import {
  CalendarOutlined,
  FileSearchOutlined,
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import './AppLayout.css'

const { Header, Sider, Content } = Layout

const navItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页总览' },
  { key: '/attendance', icon: <CalendarOutlined />, label: '今日打卡' },
  { key: '/students', icon: <TeamOutlined />, label: '学生管理' },
  { key: '/records', icon: <FileSearchOutlined />, label: '考勤记录' },
]

function formatToday() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const selectedKey = useMemo(() => {
    const match = navItems.find((item) =>
      item.key === '/' ? location.pathname === '/' : location.pathname.startsWith(item.key),
    )
    return match?.key ?? '/'
  }, [location.pathname])

  return (
    <Layout className="app-layout">
      <Sider
        theme="dark"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        width={232}
      >
        <div className={`brand ${collapsed ? 'brand-collapsed' : ''}`}>
          <span className="brand-mark" aria-hidden="true" />
          {collapsed ? null : (
            <div>
              <p className="brand-name">守课</p>
              <p className="brand-desc">学生打卡考勤</p>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={navItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderInlineEnd: 'none', flex: 1 }}
        />

        {collapsed ? null : (
          <div className="sider-foot">
            <Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>
              今日 · {formatToday()}
            </Typography.Text>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.55)', display: 'block' }}>
              管理员视图
            </Typography.Text>
          </div>
        )}
      </Sider>

      <Layout>
        <Header className="app-header">
          <Typography.Text type="secondary">学生打卡考勤管理系统</Typography.Text>
          <Flex align="center" gap={8}>
            <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1f6b4a' }} />
            <Typography.Text>教务处</Typography.Text>
          </Flex>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
