import { AdminShell } from "@/components/admin/AdminShell";

// 觸發伺服器端備份排程心跳（透過後台進入時）
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}