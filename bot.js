// ====================================================
// Ravok Site — Bot Oficial para o Discord
// ====================================================

const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActivityType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits,
  AttachmentBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const { generateWelcomeCard } = require('./welcomeCard.js');

// Carregamento automático e resiliente do .env se existir
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  try {
    const rawEnv = fs.readFileSync(envFile, 'utf8');
    for (const line of rawEnv.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch (e) {}
}

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const API_BASE = process.env.API_URL || 'https://ravok-site.vercel.app';
const SERVER_IP = 'jogar.ravok.network';

function getDbSettings() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(content);
      return parsed.settings || {};
    }
  } catch (e) {
    console.error('[Bot] Erro ao ler settings do db.json:', e.message);
  }
  return {};
}

function saveDbAtomic(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('[Bot] Erro ao salvar db.json atomicamente:', err.message);
    return false;
  }
}

// ----------------------------------------------------
// CONSULTA ROBUSTA AO VIVO DO SERVIDOR MINECRAFT (SEM DEPENDER DE LOCALHOST)
// ----------------------------------------------------
let mcStatusCache = {
  data: null,
  timestamp: 0
};

async function fetchMinecraftStatus(forceFresh = false) {
  const settings = getDbSettings();
  const serverIp = (settings.serverIp || settings.minecraftIp || process.env.MINECRAFT_IP || SERVER_IP).trim();
  const now = Date.now();

  // Cache inteligente de 25 segundos para evitar sobrecarga e rate limit
  if (!forceFresh && mcStatusCache.data && (now - mcStatusCache.timestamp) < 25000) {
    return mcStatusCache.data;
  }

  // 1. Provedor Primário: api.mcstatus.io (consulta Java Spigot/Paper direta)
  try {
    const res = await fetch(`https://api.mcstatus.io/v2/status/java/${encodeURIComponent(serverIp)}`, {
      headers: { 'User-Agent': 'RavokNetwork-DiscordBot/2.0' },
      signal: AbortSignal.timeout(4500)
    });
    if (res.ok) {
      const data = await res.json();
      const result = {
        online: Boolean(data.online),
        ip: serverIp,
        players: {
          online: data.players && typeof data.players.online === 'number' ? data.players.online : 0,
          max: data.players && typeof data.players.max === 'number' ? data.players.max : 100,
          list: data.players && Array.isArray(data.players.list) 
            ? data.players.list.map(p => p.name_clean || p.name_raw || p.name).filter(Boolean)
            : []
        },
        version: data.version ? (data.version.name_clean || data.version.name_raw || '1.20+') : '1.20+',
        motd: data.motd ? (data.motd.clean || 'Ravok Network') : 'Ravok Network',
        icon: data.icon || null
      };
      mcStatusCache = { data: result, timestamp: now };
      return result;
    }
  } catch (err) {
    logBot('warn', `mcstatus.io inacessível para ${serverIp}, consultando provedor secundário...`);
  }

  // 2. Provedor Secundário: api.mcsrvstat.us
  try {
    const res = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(serverIp)}`, {
      signal: AbortSignal.timeout(4500)
    });
    if (res.ok) {
      const fbData = await res.json();
      const result = {
        online: Boolean(fbData.online),
        ip: serverIp,
        players: {
          online: fbData.players && typeof fbData.players.online === 'number' ? fbData.players.online : 0,
          max: fbData.players && typeof fbData.players.max === 'number' ? fbData.players.max : 100,
          list: fbData.players && Array.isArray(fbData.players.list) ? fbData.players.list.map(p => p.name).filter(Boolean) : []
        },
        version: fbData.version || '1.20+',
        motd: (fbData.motd && Array.isArray(fbData.motd.clean)) ? fbData.motd.clean.join(' ') : 'Ravok Network',
        icon: fbData.icon || null
      };
      mcStatusCache = { data: result, timestamp: now };
      return result;
    }
  } catch (err) {}

  // 3. Fallback: Preserva cache anterior caso a rede oscile temporariamente
  if (mcStatusCache.data) {
    return mcStatusCache.data;
  }

  return {
    online: false,
    ip: serverIp,
    players: { online: 0, max: 100, list: [] },
    version: '1.20.1+',
    motd: 'Ravok Network'
  };
}

// Determinar intents do bot (intents padrão evitam erro "Used disallowed intents")
const wantsPrivileged = process.env.DISCORD_PRIVILEGED_INTENTS === 'true';

const botIntents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMessageReactions
];

if (wantsPrivileged) {
  botIntents.push(GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers);
  console.log('[Bot] Intents privilegiados ativados (MessageContent, GuildMembers).');
} else {
  console.log('[Bot] Rodando com intents padrão homologados (Guilds, GuildMessages, Reactions).');
}

const client = new Client({
  intents: botIntents,
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

// Tratamento global de erros do cliente Discord para evitar quebra do processo Node
client.on('error', (err) => {
  console.warn('[Bot] [WARN] Erro capturado no Discord Client:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('[Bot] [FATAL] uncaughtException interceptada:', err && err.stack ? err.stack : err);
});

process.on('unhandledRejection', (reason) => {
  console.warn('[Bot] [WARN] Rejeição de Promise interceptada:', reason && reason.message ? reason.message : reason);
});

// Comandos Slash
const commands = [
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Consulta o status ao vivo do servidor Minecraft (jogar.ravok.network)'),

  new SlashCommandBuilder()
    .setName('ip')
    .setDescription('Exibe o IP oficial do servidor e informações de conexão'),

  new SlashCommandBuilder()
    .setName('loja')
    .setDescription('Exibe o link da loja oficial e os itens mais vendidos'),

  new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Visualiza o perfil e estatísticas de um jogador no servidor')
    .addStringOption(opt => 
      opt.setName('nick')
        .setDescription('Nick do jogador no Minecraft')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('vincular')
    .setDescription('Vincula sua conta do Minecraft com seu Discord usando o código do /vincular')
    .addStringOption(opt => 
      opt.setName('codigo')
        .setDescription('Código de 6 dígitos gerado no Minecraft com /vincular')
        .setRequired(true)
    )
    .addStringOption(opt => 
      opt.setName('nick')
        .setDescription('Seu nick exato no Minecraft')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('kayzel')
    .setDescription('Converse com a Kayzel, o assistente oficial da Ravok Network')
    .addStringOption(opt =>
      opt.setName('pergunta')
        .setDescription('Sua dúvida ou conversa para o Kayzel responder')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('sugestao')
    .setDescription('Envie uma sugestão oficial para a equipe do servidor')
    .addStringOption(opt =>
      opt.setName('mensagem')
        .setDescription('Escreva sua sugestão com detalhes')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('confissao')
    .setDescription('Envie uma confissão 100% anônima para a comunidade')
    .addStringOption(opt =>
      opt.setName('mensagem')
        .setDescription('Escreva sua confissão anônima')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('testwelcome')
    .setDescription('[Admin] Testa a imagem personalizada de boas-vindas')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('limpar')
    .setDescription('Apaga mensagens recentes do canal atual (Moderação / Limpar Chat)')
    .addIntegerOption(opt =>
      opt.setName('quantidade')
        .setDescription('Quantidade de mensagens a apagar (de 1 a 100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Apaga mensagens recentes do canal atual (Moderação / Limpar Chat)')
    .addIntegerOption(opt =>
      opt.setName('quantidade')
        .setDescription('Quantidade de mensagens a apagar (de 1 a 100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
];

// ----------------------------------------------------
// SISTEMA DE LOGS EM MEMÓRIA
// ----------------------------------------------------
const botLogs = [];
function logBot(level, message) {
  const time = new Date().toLocaleTimeString('pt-BR');
  const entry = { time, level, message };
  botLogs.push(entry);
  if (botLogs.length > 50) botLogs.shift();
  console.log(`[Bot] [${level.toUpperCase()}] ${message}`);
}

// ----------------------------------------------------
// EVENTO READY & REGISTRO DE COMANDOS
// ----------------------------------------------------
let presenceInterval = null;
let statusChannelsInterval = null;

client.on('ready', async () => {
  logBot('info', `🤖 Bot conectado ao Discord com sucesso como: ${client.user.tag}`);

  try {
    await client.application.commands.set(commands);
    for (const guild of client.guilds.cache.values()) {
      await guild.commands.set(commands).catch(() => {});
    }
    logBot('info', `✓ ${commands.length} Comandos Slash registrados com sucesso em todas as guildas! (/status, /ip, /loja, /perfil, /vincular, /silvie, /sugestao, /confissao, /testwelcome, /limpar, /clear)`);
  } catch (err) {
    logBot('error', `Falha ao registrar comandos slash: ${err.message}`);
  }

  if (presenceInterval) clearInterval(presenceInterval);
  updateBotPresence();
  presenceInterval = setInterval(updateBotPresence, 45000);

  if (statusChannelsInterval) clearInterval(statusChannelsInterval);
  setTimeout(() => {
    syncServerStatusChannels().catch(e => logBot('error', `Falha ao sincronizar canais de status: ${e.message}`));
  }, 3000);
  statusChannelsInterval = setInterval(() => {
    syncServerStatusChannels().catch(e => logBot('error', `Falha ao sincronizar canais de status: ${e.message}`));
  }, 5 * 60 * 1000);
});

// Atualizar presença do bot em tempo real com dados ao vivo do Minecraft
async function updateBotPresence() {
  if (!client.user) return;
  try {
    const status = await fetchMinecraftStatus();
    const serverIp = status.ip || SERVER_IP;

    if (status.online) {
      const count = status.players ? status.players.online : 0;
      client.user.setPresence({
        activities: [{
          name: `${serverIp} | ${count} online`,
          type: ActivityType.Playing
        }],
        status: 'online'
      });
      return;
    } else {
      client.user.setPresence({
        activities: [{
          name: `${serverIp} | Manutenção`,
          type: ActivityType.Watching
        }],
        status: 'idle'
      });
      return;
    }
  } catch (e) {
    logBot('warn', `Erro ao atualizar presença: ${e.message}`);
  }

  client.user.setPresence({
    activities: [{
      name: `${SERVER_IP} | Loja & Comunidade`,
      type: ActivityType.Watching
    }],
    status: 'online'
  });
}

// ----------------------------------------------------
// INTERAÇÕES (SLASH COMMANDS)
// ----------------------------------------------------
client.on('interactionCreate', async (interaction) => {
  try {
    // ----------------------------------------------------
    // BOTÕES INTERATIVOS (PAINÉIS DO KAYZEL)
    // ----------------------------------------------------
    if (interaction.isButton()) {
      return await handleButtonInteraction(interaction);
    }

    // ----------------------------------------------------
    // MODAIS ENVIADOS PELOS USUÁRIOS
    // ----------------------------------------------------
    if (interaction.isModalSubmit()) {
      return await handleModalSubmit(interaction);
    }

    if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // COMANDO: /status
  if (commandName === 'status') {
    await interaction.deferReply();
    try {
      const data = await fetchMinecraftStatus(true);
      const isOnline = Boolean(data.online);
      const settings = getDbSettings();
      const storeUrl = (settings.apiUrl || process.env.API_URL || 'https://loja.ravok.network').replace(/\/$/, '');

      const embed = new EmbedBuilder()
        .setTitle(isOnline ? '🟢 Servidor Online!' : '🔴 Servidor Offline')
        .setColor(isOnline ? 0x00FFCC : 0xef4444)
        .setDescription(isOnline 
          ? `O servidor **Ravok Network** está online e operando normalmente!` 
          : `O servidor está temporariamente offline ou em manutenção.`
        )
        .addFields(
          { name: '🎮 IP de Conexão', value: `\`${data.ip}\``, inline: true },
          { name: '👥 Jogadores Online', value: isOnline ? `**${data.players.online}** / ${data.players.max}` : '0 / 100', inline: true },
          { name: '⚙️ Versão Suportada', value: isOnline ? `${data.version || '1.20.x - 1.21.x'}` : 'Paper 1.21.x', inline: true },
          { name: '🛒 Loja Oficial', value: `[Acessar Loja](${storeUrl})`, inline: true },
          { name: '🏆 Rankings Web', value: `[Hall da Fama](${storeUrl}/rankings.html)`, inline: true }
        )
        .setFooter({ text: 'Ravok Network • Monitoramento Oficial' })
        .setTimestamp();

      if (isOnline && data.players.list && data.players.list.length > 0) {
        const playerNames = data.players.list.slice(0, 10).join(', ');
        const extra = data.players.list.length > 10 ? ` e mais ${data.players.list.length - 10}...` : '';
        embed.addFields({ name: '✨ Conectados Agora', value: playerNames + extra, inline: false });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Acessar Loja Web')
          .setStyle(ButtonStyle.Link)
          .setURL(storeUrl),
        new ButtonBuilder()
          .setLabel('Ver Rankings')
          .setStyle(ButtonStyle.Link)
          .setURL(`${storeUrl}/rankings.html`)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
      logBot('info', `Comando /status consultado por ${interaction.user.tag}: Servidor ${isOnline ? 'ONLINE' : 'OFFLINE'} (${data.players.online} jogadores)`);
    } catch (e) {
      await interaction.editReply({ content: '❌ Erro ao consultar o status do servidor: ' + e.message });
    }
    return;
  }

  // COMANDO: /ip
  if (commandName === 'ip') {
    const data = await fetchMinecraftStatus();
    const isOnline = Boolean(data.online);
    const settings = getDbSettings();
    const storeUrl = (settings.apiUrl || process.env.API_URL || 'https://loja.ravok.network').replace(/\/$/, '');

    const embed = new EmbedBuilder()
      .setTitle('⚡ Como Entrar no Servidor')
      .setColor(isOnline ? 0x00d4ff : 0xef4444)
      .setDescription(`Conecte-se agora mesmo à maior comunidade survival!`)
      .addFields(
        { name: '🎮 Endereço IP', value: `\`\`\`${data.ip}\`\`\``, inline: false },
        { name: '📌 Status', value: isOnline ? `🟢 Online (${data.players.online} jogadores)` : '🔴 Offline / Manutenção', inline: true },
        { name: '⚙️ Versão', value: 'Minecraft Java 1.20.1 a 1.21+', inline: true },
        { name: '🛒 Loja & VIPs', value: `[loja.ravok.network](${storeUrl})`, inline: true }
      )
      .setFooter({ text: 'Ravok Network • Copie o IP e venha jogar!' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Visitar Loja')
        .setStyle(ButtonStyle.Link)
        .setURL(storeUrl)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
    return;
  }

  // COMANDO: /loja
  if (commandName === 'loja') {
    let products = [];
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      if (res.ok) products = await res.json();
    } catch (e) {}

    const embed = new EmbedBuilder()
      .setTitle('🛒 Loja Oficial — Ravok Network')
      .setColor(0x00d4ff)
      .setDescription('Adquira Coins, Chaves, Ranks VIP e Cosméticos exclusivos com **entrega automática** no servidor via `/resgatar`!')
      .addFields(
        { name: '🪙 Coins & Vantagens', value: 'Coins para gastar na Coin Shop dentro do jogo.', inline: true },
        { name: '🗝️ Chaves de Caixas', value: 'Chaves de Voto, Rara e Épica para o spawn.', inline: true },
        { name: '👑 Ranks VIP', value: 'Kits especiais, tags exclusivas e fila prioritária.', inline: true },
        { name: '💳 Pagamento Seguro', value: 'Pix instantâneo via Mercado Pago com liberação em segundos!', inline: false }
      )
      .setFooter({ text: 'Ravok Network • Entrega 100% Automática' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Abrir Loja Oficial ↗')
        .setStyle(ButtonStyle.Link)
        .setURL(API_BASE)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  // COMANDO: /perfil <nick>
  if (commandName === 'perfil') {
    const nick = interaction.options.getString('nick');
    await interaction.deferReply();

    try {
      const res = await fetch(`${API_BASE}/api/player/${encodeURIComponent(nick)}`);
      const data = res.ok ? await res.json() : null;

      if (!data) {
        return interaction.editReply({ content: `❌ Jogador \`${nick}\` não encontrado no banco de dados.` });
      }

      const stats = data.stats || {};
      const embed = new EmbedBuilder()
        .setTitle(`👤 Perfil de ${nick}`)
        .setColor(0x00d4ff)
        .setThumbnail(`https://mc-heads.net/avatar/${encodeURIComponent(nick)}/128`)
        .setImage(`https://mc-heads.net/body/${encodeURIComponent(nick)}/160`)
        .setDescription(data.linked ? '⭐ **Conta Oficialmente Vinculada**' : '✦ Jogador do Ravok Network')
        .addFields(
          { name: '🪙 Coins', value: Number(stats.coins || 0).toLocaleString('pt-BR'), inline: true },
          { name: '⚔️ Abates (Kills)', value: String(stats.kills || 0), inline: true },
          { name: '⏳ Tempo de Jogo', value: stats.time_played || '0m', inline: true },
          { name: '🗳️ Votos', value: String(stats.votes || 0), inline: true },
          { name: '💎 Saldo (Money)', value: `R$ ${Number(stats.money || 0).toLocaleString('pt-BR')}`, inline: true },
          { name: '🔄 Última Sincronização', value: stats.last_sync ? new Date(stats.last_sync).toLocaleString('pt-BR') : 'Sem dados recentes', inline: true }
        )
        .setFooter({ text: 'Use /ravoksync no Minecraft para atualizar estes dados' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Ver no Hall da Fama ↗')
          .setStyle(ButtonStyle.Link)
          .setURL(`${API_BASE}/rankings.html`)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      await interaction.editReply({ content: '❌ Erro ao carregar o perfil do jogador.' });
    }
  }

  // COMANDO: /vincular <codigo> <nick>
  if (commandName === 'vincular') {
    const rawCodigo = interaction.options.getString('codigo');
    const rawNick = interaction.options.getString('nick');

    await interaction.deferReply({ ephemeral: true });

    let codigo = (rawCodigo || '').trim();
    let nick = (rawNick || '').trim();

    // Se o usuário digitou invertido (código no nick ou nick no código)
    if (/^\d{6}$/.test(nick) && !/^\d{6}$/.test(codigo)) {
      const temp = nick;
      nick = codigo;
      codigo = temp;
    }

    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const db = JSON.parse(raw);

      // Busca pelo nick ou busca pelo código de 6 dígitos
      let stored = null;
      let matchedKey = '';

      if (nick && db.verifyCodes && db.verifyCodes[nick.toLowerCase()]) {
        matchedKey = nick.toLowerCase();
        stored = db.verifyCodes[matchedKey];
      }

      if (!stored && codigo && db.verifyCodes) {
        const found = Object.entries(db.verifyCodes).find(([k, v]) => v && v.code === codigo);
        if (found) {
          matchedKey = found[0];
          stored = found[1];
          if (!nick) nick = stored.nick;
        }
      }

      if (!stored || stored.code !== codigo) {
        return await interaction.editReply({ 
          content: `❌ Código de verificação inválido ou não encontrado para o nick **${nick || 'informado'}**.\n💡 Entre em \`jogar.ravok.network\` e use \`/vincular\` para gerar seu código de 6 dígitos!` 
        });
      }

      if (Date.now() > stored.expiresAt) {
        delete db.verifyCodes[matchedKey];
        saveDbAtomic(db);
        return await interaction.editReply({ 
          content: `❌ O código **${codigo}** expirou.\n💡 Gere um novo código usando \`/vincular\` dentro do servidor!` 
        });
      }

      // Vínculo realizado com sucesso!
      const userTag = interaction.user.tag || interaction.user.username;
      db.linkedAccounts = db.linkedAccounts || [];
      const existingIdx = db.linkedAccounts.findIndex(l => 
        l.discordId === interaction.user.id || 
        l.discordTag === userTag || 
        l.nick.toLowerCase() === stored.nick.toLowerCase()
      );

      const linkRecord = {
        nick: stored.nick,
        discordTag: userTag,
        discordId: interaction.user.id,
        linked_at: new Date().toISOString()
      };

      if (existingIdx >= 0) db.linkedAccounts[existingIdx] = linkRecord;
      else db.linkedAccounts.push(linkRecord);

      delete db.verifyCodes[matchedKey];

      // Recompensa automática de boas-vindas do vínculo para o /resgatar
      db.pendingDeliveries = db.pendingDeliveries || [];
      const alreadyRewarded = db.pendingDeliveries.some(d => d.nick.toLowerCase() === stored.nick.toLowerCase() && d.product_name === 'Recompensa de Conta Vinculada');
      if (!alreadyRewarded) {
        db.pendingDeliveries.push({
          id: Math.floor(10000000 + Math.random() * 89999999),
          orderId: 'VINC-' + Math.floor(1000 + Math.random() * 9000),
          nick: stored.nick,
          product_name: 'Recompensa de Conta Vinculada',
          category: 'Vínculo',
          command: `crate key give ${stored.nick} vote 1`,
          gui_icon: 'TRIPWIRE_HOOK',
          status: 'pending',
          created_at: new Date().toISOString()
        });
      }

      saveDbAtomic(db);

      // Atribuição de cargos no Discord
      const given = [];
      if (interaction.guild && interaction.member) {
        const settings = getDbSettings();
        const rVinc = settings.discordBotRoleVinculado ? interaction.guild.roles.cache.get(settings.discordBotRoleVinculado) : null;
        const rAcess = settings.discordBotRoleAcesso ? interaction.guild.roles.cache.get(settings.discordBotRoleAcesso) : null;
        if (rVinc) { await interaction.member.roles.add(rVinc).catch(() => {}); given.push(rVinc.name); }
        if (rAcess) { await interaction.member.roles.add(rAcess).catch(() => {}); given.push(rAcess.name); }
      }

      const embed = new EmbedBuilder()
        .setTitle('✓ Conta Vinculada com Sucesso!')
        .setColor(0x00FFCC)
        .setDescription(`Parabéns! Sua conta do Minecraft **${stored.nick}** foi vinculada com sucesso ao seu Discord (**${userTag}**).`)
        .addFields(
          { name: 'Jogador', value: `\`${stored.nick}\``, inline: true },
          { name: 'Discord', value: `\`${userTag}\``, inline: true },
          { name: 'Status', value: '🟢 Vinculado e Ativo', inline: true },
          { name: 'Cargos Liberados', value: given.length ? `**${given.join(', ')}**` : 'Cargos atualizados', inline: false },
          { name: 'Recompensa no Jogo', value: 'Entre em `jogar.ravok.network` e use `/resgatar` para retirar sua Chave de Voto!', inline: false }
        )
        .setFooter({ text: 'Ravok Network • Integração Oficial' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      logBot('info', `🔗 ${userTag} vinculou com sucesso a conta ${stored.nick} via /vincular!`);
    } catch (err) {
      logBot('error', `Erro ao processar /vincular: ${err.message}`);
      await interaction.editReply({ content: `❌ Erro interno ao salvar vínculo: ${err.message}` });
    }
  }

  // COMANDO: /silvie
  if (commandName === 'kayzel' || commandName === 'silvie') {
    const pergunta = interaction.options.getString('pergunta');
    await interaction.deferReply();
    try {
      const answer = await askKayzelAI(pergunta, interaction.user.displayName || interaction.user.username);
      const embed = new EmbedBuilder()
        .setTitle('🔮 Kayzel Responde')
        .setColor(0x55e6d8)
        .setDescription(answer.length > 4000 ? answer.slice(0, 3990) + '...' : answer)
        .addFields({ name: 'Sua Pergunta', value: pergunta.slice(0, 1024) })
        .setFooter({ text: 'Ravok Network • Assistente Oficial' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      logBot('info', `Comando /silvie usado por ${interaction.user.tag}`);
    } catch (err) {
      await interaction.editReply({ content: `❌ Erro ao consultar o Kayzel: ${err.message}` });
    }
  }

  // COMANDO: /sugestao
  if (commandName === 'sugestao') {
    const texto = interaction.options.getString('mensagem');
    await interaction.deferReply({ ephemeral: true });

    const settings = getDbSettings();
    const canalSugestoesId = settings.discordBotChannelSugestoes || '1482152390378655816';

    try {
      const canal = await client.channels.fetch(canalSugestoesId);
      if (canal && canal.isTextBased()) {
        const embed = new EmbedBuilder()
          .setTitle('💡 Nova Sugestão da Comunidade!')
          .setColor(0x55e6d8)
          .setThumbnail(interaction.user.displayAvatarURL())
          .setDescription(texto)
          .addFields({ name: 'Autor', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true })
          .setFooter({ text: 'Ravok Network • Votação Aberta' })
          .setTimestamp();

        const msgSent = await canal.send({ embeds: [embed] });
        await msgSent.react('👍');
        await msgSent.react('👎');
        await interaction.editReply({ content: '✓ Sua sugestão foi postada no canal oficial com sucesso! Obrigado por ajudar a Ravok. 💙' });
        logBot('info', `Sugestão enviada por ${interaction.user.tag}`);
      } else {
        await interaction.editReply({ content: '⚠️ Canal de sugestões não configurado ou inacessível.' });
      }
    } catch (err) {
      await interaction.editReply({ content: `❌ Erro ao enviar sugestão: ${err.message}` });
    }
  }

  // COMANDO: /confissao
  if (commandName === 'confissao') {
    const texto = interaction.options.getString('mensagem');
    await interaction.deferReply({ ephemeral: true });

    const settings = getDbSettings();
    const canalConfissoesId = settings.discordBotChannelConfissoes || '1482150365523607623';

    try {
      const canal = await client.channels.fetch(canalConfissoesId);
      if (canal && canal.isTextBased()) {
        const embed = new EmbedBuilder()
          .setTitle('🤫 Confissão Anônima')
          .setColor(0x9b59b6)
          .setDescription(`"${texto}"`)
          .setFooter({ text: 'Ravok Network • 100% Anônimo' })
          .setTimestamp();

        await canal.send({ embeds: [embed] });
        await interaction.editReply({ content: '🤫 Sua confissão anônima foi publicada com sucesso!' });
        logBot('info', `Confissão anônima publicada.`);
      } else {
        await interaction.editReply({ content: '⚠️ Canal de confissões não configurado ou inacessível.' });
      }
    } catch (err) {
      await interaction.editReply({ content: `❌ Erro ao enviar confissão: ${err.message}` });
    }
  }

  // COMANDO: /testwelcome
  if (commandName === 'testwelcome') {
    await interaction.deferReply({ ephemeral: true });
    try {
      const settings = getDbSettings();
      let bgImage = settings.welcomeBgUrl;
      if (!bgImage) {
        const localBg = path.join(__dirname, 'public', 'welcome-bg.png');
        if (fs.existsSync(localBg)) bgImage = localBg;
      }
      const avatarUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 256 });
      const cardBuffer = await generateWelcomeCard({
        username: interaction.user.username,
        avatarUrl: avatarUrl,
        memberCount: interaction.guild ? interaction.guild.memberCount : 540,
        serverName: interaction.guild ? interaction.guild.name : 'Ravok Network',
        badgeText: `Member #${interaction.guild ? interaction.guild.memberCount : 540}`,
        backgroundImage: bgImage
      });
      const attachment = new AttachmentBuilder(cardBuffer, { name: 'welcome.png' });
      await interaction.channel.send({
        content: `Welcome ${interaction.user} to **${interaction.guild ? interaction.guild.name : 'Ravok Network'}**!`,
        files: [attachment]
      });
      await interaction.editReply({ content: '✓ Imagem personalizada de boas-vindas enviada com sucesso no canal!' });
      logBot('info', `Comando /testwelcome executado por ${interaction.user.tag}`);
    } catch (err) {
      await interaction.editReply({ content: `❌ Erro ao gerar imagem: ${err.message}` });
    }
  }

  // COMANDO: /limpar ou /clear (Moderação / Limpar Chat)
  if (commandName === 'limpar' || commandName === 'clear') {
    if (!interaction.guild || !interaction.channel || !interaction.channel.isTextBased()) {
      return await interaction.reply({
        content: '❌ Este comando só pode ser utilizado em canais de texto dentro do servidor.',
        ephemeral: true
      });
    }

    const member = interaction.member;
    const isStaff = member && member.permissions && (
      member.permissions.has(PermissionFlagsBits.ManageMessages) ||
      member.permissions.has(PermissionFlagsBits.Administrator)
    );

    if (!isStaff) {
      return await interaction.reply({
        content: '❌ **Acesso Negado!** Você precisa da permissão **Gerenciar Mensagens** ou Administrador para limpar o chat.',
        ephemeral: true
      });
    }

    const botMember = interaction.guild.members.me;
    if (!botMember || !botMember.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.reply({
        content: '❌ **Permissão Faltando!** O bot precisa da permissão **Gerenciar Mensagens** neste canal para poder apagar mensagens.',
        ephemeral: true
      });
    }

    const requestedAmount = interaction.options.getInteger('quantidade') || 100;
    const clampedAmount = Math.max(1, Math.min(100, requestedAmount));

    await interaction.deferReply({ ephemeral: true });

    try {
      const deleted = await interaction.channel.bulkDelete(clampedAmount, true);
      const totalDeleted = deleted ? deleted.size : 0;

      let desc = `🧹 Foram apagadas com sucesso **${totalDeleted}** mensagens recentes no canal ${interaction.channel}!`;
      if (totalDeleted < clampedAmount) {
        desc += `\n\n⚠️ *Aviso: O Discord não permite apagar em massa mensagens enviadas há mais de 14 dias.*`;
      }

      const embed = new EmbedBuilder()
        .setColor(0x00d4ff)
        .setTitle('🧹 Chat Limpo com Sucesso')
        .setDescription(desc)
        .addFields(
          { name: '👤 Moderador', value: `${interaction.user}`, inline: true },
          { name: '💬 Canal', value: `${interaction.channel}`, inline: true },
          { name: '🔢 Quantidade', value: `\`${totalDeleted} / ${clampedAmount}\``, inline: true }
        )
        .setFooter({ text: 'Ravok Network • Moderação' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      logBot('info', `🧹 ${totalDeleted} mensagens apagadas por ${interaction.user.tag} em #${interaction.channel.name}`);
    } catch (err) {
      logBot('error', `Falha ao apagar mensagens em #${interaction.channel.name}: ${err.message}`);
      await interaction.editReply({ content: `❌ Falha ao limpar mensagens: ${err.message}` });
    }
  }
  } catch (globalErr) {
    console.warn('[Bot] [WARN] Erro capturado em interactionCreate:', globalErr.message);
  }
});

// ----------------------------------------------------
// HANDLER DE BOTÕES INTERATIVOS (PAINÉIS DO KAYZEL)
// ----------------------------------------------------
async function handleButtonInteraction(interaction) {
  try {
    const { customId } = interaction;

  // 1. TICKET: Abrir Ticket
  if (customId === 'sys_ticket_btn') {
    const modal = new ModalBuilder()
      .setCustomId('modal_ticket')
      .setTitle('Abrir Ticket • Ravok Network');

    const nickInput = new TextInputBuilder()
      .setCustomId('ticket_nick')
      .setLabel('Seu nick no Minecraft')
      .setPlaceholder('Ex: Guiileu')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(24)
      .setRequired(true);

    const probInput = new TextInputBuilder()
      .setCustomId('ticket_problema')
      .setLabel('Como podemos te ajudar?')
      .setPlaceholder('Descreva sua dúvida, problema ou solicitação...')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(1000)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nickInput),
      new ActionRowBuilder().addComponents(probInput)
    );

    return interaction.showModal(modal);
  }

  // 2. TICKET: Fechar Ticket
  if (customId === 'sys_ticket_close') {
    const isStaff = interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) || 
                    interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) ||
                    interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isStaff) {
      return interaction.reply({ content: '❌ Apenas membros da Staff podem fechar este ticket.', ephemeral: true });
    }

    await interaction.reply('🔒 **Fechando ticket em 5 segundos...**');
    logBot('info', `Ticket #${interaction.channel.name} fechado por ${interaction.user.tag}`);

    setTimeout(async () => {
      try {
        await interaction.channel.delete('Ticket finalizado pela Staff');
      } catch (e) {}
    }, 5000);
    return;
  }

  // 3. RECRUTAMENTO: Fazer Formulário
  if (customId === 'sys_recrut_btn') {
    const modal = new ModalBuilder()
      .setCustomId('modal_recrutamento')
      .setTitle('Formulário de Recrutamento Staff');

    const nomeIdade = new TextInputBuilder()
      .setCustomId('recrut_nome_idade')
      .setLabel('Seu Nome e Idade')
      .setPlaceholder('Ex: Guilherme, 19 anos')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(50)
      .setRequired(true);

    const exp = new TextInputBuilder()
      .setCustomId('recrut_exp')
      .setLabel('Experiência prévia em servidores')
      .setPlaceholder('Já foi moderador/builder em outros servidores?')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(800)
      .setRequired(true);

    const motivo = new TextInputBuilder()
      .setCustomId('recrut_motivo')
      .setLabel('Por que quer entrar na equipe?')
      .setPlaceholder('O que você pode agregar ao Ravok Network?')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(800)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nomeIdade),
      new ActionRowBuilder().addComponents(exp),
      new ActionRowBuilder().addComponents(motivo)
    );

    return interaction.showModal(modal);
  }

  // 4. CONFISSÕES: Enviar Confissão
  if (customId === 'sys_confissao_btn') {
    const modal = new ModalBuilder()
      .setCustomId('modal_confissao')
      .setTitle('Confissão 100% Anônima');

    const confInput = new TextInputBuilder()
      .setCustomId('confissao_texto')
      .setLabel('Seu segredo / pensamento...')
      .setPlaceholder('Ninguém saberá quem você é. Desabafe à vontade! 😉')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(1000)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(confInput));
    return interaction.showModal(modal);
  }

  // 5. SUGESTÕES: Nova Sugestão
  if (customId === 'sys_sugestao_btn') {
    const modal = new ModalBuilder()
      .setCustomId('modal_sugestao')
      .setTitle('Nova Sugestão • Ravok Network');

    const sugInput = new TextInputBuilder()
      .setCustomId('sugestao_texto')
      .setLabel('Sua ideia de melhoria')
      .setPlaceholder('Descreva novos sistemas, eventos, itens ou melhorias...')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(1000)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(sugInput));
    return interaction.showModal(modal);
  }

  // 6. VINCULAR CONTA
  if (customId === 'sys_vinc_btn') {
    const modal = new ModalBuilder()
      .setCustomId('modal_vincular_painel')
      .setTitle('Vincular Conta do Minecraft');

    const nickInput = new TextInputBuilder()
      .setCustomId('vinc_nick')
      .setLabel('Seu nick exato no Minecraft')
      .setPlaceholder('Ex: Guiileu')
      .setStyle(TextInputStyle.Short)
      .setMinLength(3)
      .setMaxLength(16)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(nickInput));
    return interaction.showModal(modal);
  }

  // 7. FEEDBACK
  if (customId === 'sys_feedback_btn') {
    const modal = new ModalBuilder()
      .setCustomId('modal_feedback')
      .setTitle('Enviar Avaliação • Ravok');

    const titInput = new TextInputBuilder()
      .setCustomId('feedback_titulo')
      .setLabel('Título da sua avaliação')
      .setPlaceholder('Ex: Servidor top, economia justa!')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(60)
      .setRequired(true);

    const msgInput = new TextInputBuilder()
      .setCustomId('feedback_msg')
      .setLabel('O que você achou da experiência?')
      .setPlaceholder('Deixe seu comentário sobre a jogabilidade, suporte ou loja...')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(800)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titInput),
      new ActionRowBuilder().addComponents(msgInput)
    );

    return interaction.showModal(modal);
  }

  // 8. DIVULGAR VÍDEO
  if (customId === 'sys_video_btn') {
    const modal = new ModalBuilder()
      .setCustomId('modal_video')
      .setTitle('Divulgar Vídeo da Comunidade');

    const titInput = new TextInputBuilder()
      .setCustomId('video_titulo')
      .setLabel('Título do vídeo')
      .setPlaceholder('Ex: Jogando no Ravok Network!')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(80)
      .setRequired(true);

    const urlInput = new TextInputBuilder()
      .setCustomId('video_url')
      .setLabel('Link do YouTube')
      .setPlaceholder('https://www.youtube.com/watch?v=...')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titInput),
      new ActionRowBuilder().addComponents(urlInput)
    );

    return interaction.showModal(modal);
  }

  // 9. ANUNCIAR LIVE
  if (customId === 'sys_live_btn') {
    const modal = new ModalBuilder()
      .setCustomId('modal_live')
      .setTitle('Anunciar Transmissão ao Vivo');

    const titInput = new TextInputBuilder()
      .setCustomId('live_titulo')
      .setLabel('Título da sua live')
      .setPlaceholder('Ex: Farmando no survival ao vivo!')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(80)
      .setRequired(true);

    const urlInput = new TextInputBuilder()
      .setCustomId('live_url')
      .setLabel('Link da Live (Twitch ou YouTube)')
      .setPlaceholder('https://twitch.tv/... ou https://youtube.com/live/...')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titInput),
      new ActionRowBuilder().addComponents(urlInput)
    );

    return await interaction.showModal(modal);
  }
  } catch (btnErr) {
    console.warn('[Bot] [WARN] Erro em handleButtonInteraction:', btnErr.message);
  }
}

