export function ok(res, data, message = 'success') {
  return res.json({ code: 0, message, data })
}

export function fail(res, message = 'error', code = 1, status = 400) {
  return res.status(status).json({ code, message, data: null })
}

export const VALID_STATUS = new Set(['present', 'late', 'absent', 'leave'])

export function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))
}

export function isValidTime(value) {
  return /^\d{2}:\d{2}$/.test(String(value ?? ''))
}
