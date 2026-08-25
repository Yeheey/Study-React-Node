import * as XLSX from 'xlsx'
import { getStudentById } from '../db/students.js'
import { VALID_STATUS, isValidDate, isValidTime } from './helpers.js'

export const IMPORT_REQUIRED_FIELDS = ['id', 'studentId', 'date', 'status']
export const IMPORT_ALLOWED_EXT = ['.xlsx', '.xls']
export const IMPORT_MAX_ROWS = 2000

const HEADER_ALIASES = {
  id: 'id',
  记录id: 'id',
  记录编号: 'id',
  studentid: 'studentId',
  学生id: 'studentId',
  date: 'date',
  日期: 'date',
  status: 'status',
  状态: 'status',
  checkintime: 'checkInTime',
  打卡时间: 'checkInTime',
  remark: 'remark',
  备注: 'remark',
}

const STATUS_ALIASES = {
  present: 'present',
  late: 'late',
  absent: 'absent',
  leave: 'leave',
  已到: 'present',
  迟到: 'late',
  缺勤: 'absent',
  请假: 'leave',
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function normalizeHeader(value) {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]/g, '')
}

function mapHeaders(headerRow) {
  const mapped = headerRow.map((cell) => HEADER_ALIASES[normalizeHeader(cell)] ?? null)
  const fields = new Set(mapped.filter(Boolean))
  const missing = IMPORT_REQUIRED_FIELDS.filter((field) => !fields.has(field))
  return { mapped, missing }
}

function toDateString(value) {
  if (value === null || value === undefined || value === '') return ''

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (!parsed) return String(value)
    return `${parsed.y}-${pad(parsed.m)}-${pad(parsed.d)}`
  }

  const text = String(value).trim().replace(/[/.]/g, '-')
  const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (!match) return text
  return `${match[1]}-${pad(match[2])}-${pad(match[3])}`
}

function toTimeString(value) {
  if (value === null || value === undefined || value === '') return ''

  if (typeof value === 'number') {
    const totalMinutes = Math.round(((value % 1) + (value < 0 ? 1 : 0)) * 24 * 60)
    const hours = Math.floor(totalMinutes / 60) % 24
    const minutes = totalMinutes % 60
    return `${pad(hours)}:${pad(minutes)}`
  }

  const text = String(value).trim()
  const match = text.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return text
  return `${pad(match[1])}:${match[2]}`
}

function normalizeStatus(value) {
  const key = String(value ?? '').trim()
  return STATUS_ALIASES[key] ?? STATUS_ALIASES[key.toLowerCase()] ?? key
}

export function hasAllowedImportExt(filename) {
  const name = String(filename ?? '').toLowerCase()
  return IMPORT_ALLOWED_EXT.some((ext) => name.endsWith(ext))
}

export function parseImportWorkbook(buffer, filename = '', mimeType = '') {
  if (!hasAllowedImportExt(filename) || /csv|text\/plain/i.test(mimeType)) {
    return { error: '上传格式不正确，仅支持 .xlsx、.xls 表格文件' }
  }

  let workbook
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' })
  } catch {
    return { error: '上传格式不正确，无法解析该表格文件' }
  }

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { error: '上传格式不正确，表格中没有工作表' }
  }

  const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    raw: true,
    defval: '',
    blankrows: false,
  })

  if (!Array.isArray(matrix) || matrix.length === 0) {
    return { error: '上传格式不正确，表格为空' }
  }

  const headerRow = Array.isArray(matrix[0]) ? matrix[0] : []
  const { mapped, missing } = mapHeaders(headerRow)
  if (missing.length > 0) {
    return {
      error: `上传格式不正确，缺少必要列：${missing.join('、')}（也可用中文列名：记录ID、学生ID、日期、状态）`,
    }
  }

  const dataRows = matrix.slice(1).filter((row) => {
    if (!Array.isArray(row)) return false
    return row.some((cell) => String(cell ?? '').trim() !== '')
  })

  if (dataRows.length === 0) {
    return { error: '上传格式不正确，表格没有数据行' }
  }

  if (dataRows.length > IMPORT_MAX_ROWS) {
    return { error: `单次最多导入 ${IMPORT_MAX_ROWS} 行` }
  }

  const rows = dataRows.map((row, index) => {
    const item = {}
    mapped.forEach((field, colIndex) => {
      if (field) item[field] = row[colIndex]
    })
    return { excelRow: index + 2, item }
  })

  return { rows }
}

export function validateImportRow(item) {
  const id = String(item.id ?? '').trim()
  if (!id) return { error: '缺少 id' }

  const studentId = String(item.studentId ?? '').trim()
  if (!studentId) return { error: '缺少 studentId' }

  const student = getStudentById(studentId)
  if (!student) return { error: `学生不存在：${studentId}` }

  const date = toDateString(item.date)
  if (!isValidDate(date)) return { error: '日期格式应为 YYYY-MM-DD' }

  const status = normalizeStatus(item.status)
  if (!VALID_STATUS.has(status)) {
    return { error: '状态须为 present/late/absent/leave 或 已到/迟到/缺勤/请假' }
  }

  const timeRaw = item.checkInTime
  let checkInTime = null
  if (timeRaw !== null && timeRaw !== undefined && String(timeRaw).trim() !== '') {
    const time = toTimeString(timeRaw)
    if (!isValidTime(time)) return { error: '打卡时间格式应为 HH:mm' }
    checkInTime = time
  }

  const remarkText = String(item.remark ?? '').trim()

  return {
    record: {
      id,
      studentId: student.id,
      studentName: student.name,
      studentNo: student.studentNo,
      className: student.className,
      date,
      checkInTime,
      status,
      remark: remarkText || undefined,
    },
  }
}
