module.exports = (req, res) => {
  res.setHeader('Set-Cookie', 'agi_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');
  res.setHeader('Location', '/');
  res.status(302).send('');
};