// ----------------------------------------------------
// HANDLER DE MODAIS SUBMETIDOS
// ----------------------------------------------------
async function handleModalSubmit(interaction) {
  try {
    const { customId, guild } = interaction;
    const settings = getDbSettings();

  // 1. MODAL TICKET
  if (customId === 'modal_ticket') {
    if (!guild) return interaction.reply({ content: '❌ Use dentro do servidor.', ephemeral: true });

    const existing = guild.channels.cache.find(c => c.topic === `kayzel-ticket:${interaction.user.id}`);
    if (existing) {
      return interaction.reply({ content: `🌿 Você já possui um ticket em aberto em ${existing}!`, ephemeral: true });
    }

    const nick = interaction.fields.getTextInputValue('ticket_nick').trim();
    const problema = interaction.fields.getTextInputValue('ticket_problema').trim();
    const categoryId = settings.discordBotCategoryTickets;
    const category = categoryId ? guild.channels.cache.get(categoryId) : null;

    try {
      const channel = await guild.channels.create({
        name: `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '') || interaction.user.id}`,
        type: ChannelType.GuildText,
        parent: category && category.type === ChannelType.GuildCategory ? category.id : undefined,
        topic: `kayzel-ticket:${interaction.user.id}`,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory] },
          { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages] }
        ]
      });

      const embed = new EmbedBuilder()
        .setTitle('🌿 Novo Ticket de Atendimento • Ravok Network')
        .setDescription('A Silvie chamou a equipe! Conte todos os detalhes com calma que alguém da Staff já vem ajudar. 💙')
        .setColor(0x55E6D8)
        .addFields(
          { name: '👤 Aventureiro', value: `${interaction.user} (\`${interaction.user.tag}\`)`, inline: true },
          { name: '🎮 Nick Minecraft', value: `\`${nick}\``, inline: true },
          { name: '📝 Solicitação', value: problema, inline: false }
        )
        .setFooter({ text: 'Silvie • Guardiã da Ravok Network' })
        .setTimestamp();

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('sys_ticket_close')
          .setLabel('Fechar Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

      await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [closeRow] });
      await interaction.reply({ content: `✅ Prontinho! Seu ticket foi criado em ${channel}.`, ephemeral: true });
      logBot('info', `🎫 Ticket aberto por ${interaction.user.tag} (${nick}) em #${channel.name}`);
    } catch (err) {
      interaction.reply({ content: `❌ Falha ao criar o canal do ticket: ${err.message}`, ephemeral: true });
    }
    return;
  }

  // 2. MODAL RECRUTAMENTO
  if (customId === 'modal_recrutamento') {
    if (!guild) return interaction.reply({ content: '❌ Use dentro do servidor.', ephemeral: true });

    const existing = guild.channels.cache.find(c => c.topic === `silvie-recrutamento:${interaction.user.id}`);
    if (existing) {
      return interaction.reply({ content: `🌿 Seu formulário de recrutamento já está aberto em ${existing}!`, ephemeral: true });
    }

    const nomeIdade = interaction.fields.getTextInputValue('recrut_nome_idade').trim();
    const exp = interaction.fields.getTextInputValue('recrut_exp').trim();
    const motivo = interaction.fields.getTextInputValue('recrut_motivo').trim();
    const categoryId = settings.discordBotCategoryRecrutamento;
    const category = categoryId ? guild.channels.cache.get(categoryId) : null;

    try {
      const channel = await guild.channels.create({
        name: `recrut-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '') || interaction.user.id}`,
        type: ChannelType.GuildText,
        parent: category && category.type === ChannelType.GuildCategory ? category.id : undefined,
        topic: `silvie-recrutamento:${interaction.user.id}`,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory] },
          { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages] }
        ]
      });

      const embed = new EmbedBuilder()
        .setTitle('📋 Novo Candidato à Staff • Ravok Network')
        .setDescription('Formulário preenchido via Silvie para análise dos Administradores.')
        .setColor(0x55E6D8)
        .addFields(
          { name: '👤 Candidato', value: `${interaction.user} (\`${interaction.user.tag}\`)`, inline: true },
          { name: '🎂 Nome & Idade', value: nomeIdade, inline: true },
          { name: '💼 Experiência Prévia', value: exp, inline: false },
          { name: '🎯 Motivação', value: motivo, inline: false }
        )
        .setFooter({ text: 'Silvie • Recrutamento Ravok Network' })
        .setTimestamp();

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('sys_ticket_close')
          .setLabel('Encerrar Análise')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

      await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [closeRow] });
      await interaction.reply({ content: `✅ Formulário enviado com sucesso em ${channel}!`, ephemeral: true });
      logBot('info', `📋 Formulário de recrutamento de ${interaction.user.tag} em #${channel.name}`);
    } catch (err) {
      interaction.reply({ content: `❌ Erro ao criar o formulário: ${err.message}`, ephemeral: true });
    }
    return;
  }

  // 3. MODAL CONFISSÃO
  if (customId === 'modal_confissao') {
    const texto = interaction.fields.getTextInputValue('confissao_texto').trim();
    const channelId = settings.discordBotChannelConfissoes || interaction.channelId;
    const channel = client.channels.cache.get(channelId) || interaction.channel;

    const embed = new EmbedBuilder()
      .setTitle('👻 Nova Confissão Anônima')
      .setDescription(`"${texto}"`)
      .setColor(0x9b59b6)
      .setFooter({ text: 'Ravok Network • 100% Anônimo' })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    await interaction.reply({ content: '🤫 Sua confissão foi publicada de forma 100% anônima!', ephemeral: true });
    logBot('info', `Confissão anônima publicada.`);
    await empurrarPainel('confissoes', channel.id).catch(() => {});
    return;
  }

  // 4. MODAL SUGESTÃO
  if (customId === 'modal_sugestao') {
    const texto = interaction.fields.getTextInputValue('sugestao_texto').trim();
    const channelId = settings.discordBotChannelSugestoes || interaction.channelId;
    const channel = client.channels.cache.get(channelId) || interaction.channel;

    const embed = new EmbedBuilder()
      .setTitle('💡 Nova Sugestão da Comunidade')
      .setDescription(texto)
      .setColor(0xf1c40f)
      .setFooter({ text: `Enviada por ${interaction.user.tag}` })
      .setTimestamp();

    const msg = await channel.send({ embeds: [embed] });
    try {
      await msg.react('👍');
      await msg.react('👎');
    } catch (e) {}
    await interaction.reply({ content: '✅ Sua sugestão foi postada para a comunidade avaliar!', ephemeral: true });
    logBot('info', `Sugestão publicada por ${interaction.user.tag}`);
    await empurrarPainel('sugestoes', channel.id).catch(() => {});
    return;
  }

  // 5. MODAL VINCULAR PAINEL
  if (customId === 'modal_vincular_painel') {
    const nick = interaction.fields.getTextInputValue('vinc_nick').trim();
    if (!/^[A-Za-z0-9_]{3,16}$/.test(nick)) {
      return interaction.reply({ content: '❌ Nick inválido. Deve ter de 3 a 16 caracteres alfanuméricos.', ephemeral: true });
    }

    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const db = JSON.parse(raw);
      db.linkedAccounts = db.linkedAccounts || [];
      const userTag = interaction.user.tag || interaction.user.username;
      const idx = db.linkedAccounts.findIndex(a => a.discordId === interaction.user.id || a.discordTag === interaction.user.id || a.discordTag === userTag || a.nick.toLowerCase() === nick.toLowerCase());
      const entry = { nick, discordTag: userTag, discordId: interaction.user.id, linked_at: new Date().toISOString() };
      if (idx >= 0) db.linkedAccounts[idx] = entry;
      else db.linkedAccounts.push(entry);
      saveDbAtomic(db);
    } catch (e) {}

    const given = [];
    if (interaction.guild) {
      const rVinc = settings.discordBotRoleVinculado ? interaction.guild.roles.cache.get(settings.discordBotRoleVinculado) : null;
      const rAcess = settings.discordBotRoleAcesso ? interaction.guild.roles.cache.get(settings.discordBotRoleAcesso) : null;
      if (rVinc) { await interaction.member.roles.add(rVinc).catch(() => {}); given.push(rVinc.name); }
      if (rAcess) { await interaction.member.roles.add(rAcess).catch(() => {}); given.push(rAcess.name); }
    }

    await interaction.reply({ content: `🌿 Tudo certo! Sua conta **${nick}** foi vinculada com sucesso! ${given.length ? `Cargos liberados: **${given.join(', ')}** 💙` : ''}`, ephemeral: true });
    logBot('info', `🔗 ${interaction.user.tag} vinculou com sucesso o nick ${nick}`);
    return;
  }

  // 6. MODAL FEEDBACK
  if (customId === 'modal_feedback') {
    const titulo = interaction.fields.getTextInputValue('feedback_titulo').trim();
    const msg = interaction.fields.getTextInputValue('feedback_msg').trim();
    const channelId = settings.discordBotChannelFeedbacks || interaction.channelId;
    const channel = client.channels.cache.get(channelId) || interaction.channel;

    const embed = new EmbedBuilder()
      .setTitle(`⭐ Feedback: ${titulo}`)
      .setDescription(`"${msg}"`)
      .setColor(0xf39c12)
      .setFooter({ text: `Avaliado por ${interaction.user.tag}` })
      .setTimestamp();

    const sent = await channel.send({ embeds: [embed] });
    await sent.react('⭐').catch(() => {});
    await interaction.reply({ content: '💙 Muito obrigado pelo seu feedback sobre o servidor!', ephemeral: true });
    logBot('info', `Feedback recebido de ${interaction.user.tag}`);
    await empurrarPainel('feedback', channel.id).catch(() => {});
    return;
  }

  // 7. MODAL VÍDEO
  if (customId === 'modal_video') {
    const titulo = interaction.fields.getTextInputValue('video_titulo').trim();
    const url = interaction.fields.getTextInputValue('video_url').trim();
    if (!/^https?:\/\//i.test(url)) {
      return interaction.reply({ content: '❌ Envie um link válido começando com http:// ou https://', ephemeral: true });
    }

    const channelId = settings.discordBotChannelVideos || interaction.channelId;
    const channel = client.channels.cache.get(channelId) || interaction.channel;

    const embed = new EmbedBuilder()
      .setTitle(`🎬 ${titulo}`)
      .setDescription(`Novo vídeo divulgado por ${interaction.user}!\n\n🔗 [Clique aqui para assistir](${url})`)
      .setColor(0xe74c3c)
      .setFooter({ text: 'Ravok Network • Vídeos da Comunidade' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Assistir no YouTube ▶').setStyle(ButtonStyle.Link).setURL(url)
    );

    await channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '🌿 Seu vídeo foi divulgado com sucesso!', ephemeral: true });
    logBot('info', `Vídeo divulgado por ${interaction.user.tag}: ${titulo}`);
    await empurrarPainel('video', channel.id).catch(() => {});
    return;
  }

  // 8. MODAL LIVE
  if (customId === 'modal_live') {
    const titulo = interaction.fields.getTextInputValue('live_titulo').trim();
    const url = interaction.fields.getTextInputValue('live_url').trim();
    if (!/^https?:\/\//i.test(url)) {
      return interaction.reply({ content: '❌ Envie um link válido começando com http:// ou https://', ephemeral: true });
    }

    const channelId = settings.discordBotChannelLives || interaction.channelId;
    const channel = client.channels.cache.get(channelId) || interaction.channel;

    const embed = new EmbedBuilder()
      .setTitle(`🔴 Estamos ao Vivo no Ravok!`)
      .setDescription(`**${interaction.user.username}** abriu live!\n\n**${titulo}**\n\n🔗 [Assistir Transmissão Agora](${url})`)
      .setColor(0xe74c3c)
      .setFooter({ text: 'Silvie avisou • Ravok Network' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Acessar Live 📺').setStyle(ButtonStyle.Link).setURL(url)
    );

    await channel.send({ content: '@everyone', embeds: [embed], components: [row] });
    await interaction.reply({ content: '🌿 Sua live foi anunciada para toda a comunidade!', ephemeral: true });
    logBot('info', `Live anunciada por ${interaction.user.tag}: ${titulo}`);
    await empurrarPainel('video', channel.id).catch(() => {});
    return;
  }
  } catch (modalErr) {
    console.warn('[Bot] [WARN] Erro em handleModalSubmit:', modalErr.message);
  }
}

