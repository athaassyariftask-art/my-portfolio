import { redirect } from 'next/navigation'
import { isStaff } from './api'

/** Dipanggil di layout admin: belum login / sesi kadaluarsa -> ke halaman login. */
export async function requireAdmin() {
  if (!(await isStaff())) redirect('/admin/login')
}
