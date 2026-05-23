import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  return <AdminSidebar email={session.email}>{children}</AdminSidebar>
}
