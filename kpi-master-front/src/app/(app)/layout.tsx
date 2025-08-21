import Sidebar from '@/components/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex font-mono">
      <Sidebar />
      <main className="flex-1 bg-gray-100">{children}</main>
    </div>
  );
}
