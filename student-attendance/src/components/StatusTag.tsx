import { Tag } from 'antd'
import { statusLabel, statusTagColor } from '../constants/status'
import type { AttendanceStatus } from '../types'

interface StatusTagProps {
  status: AttendanceStatus
}

export default function StatusTag({ status }: StatusTagProps) {
  return <Tag color={statusTagColor[status]}>{statusLabel[status]}</Tag>
}
