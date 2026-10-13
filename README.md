# Study-React-Node· 学生打卡考勤系统

前后端联调工程，对应仓库：[Yeheey/Study-React-Node](https://github.com/Yeheey/Study-React-Node)

## 目录

| 目录 | 说明 |
|------|------|
| `student-attendance` | React + Vite 前端 |
| `attendance-api` | Node.js + Express 后端 |

## 快速启动

```bash
# 后端（端口 3001）
cd attendance-api
npm install
npm run dev

# 前端（另开终端）
cd student-attendance
npm install
npm run dev
```

前端已将 `/api` 代理到 `http://localhost:3001`。

演示账号见 `student-attendance/README.md`：管理员 `admin`、普通用户 `user1`、演示学生 `student1`（小小胖，高三（1）班），密码均为 `123456`。
在学生管理中新增的学生，登录名为学号，默认密码 `123456`。学生登录后仅可见「申请请假」菜单。管理员可在「审批请假」中通过或驳回申请。
