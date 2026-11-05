const app = require('../server.js');

module.exports = (req, res) => {
  const [pathname, search] = (req.url || '/').split('?');
  const query = search ? '?' + search : '';

  // Se a rota requisitada for uma página HTML direta, preserva a rota original
  if (
    pathname === '/' ||
    pathname === '/index.html' ||
    pathname === '/admin' ||
    pathname === '/admin.html' ||
    pathname === '/votar' ||
    pathname === '/votar.html' ||
    pathname === '/texturas' ||
    pathname === '/texturas.html' ||
    pathname === '/rankings' ||
    pathname === '/rankings.html'
  ) {
    req.url = pathname + query;
    return app(req, res);
  }

  // Se for arquivo estático (estilos, scripts, imagens, downloads)
  if (
    pathname.startsWith('/images') ||
    pathname.startsWith('/products') ||
    pathname.startsWith('/downloads') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg')
  ) {
    req.url = pathname + query;
    return app(req, res);
  }

  // Para rotas de API que a Vercel possa ter repassado sem o prefixo /api
  if (!pathname.startsWith('/api')) {
    req.url = '/api' + (pathname.startsWith('/') ? pathname : '/' + pathname) + query;
  }

  return app(req, res);
};