// ----------------------------------------------------
// EVENTO: ENTRADA DE NOVO MEMBRO (BOAS-VINDAS & AUTO-ROLES)
// ----------------------------------------------------
client.on('guildMemberAdd', async (member) => {
  const settings = getDbSettings();

  // Boas-Vindas com Imagem Personalizada
  if (settings.welcomeEnabled !== false) {
    const welcomeChannelId = settings.discordBotChannelBoasVindas;
    if (welcomeChannelId) {
      try {
        const channel = await member.guild.channels.fetch(welcomeChannelId);
        if (channel && channel.isTextBased()) {
          let attachment = null;
          try {
            const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
            let bgImage = settings.welcomeBgUrl;
            if (!bgImage) {
              const localBg = path.join(__dirname, 'public', 'welcome-bg.png');
              if (fs.existsSync(localBg)) bgImage = localBg;
            }
            const cardBuffer = await generateWelcomeCard({
              username: member.user.username,
              avatarUrl: avatarUrl,
              memberCount: member.guild.memberCount,
              serverName: member.guild.name || 'Ravok Network',
              badgeText: `Member #${member.guild.memberCount}`,
              backgroundImage: bgImage
            });
            attachment = new AttachmentBuilder(cardBuffer, { name: 'welcome.png' });
          } catch (cardErr) {
            logBot('warn', `Não foi possível gerar card visual de boas-vindas: ${cardErr.message}`);
          }

          if (attachment) {
            await channel.send({
              content: `Welcome ${member} to **${member.guild.name}**!`,
              files: [attachment]
            });
          } else {
            const embed = new EmbedBuilder()
              .setTitle('🌿 BEM-VINDO(A) À RAVOK NETWORK!')
              .setDescription(`Olá, ${member}! Eu sou a **Silvie**, guardiã da Ravok. 💙\n\nSua aventura está pronta para começar:\n🔗 Vincule sua conta do Minecraft com seu Discord\n📖 Confira as regras do reino\n💬 Converse com a comunidade nos canais gerais\n💡 Envie sugestões para melhorarmos juntos\n\nPrecisando de ajuda, abra um ticket e eu chamo a equipe. 🌿`)
              .setColor(0x55E6D8)
              .setFooter({ text: 'Ravok Network • Servidor Oficial' })
              .setTimestamp();

            await channel.send({ content: `⚡ Sistema detectou uma nova presença: ${member}`, embeds: [embed] });
          }
          logBot('info', `👋 Boas-vindas personalizadas enviadas para ${member.user.tag} em #${channel.name}`);
        }
      } catch (err) {
        logBot('error', `Falha ao enviar boas-vindas: ${err.message}`);
      }
    }
  }

  // Auto-Roles
  if (Array.isArray(settings.autoRoles) && settings.autoRoles.length > 0) {
    for (const roleId of settings.autoRoles) {
      try {
        const role = member.guild.roles.cache.get(roleId);
        if (role) await member.roles.add(role);
      } catch (e) {}
    }
  }
});

