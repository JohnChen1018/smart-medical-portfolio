export type PortalRole = "admin" | "user" | "guest";

export const ROLE_LABELS: Record<string, string> = {
  admin: "管理員",
  user: "使用者",
  guest: "訪客",
};

export const ROLE_HELP = {
  admin: "可管理帳號、備份排程、操作記錄、內容修改（完整權限）",
  user: "可修改網站內容、查看操作記錄、封鎖來訪位址（無法管理帳號與備份）",
};

export function canManageAccounts(role: string) {
  return role === "admin";
}

export function canManageBackups(role: string) {
  return role === "admin";
}

export function canViewLogs(role: string) {
  return role === "admin" || role === "user";
}

export function canBlockVisitors(role: string) {
  return role === "admin" || role === "user";
}

export function canEditContent(role: string) {
  return role === "admin" || role === "user";
}
