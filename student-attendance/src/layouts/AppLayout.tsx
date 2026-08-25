import { NavLink, Outlet } from 'react-router-dom'
import './AppLayout.css'

const navItems = [
  { to: '/', label: '首页总览', end: true },
  { to: '/attendance', label: '今日打卡' },
  { to: '/students', label: '学生管理' },
  { to: '/records', label: '考勤记录' },
]

export default function AppLayout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <p className="brand-name">守课</p>
            <p className="brand-desc">学生打卡考勤</p>
          </div>
        </div>

        <nav className="nav" aria-label="主导航">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <p>今日 · 2026-08-25</p>
          <p className="muted">管理员视图</p>
        </div>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <p className="topbar-title">学生打卡考勤管理系统</p>
          <div className="topbar-user">教务处</div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
