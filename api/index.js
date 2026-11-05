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
    pathname === '/vote' ||
    pathname === '/vote.html' ||
    pathname === '/regras' ||
    pathname === '/rules' ||
    pathname === '/rules.html' ||
    pathname === '/equipe' ||
    pathname === '/staff' ||
    pathname === '/staff.html' ||
    pathname === '/faq' ||
    pathname === '/faq.html' ||
    pathname === '/texturas' ||
    pathname === '/texturas.html' ||
    pathname === '/rankings' ||
    pathname === '/rankings.html'
  ) {
    req.url = pathname + query;
    return app(req, res);
  }

  // Se for arquivo estático (estilos, scripts, imagens, downloads, fontes, assets do Sunstone)
  if (
    pathname.startsWith('/assets') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/products') ||
    pathname.startsWith('/downloads') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.eot') ||
    pathname.endsWith('.json')
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
