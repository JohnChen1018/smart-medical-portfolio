export function deviceFromRequest(request: Request) {
  const ua = request.headers.get("user-agent") || "";
  const mobile = request.headers.get("sec-ch-ua-mobile");
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "平板";
  if (mobile === "?1" || /Mobi|iPhone|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return "手機";
  if (!ua.trim()) return "";
  return "電腦";
}
