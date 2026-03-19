export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
  background:#0a0a0a;color:#e4e4e7;min-height:100vh;
}
.emu-bar{
  background:#141414;border-bottom:1px solid #2a2a2a;padding:10px 20px;
  display:flex;align-items:center;gap:10px;font-size:.8125rem;color:#a1a1aa;
}
.emu-badge{
  display:inline-flex;align-items:center;gap:4px;
  background:#422006;color:#fbbf24;font-size:.6875rem;font-weight:700;
  padding:2px 8px;border-radius:4px;letter-spacing:.04em;text-transform:uppercase;
}
.emu-bar-title{font-weight:600;color:#e4e4e7;}
.emu-bar-service{color:#71717a;margin-left:auto;font-size:.75rem;}

/* Card page (consent, error) */
.card-wrap{
  display:flex;align-items:center;justify-content:center;
  min-height:calc(100vh - 42px);padding:24px 16px;
}
.card{
  background:#141414;border:1px solid #2a2a2a;border-radius:10px;
  padding:24px 22px 18px;width:100%;max-width:420px;
  box-shadow:0 12px 40px rgba(0,0,0,.5);
}
.card-title{font-size:1.125rem;font-weight:600;margin-bottom:4px;color:#e4e4e7;}
.card-subtitle{color:#71717a;font-size:.8125rem;margin-bottom:18px;line-height:1.45;}
.card-footer{
  margin-top:18px;padding-top:14px;border-top:1px solid #1e1e1e;
  text-align:center;font-size:.6875rem;color:#52525b;
}

/* Error card */
.error-title{color:#ef4444;font-size:1.125rem;font-weight:600;margin-bottom:8px;}
.error-msg{color:#a1a1aa;font-size:.875rem;line-height:1.5;}
.error-card{text-align:center;}

/* User button */
.user-form{margin-bottom:8px;}
.user-form:last-of-type{margin-bottom:0;}
.user-btn{
  width:100%;display:flex;align-items:center;gap:12px;
  padding:10px 12px;border:1px solid #2a2a2a;border-radius:8px;
  background:#0a0a0a;color:inherit;cursor:pointer;text-align:left;
  font:inherit;transition:background .15s,border-color .15s;
}
.user-btn:hover{background:#1a1a1a;border-color:#fbbf24;}
.avatar{
  width:36px;height:36px;border-radius:50%;
  background:#422006;color:#fbbf24;font-weight:600;font-size:.875rem;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.user-text{min-width:0;}
.user-login{font-weight:600;font-size:.875rem;display:block;color:#e4e4e7;}
.user-meta{color:#71717a;font-size:.75rem;margin-top:1px;}
.user-email{font-size:.6875rem;color:#52525b;word-break:break-all;margin-top:1px;}

/* Settings layout */
.settings-layout{
  max-width:920px;margin:0 auto;padding:28px 20px;
  display:flex;gap:28px;
}
.settings-sidebar{width:200px;flex-shrink:0;}
.settings-sidebar a{
  display:block;padding:6px 10px;border-radius:6px;color:#a1a1aa;
  text-decoration:none;font-size:.8125rem;transition:background .15s;
}
.settings-sidebar a:hover{background:#1a1a1a;color:#e4e4e7;}
.settings-sidebar a.active{background:#1a1a1a;color:#e4e4e7;font-weight:600;}
.settings-main{flex:1;min-width:0;}

/* Settings cards */
.s-card{
  background:#141414;border:1px solid #2a2a2a;border-radius:8px;
  padding:18px;margin-bottom:14px;
}
.s-card-header{display:flex;align-items:center;gap:14px;margin-bottom:14px;}
.s-icon{
  width:42px;height:42px;border-radius:8px;
  background:#1e1e1e;display:flex;align-items:center;justify-content:center;
  font-size:1.125rem;font-weight:700;color:#71717a;flex-shrink:0;
}
.s-title{font-size:1.25rem;font-weight:600;color:#e4e4e7;}
.s-subtitle{font-size:.75rem;color:#71717a;margin-top:2px;}
.section-heading{
  font-size:.9375rem;font-weight:600;margin-bottom:10px;color:#e4e4e7;
  display:flex;align-items:center;justify-content:space-between;
}
.perm-list{list-style:none;}
.perm-list li{padding:5px 0;font-size:.8125rem;display:flex;align-items:center;gap:6px;color:#a1a1aa;}
.check{color:#22c55e;}
.org-row{
  display:flex;align-items:center;gap:8px;padding:7px 0;
  border-bottom:1px solid #1e1e1e;font-size:.8125rem;
}
.org-row:last-child{border-bottom:none;}
.org-icon{
  width:22px;height:22px;border-radius:4px;background:#1e1e1e;
  display:flex;align-items:center;justify-content:center;
  font-size:.625rem;font-weight:700;color:#71717a;flex-shrink:0;
}
.org-name{font-weight:600;color:#e4e4e7;}
.badge{font-size:.6875rem;padding:1px 7px;border-radius:999px;font-weight:500;}
.badge-granted{background:#052e16;color:#22c55e;}
.badge-denied{background:#2a0a0a;color:#ef4444;}
.badge-requested{background:#2a1a05;color:#f59e0b;}
.btn-revoke{
  display:inline-block;padding:5px 14px;border-radius:6px;
  border:1px solid #ef4444;background:transparent;color:#ef4444;
  font-size:.75rem;font-weight:600;cursor:pointer;transition:background .15s;
}
.btn-revoke:hover{background:rgba(239,68,68,.1);}
.info-text{color:#71717a;font-size:.75rem;line-height:1.5;margin-top:10px;}
.app-link{
  display:flex;align-items:center;gap:12px;padding:12px;
  border:1px solid #2a2a2a;border-radius:8px;background:#0a0a0a;
  text-decoration:none;color:inherit;margin-bottom:8px;transition:background .15s,border-color .15s;
}
.app-link:hover{background:#1a1a1a;border-color:#fbbf24;}
.app-link-name{font-weight:600;font-size:.875rem;color:#e4e4e7;}
.app-link-scopes{font-size:.6875rem;color:#71717a;margin-top:1px;}
.empty{color:#71717a;text-align:center;padding:28px 0;font-size:.875rem;}
.page-footer{margin-top:20px;text-align:center;font-size:.6875rem;color:#3f3f46;}
`;

function emuBar(service?: string): string {
  return `<div class="emu-bar">
  <span class="emu-badge">emulator</span>
  <span class="emu-bar-title">emulate</span>
  ${service ? `<span class="emu-bar-service">${escapeHtml(service)}</span>` : ""}
</div>`;
}

function head(title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(title)} | emulate</title>
<style>${CSS}</style>
</head>`;
}

export function renderCardPage(
  title: string,
  subtitle: string,
  body: string,
  service?: string
): string {
  return `${head(title)}
<body>
${emuBar(service)}
<div class="card-wrap">
  <div class="card">
    <div class="card-title">${escapeHtml(title)}</div>
    <div class="card-subtitle">${subtitle}</div>
    ${body}
    <div class="card-footer">emulate</div>
  </div>
</div>
</body></html>`;
}

export function renderErrorPage(title: string, message: string, service?: string): string {
  return `${head(title)}
<body>
${emuBar(service)}
<div class="card-wrap">
  <div class="card error-card">
    <div class="error-title">${escapeHtml(title)}</div>
    <div class="error-msg">${escapeHtml(message)}</div>
    <div class="card-footer">emulate</div>
  </div>
</div>
</body></html>`;
}

export function renderSettingsPage(
  title: string,
  sidebarHtml: string,
  bodyHtml: string,
  service?: string
): string {
  return `${head(title)}
<body>
${emuBar(service)}
<div class="settings-layout">
  <nav class="settings-sidebar">${sidebarHtml}</nav>
  <div class="settings-main">${bodyHtml}</div>
</div>
<div class="page-footer">emulate</div>
</body></html>`;
}

export interface UserButtonOptions {
  letter: string;
  login: string;
  name?: string;
  email?: string;
  formAction: string;
  hiddenFields: Record<string, string>;
}

export function renderUserButton(opts: UserButtonOptions): string {
  const hiddens = Object.entries(opts.hiddenFields)
    .map(([k, v]) => `<input type="hidden" name="${escapeAttr(k)}" value="${escapeAttr(v)}"/>`)
    .join("");

  const nameLine = opts.name
    ? `<div class="user-meta">${escapeHtml(opts.name)}</div>`
    : "";
  const emailLine = opts.email
    ? `<div class="user-email">${escapeHtml(opts.email)}</div>`
    : "";

  return `<form class="user-form" method="post" action="${escapeAttr(opts.formAction)}">
${hiddens}
<button type="submit" class="user-btn">
  <span class="avatar">${escapeHtml(opts.letter)}</span>
  <span class="user-text">
    <span class="user-login">${escapeHtml(opts.login)}</span>
    ${nameLine}${emailLine}
  </span>
</button>
</form>`;
}
