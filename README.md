# OldPang · 学生打卡考勤系统

前后端联调工程，对应仓库：[Yeheey/OldPang](https://github.com/Yeheey/OldPang)

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
