import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token && token.startsWith('guest-')) {
    const guestId = token;
    req.user = {
      id: guestId,
      email: `${guestId}@local.chathive`,
      username: `Guest${guestId.slice(-4)}`
    };
    return next();
  }

  if (!token) {
    req.user = {
      id: 'guest-anon',
      email: 'guest-anon@local.chathive',
      username: 'GuestAnon'
    };
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      const guestId = `guest-${Date.now()}`;
      req.user = {
        id: guestId,
        email: `${guestId}@local.chathive`,
        username: `Guest${guestId.slice(-4)}`
      };
      return next();
    }
    req.user = user;
    next();
  });
};
