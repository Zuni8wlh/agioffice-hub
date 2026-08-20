const crypto = require('crypto');

const HUB_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AGI Office</title>
<style>
  :root{ --ink:#1a1a1a; --muted:#6b6b6b; --line:#dcdcdc; --blue:#1a56db; }
  *{box-sizing:border-box;}
  body{
    margin:0; font-family:'Segoe UI', Arial, sans-serif; background:#ffffff; color:var(--ink);
    min-height:100vh; display:flex; flex-direction:column; align-items:center; padding:64px 24px;
  }
  header{ text-align:center; margin-bottom:48px; max-width:520px; }
  h1{ font-size:26px; margin:0 0 8px; letter-spacing:.01em; }
  header p{ font-size:14px; color:var(--muted); margin:0; line-height:1.6; }
  .grid{ display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:18px; width:100%; max-width:820px; }
  a.card{ display:block; text-decoration:none; color:inherit; border:1px solid var(--line); border-radius:10px; padding:24px 22px; transition:border-color .15s, box-shadow .15s; }
  a.card:hover{ border-color:var(--blue); box-shadow:0 6px 18px rgba(0,0,0,.08); }
  .card .tag{ font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--blue); margin-bottom:10px; display:block; }
  .card h2{ font-size:17px; margin:0 0 8px; }
  .card p{ font-size:13px; color:var(--muted); margin:0; line-height:1.55; }
  footer{ margin-top:56px; font-size:12px; color:#a0a0a0; text-align:center; }
  footer a{ color:#a0a0a0; }
  @media (max-width: 600px){
    body{ padding:40px 16px; }
    .grid{ grid-template-columns:1fr 1fr; gap:10px; }
    a.card{ padding:14px 12px; border-radius:8px; }
    .card .tag{ font-size:9px; margin-bottom:6px; }
    .card h2{ font-size:14px; margin:0 0 5px; }
    .card p{ font-size:11.5px; line-height:1.45; }
  }
</style>
</head>
<body>
<header>
  <h1>AGI Office</h1>
  <p>Internal tools for daily office work</p>
</header>
<div class="grid">
  <a class="card" href="https://screener.agioffice.online">
    <span class="tag">Sales research</span>
    <h2>Company Screener</h2>
    <p>Upload a list of companies and automatically find their contacts and status.</p>
  </a>
  <a class="card" href="https://archive.agioffice.online">
    <span class="tag">Supplier reference</span>
    <h2>Brochure Archive</h2>
    <p>Search and browse the archive of textile exhibition brochures by category.</p>
  </a>
  <a class="card" href="https://address.agioffice.online">
    <span class="tag">Documents</span>
    <h2>Address Generator</h2>
    <p>Build and print address labels for shipments, ready for A4.</p>
  </a>
</div>
<footer>agioffice.online &middot; <a href="/api/logout">Log out</a></footer>
</body>
</html>
`;

function loginHtml(showError, returnUrl){
  const safeReturn = (returnUrl || '').replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Log in, AGI Office</title>
<style>
  :root{ --ink:#1a1a1a; --muted:#6b6b6b; --line:#dcdcdc; --blue:#1a56db; }
  *{box-sizing:border-box;}
  body{
    margin:0; font-family:'Segoe UI', Arial, sans-serif; background:#ffffff; color:var(--ink);
    min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px;
  }
  .card{ width:100%; max-width:340px; text-align:center; }
  h1{ font-size:20px; margin:0 0 6px; }
  p.sub{ font-size:13px; color:var(--muted); margin:0 0 28px; }
  label{ display:block; text-align:left; font-size:12px; font-weight:600; margin:0 0 5px; color:#3a3628; }
  input{
    width:100%; padding:10px 12px; font-size:14px; border:1px solid var(--line); border-radius:6px;
    margin-bottom:16px; font-family:inherit; background:#fff; color:var(--ink);
  }
  button{
    width:100%; padding:11px; border:none; border-radius:6px; background:var(--blue); color:#fff;
    font-size:14px; font-weight:700; cursor:pointer; margin-top:4px;
  }
  button:hover{ background:#12409e; }
  .error{
    background:#fdecea; color:#a3241a; font-size:12.5px; padding:9px 12px; border-radius:6px; margin-bottom:18px; text-align:left;
  }
</style>
</head>
<body>
  <div class="card">
    <h1>AGI Office</h1>
    <p class="sub">Log in to continue</p>
    ${showError ? '<div class="error">Wrong username or password. Try again.</div>' : ''}
    <form method="POST" action="/api/login">
      <input type="hidden" name="return" value="${safeReturn}">
      <label for="username">Username</label>
      <input type="text" id="username" name="username" autocomplete="username" autofocus>
      <label for="password">Password</label>
      <input type="password" id="password" name="password" autocomplete="current-password">
      <button type="submit">Log in</button>
    </form>
  </div>
</body>
</html>
`;
}

function parseCookies(header){
  const out = {};
  if(!header) return out;
  header.split(';').forEach(part=>{
    const idx = part.indexOf('=');
    if(idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if(k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function safeEqual(a, b){
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if(bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifySession(token, secret){
  if(!token || !secret) return false;
  const parts = token.split('.');
  if(parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if(!safeEqual(sig, expected)) return false;
  const expiry = parseInt(payload, 10);
  if(!expiry || Date.now() > expiry) return false;
  return true;
}

module.exports = (req, res) => {
  const secret = process.env.SESSION_SECRET;
  if(!secret){
    res.status(500).send('Login is not fully configured yet. Set SESSION_SECRET in Vercel Environment Variables.');
    return;
  }

  const cookies = parseCookies(req.headers.cookie);
  const authed = verifySession(cookies.agi_session, secret);

  let showError = false;
  let returnUrl = '';
  try{
    const url = new URL(req.url, 'http://placeholder');
    showError = url.searchParams.get('error') === '1';
    returnUrl = url.searchParams.get('return') || '';
  }catch(e){}

  if(authed){
    if(returnUrl && /^https:\/\/[a-z0-9-]+\.agioffice\.online\/?/i.test(returnUrl)){
      res.setHeader('Location', returnUrl);
      res.status(302).send('');
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(HUB_HTML);
    return;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(loginHtml(showError, returnUrl));
};
