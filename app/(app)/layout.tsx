import BottomNav from '@/components/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20" style={{ position: 'relative', zIndex: 1 }}>
      {children}
      <BottomNav />
    </div>
  )
}
