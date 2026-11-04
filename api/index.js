const app = require('../server.js');

module.exports = (req, res) => {
  // Garante que o Express sempre receba rotas com o prefixo /api
  // Independentemente de a Vercel reescrever como /api ou repassar a URL original
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
};
