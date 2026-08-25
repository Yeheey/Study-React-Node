# 守课 · 考勤 API

Node.js + Express 后端，用于与 `student-attendance` React 前端联调。

## 启动

```bash
cd attendance-api
npm install
npm run dev
```

默认端口：`http://localhost:3001`

## 接口一览

统一响应：`{ code: 0, message: 'success', data: ... }`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/dashboard/stats` | 首页统计 |
| GET | `/api/students?keyword=&grade=` | 学生列表 |
| GET | `/api/attendance/today?keyword=&className=&status=` | 今日打卡 |
| GET | `/api/attendance/records?date=&status=` | 历史考勤 |
| GET | `/api/meta/options` | 班级/年级/日期选项 |
| PATCH | `/api/attendance/:id` | 更新考勤状态 |
| POST | `/api/attendance/check-in` | 学生打卡 |

## 联调说明

前端 Vite 已代理 `/api` → `http://localhost:3001`。  
先启动本服务，再启动 React：`npm run dev`。
