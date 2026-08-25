import { useMemo, useState } from 'react'
import { Avatar, Dropdown, Flex, Layout, Menu, Typography } from 'antd'
import {
  CalendarOutlined,
  FileSearchOutlined,
  HomeOutlined,
  LogoutOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './AppLayout.css'

const { Header, Sider, Content } = Layout

const allNavItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页总览' },
  { key: '/attendance', icon: <CalendarOutlined />, label: '今日打卡' },
  { key: '/students', icon: <TeamOutlined />, label: '学生管理', adminOnly: true },
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
  const { user, isAdmin, logout } = useAuth()

  const navItems = useMemo(
    () => allNavItems.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin],
  )

  const selectedKey = useMemo(() => {
    const match = navItems.find((item) =>
      item.key === '/' ? location.pathname === '/' : location.pathname.startsWith(item.key),
    )
    return match?.key ?? '/'
  }, [location.pathname, navItems])

  const roleLabel = isAdmin ? '管理员' : '普通用户'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

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
          <img className="brand-mark" src="/brand-mark.png" alt="守课" />
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
          items={navItems.map(({ key, icon, label }) => ({ key, icon, label }))}
          onClick={({ key }) => navigate(key)}
          style={{ borderInlineEnd: 'none', flex: 1 }}
        />

        {collapsed ? null : (
          <div className="sider-foot">
            <Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>
              今日 · {formatToday()}
            </Typography.Text>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.55)', display: 'block' }}>
              {roleLabel}视图
            </Typography.Text>
          </div>
        )}
      </Sider>

      <Layout>
        <Header className="app-header">
          <Typography.Text type="secondary">学生打卡考勤管理系统</Typography.Text>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: handleLogout,
                },
              ],
            }}
          >
            <Flex align="center" gap={8} style={{ cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1f6b4a' }} />
              <Typography.Text>{user?.displayName ?? user?.username}</Typography.Text>
            </Flex>
          </Dropdown>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
