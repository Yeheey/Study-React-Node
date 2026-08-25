export const students = [
  { id: 's1', name: '陈思远', studentNo: '2024001', className: '高一(1)班', grade: '高一', phone: '138****2101' },
  { id: 's2', name: '林雨桐', studentNo: '2024002', className: '高一(1)班', grade: '高一', phone: '139****8823' },
  { id: 's3', name: '王浩然', studentNo: '2024003', className: '高一(2)班', grade: '高一', phone: '136****4412' },
  { id: 's4', name: '赵婉清', studentNo: '2024004', className: '高一(2)班', grade: '高一', phone: '137****9901' },
  { id: 's5', name: '刘子墨', studentNo: '2024005', className: '高二(1)班', grade: '高二', phone: '135****3344' },
  { id: 's6', name: '周诗涵', studentNo: '2024006', className: '高二(1)班', grade: '高二', phone: '158****6677' },
  { id: 's7', name: '黄景行', studentNo: '2024007', className: '高二(2)班', grade: '高二', phone: '159****1122' },
  { id: 's8', name: '吴佳怡', studentNo: '2024008', className: '高二(2)班', grade: '高二', phone: '186****5533' },
  { id: 's9', name: '郑明轩', studentNo: '2024009', className: '高三(1)班', grade: '高三', phone: '188****7788' },
  { id: 's10', name: '孙语嫣', studentNo: '2024010', className: '高三(1)班', grade: '高三', phone: '133****9900' },
  { id: 's11', name: '马俊杰', studentNo: '2024011', className: '高三(2)班', grade: '高三', phone: '151****2233' },
  { id: 's12', name: '徐若溪', studentNo: '2024012', className: '高三(2)班', grade: '高三', phone: '152****4455' },
]

export const TODAY = '2026-08-25'

/** @type {import('../types.js').AttendanceRecord[]} */
export const attendanceRecords = [
  { id: 'r1', studentId: 's1', studentName: '陈思远', studentNo: '2024001', className: '高一(1)班', date: TODAY, checkInTime: '07:42', status: 'present' },
  { id: 'r2', studentId: 's2', studentName: '林雨桐', studentNo: '2024002', className: '高一(1)班', date: TODAY, checkInTime: '08:15', status: 'late', remark: '交通延误' },
  { id: 'r3', studentId: 's3', studentName: '王浩然', studentNo: '2024003', className: '高一(2)班', date: TODAY, checkInTime: '07:38', status: 'present' },
  { id: 'r4', studentId: 's4', studentName: '赵婉清', studentNo: '2024004', className: '高一(2)班', date: TODAY, checkInTime: null, status: 'absent' },
  { id: 'r5', studentId: 's5', studentName: '刘子墨', studentNo: '2024005', className: '高二(1)班', date: TODAY, checkInTime: '07:50', status: 'present' },
  { id: 'r6', studentId: 's6', studentName: '周诗涵', studentNo: '2024006', className: '高二(1)班', date: TODAY, checkInTime: null, status: 'leave', remark: '病假' },
  { id: 'r7', studentId: 's7', studentName: '黄景行', studentNo: '2024007', className: '高二(2)班', date: TODAY, checkInTime: '07:35', status: 'present' },
  { id: 'r8', studentId: 's8', studentName: '吴佳怡', studentNo: '2024008', className: '高二(2)班', date: TODAY, checkInTime: '08:22', status: 'late' },
  { id: 'r9', studentId: 's9', studentName: '郑明轩', studentNo: '2024009', className: '高三(1)班', date: TODAY, checkInTime: '07:28', status: 'present' },
  { id: 'r10', studentId: 's10', studentName: '孙语嫣', studentNo: '2024010', className: '高三(1)班', date: TODAY, checkInTime: '07:45', status: 'present' },
  { id: 'r11', studentId: 's11', studentName: '马俊杰', studentNo: '2024011', className: '高三(2)班', date: TODAY, checkInTime: null, status: 'absent' },
  { id: 'r12', studentId: 's12', studentName: '徐若溪', studentNo: '2024012', className: '高三(2)班', date: TODAY, checkInTime: '07:55', status: 'present' },
  { id: 'h1', studentId: 's1', studentName: '陈思远', studentNo: '2024001', className: '高一(1)班', date: '2026-08-24', checkInTime: '07:40', status: 'present' },
  { id: 'h2', studentId: 's2', studentName: '林雨桐', studentNo: '2024002', className: '高一(1)班', date: '2026-08-24', checkInTime: '07:52', status: 'present' },
  { id: 'h3', studentId: 's3', studentName: '王浩然', studentNo: '2024003', className: '高一(2)班', date: '2026-08-24', checkInTime: null, status: 'leave', remark: '事假' },
  { id: 'h4', studentId: 's4', studentName: '赵婉清', studentNo: '2024004', className: '高一(2)班', date: '2026-08-24', checkInTime: '08:10', status: 'late' },
  { id: 'h5', studentId: 's5', studentName: '刘子墨', studentNo: '2024005', className: '高二(1)班', date: '2026-08-24', checkInTime: '07:48', status: 'present' },
  { id: 'h6', studentId: 's1', studentName: '陈思远', studentNo: '2024001', className: '高一(1)班', date: '2026-08-23', checkInTime: '07:36', status: 'present' },
  { id: 'h7', studentId: 's2', studentName: '林雨桐', studentNo: '2024002', className: '高一(1)班', date: '2026-08-23', checkInTime: null, status: 'absent' },
  { id: 'h8', studentId: 's9', studentName: '郑明轩', studentNo: '2024009', className: '高三(1)班', date: '2026-08-23', checkInTime: '07:30', status: 'present' },
]
