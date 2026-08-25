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
| POST | `/api/auth/login` | 登录，返回 token 与用户角色 |
| GET | `/api/health` | 健康检查 |
| GET | `/api/dashboard/stats` | 首页统计 |
| GET | `/api/students?keyword=&grade=` | 学生列表（需管理员 token） |
| POST | `/api/students` | 新增学生（需管理员 token；同时创建登录账号，用户名为学号，默认密码 123456） |
| PATCH | `/api/students/:id` | 更新学生（需管理员 token） |
| DELETE | `/api/students/:id` | 删除学生（需管理员 token） |
| GET | `/api/attendance/today?keyword=&className=&status=` | 今日打卡 |
| GET | `/api/attendance/records?date=&status=` | 历史考勤 |
| GET | `/api/meta/options` | 班级/年级/日期选项 |
| POST | `/api/attendance/records` | 新增考勤记录（需管理员 token） |
| POST | `/api/attendance/records/import` | Excel 批量导入（.xlsx / .xls，需管理员 token，按 id 覆盖或新增） |
| PATCH | `/api/attendance/:id` | 更新考勤记录（需管理员 token） |
| DELETE | `/api/attendance/:id` | 删除考勤记录（需管理员 token） |
| GET | `/api/leave-requests` | 当前学生的请假申请列表（需学生 token） |
| POST | `/api/leave-requests` | 提交请假申请（需学生 token） |
| GET | `/api/admin/leave-requests?keyword=&status=` | 全部请假申请（需管理员 token） |
| PATCH | `/api/admin/leave-requests/:id` | 审批或修改请假状态，body 为 `{ status: 'approved' \| 'rejected', reviewRemark? }`（需管理员 token；已通过/已拒绝可互改，驳回须填写原因） |

## 联调说明

前端 Vite 已代理 `/api` → `http://localhost:3001`。  
先启动本服务，再启动 React：`npm run dev`。  
演示账号见 `student-attendance/README.md`。