// ----------------------------------------------------
// MOTOR DE INTELIGÊNCIA ARTIFICIAL — SILVIE AI
// ----------------------------------------------------
async function askKayzelAI(promptText, authorName = 'Aventureiro') {
  const settings = getDbSettings();
  const apiKey = (settings.aiApiKey || '').trim();
  const systemPrompt = settings.aiPrompt || 'Você é Silvie, a assistente oficial da Ravok Network. Ajude os aventureiros com simpatia e clareza em português do Brasil.';
  const model = settings.aiModel || 'gemini-1.5-flash';

  // Se não houver chave de API configurada, utiliza respostas inteligentes de apoio
  if (!apiKey) {
    if (/\b(loja|vips?|coins?|comprar?|pix|pagamento|preço|precos?|produtos?)\b/i.test(promptText)) {
      return `Olá! Você pode adquirir VIPs, Coins e Chaves com Pix automático na nossa loja oficial: ${API_BASE} ou usando o comando \`/loja\`! 🛒✨`;
    }
    if (/\b(ip|conectar|entrar|servidor|host|jogar|porta|versao|versão)\b/i.test(promptText)) {
      return `Olá, **${authorName}**! O IP oficial para jogar na Ravok Network é: \`jogar.ravok.network\` (compatível com Minecraft 1.20.1 a 1.21+). Te vejo lá! 🎮💙`;
    }
    if (/\b(ticket|tickets|suporte|denúncia|denuncia|denunciar|bug|bugs|staff|ajuda)\b/i.test(promptText)) {
      return `Olá, **${authorName}**! Para denúncias, bugs ou suporte direto com a nossa equipe, por favor abra um ticket no canal de suporte! Nossa Staff vai te atender o mais rápido possível. 💙`;
    }
    if (/\b(quem é você|quem e voce|seu nome|silvie)\b/i.test(promptText)) {
      return `Oie! Eu sou a **Silvie**, a mascote e assistente oficial da Ravok Network! 💙🔮 Como posso te ajudar com o servidor hoje?`;
    }
    return `Olá, **${authorName}**! Eu sou a Silvie! 💙\n*(Nota do Administrador: Para ativar conversas livres com Inteligência Artificial, insira sua chave da API Gemini no Painel Admin > Bot Discord).* Como posso te ajudar com o servidor?`;
  }

  // 1. Caso a chave comece com sk- (OpenAI API compatível)
  if (apiKey.startsWith('sk-')) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${authorName}: ${promptText}` }
        ],
        max_tokens: 600,
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errMsg = (err.error && err.error.message) || res.statusText;
      throw new Error(`OpenAI: ${errMsg}`);
    }

    const data = await res.json();
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return content || 'Não consegui processar a resposta.';
  }

  // 2. Provedor Padrão: Google Gemini API
  const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  
  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `[Mensagem do jogador ${authorName}]: ${promptText}`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800
    }
  };

  const res = await fetch(geminiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const errMsg = (err.error && err.error.message) || `HTTP ${res.status}`;
    throw new Error(`Gemini: ${errMsg}`);
  }

  const data = await res.json();
  const text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
  if (!text) {
    throw new Error('A IA não gerou conteúdo de resposta.');
  }

  return text.trim();
}

// ----------------------------------------------------
// EVENTO: RESPOSTA AUTOMÁTICA COM IA (SILVIE)
// ----------------------------------------------------
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const settings = getDbSettings();

  const contentStr = typeof message.content === 'string' ? message.content : '';
  if (!contentStr) return;

  // COMANDOS PREFIXO DE TESTE RÁPIDO PARA ADMINS (!testwelcome, !boasvindas, !welcome)
  const rawMsg = contentStr.trim().toLowerCase();
  if (rawMsg === '!testwelcome' || rawMsg === '!boasvindas' || rawMsg === '!welcome') {
    const isStaff = message.member && (
      message.member.permissions.has(PermissionFlagsBits.Administrator) ||
      message.member.permissions.has(PermissionFlagsBits.ManageGuild)
    );
    if (isStaff) {
      try {
        let bgImage = settings.welcomeBgUrl;
        if (!bgImage) {
          const localBg = path.join(__dirname, 'public', 'welcome-bg.png');
          if (fs.existsSync(localBg)) bgImage = localBg;
        }
        const avatarUrl = message.author.displayAvatarURL({ extension: 'png', size: 256 });
        const cardBuffer = await generateWelcomeCard({
          username: message.author.username,
          avatarUrl: avatarUrl,
          memberCount: message.guild.memberCount,
          serverName: message.guild.name || 'Ravok Network',
          badgeText: `Member #${message.guild.memberCount}`,
          backgroundImage: bgImage
        });
        const attachment = new AttachmentBuilder(cardBuffer, { name: 'welcome.png' });
        await message.channel.send({
          content: `Welcome ${message.author} to **${message.guild.name}**! *(Teste Administrativo)*`,
          files: [attachment]
        });
        logBot('info', `Comando prefixo ${rawMsg} executado com sucesso por ${message.author.tag} em #${message.channel.name}`);
      } catch (err) {
        await message.channel.send(`❌ Erro ao gerar imagem de boas-vindas: ${err.message}`);
      }
      return;
    }
  }

  // COMANDOS PREFIXO DE LIMPEZA DE CHAT (!limpar [qtd], !clear [qtd], .limpar [qtd], etc.)
  const rawMsgTrim = message.content.trim();
  const clearMatch = rawMsgTrim.match(/^[!\.\-\/](limpar|clear|purge)(?:\s+(\d+))?$/i);
  if (clearMatch) {
    const isStaff = message.member && (
      (message.member.permissions && typeof message.member.permissions.has === 'function' &&
        (message.member.permissions.has(PermissionFlagsBits.ManageMessages) || message.member.permissions.has(PermissionFlagsBits.Administrator)))
    );

    if (!isStaff) {
      const errReply = await message.reply('❌ Você não tem permissão para usar este comando.');
      setTimeout(() => errReply.delete().catch(() => {}), 5000);
      return;
    }

    const botMember = message.guild.members.me;
    if (!botMember || !botMember.permissionsIn(message.channel).has(PermissionFlagsBits.ManageMessages)) {
      const errReply = await message.reply('❌ Eu preciso da permissão **Gerenciar Mensagens** neste canal para poder limpar o chat.');
      setTimeout(() => errReply.delete().catch(() => {}), 6000);
      return;
    }

    // Apaga a própria mensagem de comando digitada pelo usuário primeiro
    await message.delete().catch(() => {});

    const requestedAmount = clearMatch[2] ? parseInt(clearMatch[2], 10) : 100;
    const clampedAmount = Math.max(1, Math.min(100, requestedAmount));

    try {
      const deleted = await message.channel.bulkDelete(clampedAmount, true);
      const totalDeleted = deleted ? deleted.size : 0;

      let desc = `🧹 **${totalDeleted}** mensagens foram apagadas com sucesso por ${message.author}!`;
      if (totalDeleted < clampedAmount) {
        desc += `\n*(Mensagens com mais de 14 dias não podem ser apagadas em massa).*`;
      }

      const alertMsg = await message.channel.send({ content: desc });
      setTimeout(() => alertMsg.delete().catch(() => {}), 5000);

      logBot('info', `🧹 ${totalDeleted} mensagens apagadas via prefixo por ${message.author.tag} em #${message.channel.name}`);
    } catch (err) {
      logBot('error', `Falha ao apagar mensagens com comando prefixo: ${err.message}`);
      const errReply = await message.channel.send(`❌ Erro ao limpar chat: ${err.message}`);
      setTimeout(() => errReply.delete().catch(() => {}), 5000);
    }
    return;
  }

  // 0. Canal de Contagem (Validação Sequencial de Números)
  const contagemId = settings.discordBotChannelContagem;
  if (contagemId && message.channel.id === String(contagemId)) {
    const conteudo = message.content.trim();
    const ultimo = Number(settings.countingCurrentNumber || 0);
    const isOnlyDigits = /^\d+$/.test(conteudo);
    const numero = isOnlyDigits ? parseInt(conteudo, 10) : null;

    if (numero !== null && numero === ultimo + 1) {
      // Contagem correta!
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const db = JSON.parse(raw);
        db.settings.countingCurrentNumber = numero;
        saveDbAtomic(db);
      } catch (e) {}

      await message.react('✅').catch(() => {});
      logBot('info', `🔢 Contagem correta: ${message.author.tag} enviou #${numero}`);
      return;
    }

    // Errou a contagem ou digitou texto!
    try {
      await message.delete();
    } catch (e) {}

    // Timeout de 10 minutos para quem errou
    try {
      if (message.member && message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await message.member.timeout(10 * 60 * 1000, 'Errou a contagem da Ravok');
      }
    } catch (e) {}

    // Avisar no canal de punições se existir
    const punicoesId = settings.discordBotChannelPunicoes;
    if (punicoesId) {
      try {
        const canalPunicoes = client.channels.cache.get(String(punicoesId));
        if (canalPunicoes && canalPunicoes.isTextBased()) {
          await canalPunicoes.send(`⚠️ ${message.author} errou a contagem no canal de números! O próximo número correto era **${ultimo + 1}**.`);
        }
      } catch (e) {}
    }

    try {
      await message.author.send(`⚠️ Opa, você errou a contagem na Ravok Network! O próximo número era **${ultimo + 1}**.`);
    } catch (e) {}

    logBot('warn', `🔢 ${message.author.tag} errou a contagem. Esperado: ${ultimo + 1}, digitou: "${conteudo}"`);
    return;
  }

  // 0.1. Canal de Vínculo de Conta (Validação automática de código de 6 dígitos)
  const isVincularChannel = (message.channel.name && message.channel.name.includes('vincular')) || 
                           (settings.discordBotChannelVincular && message.channel.id === String(settings.discordBotChannelVincular));

  const codeMatch = message.content.match(/\b\d{6}\b/);
  if (isVincularChannel && codeMatch) {
    const code = codeMatch[0];
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const db = JSON.parse(raw);

      const entry = Object.entries(db.verifyCodes || {}).find(([k, v]) => v && v.code === code);
      if (entry) {
        const [nickLower, stored] = entry;
        if (Date.now() > stored.expiresAt) {
          delete db.verifyCodes[nickLower];
          saveDbAtomic(db);
          const reply = await message.reply({ content: `❌ O código **${code}** para **${stored.nick}** expirou. Use \`/vincular\` no jogo novamente!` });
          setTimeout(() => reply.delete().catch(() => {}), 8000);
          return;
        }

        const userTag = message.author.tag || message.author.username;
        db.linkedAccounts = db.linkedAccounts || [];
        const existingIdx = db.linkedAccounts.findIndex(l => 
          l.discordId === message.author.id || 
          l.discordTag === userTag || 
          l.nick.toLowerCase() === nickLower
        );

        const linkRecord = {
          nick: stored.nick,
          discordTag: userTag,
          discordId: message.author.id,
          linked_at: new Date().toISOString()
        };

        if (existingIdx >= 0) db.linkedAccounts[existingIdx] = linkRecord;
        else db.linkedAccounts.push(linkRecord);

        delete db.verifyCodes[nickLower];

        // Recompensa automática de boas-vindas do vínculo para o /resgatar
        db.pendingDeliveries = db.pendingDeliveries || [];
        const alreadyRewarded = db.pendingDeliveries.some(d => d.nick.toLowerCase() === stored.nick.toLowerCase() && d.product_name === 'Recompensa de Conta Vinculada');
        if (!alreadyRewarded) {
          db.pendingDeliveries.push({
            id: Math.floor(10000000 + Math.random() * 89999999),
            orderId: 'VINC-' + Math.floor(1000 + Math.random() * 9000),
            nick: stored.nick,
            product_name: 'Recompensa de Conta Vinculada',
            category: 'Vínculo',
            command: `crate key give ${stored.nick} vote 1`,
            gui_icon: 'TRIPWIRE_HOOK',
            status: 'pending',
            created_at: new Date().toISOString()
          });
        }

        saveDbAtomic(db);

        // Atribui cargos no Discord
        const given = [];
        if (message.guild && message.member) {
          const rVinc = settings.discordBotRoleVinculado ? message.guild.roles.cache.get(settings.discordBotRoleVinculado) : null;
          const rAcess = settings.discordBotRoleAcesso ? message.guild.roles.cache.get(settings.discordBotRoleAcesso) : null;
          if (rVinc) { await message.member.roles.add(rVinc).catch(() => {}); given.push(rVinc.name); }
          if (rAcess) { await message.member.roles.add(rAcess).catch(() => {}); given.push(rAcess.name); }
        }

        const embed = new EmbedBuilder()
          .setTitle('✓ Conta Vinculada com Sucesso!')
          .setColor(0x00FFCC)
          .setDescription(`🌿 Parabéns ${message.author}! Sua conta do Minecraft **${stored.nick}** foi vinculada com sucesso ao seu Discord (**${userTag}**).`)
          .addFields(
            { name: 'Jogador', value: `\`${stored.nick}\``, inline: true },
            { name: 'Discord', value: `\`${userTag}\``, inline: true },
            { name: 'Status', value: '🟢 Vinculado e Ativo', inline: true },
            { name: 'Cargos Liberados', value: given.length ? `**${given.join(', ')}**` : 'Cargos atualizados', inline: false },
            { name: 'Recompensa no Jogo', value: 'Entre em `jogar.ravok.network` e use `/resgatar` para retirar sua Chave de Voto!', inline: false }
          )
          .setFooter({ text: 'Ravok Network • Integração Oficial' })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
        logBot('info', `🔗 ${userTag} vinculou a conta ${stored.nick} via código de chat no canal #${message.channel.name}!`);
        return;
      } else {
        const reply = await message.reply({ content: `❌ Código \`${code}\` inválido ou inexistente. Entre no Minecraft e use \`/vincular\` para gerar seu código!` });
        setTimeout(() => reply.delete().catch(() => {}), 8000);
        return;
      }
    } catch (err) {
      console.warn('[Bot] Erro ao validar código no chat:', err.message);
    }
  }

  // 1. Reações automáticas no canal de memes
  if (settings.memeReactionsEnabled !== false && settings.discordBotChannelMemes && message.channel.id === String(settings.discordBotChannelMemes)) {
    if (message.attachments.size > 0 || /(?:https?:\/\/)\S+\.(?:png|jpg|jpeg|gif|webp)/i.test(message.content)) {
      try {
        await message.react('👍');
        await message.react('❤️');
      } catch (e) {}
    }
  }

  // 2. Proteção Anti-Link
  if (settings.antiLinkEnabled !== false) {
    const isStaff = message.member && (
      message.member.permissions.has(PermissionFlagsBits.ManageMessages) ||
      message.member.permissions.has(PermissionFlagsBits.Administrator)
    );
    const safeChannels = [
      settings.discordBotChannelMusica,
      settings.discordBotChannelMemes,
      settings.discordBotChannelVideos,
      settings.discordBotChannelLives
    ].filter(Boolean).map(String);

    if (!isStaff && !safeChannels.includes(message.channel.id)) {
      if (/(?:https?:\/\/|discord\.gg\/)\S+/i.test(message.content)) {
        try {
          await message.delete();
          await message.author.send('⚠️ Links só são permitidos nos canais dedicados de vídeos, memes ou para membros da Staff do Ravok Network! 💙').catch(() => {});
          logBot('warn', `Link removido de ${message.author.tag} em #${message.channel.name}`);
          return;
        } catch (e) {}
      }
    }
  }

  // 3. Manter Painel Interativo sempre no Fim do Canal (empurrar_botao)
  const activePanels = settings.activePanels || {};
  const panelInfo = activePanels[String(message.channel.id)];
  if (panelInfo && panelInfo.type) {
    const isStaff = message.member && (
      message.member.permissions.has(PermissionFlagsBits.ManageMessages) ||
      message.member.permissions.has(PermissionFlagsBits.Administrator)
    );

    // Em canais de confissões e regras, os membros comuns devem usar os botões
    if (['confissoes', 'regras'].includes(panelInfo.type) && !isStaff) {
      try {
        await message.delete();
        await message.author.send(`⚠️ No canal de **${panelInfo.type}**, utilize o botão no painel para interagir! 💙`).catch(() => {});
        return;
      } catch (e) {}
    }

    // Re-empurrar o painel para o final do canal
    empurrarPainel(panelInfo.type, message.channel.id).catch(() => {});
  }

  if (settings.aiEnabled === false) return;

  const botId = client.user ? client.user.id : null;
  const isMentioned = botId && message.mentions.has(botId);
  const isAiChannel = settings.aiChannelId && message.channel.id === String(settings.aiChannelId);
  
  let isReplyToBot = false;
  if (message.reference && message.reference.messageId && botId) {
    try {
      const replied = await message.channel.messages.fetch(message.reference.messageId);
      if (replied && replied.author.id === botId) {
        isReplyToBot = true;
      }
    } catch (e) {}
  }

  // Responde se for mencionado, se responderem ao bot, ou se estiver no canal de chat da IA
  if (!isMentioned && !isReplyToBot && !isAiChannel) return;

  // Limpar menções do texto
  let cleanText = message.content;
  if (botId) {
    cleanText = cleanText.replace(new RegExp(`<@!?${botId}>`, 'g'), '').trim();
  }

  if (!cleanText) {
    return await message.reply('Olá! Eu sou a Silvie, assistente oficial da Ravok Network. Em que posso te ajudar hoje? 💙');
  }

  try {
    await message.channel.sendTyping();
    const authorName = message.author.displayName || message.author.username;
    const response = await askKayzelAI(cleanText, authorName);

    if (response.length <= 1900) {
      await message.reply({ content: response, allowedMentions: { repliedUser: false } });
    } else {
      const parts = response.match(/[\s\S]{1,1850}/g) || [response];
      for (const part of parts) {
        await message.channel.send(part);
      }
    }

    logBot('info', `Silvie IA respondeu a ${message.author.tag}: "${cleanText.slice(0, 35)}..."`);
  } catch (err) {
    logBot('error', `Erro na resposta da IA: ${err.message}`);
    await message.reply(`Desculpe, tive uma instabilidade temporária ao consultar a IA: ${err.message} 💙`);
  }
});

