// ====================================================
// Ravok Discord Bot — Entry Point (MagnoHost / Pterodactyl)
// ====================================================

console.log('----------------------------------------------------');
console.log('  🍂 Ravok Network — Discord Bot Container (MagnoHost)');
console.log('----------------------------------------------------');

const bot = require('./bot.js');

// Mantém o container Pterodactyl ativo continuamente
const keepAliveTimer = setInterval(() => {}, 1000 * 60 * 60);

async function start() {
  if (bot && typeof bot.startBot === 'function') {
    try {
      const result = await bot.startBot();
      if (result && result.success) {
        console.log(`[Bot Init] Conectado e autenticado com sucesso! (${result.user || 'Online'})`);
      } else {
        console.warn('[Bot Init] Aviso durante a inicialização:', result ? result.message || result.error : 'Sem resposta');
      }
    } catch (err) {
      console.error('[Bot Init Error]:', err && err.message ? err.message : err);
    }
  } else {
    console.error('[Bot Init Fatal]: Módulo bot.js não exportou startBot!');
  }
}

start();

// Tratamento de encerramento gracioso via painel Pterodactyl
process.on('SIGTERM', () => {
  console.log('[Bot] Encerrando com segurança via SIGTERM...');
  clearInterval(keepAliveTimer);
  if (bot && typeof bot.stopBot === 'function') {
    bot.stopBot();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Bot] Encerrando com segurança via SIGINT...');
  clearInterval(keepAliveTimer);
  if (bot && typeof bot.stopBot === 'function') {
    bot.stopBot();
  }
  process.exit(0);
});
