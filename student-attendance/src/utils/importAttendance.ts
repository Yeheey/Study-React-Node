import * as XLSX from 'xlsx'

export const IMPORT_REQUIRED_FIELDS = ['id', 'studentId', 'date', 'status'] as const
export const IMPORT_ALLOWED_EXT = ['.xlsx', '.xls', '.csv'] as const
export const IMPORT_MAX_ROWS = 2000

const HEADER_ALIASES: Record<string, string> = {
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

function normalizeHeader(value: unknown) {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]/g, '')
}

export function hasAllowedImportExt(filename: string) {
  const name = filename.toLowerCase()
  return IMPORT_ALLOWED_EXT.some((ext) => name.endsWith(ext))
}

export async function validateImportFile(file: File): Promise<string | null> {
  if (!hasAllowedImportExt(file.name)) {
    return '上传格式不正确，仅支持 .xlsx、.xls、.csv 表格文件'
  }

  if (file.size === 0) {
    return '上传格式不正确，文件为空'
  }

  let workbook: XLSX.WorkBook
  try {
    const buffer = await file.arrayBuffer()
    workbook = XLSX.read(buffer, { type: 'array' })
  } catch {
    return '上传格式不正确，无法解析该表格文件'
  }

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return '上传格式不正确，表格中没有工作表'
  }

  const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    raw: true,
    defval: '',
    blankrows: false,
  }) as unknown[][]

  if (matrix.length === 0) {
    return '上传格式不正确，表格为空'
  }

  const headerRow = Array.isArray(matrix[0]) ? matrix[0] : []
  const mapped = new Set(
    headerRow.map((cell) => HEADER_ALIASES[normalizeHeader(cell)]).filter(Boolean),
  )
  const missing = IMPORT_REQUIRED_FIELDS.filter((field) => !mapped.has(field))
  if (missing.length > 0) {
    return `上传格式不正确，缺少必要列：${missing.join('、')}（也可用中文列名：记录ID、学生ID、日期、状态）`
  }

  const dataRows = matrix.slice(1).filter((row) => {
    if (!Array.isArray(row)) return false
    return row.some((cell) => String(cell ?? '').trim() !== '')
  })

  if (dataRows.length === 0) {
    return '上传格式不正确，表格没有数据行'
  }

  if (dataRows.length > IMPORT_MAX_ROWS) {
    return `单次最多导入 ${IMPORT_MAX_ROWS} 行`
  }

  return null
}

const TEMPLATE_ROWS = [
  ['id', 'studentId', 'date', 'status', 'checkInTime', 'remark'],
  ['r1', 's1', '2026-08-25', 'present', '07:42', ''],
  ['new-1', 's2', '2026-08-22', 'late', '08:15', '管理员批量导入示例'],
]

export function downloadImportTemplate(format: 'xlsx' | 'xls') {
  const sheet = XLSX.utils.aoa_to_sheet(TEMPLATE_ROWS)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, '考勤导入')

  const buffer = XLSX.write(workbook, { bookType: format, type: 'array' }) as ArrayBuffer
  const mime =
    format === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/vnd.ms-excel'
  const blob = new Blob([buffer], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `attendance-import.${format}`
  link.click()
  URL.revokeObjectURL(url)
}