// ----------------------------------------------------
// NOTIFICAÇÕES EM CANAIS AUTOMÁTICOS
// ----------------------------------------------------

// Disparar anúncio de venda aprovada
async function notifySale(order) {
  const settings = getDbSettings();
  const channelId = settings.discordBotChannelVendas;
  if (!channelId || !client.isReady()) return false;

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) return false;

    const itemsDesc = (order.items || []).map(i => `• **${i.name}** (${i.cat || 'Item'})`).join('\n');
    const embed = new EmbedBuilder()
      .setTitle('💎 Nova Compra Aprovada!')
      .setColor(0x00FFCC)
      .setThumbnail(`https://mc-heads.net/avatar/${encodeURIComponent(order.nick)}/128`)
      .setDescription(`O jogador **${order.nick}** acabou de realizar uma compra na loja e seus itens já estão disponíveis no jogo!`)
      .addFields(
        { name: 'Jogador', value: `\`${order.nick}\``, inline: true },
        { name: 'Valor', value: `**R$ ${Number(order.total || 0).toFixed(2).replace('.', ',')}**`, inline: true },
        { name: 'Itens Adquiridos', value: itemsDesc || 'Itens diversos', inline: false },
        { name: 'Como retirar no jogo', value: 'Entre em `jogar.ravok.network` e use `/resgatar`!', inline: false }
      )
      .setFooter({ text: `Pedido #${order.id} • Ravok Network` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });

    // Atualiza automaticamente os canais de status e o painel da meta
    syncServerStatusChannels().catch(() => {});
    publishMetaPanel().catch(() => {});

    return true;
  } catch (err) {
    console.error('[Bot] Erro ao enviar anúncio de venda:', err.message);
    return false;
  }
}

