const jwt = require('jsonwebtoken');

function attachUserIfExists(req, res, next) {
  const authHeader = req.headers.authorization || req.cookies.token;

  if (!authHeader) {
    return next();
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // Token inválido, ignoramos
  }

  next();
}
