# 守课 · 学生打卡考勤系统

基于 React + Vite + TypeScript 的学生打卡考勤前端工程。

## 功能页面

- **首页总览**：今日出勤率、到勤统计、最新打卡摘要
- **今日打卡**：学生打卡情况表格（姓名/学号/班级/状态筛选）
- **学生管理**：在册学生列表
- **考勤记录**：历史打卡明细

## 快速开始

```bash
cd student-attendance
npm install
npm run dev
```

## 构建打包

```bash
npm run build
npm run preview
```

## 前后端联调

1. 启动后端：`cd ../attendance-api && npm install && npm run dev`（端口 3001）
2. 启动前端：`npm run dev`（Vite 已将 `/api` 代理到后端）

前端请求封装见 `src/api/index.ts`。