// Disparar anúncio de feedback
async function notifyFeedback(feedback) {
  const settings = getDbSettings();
  const channelId = settings.discordBotChannelFeedbacks;
  if (!channelId || !client.isReady()) return false;

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) return false;

    const embed = new EmbedBuilder()
      .setTitle('⭐ Novo Feedback da Comunidade!')
      .setColor(0xffb703)
      .setThumbnail(`https://mc-heads.net/avatar/${encodeURIComponent(feedback.nick)}/128`)
      .setDescription(`"${feedback.comment}"`)
      .addFields(
        { name: 'Jogador', value: `\`${feedback.nick}\``, inline: true },
        { name: 'Nota', value: '★'.repeat(feedback.stars), inline: true }
      )
      .setFooter({ text: 'Ravok Network • Avaliações' })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    return true;
  } catch (err) {
    console.error('[Bot] Erro ao enviar feedback:', err.message);
    return false;
  }
}

// ----------------------------------------------------
// CONTROLE DE INICIALIZAÇÃO & GESTÃO DO BOT
// ----------------------------------------------------
let isStarting = false;

async function startBot(tokenOverride) {
  const settings = getDbSettings();
  const token = tokenOverride || settings.discordBotToken || process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    logBot('warn', 'Nenhum token do bot configurado.');
    return { success: false, message: 'Nenhum token configurado. Adicione o Token do Bot no Painel Admin.' };
  }

  if (client.isReady()) {
    logBot('info', 'O bot já se encontra online.');
    return { success: true, message: 'Bot já está online.', user: client.user.tag };
  }

  if (isStarting) {
    return { success: false, message: 'O bot já está em processo de inicialização...' };
  }

  isStarting = true;
  logBot('info', 'Iniciando autenticação no Discord Gateway...');

  try {
    await client.login(token);
    isStarting = false;
    logBot('info', `Autenticação bem-sucedida! Sessão iniciada como ${client.user.tag}`);
    return { success: true, user: client.user.tag };
  } catch (err) {
    isStarting = false;
    logBot('error', `Falha ao autenticar no Discord: ${err.message}`);
    return { success: false, error: err.message };
  }
}

function stopBot() {
  if (client.isReady()) {
    const userTag = client.user ? client.user.tag : 'Bot';
    if (presenceInterval) clearInterval(presenceInterval);
    if (statusChannelsInterval) clearInterval(statusChannelsInterval);
    client.destroy();
    logBot('warn', `Bot (${userTag}) foi desconectado manualmente via Painel Admin.`);
    return { success: true, message: 'Bot desconectado com sucesso.' };
  }
  return { success: false, message: 'O bot já estava offline.' };
}

async function restartBot(tokenOverride) {
  logBot('info', 'Reiniciando o bot...');
  stopBot();
  await new Promise(r => setTimeout(r, 1200));
  return await startBot(tokenOverride);
}

function getBotStatus() {
  const ready = client.isReady();
  return {
    online: ready,
    tag: ready && client.user ? client.user.tag : null,
    id: ready && client.user ? client.user.id : null,
    avatar: ready && client.user ? client.user.displayAvatarURL() : null,
    guilds: ready && client.guilds ? client.guilds.cache.size : 0,
    channels: ready && client.channels ? client.channels.cache.size : 0,
    uptime: ready ? client.uptime : 0,
    ping: ready && client.ws ? client.ws.ping : null,
    mcStatus: mcStatusCache.data || null,
    logs: [...botLogs].slice(-40)
  };
}

// Disparar anúncio personalizado direto do painel (Sem Comandos)
async function sendCustomAnnouncement({ channelId, title, message, color, imageUrl }) {
  if (!client.isReady()) {
    throw new Error('O bot precisa estar online no Discord para enviar comunicados.');
  }

  const targetId = channelId ? channelId.trim() : null;
  if (!targetId) {
    throw new Error('Informe o ID do canal de destino.');
  }

  const channel = await client.channels.fetch(targetId);
  if (!channel || !channel.isTextBased()) {
    throw new Error('Canal de texto não encontrado ou o bot não tem permissão para visualizar.');
  }

  let embedColor = 0x00d4ff;
  if (color) {
    const cleanHex = color.replace('#', '');
    const parsed = parseInt(cleanHex, 16);
    if (!isNaN(parsed)) embedColor = parsed;
  }

  const embed = new EmbedBuilder()
    .setTitle(title || '📢 Anúncio Oficial — Ravok Network')
    .setDescription(message || '')
    .setColor(embedColor)
    .setFooter({ text: 'Ravok Network • Comunicado da Equipe' })
    .setTimestamp();

  const files = [];
  if (imageUrl && typeof imageUrl === 'string') {
    const cleanImg = imageUrl.trim();
    if (cleanImg.startsWith('data:image/')) {
      const match = cleanImg.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        const buffer = Buffer.from(match[2], 'base64');
        const fileName = `anuncio_${Date.now()}.${ext}`;
        const attachment = new AttachmentBuilder(buffer, { name: fileName });
        files.push(attachment);
        embed.setImage(`attachment://${fileName}`);
      }
    } else if (cleanImg.startsWith('http://') || cleanImg.startsWith('https://')) {
      embed.setImage(cleanImg);
    }
  }

  await channel.send({ embeds: [embed], files });
  logBot('info', `📢 Anúncio "${title || 'Sem Título'}" enviado com sucesso no canal #${channel.name || targetId}`);
  return { success: true, channelName: channel.name || targetId };
}

// Enviar compra simulada para testar o canal com 1 clique
async function testSaleNotification() {
  if (!client.isReady()) throw new Error('O bot precisa estar online.');
  const dummyOrder = {
    id: Math.floor(1000 + Math.random() * 9000),
    nick: 'JogadorTeste',
    total: 49.90,
    items: [{ name: 'VIP Lendário (30 Dias)' }, { name: '10.000 Ravok Coins' }]
  };
  const ok = await notifySale(dummyOrder);
  if (!ok) throw new Error('Canal de vendas não configurado ou inacessível.');
  logBot('info', '🛒 Compra de teste enviada com sucesso no canal de vendas!');
  return { success: true };
}

// Enviar feedback simulado para testar o canal com 1 clique
async function testFeedbackNotification() {
  if (!client.isReady()) throw new Error('O bot precisa estar online.');
  const dummyFeedback = {
    nick: 'JogadorTeste',
    comment: 'Servidor incrível! Entrega automática instantânea pelo /resgatar no Minecraft.',
    stars: 5
  };
  const ok = await notifyFeedback(dummyFeedback);
  if (!ok) throw new Error('Canal de feedbacks não configurado ou inacessível.');
  logBot('info', '⭐ Avaliação de teste enviada com sucesso no canal de avaliações!');
  return { success: true };
}

// Enviar boas-vindas simuladas para testar o canal com 1 clique
async function testWelcomeNotification(targetUser) {
  if (!client.isReady()) throw new Error('O bot precisa estar online.');
  const settings = getDbSettings();
  const welcomeChannelId = settings.discordBotChannelBoasVindas;
  if (!welcomeChannelId) throw new Error('Canal de boas-vindas não configurado no painel.');
  const channel = client.channels.cache.get(String(welcomeChannelId)) || await client.channels.fetch(String(welcomeChannelId)).catch(() => null);
  if (!channel || !channel.isTextBased()) throw new Error('Canal de boas-vindas inacessível ou inválido.');

  const user = targetUser || client.user;
  const guild = channel.guild;
  const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256 });
  let bgImage = settings.welcomeBgUrl;
  if (!bgImage) {
    const localBg = path.join(__dirname, 'public', 'welcome-bg.png');
    if (fs.existsSync(localBg)) bgImage = localBg;
  }

  const cardBuffer = await generateWelcomeCard({
    username: user.username,
    avatarUrl: avatarUrl,
    memberCount: guild ? guild.memberCount : 540,
    serverName: guild ? guild.name : 'Ravok Network',
    badgeText: `Member #${guild ? guild.memberCount : 540}`,
    backgroundImage: bgImage
  });

  const attachment = new AttachmentBuilder(cardBuffer, { name: 'welcome.png' });
  await channel.send({
    content: `Welcome ${user} to **${guild ? guild.name : 'Ravok Network'}**! *(Teste Administrativo)*`,
    files: [attachment]
  });
  logBot('info', `🖼️ Boas-vindas de teste enviadas para #${channel.name}!`);
  return { success: true, channelName: channel.name };
}

// Forçar ressincronização dos comandos slash
async function syncCommands() {
  if (!client.isReady() || !client.application) {
    throw new Error('O bot precisa estar online para sincronizar comandos slash.');
  }
  await client.application.commands.set(commands);
  for (const guild of client.guilds.cache.values()) {
    await guild.commands.set(commands).catch(() => {});
  }
  logBot('info', `⚡ ${commands.length} Comandos Slash sincronizados com a API global e guildas do Discord!`);
  return { success: true, count: commands.length };
}

// Limpar mensagens de um canal de texto via Painel Web
async function clearChannelMessages(channelId, amount = 100) {
  if (!client.isReady()) {
    throw new Error('O bot precisa estar online no Discord para limpar mensagens.');
  }
  const cleanId = String(channelId || '').trim();
  if (!cleanId) {
    throw new Error('Informe o ID do canal que deseja limpar.');
  }

  let channel = client.channels.cache.get(cleanId);
  if (!channel) {
    channel = await client.channels.fetch(cleanId).catch(() => null);
  }
  if (!channel || !channel.isTextBased()) {
    throw new Error('Canal de texto não encontrado ou o bot não tem permissão para acessá-lo.');
  }

  const botMember = channel.guild ? channel.guild.members.me : null;
  if (botMember && !botMember.permissionsIn(channel).has(PermissionFlagsBits.ManageMessages)) {
    throw new Error('O bot não possui a permissão "Gerenciar Mensagens" no canal indicado.');
  }

  const clamped = Math.max(1, Math.min(100, parseInt(amount, 10) || 100));
  const deleted = await channel.bulkDelete(clamped, true);
  const total = deleted ? deleted.size : 0;

  logBot('info', `🧹 ${total} mensagens apagadas via Painel Web no canal #${channel.name || cleanId}`);
  return { success: true, count: total, channelName: channel.name || cleanId };
}

// Limpar logs
function clearLogs() {
  botLogs.length = 0;
  return { success: true };
}

