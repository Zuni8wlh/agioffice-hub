const crypto = require('crypto');

function safeEqual(a, b){
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if(bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function makeSession(secret){
  const expiry = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
  const payload = String(expiry);
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return payload + '.' + sig;
}

module.exports = (req, res) => {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;
  const secret = process.env.SESSION_SECRET;

  if(!user || !pass || !secret){
    res.status(500).send('Login is not fully configured yet. Set BASIC_AUTH_USER, BASIC_AUTH_PASS, and SESSION_SECRET in Vercel Environment Variables.');
    return;
  }

  const body = req.body || {};
  const username = body.username || '';
  const password = body.password || '';
  const returnUrl = body.return || '';

  const ok = username && password && safeEqual(username, user) && safeEqual(password, pass);

  if(!ok){
    const errUrl = returnUrl ? `/?error=1&return=${encodeURIComponent(returnUrl)}` : '/?error=1';
    res.setHeader('Location', errUrl);
    res.status(302).send('');
    return;
  }

  const token = makeSession(secret);
  // Domain (no leading dot needed) makes this cookie readable by all *.agioffice.online subdomains too.
  res.setHeader('Set-Cookie', `agi_session=${token}; Path=/; Domain=agioffice.online; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`);

  const dest = (returnUrl && /^https:\/\/[a-z0-9-]+\.agioffice\.online\/?/i.test(returnUrl)) ? returnUrl : '/';
  res.setHeader('Location', dest);
  res.status(302).send('');
};