// ----------------------------------------------------
// PUBLICAR PAINÉIS INTERATIVOS NO DISCORD (1-CLIQUE)
// ----------------------------------------------------
async function publishPanel(type, targetChannelId) {
  if (!client.isReady()) throw new Error('O bot precisa estar online.');
  const settings = getDbSettings();
  let channelId = targetChannelId;
  let embed, row;

  if (type === 'meta') {
    return await publishMetaPanel(targetChannelId);
  }

  if (type === 'tickets') {
    channelId = channelId || settings.discordBotCategoryTickets || settings.discordBotChannelGeral;
    embed = new EmbedBuilder()
      .setTitle('🎫 ﹒𝗧𝗶𝗰𝗸𝗲𝘁 𝗱𝗲 𝗦𝘂𝗽𝗼𝗿𝘁𝗲 • Ravok Network')
      .setDescription('⊱⋅ ───── ❴ • ✦ ʀᴀᴠᴏᴋ ѕᴜᴘᴘᴏʀᴛ ✦ • ❵ ───── ⋅⊰\n\nPrecisa de ajuda? A gente resolve! 🛠️\n\nClicando abaixo, você pode:\n📌 Tirar dúvidas sobre o servidor\n⚠️ Reportar problemas, bugs ou denúncias\n💬 Falar direto com a nossa equipe\n\nAssim que abrir, um membro da Staff vai te atender.\n\n💡 Atendimento direto, rápido e humanizado.\n\n⊱⋅ ───── ❴ • ✦ ✦ ✦ • ❵ ───── ⋅⊰\n👇 Clique no botão abaixo para abrir seu atendimento:')
      .setColor(0x55E6D8)
      .setImage('https://files.catbox.moe/8dnlh1.png')
      .setFooter({ text: 'Silvie • Atendimento Oficial Ravok' });
    row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('sys_ticket_btn').setLabel('Abrir Ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫')
    );
  } else if (type === 'recrutamento') {
    channelId = channelId || settings.discordBotCategoryRecrutamento || settings.discordBotChannelGeral;
    embed = new EmbedBuilder()
      .setTitle('🛡️ ﹒𝗥𝗲𝗰𝗿𝘂𝘁𝗮𝗺𝗲𝗻𝘁𝗼 • Ravok Staff')
      .setDescription('⊱⋅ ───── ❴ • ✦ ᴄᴏʀᴇ ʀᴀᴠᴏᴋ ✦ • ❵ ───── ⋅⊰\n\nQuer entrar para a equipe? Aqui é onde você se prova! 👑\n\nClicando abaixo, você pode se candidatar.\n\nA gente procura:\n🧠 Responsabilidade e maturidade\n💬 Boa comunicação\n⚡ Atividade e dedicação no servidor\n\n💡 Não é só um cargo… é compromisso com os jogadores.\n\n⊱⋅ ───── ❴ • ✦ ✦ ✦ • ❵ ───── ⋅⊰\n👇 Clique no botão abaixo para preencher seu formulário:')
      .setColor(0x55E6D8)
      .setImage('https://files.catbox.moe/udb3ur.png')
      .setFooter({ text: 'Silvie • Recrutamento Ravok Network' });
    row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('sys_recrut_btn').setLabel('Fazer Formulário').setStyle(ButtonStyle.Success).setEmoji('📋')
    );
  } else if (type === 'confissoes') {
    channelId = channelId || settings.discordBotChannelConfissoes || settings.discordBotChannelGeral;
    embed = new EmbedBuilder()
      .setTitle('🤫 ﹒𝗖𝗼𝗻𝗳𝗶𝘀𝘀õ𝗲𝘀 𝗔𝗻ô𝗻𝗶𝗺𝗮𝘀')
      .setDescription('⊱⋅ ───── ❴ • ✦ ᴀɴôɴɪᴍᴏ ✦ • ❵ ───── ⋅⊰\n\nQuer falar algo sem mostrar quem é? 👀\n\nClicando abaixo, você pode enviar:\n🤫 Confissões\n💭 Pensamentos\n📖 Histórias secretas\n\n🔒 **Tudo é 100% anônimo.**\n\n💡 Só lembra… alguém vai ler 😏\n\n⊱⋅ ───── ❴ • ✦ ✦ ✦ • ❵ ───── ⋅⊰\n👇 Clique no botão abaixo para enviar sua confissão:')
      .setColor(0x9b59b6)
      .setImage('https://files.catbox.moe/hutibg.png')
      .setFooter({ text: 'Silvie • Confissões Ravok' });
    row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('sys_confissao_btn').setLabel('Enviar Confissão').setStyle(ButtonStyle.Secondary).setEmoji('👻')
    );
  } else if (type === 'sugestoes') {
    channelId = channelId || settings.discordBotChannelSugestoes || settings.discordBotChannelGeral;
    embed = new EmbedBuilder()
      .setTitle('💡 ﹒𝗦𝘂𝗴𝗲𝘀𝘁õ𝗲𝘀 da Comunidade')
      .setDescription('⊱ ───── ❴ • ✦ ɪᴅᴇɪᴀѕ ✦ • ❵ ───── ⋅⊰\n\nTem uma ideia pra melhorar o servidor? Manda aqui! 💡\n\nClicando abaixo, você pode sugerir:\n⚙️ Novos sistemas e mecânicas\n🎮 Ideias de eventos e minigames\n✨ Melhorias gerais para o reino\n\nTudo é analisado pela equipe e votado pelos jogadores.\n\n💡 Algumas ideias viram realidade… pode ser a sua!\n\n⊱⋅ ───── ❴ • ✦ ✦ ✦ • ❵ ───── ⋅⊰\n👇 Clique no botão abaixo para enviar sua sugestão:')
      .setColor(0xf1c40f)
      .setImage('https://files.catbox.moe/ckwmh6.png')
      .setFooter({ text: 'Silvie • Sugestões Ravok' });
    row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('sys_sugestao_btn').setLabel('Nova Sugestão').setStyle(ButtonStyle.Primary).setEmoji('💡')
    );
  } else if (type === 'vincular') {
    channelId = channelId || settings.discordBotChannelGeral;
    embed = new EmbedBuilder()
      .setTitle('🔗 ﹒𝗩𝗶𝗻𝗰𝘂𝗹𝗮𝗿 𝗖𝗼𝗻𝘁𝗮 𝗠𝗶𝗻𝗲𝗰𝗿𝗮𝗳𝘁')
      .setDescription('⊱⋅ ───── ❴ • ✦ ɪɴᴛᴇɢʀᴀçãᴏ ✦ • ❵ ───── ⋅⊰\n\nConecte sua conta do Minecraft com seu Discord e desbloqueie vantagens! ⚙️\n\nClicando abaixo, você pode:\n🔗 Vincular sua conta em segundos\n🎖️ Receber cargos automáticos de membro vinculado\n⚡ Liberar benefícios exclusivos na comunidade\n\n💡 Mais integração = mais recursos!\n\n⊱⋅ ───── ❴ • ✦ ✦ ✦ • ❵ ───── ⋅⊰\n👇 Clique no botão abaixo para vincular sua conta:')
      .setColor(0x00d4ff)
      .setImage('https://files.catbox.moe/8xxg2i.png')
      .setFooter({ text: 'Silvie • Integração de Contas Ravok' });
    row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('sys_vinc_btn').setLabel('Vincular Conta').setStyle(ButtonStyle.Success).setEmoji('🔗')
    );
  } else if (type === 'feedback') {
    channelId = channelId || settings.discordBotChannelFeedbacks || settings.discordBotChannelGeral;
    embed = new EmbedBuilder()
      .setTitle('⭐ ﹒𝗙𝗲𝗲𝗱𝗯𝗮𝗰𝗸 & 𝗔𝘃𝗮𝗹𝗶𝗮çõ𝗲𝘀')
      .setDescription('⊱⋅ ───── ❴ • ✦ ᴏᴘɪɴɪãᴏ ✦ • ❵ ───── ⋅⊰\n\nSua opinião ajuda a moldar a história do servidor! 📊\n\nClicando abaixo, você pode dizer:\n👍 O que mais gostou no servidor\n👎 O que podemos melhorar\n💭 Ideias rápidas e avaliações\n\nTudo é lido com muito carinho pela equipe.\n\n💡 A Ravok evolui junto com você!\n\n⊱⋅ ───── ❴ • ✦ ✦ ✦ • ❵ ───── ⋅⊰\n👇 Clique no botão abaixo para dar seu feedback:')
      .setColor(0xf39c12)
      .setImage('https://files.catbox.moe/gw7wyn.png')
      .setFooter({ text: 'Silvie • Avaliações da Comunidade' });
    row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('sys_feedback_btn').setLabel('Dar Feedback').setStyle(ButtonStyle.Primary).setEmoji('⭐')
    );
  } else if (type === 'video') {
    channelId = channelId || settings.discordBotChannelVideos || settings.discordBotChannelGeral;
    embed = new EmbedBuilder()
      .setTitle('🎬 ﹒𝗖𝗼𝗺𝘂𝗻𝗶𝗱𝗮𝗱𝗲 𝗲𝗺 𝗗𝗲𝘀𝘁𝗮𝗾𝘂𝗲 (Vídeos & Lives)')
      .setDescription('⊱⋅ ───── ❴ • ✦ ᴄʀɪᴀᴅᴏʀᴇѕ ✦ • ❵ ───── ⋅⊰\n\nProduziu conteúdo sobre a Ravok Network? Aqui é o lugar pra brilhar! 🚀\n\nEnvie seus vídeos e transmissões:\n🎥 Vídeos do YouTube\n🔴 Transmissões ao vivo da Twitch ou YouTube\n\nA comunidade pode apoiar com likes, views e novos amigos!\n\n💡 Dica: Um bom título e thumbnail atraem muito mais público.\n\n⊱⋅ ───── ❴ • ✦ ✦ ✦ • ❵ ───── ⋅⊰')
      .setColor(0xe74c3c)
      .setImage('https://files.catbox.moe/6pox8p.png')
      .setFooter({ text: 'Silvie • Criadores Ravok' });
    row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('sys_video_btn').setLabel('Divulgar Vídeo').setStyle(ButtonStyle.Danger).setEmoji('🎬'),
      new ButtonBuilder().setCustomId('sys_live_btn').setLabel('Anunciar Live').setStyle(ButtonStyle.Danger).setEmoji('🔴')
    );
  } else if (type === 'regras') {
    channelId = channelId || settings.discordBotChannelRegras || settings.discordBotChannelGeral;
    embed = new EmbedBuilder()
      .setTitle('📜 ᴅɪʀᴇᴛʀɪᴢᴇꜱ ɢᴇʀᴀɪꜱ — ʀᴀᴠᴏᴋ ɴᴇᴛᴡᴏʀᴋ')
      .setDescription(`⊱⋅ ───── ❴ • ✦ ʀᴀᴠᴏᴋ ɴᴇᴛᴡᴏʀᴋ ✦ • ❵ ───── ⋅⊰\n\n🤝 **ʀᴇꜱᴘᴇɪᴛᴏ ᴇ́ ᴇꜱꜱᴇɴᴄɪᴀʟ**\nTrate todos os membros com educação e respeito.\n\n🚫 **ᴘʀᴇᴄᴏɴᴄᴇɪᴛᴏ ɴᴀ̃ᴏ ᴇ́ ᴛᴏʟᴇʀᴀᴅᴏ**\nQualquer forma de discriminação resultará em banimento imediato.\n\n🛑 **ᴇᴠɪᴛᴇ ᴄᴏɴꜰʟɪᴛᴏꜱ**\nAssédio, provocações ou discussões agressivas não serão permitidas.\n\n📩 **ɴᴀ̃ᴏ ꜰᴀᴄ̧ᴀ ꜱᴘᴀᴍ**\nFlood, mensagens repetitivas ou poluição de chat são proibidos.\n\n📢 **ᴅɪᴠᴜʟɢᴀᴄ̧ᴀ̃ᴏ ᴀᴘᴇɴᴀꜱ ᴄᴏᴍ ᴀᴜᴛᴏʀɪᴢᴀᴄ̧ᴀ̃ᴏ**\nLinks, servidores ou projetos externos só podem ser divulgados com permissão da staff.\n\n🔞 **ᴄᴏɴᴛᴇᴜ́ᴅᴏ ɪɴᴀᴘʀᴏᴘʀɪᴀᴅᴏ**\nConteúdos NSFW ou ofensivos não são permitidos.\n\n⚠️ **ᴄᴏɴᴛᴇᴜ́ᴅᴏ ɪʟᴇɢᴀʟ**\nÉ proibido compartilhar qualquer material ilícito.\n\n🔗 **ʟɪɴᴋꜱ ꜱᴜꜱᴘᴇɪᴛᴏꜱ**\nNão envie links maliciosos ou encurtadores duvidosos.\n\n🧠 **ᴜꜱᴇ ᴏꜱ ᴄᴀɴᴀɪꜱ ᴄᴏʀʀᴇᴛᴏꜱ**\nMantenha cada assunto em seu canal apropriado.\n\n🧯 **ᴇᴠɪᴛᴇ ᴛᴏxɪᴄɪᴅᴀᴅᴇ**\nDiscussões destrutivas ou comportamento tóxico não serão tolerados.\n\n🕵️ **ᴘʀɪᴠᴀᴄɪᴅᴀᴅᴇ**\nNão compartilhe dados pessoais seus ou de terceiros.\n\n👑 **ꜱᴛᴀꜰꜰ**\nÉ proibido se passar por membros da staff.\n\n🎯 **ᴅᴇᴄɪꜱᴏ̃ᴇꜱ ᴅᴀ ꜱᴛᴀꜰꜰ**\nAs decisões da equipe devem ser respeitadas.\n\n🧠 **ʙᴏᴍ ꜱᴇɴꜱᴏ**\nCaso algo não esteja listado aqui, use o bom senso.\n\n⊱⋅ ───── ❴ • ✦ ʀᴀᴠᴏᴋ ɴᴇᴛᴡᴏʀᴋ ✦ • ❵ ───── ⋅⊰\n\n✨ **Aproveite o Ravok Network e divirta-se!**`)
      .setColor(0x55E6D8)
      .setFooter({ text: 'Silvie • Diretrizes Oficiais' });
  } else if (type === 'loja') {
    channelId = channelId || settings.discordBotChannelVendas || '1533504518967525386';
    const storeUrl = settings.siteUrl || (API_BASE && !API_BASE.includes('localhost') ? API_BASE : 'https://ravok.network');
    embed = new EmbedBuilder()
      .setTitle('🛒 ﹒𝗟𝗢𝗝𝗔 𝗢𝗙𝗜𝗖𝗜𝗔𝗟 • ʀᴀᴠᴏᴋ ɴᴇᴛᴡᴏʀᴋ')
      .setDescription(
        '⊱⋅ ───── ❴ • ✦ ʀᴀᴠᴏᴋ ѕᴛᴏʀᴇ ✦ • ❵ ───── ⋅⊰\n\n' +
        'Bem-vindo à **Loja Oficial da Ravok Network**! 🌟\n\n' +
        'Aqui você pode adquirir **Ranks VIP**, **Ravok Coins**, **Chaves de Caixas** e cosméticos exclusivos com ativação e entrega 100% automáticas diretamente no servidor!\n\n' +
        '👑 **Ranks VIP**: Kits diários exclusivos, tags de destaque no chat, multiplicadores de coins e prioridade na fila do servidor.\n' +
        '🪙 **Ravok Coins**: Moeda oficial para gastar no `/coinshop` do jogo para desbloquear vantagens lendárias.\n' +
        '🗝️ **Chaves de Caixas**: Chaves de Voto, Rara e Épica para abrir caixas misteriosas no spawn.\n' +
        '💳 **Pagamento Instantâneo**: Pix com aprovação imediata via Mercado Pago.\n' +
        '⚡ **Como retirar no jogo**: Assim que sua compra for aprovada, basta digitar `/resgatar` no servidor!\n\n' +
        '⊱⋅ ───── ❴ • ✦ ✦ ✦ • ❵ ───── ⋅⊰\n' +
        '👇 Clique nos botões abaixo para acessar a loja e conferir os pacotes:'
      )
      .setColor(0x55E6D8)
      .setImage('https://files.catbox.moe/8xxg2i.png')
      .setFooter({ text: 'Silvie • Loja Oficial Ravok Network' });
    row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Acessar Loja Web')
        .setStyle(ButtonStyle.Link)
        .setEmoji('🛒')
        .setURL(storeUrl),
      new ButtonBuilder()
        .setLabel('Ranks VIP')
        .setStyle(ButtonStyle.Link)
        .setEmoji('👑')
        .setURL(`${storeUrl}#vips`),
      new ButtonBuilder()
        .setLabel('Comprar Coins')
        .setStyle(ButtonStyle.Link)
        .setEmoji('🪙')
        .setURL(`${storeUrl}#coins`),
      new ButtonBuilder()
        .setLabel('Chaves & Caixas')
        .setStyle(ButtonStyle.Link)
        .setEmoji('🗝️')
        .setURL(`${storeUrl}#chaves`)
    );
  } else {
    throw new Error(`Tipo de painel desconhecido: ${type}`);
  }

  const channel = client.channels.cache.get(String(channelId));
  if (!channel) throw new Error(`Canal ID ${channelId} não encontrado no Discord.`);

  if (type === 'loja' && channel.name !== '┊・🛒・ʟᴏᴊᴀ・ᴏꜰɪᴄɪᴀʟ') {
    try {
      await channel.setName('┊・🛒・ʟᴏᴊᴀ・ᴏꜰɪᴄɪᴀʟ');
    } catch (e) {}
  }

  // Deletar mensagem anterior do painel neste canal (garante que fique sempre como última)
  const activePanels = settings.activePanels || {};
  const currentPanel = activePanels[String(channelId)];
  if (currentPanel && currentPanel.messageId) {
    try {
      const oldMsg = await channel.messages.fetch(currentPanel.messageId);
      if (oldMsg) await oldMsg.delete();
    } catch (e) {}
  }
  
  const payload = { embeds: [embed] };
  if (row) payload.components = [row];
  const newMsg = await channel.send(payload);

  // Grava o ID da nova mensagem para mantê-la sempre no fim do chat
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const db = JSON.parse(raw);
    db.settings.activePanels = db.settings.activePanels || {};
    db.settings.activePanels[String(channelId)] = { messageId: newMsg.id, type };
    saveDbAtomic(db);
  } catch (e) {}

  logBot('info', `📌 Painel "${type}" mantido como última mensagem no canal #${channel.name || channelId}!`);
  return { success: true, channelName: channel.name || channelId, messageId: newMsg.id };
}

const empurrarPainel = publishPanel;

// Atribuir cargos de conta vinculada para um membro pelo ID ou Tag
async function assignLinkedRoles(discordIdOrTag) {
  if (!client.isReady() || !discordIdOrTag) return false;
  const settings = getDbSettings();
  const roleVinculadoId = settings.discordBotRoleVinculado;
  const roleAcessoId = settings.discordBotRoleAcesso;
  if (!roleVinculadoId && !roleAcessoId) return false;

  const match = String(discordIdOrTag).match(/\b\d{17,20}\b/);
  const targetId = match ? match[0] : null;

  for (const guild of client.guilds.cache.values()) {
    try {
      let member = targetId ? await guild.members.fetch(targetId).catch(() => null) : null;
      if (!member) {
        const cleanTag = String(discordIdOrTag).replace(/\s*\(\d+\)/, '').trim().toLowerCase();
        member = guild.members.cache.find(m => m.user.tag.toLowerCase() === cleanTag || m.user.username.toLowerCase() === cleanTag);
      }
      if (member) {
        if (roleVinculadoId) {
          const r = guild.roles.cache.get(roleVinculadoId);
          if (r) await member.roles.add(r).catch(() => {});
        }
        if (roleAcessoId) {
          const r = guild.roles.cache.get(roleAcessoId);
          if (r) await member.roles.add(r).catch(() => {});
        }
        logBot('info', `🎖️ Cargos de Conta Vinculada atribuídos com sucesso para ${member.user.tag}!`);
        return true;
      }
    } catch (e) {}
  }
  return false;
}

// ----------------------------------------------------
// SISTEMA DE METAS DE VENDAS & STATUS DE CANAIS
// ----------------------------------------------------

function calculateSalesGoal() {
  const settings = getDbSettings();
  let orders = [];
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    orders = Array.isArray(parsed.orders) ? parsed.orders : [];
  } catch (e) {}

  const baseSales = Number(settings.metaVendasBase || 0);
  const targetGoal = Number(settings.metaVendasValor || 2000);
  const goalMode = settings.goalMode || 'manual';

  const approvedTotal = orders
    .filter(o => ['aprovado', 'approved', 'paid', 'completed', 'entregue'].includes(String(o.status || '').toLowerCase()))
    .reduce((acc, o) => acc + Number(o.total || 0), 0);

  const totalArrecadado = Math.max(0, baseSales + approvedTotal);
  const autoPercent = targetGoal > 0 ? Math.min(100, Math.round((totalArrecadado / targetGoal) * 100)) : 0;
  const percent = goalMode === 'manual'
    ? Math.min(100, Math.max(0, Math.round(Number(settings.goalManualPercent || 0))))
    : autoPercent;
  const falta = Math.max(0, targetGoal - totalArrecadado);

  return {
    goalMode,
    manualPercent: Math.min(100, Math.max(0, Math.round(Number(settings.goalManualPercent || 0)))),
    autoPercent,
    totalArrecadado,
    targetGoal,
    percent,
    falta
  };
}

function generateProgressBar(percent, size = 12) {
  const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
  const filled = Math.round((clamped / 100) * size);
  const empty = Math.max(0, size - filled);
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// Sincronizar Canais de Voz de Status do Servidor e Meta
async function syncServerStatusChannels() {
  if (!client.isReady()) {
    return { success: false, message: 'Bot offline' };
  }
  const settings = getDbSettings();

  const chJogadoresId = settings.discordBotChannelStatusJogadores || '1529648354928234548';
  const chServerId = settings.discordBotChannelStatusServer || '1529648417066975272';
  const chPingId = settings.discordBotChannelStatusPing || '1529648465309864016';
  const chMetaId = settings.discordBotChannelMetaVendas || '1531083037742334053';

  // 1. Obter status do Minecraft diretamente sem dependência de portas locais
  let onlinePlayers = 0;
  let isServerOnline = false;
  try {
    const mcStatus = await fetchMinecraftStatus(true);
    isServerOnline = Boolean(mcStatus.online);
    onlinePlayers = mcStatus.players && typeof mcStatus.players.online === 'number' ? mcStatus.players.online : 0;
  } catch (e) {
    logBot('warn', `Erro ao consultar status do Minecraft para canais de voz: ${e.message}`);
  }

  // 2. Ping do WebSocket
  let ping = client.ws && client.ws.ping > 0 ? Math.round(client.ws.ping) : 18;

  // 3. Meta de vendas
  const { totalArrecadado, targetGoal } = calculateSalesGoal();
  const valArr = totalArrecadado % 1 === 0 ? totalArrecadado.toString() : totalArrecadado.toFixed(0);
  const valMeta = targetGoal % 1 === 0 ? targetGoal.toString() : targetGoal.toFixed(0);

  const chVendasId = settings.discordBotChannelVendas || '1533504518967525386';

  const updates = [
    { id: chJogadoresId, targetName: `👥 Jogadores: ${onlinePlayers}` },
    { id: chServerId, targetName: isServerOnline ? '🟢 Status: Online' : '🔴 Status: Offline' },
    { id: chPingId, targetName: `└─・📶・Ping: ${ping}ms` },
    { id: chMetaId, targetName: `┊-💰-ᴍᴇᴛᴀ-${valArr}-de-${valMeta}` },
    { id: chVendasId, targetName: '┊・🛒・ʟᴏᴊᴀ・ᴏꜰɪᴄɪᴀʟ' }
  ];

  const results = [];
  for (const item of updates) {
    if (!item.id) continue;
    try {
      let ch = client.channels.cache.get(item.id);
      if (!ch) {
        ch = await client.channels.fetch(item.id).catch(() => null);
      }
      if (!ch) {
        results.push({ id: item.id, status: 'not_found' });
        continue;
      }
      if (ch.name !== item.targetName) {
        await ch.setName(item.targetName);
        logBot('info', `📊 Canal "${ch.name}" renomeado para: "${item.targetName}"`);
        results.push({ id: item.id, oldName: ch.name, newName: item.targetName, updated: true });
      } else {
        results.push({ id: item.id, name: ch.name, updated: false, reason: 'already_matched' });
      }
    } catch (err) {
      logBot('warn', `Não foi possível renomear canal ${item.id} (${item.targetName}): ${err.message}`);
      results.push({ id: item.id, error: err.message });
    }
  }

  // Sincronizar presença do bot simultaneamente
  updateBotPresence().catch(() => {});

  return { success: true, results, onlinePlayers, isServerOnline, ping, totalArrecadado, targetGoal };
}

// Publicar ou atualizar embed oficial da Meta de Vendas
async function publishMetaPanel(targetChannelId) {
  if (!client.isReady()) throw new Error('O bot precisa estar online.');
  const settings = getDbSettings();
  const channelId = targetChannelId || settings.discordBotChannelMetaVendas || '1531083037742334053';

  let channel = client.channels.cache.get(String(channelId));
  if (!channel) {
    channel = await client.channels.fetch(String(channelId)).catch(() => null);
  }
  if (!channel || !channel.isTextBased()) {
    throw new Error(`Canal ID ${channelId} não encontrado ou não aceita mensagens.`);
  }

  const { totalArrecadado, targetGoal, percent, falta } = calculateSalesGoal();
  const progressBar = generateProgressBar(percent, 14);

  const embed = new EmbedBuilder()
    .setTitle('💰 ﹒𝗠𝗘𝗧𝗔 𝗗𝗘 𝗔𝗥𝗥𝗘𝗖𝗔𝗗𝗔ÇÃ𝗢 • ʀᴀᴠᴏᴋ ɴᴇᴛᴡᴏʀᴋ')
    .setDescription(
      '⊱⋅ ───── ❴ • ✦ ʀᴀᴠᴏᴋ ѕᴛᴏʀᴇ ✦ • ❵ ───── ⋅⊰\n\n' +
      'Ajude a manter a **Ravok Network** online, rápida e repleta de novidades! Todo o valor arrecadado é 100% reinvestido em hospedagem dedicada de alta performance, novos minigames, sistemas exclusivos e proteções avançadas.\n\n' +
      'Ao adquirir qualquer **VIP, Coins, Chaves de Caixas ou Cosméticos**, você fortalece nossa comunidade e desbloqueia vantagens épicas instantâneas!\n\n' +
      '⊱⋅ ───── ❴ • ✦ ᴘʀᴏɢʀᴇѕѕᴏ ✦ • ❵ ───── ⋅⊰'
    )
    .setColor(percent >= 100 ? 0x00FFCC : 0x00D2FF)
    .addFields(
      { name: '💵 Total Arrecadado', value: `\`R$ ${totalArrecadado.toFixed(2).replace('.', ',')}\``, inline: true },
      { name: '🎯 Meta Mensal', value: `\`R$ ${targetGoal.toFixed(2).replace('.', ',')}\``, inline: true },
      { name: '📊 Porcentagem', value: `\`${percent}%\``, inline: true },
      {
        name: '📈 Barra de Progresso',
        value: `\`[${progressBar}]\` **${percent}%**\n` +
          (percent >= 100
            ? '🎉 **Meta mensal 100% batida!** Um enorme obrigado a todos os jogadores que apoiam a nossa rede!'
            : `Faltam apenas **R$ ${falta.toFixed(2).replace('.', ',')}** para alcançarmos o objetivo deste mês!`),
        inline: false
      }
    )
    .setImage('https://files.catbox.moe/8xxg2i.png')
    .setFooter({ text: 'Silvie • Meta Oficial de Manutenção e Expansão Ravok' })
    .setTimestamp();

  const storeUrl = settings.siteUrl || (API_BASE && !API_BASE.includes('localhost') ? API_BASE : 'https://ravok.network');
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Acessar Loja Oficial')
      .setStyle(ButtonStyle.Link)
      .setEmoji('🛒')
      .setURL(storeUrl),
    new ButtonBuilder()
      .setLabel('Ver Ranks VIP')
      .setStyle(ButtonStyle.Link)
      .setEmoji('👑')
      .setURL(`${storeUrl}#vips`),
    new ButtonBuilder()
      .setLabel('Comprar Coins')
      .setStyle(ButtonStyle.Link)
      .setEmoji('🪙')
      .setURL(`${storeUrl}#coins`)
  );

  const payload = { embeds: [embed], components: [row] };

  // Verificar se já existe uma mensagem gravada em activePanels
  const activePanels = settings.activePanels || {};
  const currentPanel = activePanels[String(channelId)];

  if (currentPanel && currentPanel.messageId) {
    try {
      const oldMsg = await channel.messages.fetch(currentPanel.messageId).catch(() => null);
      if (oldMsg) {
        await oldMsg.edit(payload);
        logBot('info', `📈 Painel da Meta atualizado com sucesso na mensagem existente (${currentPanel.messageId})!`);
        return { success: true, channelName: channel.name || channelId, messageId: oldMsg.id, action: 'edited' };
      }
    } catch (e) {}
  }

  // Se não foi editada, envia uma nova mensagem
  const newMsg = await channel.send(payload);

  // Grava em activePanels
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const db = JSON.parse(raw);
    db.settings.activePanels = db.settings.activePanels || {};
    db.settings.activePanels[String(channelId)] = { messageId: newMsg.id, type: 'meta' };
    saveDbAtomic(db);
  } catch (e) {}

  logBot('info', `📌 Novo painel da meta publicado com sucesso no canal #${channel.name || channelId}!`);
  return { success: true, channelName: channel.name || channelId, messageId: newMsg.id, action: 'created' };
}

// Se executado diretamente via terminal (node bot.js)
if (require.main === module) {
  startBot();
}

async function publishStorePanel(targetChannelId) {
  return await publishPanel('loja', targetChannelId);
}

module.exports = {
  askSilvieAI: askKayzelAI,
  client,
  startBot,
  stopBot,
  restartBot,
  getBotStatus,
  notifySale,
  notifyFeedback,
  sendCustomAnnouncement,
  testSaleNotification,
  testFeedbackNotification,
  testWelcomeNotification,
  syncCommands,
  clearLogs,
  askKayzelAI,
  publishPanel,
  empurrarPainel,
  assignLinkedRoles,
  syncServerStatusChannels,
  publishMetaPanel,
  publishStorePanel,
  calculateSalesGoal,
  generateProgressBar,
  fetchMinecraftStatus,
  clearChannelMessages
};
