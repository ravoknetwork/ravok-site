const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const crypto = require('crypto');

function hashPassword(pass) {
  return crypto.createHash('sha256').update(String(pass || '') + '_ravok_salt_2026').digest('hex');
}

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Tratamento global de exceções e rejeições assíncronas para proteção do container
process.on('uncaughtException', (err) => {
  console.error('[Server] [FATAL] uncaughtException interceptada:', err && err.stack ? err.stack : err);
});

process.on('unhandledRejection', (reason) => {
  console.warn('[Server] [WARN] unhandledRejection interceptada:', reason && reason.message ? reason.message : reason);
});

// Módulo do Bot Discord (Ravok Site)
let bot = null;
try {
  bot = require('./bot.js');
} catch (e) {
  console.warn('[Server] Módulo do bot indisponível:', e.message);
}

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos da pasta public, raiz e subpastas
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/products', express.static(path.join(__dirname, 'public', 'products')));
app.use('/products', express.static(path.join(__dirname, 'products')));
app.use('/downloads', express.static(path.join(__dirname, 'public', 'downloads')));
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// Handler universal de arquivos estáticos (.css, .js, imagens, fontes) com busca multi-caminho
app.get(/\.(css|js|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|map|json)$/i, (req, res, next) => {
  const relPath = req.path.replace(/^\/+/, '');
  const candidatePaths = [
    path.join(__dirname, 'public', relPath),
    path.join(process.cwd(), 'public', relPath),
    path.join(__dirname, relPath),
    path.join(process.cwd(), relPath),
    path.resolve(__dirname, '..', relPath),
    path.resolve(process.cwd(), '..', relPath)
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        if (fs.statSync(p).isFile()) {
          return res.sendFile(p);
        }
      } catch (e) {}
    }
  }
  next();
});

// Handlers explícitos via Regex para entregar qualquer nível de pasta/subpasta (/images/... ou /products/...)
app.get(/^\/(images|products|downloads)\/.+/, (req, res) => {
  const relPath = req.path.replace(/^\/+/, '');
  const candidatePaths = [
    path.join(__dirname, 'public', relPath),
    path.join(process.cwd(), 'public', relPath),
    path.join(__dirname, relPath),
    path.join(process.cwd(), relPath),
    path.resolve(__dirname, '..', relPath)
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        if (fs.statSync(p).isFile()) {
          return res.sendFile(p);
        }
      } catch (e) {}
    }
  }
  res.status(404).send('Asset not found: ' + relPath);
});

// Endpoint de diagnóstico para validar ambiente Vercel
app.get('/api/debug-files', (req, res) => {
  try {
    const listDir = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir) : null;
    res.json({
      dirname: __dirname,
      cwd: process.cwd(),
      rootFiles: listDir(__dirname),
      cwdFiles: listDir(process.cwd()),
      imagesInDirname: listDir(path.join(__dirname, 'images')),
      imagesInCwd: listDir(path.join(process.cwd(), 'images')),
      productsInDirname: listDir(path.join(__dirname, 'images', 'products')),
      productsInCwd: listDir(path.join(process.cwd(), 'images', 'products'))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rotas explícitas para garantir exibição das páginas principais
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get(['/rules', '/regras'], (req, res) => {
  res.sendFile(path.join(__dirname, 'rules.html'));
});
app.get(['/staff', '/equipe'], (req, res) => {
  res.sendFile(path.join(__dirname, 'staff.html'));
});
app.get(['/vote', '/votar'], (req, res) => {
  res.sendFile(path.join(__dirname, 'vote.html'));
});
app.get('/faq', (req, res) => {
  res.sendFile(path.join(__dirname, 'faq.html'));
});
app.get('/texturas', (req, res) => {
  res.sendFile(path.join(__dirname, 'texturas.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});
app.get('/rankings', (req, res) => {
  res.sendFile(path.join(__dirname, 'rankings.html'));
});

// Endpoint raiz da API para testes de conectividade e healthcheck
app.get(['/api', '/api/'], (req, res) => {
  res.json({
    status: 'ok',
    name: 'Ravok Network API',
    season: 'Temporada 3 - Outonal',
    time: new Date().toISOString()
  });
});

// Gerador de IDs seguros de 8 dígitos (compatível com int 32-bit e long 64-bit no Minecraft)
function generateSafeId() {
  return Math.floor(10000000 + Math.random() * 89999999);
}

// ----------------------------------------------------
// BANCO DE DADOS EM ARQUIVO (JSON PERSISTENTE)
// ----------------------------------------------------
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_PRODUCTS = [
  {
    "id": "vip-vendaval",
    "cat": "VIPs",
    "badge": "INICIAL",
    "badgeColor": "orange",
    "tag": "[VENDAVAL]",
    "tagClass": "vendaval",
    "prefixImg": "images/prefixes/knight.png",
    "icon": "🌪️",
    "image": "images/products/vip_vendaval_hd.png",
    "name": "VIP VENDAVAL",
    "description": "Tag [VENDAVAL], até 5 sethomes, Kit Vendaval periódico, /nick, /back, /recipe, /feed e /disposal.",
    "price": 14.9,
    "oldPrice": 19.9,
    "homes": 5,
    "kit": "Kit Vendaval",
    "commandsList": [
      "/nick",
      "/back",
      "/recipe",
      "/feed",
      "/disposal"
    ],
    "perksList": [
      "Tag [VENDAVAL] no chat e TAB",
      "Definir até 5 Casas (/sethome)",
      "Kit Vendaval semanal exclusivo",
      "Comandos /feed, /back e /recipe",
      "Lixeira portátil com /disposal"
    ],
    "command": "lp user {player} parent settrack rank knight"
  },
  {
    "id": "vip-flamejante",
    "cat": "VIPs",
    "badge": "POPULAR",
    "badgeColor": "gold",
    "tag": "[FLAMEJANTE]",
    "tagClass": "flamejante",
    "prefixImg": "images/prefixes/lord.png",
    "icon": "🔥",
    "image": "images/products/vip_flamejante_hd.png",
    "name": "VIP FLAMEJANTE",
    "description": "Tag [FLAMEJANTE], até 10 sethomes, Kit Flamejante, bancada portátil /craft, radar /near, /feed e /back.",
    "price": 29.9,
    "oldPrice": 39.9,
    "homes": 10,
    "kit": "Kit Flamejante",
    "commandsList": [
      "/nick",
      "/back",
      "/recipe",
      "/feed",
      "/disposal",
      "/near",
      "/craft"
    ],
    "perksList": [
      "Tag [FLAMEJANTE] em chamas",
      "Definir até 10 Casas (/sethome)",
      "Kit Flamejante com armas ígneas",
      "Bancada virtual com /craft",
      "Localizar jogadores próximos com /near"
    ],
    "command": "lp user {player} parent settrack rank lord"
  },
  {
    "id": "vip-carvalho",
    "cat": "VIPs",
    "badge": "AVANÇADO",
    "badgeColor": "gold",
    "tag": "[CARVALHO]",
    "tagClass": "carvalho",
    "prefixImg": "images/prefixes/paladin.png",
    "icon": "🛡️",
    "image": "images/products/vip_carvalho_hd.png",
    "name": "VIP CARVALHO",
    "description": "Tag [CARVALHO], até 15 sethomes, Kit Carvalho épico, /ec (enderchest portátil), /repair e /ptime.",
    "price": 44.9,
    "oldPrice": 59.9,
    "homes": 15,
    "kit": "Kit Carvalho",
    "commandsList": [
      "/nick",
      "/back",
      "/recipe",
      "/feed",
      "/disposal",
      "/near",
      "/craft",
      "/ec",
      "/ptime",
      "/repair"
    ],
    "perksList": [
      "Tag [CARVALHO] no chat e TAB",
      "Definir até 15 Casas (/sethome)",
      "Kit Carvalho com armadura reforçada",
      "Baú do Fim portátil com /ec",
      "Reparar itens na mão com /repair",
      "Ajustar clima e hora individual com /ptime"
    ],
    "command": "lp user {player} parent settrack rank paladin"
  },
  {
    "id": "vip-aurora",
    "cat": "VIPs",
    "badge": "ELITE",
    "badgeColor": "gold",
    "tag": "[AURORA]",
    "tagClass": "aurora",
    "prefixImg": "images/prefixes/duke.png",
    "icon": "✨",
    "image": "images/products/vip_aurora_hd.png",
    "name": "VIP AURORA",
    "description": "Tag [AURORA], até 25 sethomes, Kit Aurora Místico, cura instantânea com /heal, /compactar e /hat.",
    "price": 64.9,
    "oldPrice": 79.9,
    "homes": 25,
    "kit": "Kit Aurora",
    "commandsList": [
      "/nick",
      "/back",
      "/recipe",
      "/feed",
      "/disposal",
      "/near",
      "/craft",
      "/ec",
      "/ptime",
      "/repair",
      "/heal",
      "/compactar",
      "/hat"
    ],
    "perksList": [
      "Tag [AURORA] dourada no chat e TAB",
      "Definir até 25 Casas (/sethome)",
      "Kit Aurora com armadura e armas místicas",
      "Regeneração e cura com /heal",
      "Compactação de minérios rápida com /compactar",
      "Colocar qualquer bloco na cabeça com /hat"
    ],
    "command": "lp user {player} parent settrack rank duke"
  },
  {
    "id": "vip-solar",
    "cat": "VIPs",
    "badge": "VALOR INESTIMÁVEL",
    "badgeColor": "gold",
    "tag": "[SOLAR]",
    "tagClass": "solar",
    "prefixImg": "images/prefixes/king.png",
    "icon": "👑",
    "image": "images/products/vip_solar_hd.png",
    "name": "VIP SOLAR",
    "description": "O mais alto escalão dos nobres da Era de Ouro. Concedido exclusivamente em Eventos Históricos e Torneios do Reino. Casas ILIMITADAS, voar com /fly, /god e /repair all.",
    "price": 0,
    "oldPrice": null,
    "inestimavel": true,
    "homes": 999,
    "kit": "Kit Solar do Rei",
    "commandsList": [
      "/nick",
      "/back",
      "/recipe",
      "/feed",
      "/disposal",
      "/near",
      "/craft",
      "/ec",
      "/ptime",
      "/repair",
      "/heal",
      "/compactar",
      "/hat",
      "/fly",
      "/god"
    ],
    "perksList": [
      "Tag [SOLAR] com brilho majestoso",
      "Casas ILIMITADAS (/sethome)",
      "Kit Solar com armamento do rei solar",
      "Voar livremente pelo mapa com /fly",
      "Modo invencível temporário com /god",
      "Entrada anunciada em broadcast no servidor"
    ],
    "command": "lp user {player} parent settrack rank king"
  },
  {
    "id": "vip-deusa",
    "cat": "VIPs",
    "badge": "DIGNIDADE DIVINA",
    "badgeColor": "purple",
    "tag": "[DEUSA]",
    "tagClass": "deusa",
    "prefixImg": "images/prefixes/deusa.png",
    "icon": "🔮",
    "image": "images/products/vip_deusa_hd.png",
    "name": "VIP DEUSA",
    "description": "A patente mais sagrada e suprema da Ravok Network! Aura iridescente divina, acesso a TODOS os kits do servidor, /fly e comandos divinos. Valor Inestimável.",
    "price": 0,
    "oldPrice": null,
    "inestimavel": true,
    "homes": 999,
    "kit": "Todos os Kits",
    "commandsList": [
      "/nick",
      "/back",
      "/recipe",
      "/feed",
      "/disposal",
      "/near",
      "/craft",
      "/ec",
      "/ptime",
      "/repair",
      "/repair all",
      "/heal",
      "/compactar",
      "/hat",
      "/fly",
      "/god",
      "prefixo deusa"
    ],
    "perksList": [
      "Tag [DEUSA] iridescente exclusiva",
      "Casas ILIMITADAS (/sethome)",
      "Acesso liberado a TODOS os Kits do jogo",
      "Reparo total e instantâneo com /repair all",
      "Voar sem limites com /fly",
      "Aura divina celestial e prioridade máxima na fila"
    ],
    "command": "lp user {player} parent add deusa"
  },
  {
    "id": "coins-1000",
    "cat": "Coins",
    "badge": "INICIAL",
    "badgeColor": "orange",
    "icon": "🪙",
    "image": "images/products/moedas_1000.png",
    "name": "1.000 Moedas",
    "description": "Pacote inicial de moedas para gastar na Loja de Moedas (/coinshop) do servidor.",
    "price": 9.9,
    "command": "coins give {player} 1000"
  },
  {
    "id": "coins-2500",
    "cat": "Coins",
    "badge": "POPULAR",
    "badgeColor": "gold",
    "icon": "🪙",
    "image": "images/products/moedas_2500.png",
    "name": "2.500 Moedas",
    "description": "Mais moedas para desbloquear cosméticos, utilitários e itens exclusivos.",
    "price": 19.9,
    "command": "coins give {player} 2500"
  },
  {
    "id": "coins-5000",
    "cat": "Coins",
    "badge": "AVANÇADO",
    "badgeColor": "gold",
    "icon": "🪙",
    "image": "images/products/moedas_5000.png",
    "name": "5.000 Moedas",
    "description": "Excelente custo-benefício para adquirir visuais raros e itens na Coin Shop.",
    "price": 34.9,
    "command": "coins give {player} 5000"
  },
  {
    "id": "coins-8000",
    "cat": "Coins",
    "badge": "DESTAQUE",
    "badgeColor": "red",
    "icon": "🪙",
    "image": "images/products/moedas_8000.png",
    "name": "8.000 Moedas",
    "description": "Grande pacote de moedas para evoluir com tudo na Temporada 3.",
    "price": 49.9,
    "command": "coins give {player} 8000"
  },
  {
    "id": "coins-10000",
    "cat": "Coins",
    "badge": "ELITE",
    "badgeColor": "gold",
    "icon": "🪙",
    "image": "images/products/moedas_10000.png",
    "name": "10.000 Moedas",
    "description": "Pacote de elite para mercadores e líderes de clã dominarem a economia.",
    "price": 59.9,
    "command": "coins give {player} 10000"
  },
  {
    "id": "coins-20000",
    "cat": "Coins",
    "badge": "SUPREMO",
    "badgeColor": "gold",
    "icon": "🪙",
    "image": "images/products/moedas_20000.png",
    "name": "20.000 + 2.000 Bônus",
    "description": "O maior pacote do servidor! Receba 20.000 moedas + 2.000 moedas extras de brinde (Total: 22.000 Moedas)!",
    "price": 99.9,
    "oldPrice": 129.9,
    "command": "coins give {player} 22000"
  },
  {
    "id": "key-voto",
    "cat": "Chaves",
    "badge": "VOTO",
    "badgeColor": "orange",
    "icon": "🗝️",
    "image": "images/products/key_voto_3x_hd.png",
    "name": "3x Chave de Voto",
    "description": "Abra a Caixa de Voto no spawn e retire recompensas diárias e boosters.",
    "price": 4.99,
    "command": "crate key give {player} vote 3"
  },
  {
    "id": "key-comum",
    "cat": "Chaves",
    "badge": "COMUM",
    "badgeColor": "orange",
    "icon": "🗝️",
    "image": "images/products/key_comum_hd.png",
    "name": "Chave Comum S3",
    "description": "Chave inicial da Caixa Comum de Outono com suprimentos úteis e minérios.",
    "price": 2.9,
    "command": "crate key give {player} common 1"
  },
  {
    "id": "key-rara",
    "cat": "Chaves",
    "badge": "RARA",
    "badgeColor": "gold",
    "icon": "🗝️",
    "image": "images/products/key_rara_hd.png",
    "name": "Chave Rara S3",
    "description": "Recompensas raras, minérios nobres e recursos valorizados da temporada.",
    "price": 5.9,
    "command": "crate key give {player} rare 1"
  },
  {
    "id": "key-epica",
    "cat": "Chaves",
    "badge": "ÉPICA",
    "badgeColor": "gold",
    "icon": "🗝️",
    "image": "images/products/key_epica_hd.png",
    "name": "Chave Épica S3",
    "description": "Caixa épica com alta chance de itens lendários e encantamentos superiores.",
    "price": 9.9,
    "oldPrice": 29.9,
    "command": "crate key give {player} epic 1"
  },
  {
    "id": "key-superior",
    "cat": "Chaves",
    "badge": "MÍTICA",
    "badgeColor": "red",
    "icon": "🗝️",
    "image": "images/products/key_superior_hd.png",
    "name": "Chave Superior S3",
    "description": "A mais poderosa chave da temporada com prêmios exclusivos e itens ancestrais.",
    "price": 14.9,
    "oldPrice": 49.9,
    "command": "crate key give {player} superior 1"
  },
  {
    "id": "key-combo",
    "cat": "Chaves",
    "badge": "COMBO",
    "badgeColor": "gold",
    "icon": "🗝️",
    "image": "images/products/key_combo_4x_hd.png",
    "name": "Combo 4x Chaves Místicas",
    "description": "Pacote especial contendo 1x Comum, 1x Rara, 1x Épica e 1x Superior com super desconto!",
    "price": 24.9,
    "oldPrice": 87.6,
    "command": "crate key give {player} common 1; crate key give {player} rare 1; crate key give {player} epic 1; crate key give {player} superior 1"
  },
  {
    "id": "enchant-fortuna-4",
    "cat": "Encantamentos",
    "badge": "LIVRO",
    "badgeColor": "gold",
    "icon": "📖",
    "image": "images/products/livro_fortuna_4.png",
    "name": "Livro: Fortuna IV",
    "description": "Livro de Encantamento Fortuna IV. Multiplica os minérios e recursos minerados muito além do limite padrão do jogo.",
    "price": 3.9,
    "oldPrice": 19.9,
    "command": "excellentenchants:ee book fortune 4 {player}"
  },
  {
    "id": "enchant-eficiencia-6",
    "cat": "Encantamentos",
    "badge": "LIVRO",
    "badgeColor": "orange",
    "icon": "📖",
    "image": "images/products/livro_eficiencia_6.png",
    "name": "Livro: Eficiência VI",
    "description": "Livro de Encantamento Eficiência VI. Velocidade de mineração ultrarrápida superando o limite máximo do Minecraft tradicional.",
    "price": 3.9,
    "oldPrice": 22.9,
    "command": "excellentenchants:ee book efficiency 6 {player}"
  },
  {
    "id": "enchant-inquebravel-4",
    "cat": "Encantamentos",
    "badge": "LIVRO",
    "badgeColor": "gold",
    "icon": "📖",
    "image": "images/products/livro_inquebravel_4.png",
    "name": "Livro: Inquebrável IV",
    "description": "Livro de Encantamento Inquebrável IV. Quadruplica a durabilidade de suas ferramentas, armas e armaduras.",
    "price": 3.5,
    "oldPrice": 19.9,
    "command": "excellentenchants:ee book unbreaking 4 {player}"
  },
  {
    "id": "enchant-remendo",
    "cat": "Encantamentos",
    "badge": "ESSENCIAL",
    "badgeColor": "orange",
    "icon": "📖",
    "image": "images/products/livro_remendo.png",
    "name": "Livro: Remendo (Mending)",
    "description": "Livro de Encantamento Remendo. Repara seus itens e ferramentas automaticamente através da coleta de esferas de XP.",
    "price": 3.9,
    "oldPrice": 16.9,
    "command": "excellentenchants:ee book mending 1 {player}"
  },
  {
    "id": "enchant-soulbound",
    "cat": "Encantamentos",
    "badge": "PROTEÇÃO",
    "badgeColor": "red",
    "icon": "📖",
    "image": "images/products/livro_soulbound.png",
    "name": "Livro: Vínculo da Alma",
    "description": "Livro de Encantamento Vínculo da Alma (Soulbound). Impede que o item seja derrubado ou perdido caso você morra no jogo!",
    "price": 4.5,
    "oldPrice": 26.9,
    "command": "excellentenchants:ee book soulbound 1 {player}"
  },
  {
    "id": "enchant-telecinese",
    "cat": "Encantamentos",
    "badge": "UTILIDADE",
    "badgeColor": "gold",
    "icon": "📖",
    "image": "images/products/livro_telecinese.png",
    "name": "Livro: Telecinese",
    "description": "Livro de Encantamento Telecinese. Move todos os blocos quebrados e itens dropados instantaneamente para seu inventário.",
    "price": 4.5,
    "oldPrice": 24.9,
    "command": "excellentenchants:ee book telekinesis 1 {player}"
  },
  {
    "id": "cmd-fly",
    "cat": "Comandos",
    "badge": "30 MINUTOS",
    "badgeColor": "blue",
    "icon": "🪶",
    "image": "images/products/cmd_fly_hd.png",
    "name": "Tempo de Fly (30 Minutos)",
    "description": "30 minutos de voo livre (/fly). É cumulativo! Se você comprar mais de uma vez ou estocar antes de acabar o tempo, o tempo é somado automaticamente no servidor.",
    "price": 9.9,
    "command": "darfly {player} 30m",
    "perksList": [
      "30 minutos de voo livre (/fly) no Survival",
      "100% Acumulativo (estoca tempo comprando mais)",
      "Ativação imediata via /resgatar usando /darfly"
    ]
  },
  {
    "id": "mystery-pets",
    "cat": "Pets",
    "isMystery": true
  },
  {
    "id": "enchant-smelter",
    "cat": "Encantamentos",
    "badge": "EXCELLENT",
    "badgeColor": "orange",
    "icon": "📖",
    "image": "images/products/livro_smelter.png",
    "name": "Livro: Fundição Instantânea",
    "description": "Encantamento ExcellentEnchants para ferramentas. Funde automaticamente minérios brutos em barras e areia em vidro diretamente ao quebrar o bloco.",
    "price": 3.9,
    "command": "excellentenchants:ee book smelter 1 {player}",
    "perksList": [
      "Funde minérios instantaneamente ao quebrar",
      "Economiza carvão e tempo de fornalhas",
      "Compatível com picaretas de diamante e netherite"
    ]
  },
  {
    "id": "enchant-decapitator",
    "cat": "Encantamentos",
    "badge": "EXCELLENT",
    "badgeColor": "gold",
    "icon": "📖",
    "image": "images/products/livro_decapitator.png",
    "name": "Livro: Decapitador",
    "description": "Encantamento ExcellentEnchants para machados e espadas. Chance de decepar e dropar as cabeças raras de monstros e jogadores derrotados no PvP e PvE.",
    "price": 3.5,
    "command": "excellentenchants:ee book decapitator 1 {player}",
    "perksList": [
      "Chance de dropar cabeças de monstros e jogadores",
      "Excelente para troféus e colecionáveis raros",
      "Aplicável em espadas e machados de combate"
    ]
  },
  {
    "id": "enchant-tunnel",
    "cat": "Encantamentos",
    "badge": "EXCELLENT",
    "badgeColor": "purple",
    "icon": "📖",
    "image": "images/products/livro_tunnel.png",
    "name": "Livro: Túnel I (Mineração 3x3)",
    "description": "Encantamento ExcellentEnchants lendário. Escave blocos em uma área cúbica de 3x3 com picaretas e pás com extrema velocidade.",
    "price": 4.5,
    "command": "excellentenchants:ee book tunnel 1 {player}",
    "perksList": [
      "Escavação e quebra em área de 3x3 blocos",
      "Acelera aberturas de minas e construção de bases",
      "Item lendário muito disputado no servidor"
    ]
  },
  {
    "id": "enchant-veinminer",
    "cat": "Encantamentos",
    "badge": "EXCELLENT",
    "badgeColor": "blue",
    "icon": "📖",
    "image": "images/products/livro_veinminer.png",
    "name": "Livro: Minerador de Veios",
    "description": "Encantamento ExcellentEnchants para picaretas. Minere instantaneamente todo o veio conectado de diamantes, ouro, ferro ou netherite de uma só vez.",
    "price": 4.5,
    "command": "excellentenchants:ee book veinminer 1 {player}",
    "perksList": [
      "Quebra toda a veia mineral conectada instantaneamente",
      "Economiza minutos em cada jazida de minério encontrada",
      "Ativação segura via /resgatar"
    ]
  },
  {
    "id": "enchant-vampire",
    "cat": "Encantamentos",
    "badge": "EXCELLENT",
    "badgeColor": "red",
    "icon": "📖",
    "image": "images/products/livro_vampire.png",
    "name": "Livro: Vampirismo",
    "description": "Encantamento ExcellentEnchants para espadas. Drena a vitalidade dos seus inimigos a cada golpe desferido, recuperando sua vida em combates difíceis.",
    "price": 4.9,
    "command": "excellentenchants:ee book vampire 1 {player}",
    "perksList": [
      "Roubo de vida e cura constante a cada golpe",
      "Vantagem indispensável em masmorras e chefões",
      "Compatível com espadas de diamante e netherite"
    ]
  },
  {
    "id": "enchant-silkspawner",
    "cat": "Encantamentos",
    "badge": "SUPREMO",
    "badgeColor": "gold",
    "icon": "📖",
    "image": "images/products/livro_silkspawner.png",
    "name": "Livro: Caçador de Almas (Spawners)",
    "description": "Encantamento ExcellentEnchants supremo para picaretas. Permite quebrar, coletar e transportar Gaiolas de Monstros (Spawners) intactas para sua fazenda!",
    "price": 50,
    "command": "excellentenchants:ee book silk_spawner 1 {player}",
    "perksList": [
      "Coleta e transporte de Gaiolas de Monstros (Spawners)",
      "Monte suas farms automáticas onde quiser",
      "Um dos encantamentos mais cobiçados da economia"
    ]
  },
  {
    "id": "cmd-back",
    "cat": "Comandos",
    "badge": "COMANDO",
    "badgeColor": "orange",
    "icon": "🔧",
    "image": "images/products/cmd_back_hd.png",
    "name": "Comando /back",
    "description": "Voucher de liberação permanente do comando /back. Retorne instantaneamente ao local do seu último teleporte ou ao ponto onde morreu.",
    "price": 6.9,
    "command": "crazyvouchers give Back_Command 1 {player}; lp user {player} permission set essentials.back true",
    "perksList": [
      "Acesso definitivo ao comando /back no Survival",
      "Volte ao local exato de mortes ou teleportes",
      "Ativação imediata via /resgatar"
    ]
  },
  {
    "id": "cmd-feed",
    "cat": "Comandos",
    "badge": "COMANDO",
    "badgeColor": "orange",
    "icon": "🔧",
    "image": "images/products/cmd_feed_hd.png",
    "name": "Comando /feed",
    "description": "Voucher de liberação permanente do comando /feed. Sacie instantaneamente sua barra de fome onde estiver, sem precisar carregar comida.",
    "price": 8.9,
    "command": "crazyvouchers give Feed_Command 1 {player}; lp user {player} permission set essentials.feed true",
    "perksList": [
      "Acesso definitivo ao comando /feed",
      "Recupere a saturação e fome com 1 comando",
      "Ativação imediata via /resgatar"
    ]
  },
  {
    "id": "cmd-heal",
    "cat": "Comandos",
    "badge": "COMANDO",
    "badgeColor": "red",
    "icon": "🔧",
    "image": "images/products/cmd_heal_hd.png",
    "name": "Comando /heal",
    "description": "Voucher de liberação permanente do comando /heal. Restaure toda a sua vida e corações com 1 clique durante suas jornadas.",
    "price": 12.9,
    "command": "crazyvouchers give Heal_Command 1 {player}; lp user {player} permission set essentials.heal true",
    "perksList": [
      "Acesso definitivo ao comando /heal",
      "Cura instantânea de todos os seus corações",
      "Ativação imediata via /resgatar"
    ]
  },
  {
    "id": "cmd-repair",
    "cat": "Comandos",
    "badge": "COMANDO",
    "badgeColor": "gold",
    "icon": "🔧",
    "image": "images/products/cmd_repair_hd.png",
    "name": "Comando /repair",
    "description": "Voucher de liberação permanente do comando /repair. Conserte o item equipado em sua mão sem gastar níveis de XP ou materiais na bigorna.",
    "price": 14.9,
    "command": "crazyvouchers give Repair_Command 1 {player}; lp user {player} permission set essentials.repair.hand true",
    "perksList": [
      "Acesso definitivo ao comando /repair no Survival",
      "Repara armas, armaduras e ferramentas sem gastar XP",
      "Ativação imediata via /resgatar"
    ]
  },
  {
    "id": "enchant-treefeller",
    "cat": "Encantamentos",
    "badge": "LENHADOR",
    "badgeColor": "green",
    "icon": "🪓",
    "image": "images/products/livro_treefeller.png",
    "name": "Livro: Lenhador (Árvores Inteiras)",
    "description": "Encantamento ExcellentEnchants para machados. Derruba uma árvore inteira instantaneamente ao quebrar apenas um bloco do tronco de madeira.",
    "price": 4.5,
    "oldPrice": 24.9,
    "command": "excellentenchants:ee book treefeller 1 {player}",
    "perksList": [
      "Derruba toda a árvore e folhagens de uma só vez",
      "Economiza tempo precioso coletando madeira no Survival",
      "Compatível com todos os machados (ferro, diamante e netherite)"
    ]
  },
  {
    "id": "mystery-cosmetics",
    "cat": "Cosméticos",
    "isMystery": true
  }
];

const OFFICIAL_PRODUCT_IMAGES = {
  'vip-vendaval': 'products/VIPS/membro.png',
  'vip-outono': 'products/VIPS/membro.png',
  'vip-flamejante': 'products/VIPS/vip_aura.png',
  'vip-ambar': 'products/VIPS/vip_aura.png',
  'vip-carvalho': 'products/VIPS/aventureiro.png',
  'vip-aurora': 'products/VIPS/vip_astro.png',
  'vip-solar': 'products/VIPS/vip_celestial.png',
  'vip-deusa': 'products/VIPS/vip_eclipse.png',
  'coins-1000': 'images/products/moedas_1000.png',
  'coins-2500': 'images/products/moedas_2500.png',
  'coins-5000': 'images/products/moedas_5000.png',
  'coins-8000': 'images/products/moedas_8000.png',
  'coins-10000': 'images/products/moedas_10000.png',
  'coins-20000': 'images/products/moedas_20000.png',
  'key-voto': 'images/products/key_voto_3x_hd.png',
  'key-vote': 'images/products/key_voto_3x_hd.png',
  'key-comum': 'images/products/key_comum_hd.png',
  'key-common': 'images/products/key_comum_hd.png',
  'key-rara': 'images/products/key_rara_hd.png',
  'key-rare': 'images/products/key_rara_hd.png',
  'key-epica': 'images/products/key_epica_hd.png',
  'key-epic': 'images/products/key_epica_hd.png',
  'key-superior': 'images/products/key_superior_hd.png',
  'key-combo': 'images/products/key_combo_4x_hd.png',
  'enchant-fortuna-4': 'images/products/livro_fortuna_4.png',
  'enchant-eficiencia-6': 'images/products/livro_eficiencia_6.png',
  'enchant-inquebravel-4': 'images/products/livro_inquebravel_4.png',
  'enchant-remendo': 'images/products/livro_remendo.png',
  'enchant-soulbound': 'images/products/livro_soulbound.png',
  'enchant-telecinese': 'images/products/livro_telecinese.png',
  'cmd-back': 'images/products/cmd_back_hd.png',
  'cmd-feed': 'images/products/cmd_feed_hd.png',
  'cmd-heal': 'images/products/cmd_heal_hd.png',
  'cmd-repair': 'images/products/cmd_repair_hd.png',
  'cmd-fly': 'images/products/cmd_fly_hd.png',
  'cosmetic-fire': 'images/products/machado_chamas_hd.png',
  'cosmetic-sword': 'images/products/espada_solar_hd.png',
  'vip-vendaval': 'images/products/vip_vendaval_hd.png',
  'vip-flamejante': 'images/products/vip_flamejante_hd.png',
  'vip-carvalho': 'images/products/vip_carvalho_hd.png',
  'vip-aurora': 'images/products/vip_aurora_hd.png',
  'vip-solar': 'images/products/vip_solar_hd.png',
  'vip-deusa': 'images/products/vip_deusa_hd.png'
};

const OFFICIAL_PREFIX_IMGS = {
  'vip-vendaval': 'images/prefixes/knight.png',
  'vip-flamejante': 'images/prefixes/lord.png',
  'vip-carvalho': 'images/prefixes/paladin.png',
  'vip-aurora': 'images/prefixes/duke.png',
  'vip-solar': 'images/prefixes/king.png',
  'vip-deusa': 'images/prefixes/deusa.png'
};

const LEGACY_BROKEN_PRODUCT_IMAGES = [
  'images/kits/preview',
  'images/autumn/pedra_do_sol_ancestral.png',
  'images/autumn/bussola_de_latao_dourado.png',
  'images/autumn/girassol_radiante.png',
  'images/autumn/fogueira_acolhedora.png',
  'images/gallery/npc_vip_aurora.png',
  'images/prefixes/deusa.png',
  'images/chave_voto_s3.png',
  'images/toolskins.png',
  'images/chave_comum.png',
  'images/chave_rara.png',
  'images/chave_epica.png',
  'images/chave_lendaria.png',
  'images/chave_epic_dragon.png',
  'images/products/chave_voto_hd.png',
  'images/products/voucher_toolskin_hd.png',
  'products/VIPS/membro.png',
  'products/VIPS/vip_aura.png',
  'products/VIPS/aventureiro.png',
  'products/VIPS/vip_astro.png',
  'products/VIPS/vip_celestial.png',
  'products/VIPS/vip_eclipse.png'
];

function upgradeProductCatalog(list, deletedProductIds = null) {
  const BANNED_LEGACY_IDS = new Set(['pet-dino', 'pet-cubee', 'voucher-skin-aleatoria', 'voucher-skin', 'mystery-skins', 'cosmetic-fire', 'cosmetic-sword']);
  list = (Array.isArray(list) ? list : []).filter(p => p && !BANNED_LEGACY_IDS.has(String(p.id)));
  const PROTECTED_COMMAND_IDS = ['cmd-fly', 'cmd-back', 'cmd-feed', 'cmd-heal', 'cmd-repair'];
  const CANONICAL_PRICES = {
    'key-voto': 4.99,
    'key-comum': 2.90,
    'key-rara': 5.90,
    'key-epica': 9.90,
    'key-superior': 14.90,
    'key-combo': 24.90,
    'enchant-silkspawner': 50.00,
    'enchant-treefeller': 4.50,
    'cmd-fly': 9.90,
    'cmd-back': 6.90,
    'cmd-feed': 8.90,
    'cmd-heal': 12.90,
    'cmd-repair': 14.90,
    'enchant-tunnel': 4.50,
    'enchant-veinminer': 4.50,
    'enchant-smelter': 3.90,
    'enchant-vampire': 4.90,
    'enchant-decapitator': 3.50,
    'enchant-soulbound': 4.50
  };

  let activeDeleted = Array.isArray(deletedProductIds)
    ? deletedProductIds
    : (typeof db !== 'undefined' && db && Array.isArray(db.deletedProductIds) ? db.deletedProductIds : []);
  
  // NUNCA permite que comandos padrão fiquem marcados como deletados
  activeDeleted = activeDeleted.filter(id => !PROTECTED_COMMAND_IDS.includes(String(id)));
  if (typeof db !== 'undefined' && db && Array.isArray(db.deletedProductIds)) {
    db.deletedProductIds = db.deletedProductIds.filter(id => !PROTECTED_COMMAND_IDS.includes(String(id)));
  }
  const delSet = new Set(activeDeleted.map(String));

  if (!Array.isArray(list)) {
    return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)).filter(p => !delSet.has(String(p.id)));
  }

  const mapped = list.filter(p => p && !delSet.has(String(p.id))).map(raw => {
    if (!raw || typeof raw !== 'object') return null;
    const p = { ...raw };
    if (p.customEdited) {
      if (!p.prefixImg && typeof OFFICIAL_PREFIX_IMGS !== 'undefined' && OFFICIAL_PREFIX_IMGS[p.id]) {
        p.prefixImg = OFFICIAL_PREFIX_IMGS[p.id];
      }
      return p;
    }
    if (p.id === 'vip-outono') {
      p.id = 'vip-vendaval';
      p.name = 'VIP VENDAVAL';
      p.tag = '[VENDAVAL]';
      p.tagClass = 'vendaval';
    } else if (p.id === 'vip-ambar') {
      p.id = 'vip-flamejante';
      p.name = 'VIP FLAMEJANTE';
      p.tag = '[FLAMEJANTE]';
      p.tagClass = 'flamejante';
    }

    // Se o item foi explicitamente customizado/editado pelo admin, NUNCA sobrescreve a imagem!
    if (p.customEdited) {
      if (!p.prefixImg && OFFICIAL_PREFIX_IMGS[p.id]) {
        p.prefixImg = OFFICIAL_PREFIX_IMGS[p.id];
      }
      return p;
    }

    const img = String(p.image || '').trim();
    const isLegacyBroken = !img
      || LEGACY_BROKEN_PRODUCT_IMAGES.some(b => img.includes(b))
      || (img === 'images/emblema_ravok_outonal.png' && OFFICIAL_PRODUCT_IMAGES[p.id]);

    if (isLegacyBroken) {
      if (OFFICIAL_PRODUCT_IMAGES[p.id]) {
        p.image = OFFICIAL_PRODUCT_IMAGES[p.id];
      } else if (p.cat === 'Coins') {
        p.image = 'images/products/moedas_2500.png';
      } else if (p.cat === 'VIPs') {
        p.image = 'products/VIPS/membro.png';
      } else if (p.cat === 'Chaves') {
        p.image = 'images/products/key_comum_hd.png';
      } else if (p.cat === 'Encantamentos') {
        p.image = 'images/products/livro_fortuna_4.png';
      } else if (p.cat === 'Comandos') {
        p.image = 'images/products/cmd_repair_hd.png';
      } else if (p.cat === 'Pets') {
        
      } else if (p.cat === 'Cosméticos') {
        p.image = 'images/products/espada_solar_hd.png';
      }
    }
    if (!p.prefixImg && OFFICIAL_PREFIX_IMGS[p.id]) {
      p.prefixImg = OFFICIAL_PREFIX_IMGS[p.id];
    }
    // Sincroniza dados e preços canônicos (chaves harmonizadas, comandos e Caçador de Almas R$ 50)
    const def = (typeof DEFAULT_PRODUCTS !== 'undefined' ? DEFAULT_PRODUCTS : []).find(d => String(d.id) === String(p.id));
    if (def && !p.customEdited) {
      p.name = def.name;
      p.cat = def.cat;
      p.badge = def.badge;
      p.badgeColor = def.badgeColor;
      p.price = (typeof CANONICAL_PRICES !== 'undefined' && CANONICAL_PRICES[p.id] !== undefined)
        ? CANONICAL_PRICES[p.id]
        : def.price;
      if (def.command && !p.command) p.command = def.command;
      if (def.image && (!p.image || p.image === 'images/emblema_ravok_outonal.png')) p.image = def.image;
    }
    if (p.id === 'enchant-silkspawner') {
      p.price = 50.00;
      p.badge = 'SUPREMO';
      p.badgeColor = 'gold';
    }
    return p;
  }).filter(Boolean);

  // Injetar novos produtos padrão (ex: Encantamentos e Comandos) SOMENTE se não foram excluídos pelo admin
  const existingIds = new Set(mapped.map(p => String(p.id)));
  DEFAULT_PRODUCTS.forEach(def => {
    const defId = String(def.id);
    if (!existingIds.has(defId) && !delSet.has(defId)) {
      mapped.push({ ...def });
      existingIds.add(defId);
    }
  });

  const BANNED = new Set(['pet-dino', 'pet-cubee', 'voucher-skin-aleatoria', 'voucher-skin', 'mystery-skins', 'cosmetic-fire', 'cosmetic-sword']);
  return mapped.filter(p => p && !delSet.has(String(p.id)) && !BANNED.has(String(p.id)));
}


const DEFAULT_HERO_SLIDES = [
  {
    "id": "hero-slide-1",
    "tagIcon": "images/autumn/folha_de_bordo_flutuante.png",
    "tagText": "TEMPORADA 3 • OUTONAL",
    "title": "COLHEITA &amp;<br>GLÓRIA ANCESTRAL",
    "desc": "A nova era da Ravok Network chegou! Explore a atmosfera outonal, desbloqueie os VIPs Vendaval, Flamejante, Carvalho, Aurora, Solar e Deusa, novas Chaves S3 e texturas oficiais exclusivas com entrega automática.",
    "charImg": "images/fullbody.png",
    "charAlt": "Guerreiro Ravok 3D",
    "primaryText": "Jogar agora: jogar.ravok.network",
    "primaryAction": "copyServerIp()",
    "secText": "Baixar Texturas Oficiais (v1.2)",
    "secHref": "texturas.html"
  },
  {
    "id": "hero-slide-2",
    "tagIcon": "images/autumn/girassol_radiante.png",
    "tagText": "VIPS &amp; PRIVILÉGIOS EXCLUSIVOS",
    "title": "FORJE SEU IMPÉRIO<br>COM RANKS LENDÁRIOS",
    "desc": "Garanta kits diários, fly, comandos de teleporte, multiplicadores de moedas e tags animadas. Do Vendaval ao Solar, domine as temporadas com prestígio!",
    "charImg": "images/kayzel1.png",
    "charAlt": "Cavaleiro de Carvalho",
    "primaryText": "Explorar Ranks VIP",
    "primaryAction": "filterCategory('VIPs')",
    "secText": "Ver Tabela Comparativa",
    "secHref": "#produtos"
  },
  {
    "id": "hero-slide-3",
    "tagIcon": "images/autumn/bussola_de_latao_dourado.png",
    "tagText": "ECONOMIA &amp; PEDREIRAS",
    "title": "COMÉRCIO VIVO &amp;<br>MOEDAS OFICIAIS",
    "desc": "Construa sua riqueza vendendo colheitas no mercado, ativando pedreiras automáticas e comprando pacotes de moedas com bônus imediatos via Pix.",
    "charImg": "images/kayzel2.png",
    "charAlt": "Guardião Ravok",
    "primaryText": "Pacotes de Moedas",
    "primaryAction": "filterCategory('Moedas')",
    "secText": "Conhecer Pedreiras",
    "secHref": "#como-funciona"
  },
  {
    "id": "hero-slide-4",
    "tagIcon": "images/autumn/pedra_do_sol_ancestral.png",
    "tagText": "ARMAS &amp; VISUAIS MÍSTICOS",
    "title": "CHAVES, LIVROS &amp;<br>COSMÉTICOS S3",
    "desc": "Abra Caixas Místicas com as Chaves de Voto, Comum, Rara, Épica e Superior. Encante suas ferramentas com Fortuna IV, Eficiência VI, Túnel e Remendo!",
    "charImg": "images/kayzel3.png",
    "charAlt": "Guerreiro das Chamas",
    "primaryText": "Ver Chaves e Livros",
    "primaryAction": "filterCategory('Chaves')",
    "secText": "Galeria do Servidor",
    "secHref": "#galeria"
  }
];

const DEFAULT_SLIDES = [
  {
    id: 'slide-spawn',
    title: 'Spawn Oficial da Ravok',
    desc: 'A grande praça central da Temporada 3 com tema outonal, decorações acolhedoras e portais de aventura.',
    img: 'images/gallery/spawn_ravok_outonal.png'
  },
  {
    id: 'slide-por-do-sol',
    title: 'Pôr do Sol Ancestral',
    desc: 'O fulgor do sol poente iluminando o cânion, guindastes de mineração e as montanhas outonais.',
    img: 'images/gallery/por_do_sol_canyon.png'
  },
  {
    id: 'slide-vips',
    title: 'Cargos & Ranks VIP',
    desc: 'Área exclusiva dos Ranks da Temporada de Outono: Vendaval, Flamejante, Carvalho, Aurora, Solar e Deusa.',
    img: 'images/gallery/npc_vip_aurora.png'
  },
  {
    id: 'slide-canyon',
    title: 'Mina & Fortaleza Subterrânea',
    desc: 'Pontes suspensas, trilhos de vagonetas e cavernas profundas nas muralhas de pedra.',
    img: 'images/gallery/canyon_pedreira_fortaleza.png'
  },
  {
    id: 'slide-mercado',
    title: 'Mercado & Loja de Moedas',
    desc: 'Mercado dos mercadores com a Loja de Moedas oficial (/coinshop), carroças rústicas e troca de itens raros.',
    img: 'images/gallery/mercado_loja_moedas.png'
  },
  {
    id: 'slide-pedreira',
    title: 'Pedreira & Vila dos Trabalhadores',
    desc: 'Moinho de vento, cascata natural e sistema de guindastes que abastecem as construções do reino.',
    img: 'images/gallery/pedreira_vila_trabalhadores.png'
  },
  {
    id: 'slide-bosque-outonal',
    title: 'Bosque das Folhas Douradas',
    desc: 'As colinas outonais da Temporada 3 repletas de carvalhos rubros, árvores douradas e cerejeiras.',
    img: 'images/gallery/vale_outonal_bosque.png'
  }
];

const DEFAULT_FEEDBACKS = [
  { id: 'fb-1', nick: 'DargonLord', stars: 5, comment: 'O melhor servidor de survival que já joguei! Economia bem balanceada, suporte rápido e a entrega do VIP caiu na hora com o /resgatar.', date: '02/09/2026' },
  { id: 'fb-2', nick: 'StellaCraft', stars: 5, comment: 'Os pets mágicos são incrivelmente fofos e as caixas de voto realmente dão itens que valem a pena. Comunidade nota 10!', date: '03/09/2026' },
  { id: 'fb-3', nick: 'Pedro_Gamer99', stars: 5, comment: 'Zero lag e o sistema de RTP por continentes/mundo normal funciona liso. Parabéns à equipe do Ravok!', date: '04/09/2026' }
];

const DEFAULT_STREAMERS = [
  {
    id: 'str-1',
    name: 'RavokPlayerTV',
    platform: 'Twitch',
    avatar: 'https://mc-heads.net/avatar/RavokPlayer/64',
    url: 'https://twitch.tv',
    channelUrl: 'https://twitch.tv',
    isLive: true,
    bio: 'Transmissões diárias construindo megabases e explorando as dungeons do servidor!'
  },
  {
    id: 'str-2',
    name: 'CraftMasterBR',
    platform: 'YouTube',
    avatar: 'https://mc-heads.net/avatar/CraftMaster/64',
    url: 'https://youtube.com',
    channelUrl: 'https://youtube.com',
    isLive: false,
    bio: 'Série completa de Survival RPG, farm de coins e abertura de caixas raras.'
  },
  {
    id: 'str-3',
    name: 'LunaGamer',
    platform: 'TikTok',
    avatar: 'https://mc-heads.net/avatar/LunaGamer/64',
    url: 'https://tiktok.com',
    channelUrl: 'https://tiktok.com',
    isLive: true,
    bio: 'Clipes diários com os melhores momentos, PvP na arena e sorteios para inscritos!'
  }
];

// IDs estruturais verificados do servidor Discord oficial (zero segredos)
const VERIFIED_DISCORD_DEFAULTS = {
  discordBotClientId: '1529247701529792612',
  discordBotChannelGeral: '1529655096559013958',
  discordBotChannelBoasVindas: '1529653781946568744',
  discordBotChannelRegras: '1529653888393674852',
  discordBotChannelVendas: '1533504518967525386',
  discordBotChannelContagem: '1529655215450488842',
  discordBotChannelConfissoes: '1529655278742667356',
  discordBotChannelTickets: '1529654761513812089',
  discordBotChannelSugestoes: '1529654801208574053',
  discordBotChannelFeedbacks: '1529654925565497404',
  discordBotChannelRecrutamento: '1529654975704207470',
  discordBotChannelLives: '1529655710328160287',
  discordBotChannelVideos: '1529655710328160287',
  discordBotChannelMemes: '1529655137042305096',
  discordBotChannelMusica: '1529656974160166962',
  discordBotChannelAnuncios: '1529654335816994907',
  discordBotChannelRelatorios: '1529656705905066014',
  discordBotChannelPunicoes: '1529656705905066014',
  aiChannelId: '1529656822112325753',
  discordBotChannelStatusJogadores: '1529648354928234548',
  discordBotChannelStatusServer: '1529648417066975272',
  discordBotChannelStatusPing: '1529648465309864016',
  discordBotChannelMetaVendas: '1533504518967525386',
  discordBotCategoryCompras: '1533505017808425091',
  discordBotCategoryTickets: '1533531370142568643',
  discordBotCategoryRecrutamento: '1529656235115151371',
  discordBotRoleVinculado: '1491951156547682386',
  discordBotRoleAcesso: '1491951282955620362'
};

function isValidDiscordSnowflake(value) {
  return /^\d{17,20}$/.test(String(value || '').trim());
}

function backfillBotChannelDefaults(settings) {
  if (!settings || typeof settings !== 'object') return false;
  let changed = false;
  for (const [key, defaultVal] of Object.entries(VERIFIED_DISCORD_DEFAULTS)) {
    if (!isValidDiscordSnowflake(settings[key])) {
      settings[key] = defaultVal;
      changed = true;
    }
  }
  if (settings.welcomeBgUrl === undefined || settings.welcomeBgUrl === null) {
    settings.welcomeBgUrl = 'images/gallery/por_do_sol_canyon.png';
    changed = true;
  }
  return changed;
}

function buildSafeBridgeSettings(s = {}) {
  const clean = { ...s };
  backfillBotChannelDefaults(clean);
  return {
    serverIp: clean.serverIp || clean.minecraftIp || 'jogar.ravok.network',
    discordInviteUrl: normalizeDiscordInviteUrl(clean.discordInviteUrl),
    discordTicketUrl: DISCORD_TICKET_INVITE_URL,
    discordBotClientId: clean.discordBotClientId || VERIFIED_DISCORD_DEFAULTS.discordBotClientId,
    welcomeBgUrl: clean.welcomeBgUrl !== undefined ? clean.welcomeBgUrl : 'images/gallery/por_do_sol_canyon.png',
    welcomeEnabled: clean.welcomeEnabled !== false,
    countingCurrentNumber: Number(clean.countingCurrentNumber || 0),
    goalMode: clean.goalMode === 'manual' ? 'manual' : 'auto',
    goalManualPercent: Number(clean.goalManualPercent || 0),
    metaVendasValor: Number(clean.metaVendasValor !== undefined ? clean.metaVendasValor : 300),
    metaVendasBase: Number(clean.metaVendasBase !== undefined ? clean.metaVendasBase : 33),
    aiEnabled: clean.aiEnabled !== false,
    aiModel: clean.aiModel || 'gemini-1.5-flash',
    aiChannelId: clean.aiChannelId || VERIFIED_DISCORD_DEFAULTS.aiChannelId,
    aiPrompt: clean.aiPrompt || '',
    discordBotChannelGeral: clean.discordBotChannelGeral,
    discordBotChannelBoasVindas: clean.discordBotChannelBoasVindas,
    discordBotChannelRegras: clean.discordBotChannelRegras,
    discordBotChannelVendas: clean.discordBotChannelVendas,
    discordBotChannelContagem: clean.discordBotChannelContagem,
    discordBotChannelConfissoes: clean.discordBotChannelConfissoes,
    discordBotChannelTickets: clean.discordBotChannelTickets,
    discordBotChannelSugestoes: clean.discordBotChannelSugestoes,
    discordBotChannelFeedbacks: clean.discordBotChannelFeedbacks,
    discordBotChannelRecrutamento: clean.discordBotChannelRecrutamento,
    discordBotChannelLives: clean.discordBotChannelLives,
    discordBotChannelVideos: clean.discordBotChannelVideos,
    discordBotChannelMemes: clean.discordBotChannelMemes,
    discordBotChannelMusica: clean.discordBotChannelMusica,
    discordBotChannelAnuncios: clean.discordBotChannelAnuncios,
    discordBotChannelRelatorios: clean.discordBotChannelRelatorios,
    discordBotChannelPunicoes: clean.discordBotChannelPunicoes,
    discordBotChannelStatusJogadores: clean.discordBotChannelStatusJogadores,
    discordBotChannelStatusServer: clean.discordBotChannelStatusServer,
    discordBotChannelStatusPing: clean.discordBotChannelStatusPing,
    discordBotChannelMetaVendas: clean.discordBotChannelMetaVendas,
    discordBotCategoryCompras: clean.discordBotCategoryCompras,
    discordBotCategoryTickets: clean.discordBotCategoryTickets,
    discordBotCategoryRecrutamento: clean.discordBotCategoryRecrutamento,
    discordBotRoleVinculado: clean.discordBotRoleVinculado,
    discordBotRoleAcesso: clean.discordBotRoleAcesso
  };
}

const DISCORD_TICKET_INVITE_URL = 'https://discord.gg/nBNjvvxzf6';
const DISCORD_DEFAULT_INVITE_URL = 'https://discord.gg/qpQt8peGdz';

function normalizeDiscordInviteUrl(raw) {
  const v = String(raw || '').trim();
  if (!v || v === 'https://discord.gg' || v === 'https://discord.gg/' || v.toLowerCase() === 'https://discord.gg/ravok') {
    return DISCORD_DEFAULT_INVITE_URL;
  }
  return v;
}

const KNOWN_SERVER_PLAYERS = [{"nick": "Guiilew", "lastSeen": 1793027005694, "source": "authme"}, {"nick": "tulio82", "lastSeen": 1792741934468, "source": "authme"}, {"nick": "THE_brennusgodd", "lastSeen": 1792710359918, "source": "authme"}, {"nick": "Formius_saas", "lastSeen": 1792623556273, "source": "authme"}, {"nick": "Loberty_One", "lastSeen": 1792442535762, "source": "authme"}, {"nick": "Brunaplxrg07", "lastSeen": 1792278092145, "source": "authme"}, {"nick": "oRamal", "lastSeen": 1792277698228, "source": "authme"}, {"nick": "Luanss757", "lastSeen": 1792249503179, "source": "authme"}, {"nick": "Euunick", "lastSeen": 1792237613530, "source": "authme"}, {"nick": "ocaqueado", "lastSeen": 1792078808729, "source": "authme"}, {"nick": "Mendezin", "lastSeen": 1792027892399, "source": "authme"}, {"nick": "webtrafico", "lastSeen": 1791828891920, "source": "authme"}, {"nick": "Deblayd", "lastSeen": 1791666427220, "source": "authme"}, {"nick": "Sayi0", "lastSeen": 1791398902126, "source": "authme"}, {"nick": "Theusma", "lastSeen": 1791181467919, "source": "authme"}, {"nick": "BSwww", "lastSeen": 1790903623960, "source": "authme"}, {"nick": "Mathkskdaj", "lastSeen": 1790897455610, "source": "authme"}, {"nick": "Luans757", "lastSeen": 1790790780677, "source": "authme"}, {"nick": "SchneiderBobo", "lastSeen": 1790776737727, "source": "authme"}, {"nick": ".ZeuS4540", "lastSeen": 1790733595427, "source": "authme"}, {"nick": "Marquin044", "lastSeen": 1790695016128, "source": "authme"}, {"nick": "wesley_op511", "lastSeen": 1790674516878, "source": "authme"}, {"nick": ".Guiilew", "lastSeen": 1790648800335, "source": "authme"}, {"nick": ".Vickvaporube1", "lastSeen": 1790556542479, "source": "authme"}, {"nick": "ViniblocksDH", "lastSeen": 1790442492614, "source": "authme"}, {"nick": "sbdias251", "lastSeen": 1790123289013, "source": "authme"}, {"nick": "Raywzli", "lastSeen": 1790122973801, "source": "authme"}, {"nick": "Craule", "lastSeen": 1790049867866, "source": "authme"}, {"nick": "REIZINHOOF", "lastSeen": 1790042423616, "source": "authme"}, {"nick": "LaurinhaS", "lastSeen": 1789996748038, "source": "authme"}, {"nick": "yukied3", "lastSeen": 1789995360888, "source": "authme"}, {"nick": "Bryanodo13", "lastSeen": 1789881387038, "source": "authme"}, {"nick": "Kiminayoo", "lastSeen": 1789881359188, "source": "authme"}, {"nick": "Twii_alex", "lastSeen": 1789714935926, "source": "authme"}, {"nick": "THE_brennugodd", "lastSeen": 1789699092976, "source": "authme"}, {"nick": "eobrenno_", "lastSeen": 1789690496636, "source": "authme"}, {"nick": "Fransuya", "lastSeen": 1789519458209, "source": "authme"}, {"nick": ".Yukiii_sz", "lastSeen": 1789237517297, "source": "authme"}, {"nick": ".TheBoT9461", "lastSeen": 1789237175497, "source": "authme"}, {"nick": "XvoidZ01", "lastSeen": 1789184073360, "source": "authme"}, {"nick": "Inleving", "lastSeen": 1789005226716, "source": "authme"}];

function rememberKnownPlayer(dbObj, nick, extra = {}) {
  const clean = String(nick || '').trim();
  if (!clean || clean.length < 2 || clean.length > 20) return false;
  if (['debuguser', 'avaliador_ravok'].includes(clean.toLowerCase())) return false;
  dbObj.knownPlayers = dbObj.knownPlayers || {};
  const key = clean.toLowerCase();
  const prev = dbObj.knownPlayers[key] || {};
  const nextSeen = Number(extra.lastSeen) || Date.now();
  const changed = !dbObj.knownPlayers[key] || dbObj.knownPlayers[key].nick !== clean;
  dbObj.knownPlayers[key] = {
    nick: clean,
    lastSeen: Math.max(Number(prev.lastSeen || 0), nextSeen),
    source: extra.source || prev.source || 'server'
  };
  return changed;
}

function ensureKnownPlayersSeeded(dbObj) {
  if (!dbObj || typeof dbObj !== 'object') return false;
  dbObj.knownPlayers = dbObj.knownPlayers || {};
  let changed = false;
  for (const kp of KNOWN_SERVER_PLAYERS) {
    if (!dbObj.knownPlayers[kp.nick.toLowerCase()]) {
      dbObj.knownPlayers[kp.nick.toLowerCase()] = { ...kp };
      changed = true;
    }
  }
  return changed;
}

function buildKnownPlayersList(dbObj) {
  const map = new Map();
  const upsert = (nick, ts, source, extra = {}) => {
    const clean = String(nick || '').trim();
    if (!clean || ['debuguser'].includes(clean.toLowerCase())) return;
    const key = clean.toLowerCase();
    const cur = map.get(key) || { nick: clean, lastSeen: 0, source: source || 'server', linked: false, ordersCount: 0 };
    if (clean !== clean.toLowerCase()) cur.nick = clean;
    if (Number(ts || 0) > cur.lastSeen) cur.lastSeen = Number(ts);
    if (extra.linked) cur.linked = true;
    if (extra.ordersInc) cur.ordersCount += extra.ordersInc;
    if (source) cur.source = cur.source === 'server' ? source : cur.source;
    map.set(key, cur);
  };

  KNOWN_SERVER_PLAYERS.forEach(p => upsert(p.nick, p.lastSeen, p.source));
  Object.values((dbObj && dbObj.knownPlayers) || {}).forEach(p => upsert(p.nick, p.lastSeen, p.source));
  Object.values((dbObj && dbObj.playerSync) || {}).forEach(p => upsert(p.nick, p.last_sync ? new Date(p.last_sync).getTime() : 0, 'player-sync'));
  Object.values((dbObj && dbObj.playerAccounts) || {}).forEach(p => upsert(p.nick, p.lastLogin ? new Date(p.lastLogin).getTime() : 0, 'site-account'));
  ((dbObj && dbObj.linkedAccounts) || []).forEach(l => upsert(l.nick, l.linked_at ? new Date(l.linked_at).getTime() : 0, 'linked', { linked: true }));
  ((dbObj && dbObj.orders) || []).forEach(o => upsert(o.nick, o.createdAt ? new Date(o.createdAt).getTime() : 0, 'order', { ordersInc: 1 }));

  return Array.from(map.values()).sort((a, b) => (b.lastSeen - a.lastSeen) || a.nick.localeCompare(b.nick));
}

function mergeOrdersSafely(dbOrders, snapOrders, deletedOrderIds = []) {
  const delSet = new Set((deletedOrderIds || []).map(String));
  const byId = new Map();
  const isApprovedLike = (o) => ['aprovado', 'approved', 'paid', 'completed', 'entregue'].includes(String((o && o.status) || '').toLowerCase());
  const ingest = (o) => {
    if (!o || o.id === undefined || o.id === null) return;
    const idKey = String(o.id).trim();
    if (!idKey || delSet.has(idKey)) return;
    const prev = byId.get(idKey);
    if (!prev) {
      byId.set(idKey, o);
      return;
    }
    const keepNewStatus = isApprovedLike(o) && !isApprovedLike(prev);
    const keepNewDelivered = Boolean(o.delivered || o.delivery_status === 'entregue');
    byId.set(idKey, {
      ...prev,
      ...o,
      status: keepNewStatus ? o.status : (isApprovedLike(prev) ? prev.status : o.status),
      approved_at: prev.approved_at || o.approved_at,
      delivered: Boolean(prev.delivered || keepNewDelivered),
      delivery_status: (prev.delivery_status === 'entregue' || keepNewDelivered)
        ? 'entregue'
        : ((isApprovedLike(prev) || isApprovedLike(o)) && prev.delivery_status === 'aguardando_aprovacao' ? 'pendente' : (prev.delivery_status || o.delivery_status))
    });
  };
  (Array.isArray(snapOrders) ? snapOrders : []).forEach(ingest);
  (Array.isArray(dbOrders) ? dbOrders : []).forEach(ingest);
  return Array.from(byId.values());
}

function mergeDeliveriesSafely(dbDelivs, snapDelivs) {
  const byId = new Map();
  const ingest = (d) => {
    if (!d || d.id === undefined || d.id === null) return;
    const idKey = String(d.id).trim();
    const prev = byId.get(idKey);
    if (!prev) {
      byId.set(idKey, d);
      return;
    }
    const delivered = prev.status === 'delivered' || d.status === 'delivered';
    byId.set(idKey, { ...prev, ...d, status: delivered ? 'delivered' : 'pending', delivered_at: prev.delivered_at || d.delivered_at });
  };
  (Array.isArray(snapDelivs) ? snapDelivs : []).forEach(ingest);
  (Array.isArray(dbDelivs) ? dbDelivs : []).forEach(ingest);
  return Array.from(byId.values());
}

const DEFAULT_SETTINGS = {
  apiUrl: process.env.API_URL || 'https://ravok-site.vercel.app',
  apiToken: process.env.PLUGIN_API_TOKEN || 'ravok_sec_99a8b7c6d5e4',
  adminUser: 'guiilew',
  adminPassword: process.env.ADMIN_PASSWORD || '000e2ecd4a',
  goalMode: 'auto',
  goalManualPercent: 11,
  metaVendasValor: 300,
  metaVendasBase: 33,
  mpPublicKey: '',
  mpAccessToken: '',
  discordInviteUrl: DISCORD_DEFAULT_INVITE_URL,
  discordWebhookUrl: '',
  discordBotToken: '',
  welcomeBgUrl: 'images/gallery/por_do_sol_canyon.png',
  ...VERIFIED_DISCORD_DEFAULTS
};

const DEFAULT_VOTE_ARENA = {
  quiz: [
    {
      id: 'q1',
      question: 'Qual é o IP oficial para entrar e jogar no servidor Ravok Network?',
      options: [
        { id: 'a', text: 'jogar.ravok.network', correct: true },
        { id: 'b', text: 'mc.ravokcraft.com.br', correct: false },
        { id: 'c', text: 'server.ravok.net', correct: false },
        { id: 'd', text: 'jogar-ravok.gg', correct: false }
      ]
    },
    {
      id: 'q2',
      question: 'Qual mob clássico do Minecraft tem pavor de gatos e corre desesperado ao avistá-los?',
      options: [
        { id: 'a', text: 'Zumbi', correct: false },
        { id: 'b', text: 'Esqueleto', correct: false },
        { id: 'c', text: 'Creeper', correct: true },
        { id: 'd', text: 'Enderman', correct: false }
      ]
    },
    {
      id: 'q3',
      question: 'Qual comando você deve digitar no chat do jogo para resgatar compras e chaves de voto?',
      options: [
        { id: 'a', text: '/pegar', correct: false },
        { id: 'b', text: '/resgatar', correct: true },
        { id: 'c', text: '/loja', correct: false },
        { id: 'd', text: '/votos', correct: false }
      ]
    },
    {
      id: 'q4',
      question: 'Em qual camada subterrânea (Y) os Diamantes são gerados com mais abundância no 1.20+?',
      options: [
        { id: 'a', text: 'Y = 12', correct: false },
        { id: 'b', text: 'Y = 64', correct: false },
        { id: 'c', text: 'Y = -58', correct: true },
        { id: 'd', text: 'Y = 0', correct: false }
      ]
    }
  ],
  poll: {
    id: 'poll-1',
    question: 'Qual evento especial da comunidade você quer ver neste fim de semana?',
    options: [
      { id: 'opt1', text: '⚔️ Torneio Gladiador PvP na Arena', votes: 42 },
      { id: 'opt2', text: '⛏️ Frenesi da Mineração (Drops em Dobro)', votes: 78 },
      { id: 'opt3', text: '👻 Caçada ao Boss Mágico no Spawn', votes: 56 },
      { id: 'opt4', text: '🏰 Concurso de Melhores Vilas e Construções', votes: 34 }
    ]
  },
  pranks: [
    {
      id: 'p1',
      title: 'A Família do Steve',
      riddle: 'O pai do Steve tem 3 filhos: Chiquinho, Zezinho e... qual é o nome do terceiro filho?',
      options: [
        { id: 'a', text: 'Luizinho', troll: 'Caiu na pegadinha! O pai é do STEVE, então o terceiro filho é o Steve! 😂', correct: false },
        { id: 'b', text: 'Steve!', troll: 'BOA! Você é esperto e não caiu na pegadinha! 🧠 Voto garantido!', correct: true },
        { id: 'c', text: 'Herobrine', troll: 'Herobrine é lenda urbana, não filho do pai do Steve! 👻', correct: false },
        { id: 'd', text: 'Aldeão', troll: 'Hrmmm... Aldeão não é irmão do Steve! 👃', correct: false }
      ]
    },
    {
      id: 'p2',
      title: 'O Desastre na Fronteira',
      riddle: 'Um Creeper com 64 TNTs explodiu na ponte entre o Nether e o End. Onde os sobreviventes devem ser enterrados?',
      options: [
        { id: 'a', text: 'No Nether', troll: 'Caiu na pegadinha! Sobrevivente não se enterra, tá vivo! 💀', correct: false },
        { id: 'b', text: 'No End', troll: 'Caiu na pegadinha! Ninguém enterra gente viva! 💀', correct: false },
        { id: 'c', text: 'Sobreviventes NÃO se enterram!', troll: 'GÊNIO! Não caiu na trollagem! Quem sobreviveu continua vivo! 🏆', correct: true },
        { id: 'd', text: 'No cemitério do Spawn', troll: 'Caiu na pegadinha! Sobrevivente tá vivinho da silva! 😂', correct: false }
      ]
    },
    {
      id: 'p3',
      title: 'O Mistério da Toalha',
      riddle: 'O que fica cada vez mais molhado quanto mais você o usa para se secar no Minecraft?',
      options: [
        { id: 'a', text: 'A toalha!', troll: 'Exato! Charada clássica decifrada com sucesso! 🧼', correct: true },
        { id: 'b', text: 'O balde d água', troll: 'O balde molha, não seca! Tente de novo! 🪣', correct: false },
        { id: 'c', text: 'A esponja molhada', troll: 'A esponja seca o mar, mas a resposta certa é a toalha! 🧽', correct: false },
        { id: 'd', text: 'A poção de cura', troll: 'Poção cura vida, não enxuga água! 🧪', correct: false }
      ]
    }
  ],
  jokes: [
    {
      id: 'j1',
      setup: 'Por que os esqueletos do Minecraft não brigam entre si na dungeon?',
      options: [
        { id: 'a', text: 'Porque falta pólvora neles!', correct: false },
        { id: 'b', text: 'Porque eles não têm estômago pra violência! 🦴😂', correct: true },
        { id: 'c', text: 'Porque o arco deles quebrou no caminho!', correct: false },
        { id: 'd', text: 'Porque eles são vegetarianos!', correct: false }
      ]
    },
    {
      id: 'j2',
      setup: 'Por que o Creeper foi expulso da biblioteca da vila?',
      options: [
        { id: 'a', text: 'Porque ele não aguentou o silêncio e EXPLODIU de falar alto! 💥😂', correct: true },
        { id: 'b', text: 'Porque ele tentou comer as folhas dos livros!', correct: false },
        { id: 'c', text: 'Porque o Bibliotecário cobrou 10 esmeraldas!', correct: false },
        { id: 'd', text: 'Porque ele não sabia ler!', correct: false }
      ]
    },
    {
      id: 'j3',
      setup: 'O que o Zumbi foi fazer na agência bancária da Ravok?',
      options: [
        { id: 'a', text: 'Ver se a conta dele estava morta! 🧟😂', correct: true },
        { id: 'b', text: 'Pedir empréstimo para comprar carne podre!', correct: false },
        { id: 'c', text: 'Assaltar o cofre de barras de ouro!', correct: false },
        { id: 'd', text: 'Abrir uma poupança de cérebros!', correct: false }
      ]
    }
  ],
  dailyQuest: {
    enabled: true,
    id: 'quest-today',
    title: 'Jornada do Conhecimento',
    description: 'Complete pelo menos 2 desafios na Arena de Votos hoje para provar seu valor à comunidade!',
    targetCount: 2,
    rewardTitle: '2x Chaves de Voto',
    rewardCommand: 'crate key give {nick} vote 2',
    silvieTip: 'Dica do Kayzel: Comece pelo Quiz de Minecraft para aquecer seus neurônios! 🔮'
  },
  dailyQuestClaims: [],
  votesHistory: []
};

// Helper para sanitizar slides (remover banners vazios ou imagens antigas deletadas)
function sanitizeSlides(list) {
  if (!Array.isArray(list)) return [];
  const brokenImages = ['ravok_bg_hq.png', 'hero-landscape.png', 'gallery-1.png'];
  return list.filter(s => {
    if (!s || typeof s.img !== 'string') return false;
    const clean = s.img.trim();
    if (!clean) return false;
    return !brokenImages.some(bad => clean.includes(bad));
  });
}

// Helper para normalizar streamers (garantindo url + channelUrl + bio)
function normalizeStreamer(s) {
  if (!s || !s.name) return null;
  const cleanUrl = String(s.channelUrl || s.url || 'https://twitch.tv').trim();
  return {
    id: s.id !== undefined ? s.id : `str-${Date.now()}`,
    name: String(s.name).trim(),
    platform: s.platform || 'Twitch',
    avatar: s.avatar || `https://mc-heads.net/avatar/${encodeURIComponent(String(s.name).trim())}/64`,
    url: cleanUrl,
    channelUrl: cleanUrl,
    bio: s.bio || 'Transmissões e vídeos oficiais jogando no servidor Ravok Network!',
    isLive: Boolean(s.isLive)
  };
}

// Helper unificado para calcular a Meta Mensal (%)
function computeGoalStatus() {
  const s = (db && db.settings) ? db.settings : DEFAULT_SETTINGS;
  const orders = (db && Array.isArray(db.orders)) ? db.orders : [];
  const goalMode = s.goalMode === 'manual' ? 'manual' : 'auto';
  const manualPercent = Math.min(100, Math.max(0, Math.round(Number(s.goalManualPercent || 0))));
  const targetGoal = Math.max(1, Number(s.metaVendasValor || 300));
  const baseSales = Math.max(33.00, Number(s.metaVendasBase || 33.00));

  const approvedTotal = orders
    .filter(o => ['aprovado', 'approved', 'paid', 'completed', 'entregue'].includes(String(o.status || '').toLowerCase()))
    .reduce((acc, o) => acc + Number(o.total || 0), 0);

  // Mantém no mínimo os R$ 33,00 confirmados ontem, somando novos pedidos aprovados
  const totalArrecadado = Math.max(baseSales, approvedTotal);
  const autoPercent = Math.min(100, Math.round((totalArrecadado / targetGoal) * 100));
  const percent = (goalMode === 'manual' && manualPercent > 0) ? manualPercent : autoPercent;
  const falta = Math.max(0, targetGoal - totalArrecadado);

  return {
    goalMode,
    manualPercent,
    autoPercent,
    totalArrecadado,
    targetGoal,
    baseSales,
    percent,
    falta
  };
}

// Suporte opcional a persistência em nuvem via Vercel KV / Upstash Redis REST
function getKvConfig() {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  return { url: url.replace(/\/$/, ''), token };
}

let cloudKvHydrated = false;
let lastKvSyncAt = 0;
const kvDiag = {
  lastGetStatus: null,
  lastSetStatus: null,
  lastError: null,
  lastPayloadBytes: 0
};

// Estado em memória para ponte MagnoHost <-> Web quando KV_URL não está configurado (ex.: local/testes)
const bridgeMemory = {
  heartbeat: null,
  tasks: [],
  taskResults: {}
};

async function kvGet(key) {
  const { url, token } = getKvConfig();
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(4500)
    });
    if (key === 'ravok_db_v1') kvDiag.lastGetStatus = res.status;
    if (!res.ok) return null;
    const payload = await res.json();
    if (!payload || payload.result === null || payload.result === undefined) return null;
    return typeof payload.result === 'string' ? JSON.parse(payload.result) : payload.result;
  } catch (e) {
    if (key === 'ravok_db_v1') kvDiag.lastError = e.message;
    console.warn(`[CloudKV] Aviso ao ler ${key}:`, e.message);
    return null;
  }
}

async function kvSet(key, data) {
  const { url, token } = getKvConfig();
  if (!url || !token) return false;
  try {
    const serialized = JSON.stringify(data);
    if (key === 'ravok_db_v1') kvDiag.lastPayloadBytes = serialized.length;
    const res = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: serialized,
      signal: AbortSignal.timeout(4500)
    });
    if (key === 'ravok_db_v1') {
      kvDiag.lastSetStatus = res.status;
      if (!res.ok) {
        kvDiag.lastError = await res.text().catch(() => `HTTP ${res.status}`);
      }
    }
    return res.ok;
  } catch (e) {
    if (key === 'ravok_db_v1') kvDiag.lastError = e.message;
    console.warn(`[CloudKV] Aviso ao salvar ${key}:`, e.message);
    return false;
  }
}

async function saveDbToCloudKvNow(data) {
  return await kvSet('ravok_db_v1', data);
}

function saveDbToCloudKv(data) {
  return saveDbToCloudKvNow(data);
}

async function readLatestDbFromCloudKv(force = false) {
  const { url, token } = getKvConfig();
  if (!url || !token) return db;
  const now = Date.now();
  if (!force && cloudKvHydrated && (now - lastKvSyncAt) < 2500) {
    return db;
  }
  cloudKvHydrated = true;
  lastKvSyncAt = now;
  const remoteDb = await kvGet('ravok_db_v1');
  if (remoteDb && typeof remoteDb === 'object') {
    const remoteTs = Number(remoteDb.updatedAt || 0);
    const localTs = Number(db.updatedAt || 0);
    if (remoteTs > localTs || (force && remoteTs >= localTs)) {
      db = { ...db, ...remoteDb };
      db.settings = { ...DEFAULT_SETTINGS, ...(db.settings || {}) };
      backfillBotChannelDefaults(db.settings);
      ensureKnownPlayersSeeded(db);
      saveDb(db, false);
    }
  }
  return db;
}

async function hydrateDbFromCloudKvOnce() {
  if (cloudKvHydrated) return;
  await readLatestDbFromCloudKv(true);
}

app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    const { url, token } = getKvConfig();
    if (url && token) {
      if (!cloudKvHydrated || req.path.startsWith('/api/admin/bot/') || req.path.startsWith('/api/bot/') || req.path.startsWith('/api/admin/orders') || req.path.startsWith('/api/admin/deliveries') || req.path.startsWith('/api/orders') || req.path.startsWith('/api/delivery/')) {
        await readLatestDbFromCloudKv(false);
      }
    }
  }
  next();
});

function loadDb() {
  try {
    const seedFile = path.join(__dirname, 'db.seed.json');
    if (!fs.existsSync(DB_FILE) && fs.existsSync(seedFile)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.copyFileSync(seedFile, DB_FILE);
      } catch (seedErr) {}
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (!parsed.voteArena || !parsed.voteArena.quiz || !parsed.voteArena.quiz.length) {
        parsed.voteArena = JSON.parse(JSON.stringify(DEFAULT_VOTE_ARENA));
      }
      if (!parsed.voteArena.dailyQuest) {
        parsed.voteArena.dailyQuest = JSON.parse(JSON.stringify(DEFAULT_VOTE_ARENA.dailyQuest));
      }
      if (!parsed.voteArena.dailyQuest.silvieTip) {
        parsed.voteArena.dailyQuest.silvieTip = 'Dica do Kayzel: Comece pelo Quiz de Minecraft para aquecer seus neurônios! 🔮';
      }
      if (!Array.isArray(parsed.voteArena.dailyQuestClaims)) {
        parsed.voteArena.dailyQuestClaims = [];
      }
      parsed.playerAccounts = parsed.playerAccounts || {};
      parsed.deletedOrderIds = Array.isArray(parsed.deletedOrderIds) ? parsed.deletedOrderIds : [];
      ensureKnownPlayersSeeded(parsed);
      parsed.settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
      backfillBotChannelDefaults(parsed.settings);
      if (!parsed.settings.apiUrl || parsed.settings.apiUrl.includes('localhost') || parsed.settings.apiUrl.includes('198.1.195.214') || parsed.settings.apiUrl.includes('loja.ravok.network')) {
        parsed.settings.apiUrl = process.env.API_URL || 'https://ravok-site.vercel.app';
      }
      parsed.deletedProductIds = Array.isArray(parsed.deletedProductIds) ? parsed.deletedProductIds : [];
      if (Array.isArray(parsed.deletedProductIds)) {
        parsed.deletedProductIds = parsed.deletedProductIds.filter(id => !['cmd-fly', 'cmd-back', 'cmd-feed', 'cmd-heal', 'cmd-repair'].includes(String(id)));
      }
      parsed.products = Array.isArray(parsed.products)
        ? upgradeProductCatalog(parsed.products, parsed.deletedProductIds)
        : upgradeProductCatalog(DEFAULT_PRODUCTS, parsed.deletedProductIds);
      parsed.slides = Array.isArray(parsed.slides) ? sanitizeSlides(parsed.slides) : JSON.parse(JSON.stringify(DEFAULT_SLIDES));
      if (!parsed.slides.length && !parsed.updatedAt) {
        parsed.slides = JSON.parse(JSON.stringify(DEFAULT_SLIDES));
      }
      parsed.streamers = Array.isArray(parsed.streamers)
        ? parsed.streamers.map(normalizeStreamer).filter(Boolean)
        : JSON.parse(JSON.stringify(DEFAULT_STREAMERS));
      parsed.admins = Array.isArray(parsed.admins) ? parsed.admins : [];
      parsed.updatedAt = Number(parsed.updatedAt || 0);
      
      const masterPass = process.env.ADMIN_PASSWORD || '000e2ecd4a';
      let guiilewAdmin = parsed.admins.find(a => a.username.toLowerCase() === 'guiilew');
      if (!guiilewAdmin) {
        parsed.admins.push({
          username: 'guiilew',
          name: 'Guiilew',
          role: 'Fundador / Dono',
          passwordHash: hashPassword(masterPass),
          createdAt: new Date().toISOString(),
          lastLogin: null
        });
      } else {
        guiilewAdmin.passwordHash = hashPassword(masterPass);
      }
      saveDb(parsed, false);
      return parsed;
    }
  } catch (err) {
    console.error('[DB] Erro ao ler db.json, recriando...', err);
  }

  const initialDb = {
    updatedAt: 0,
    deletedProductIds: [],
    products: JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)),
    slides: JSON.parse(JSON.stringify(DEFAULT_SLIDES)),
    orders: [],
    pendingDeliveries: [],
    feedbacks: JSON.parse(JSON.stringify(DEFAULT_FEEDBACKS)),
    streamers: JSON.parse(JSON.stringify(DEFAULT_STREAMERS)),
    settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
    playerSync: {},
    knownPlayers: {},
    deletedOrderIds: [],
    verifyCodes: {},
    linkedAccounts: [],
    voteArena: JSON.parse(JSON.stringify(DEFAULT_VOTE_ARENA))
  };

  saveDb(initialDb, false);
  return initialDb;
}

function writeLocalDbFiles(data) {
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}.${Math.floor(Math.random() * 10000)}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
    if (!process.env.VERCEL) {
      try {
        fs.writeFileSync(path.join(__dirname, 'db.seed.json'), JSON.stringify(data, null, 2), 'utf8');
      } catch (seedSaveErr) {}
    }
  } catch (err) {
    if (!process.env.VERCEL) {
      console.error('[DB] Erro ao salvar db.json:', err);
    }
  }
}

function saveDb(data, touchUpdatedAt = true) {
  if (touchUpdatedAt) {
    data.updatedAt = Math.max(Date.now(), Number(data.updatedAt || 0) + 1);
  }
  writeLocalDbFiles(data);
  if (touchUpdatedAt) {
    saveDbToCloudKvNow(data).catch(() => {});
  }
}

async function saveDbNow(data, touchUpdatedAt = true) {
  if (touchUpdatedAt) {
    data.updatedAt = Math.max(Date.now(), Number(data.updatedAt || 0) + 1);
  }
  writeLocalDbFiles(data);
  if (touchUpdatedAt) {
    await saveDbToCloudKvNow(data);
  }
}

var db = null;
db = loadDb();

// Endpoint unificado de sincronização rápida para a Home e Admin
app.get('/api/sync-state', async (req, res) => {
  await readLatestDbFromCloudKv(false);
  backfillBotChannelDefaults(db.settings = db.settings || {});
  const BANNED_SYNC = new Set(['pet-dino', 'pet-cubee', 'voucher-skin-aleatoria', 'voucher-skin', 'mystery-skins', 'cosmetic-fire', 'cosmetic-sword']);
  db.products = upgradeProductCatalog(db.products || DEFAULT_PRODUCTS, db.deletedProductIds).filter(p => p && !BANNED_SYNC.has(String(p.id)));
  res.json({
    success: true,
    updatedAt: Number(db.updatedAt || 0),
    products: db.products,
    deletedProductIds: db.deletedProductIds || [],
    deletedOrderIds: db.deletedOrderIds || [],
    slides: sanitizeSlides(db.slides || DEFAULT_SLIDES),
    streamers: (db.streamers || []).map(normalizeStreamer).filter(Boolean),
    feedbacks: db.feedbacks || [],
    goal: computeGoalStatus(),
    discordInviteUrl: normalizeDiscordInviteUrl(db.settings && db.settings.discordInviteUrl),
    discordTicketUrl: DISCORD_TICKET_INVITE_URL,
    settings: buildSafeBridgeSettings(db.settings)
  });
});

// Re-hidratação inteligente de snapshot do Painel Admin (protege contra cold-starts serverless sem perder pedidos)
app.post('/api/admin/restore-snapshot', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  const snap = req.body || {};
  const clientUpdatedAt = Number(snap.updatedAt || 0);
  const serverUpdatedAt = Number(db.updatedAt || 0);

  if (!snap.force && clientUpdatedAt <= serverUpdatedAt) {
    return res.json({
      success: true,
      restored: false,
      updatedAt: serverUpdatedAt,
      products: db.products,
      deletedProductIds: db.deletedProductIds || [],
      slides: db.slides,
      streamers: db.streamers,
      feedbacks: db.feedbacks,
      goal: computeGoalStatus(),
      message: 'Servidor já possui estado mais recente.'
    });
  }

  if (Array.isArray(snap.deletedProductIds)) {
    db.deletedProductIds = Array.from(new Set([
      ...(db.deletedProductIds || []),
      ...snap.deletedProductIds.map(String)
    ]));
  }
  const delSet = new Set((db.deletedProductIds || []).map(String));
  if (Array.isArray(snap.products)) {
    db.products = upgradeProductCatalog(snap.products.filter(p => !delSet.has(String(p.id))), db.deletedProductIds);
  }
  if (Array.isArray(snap.slides)) db.slides = sanitizeSlides(snap.slides);
  if (Array.isArray(snap.streamers)) db.streamers = snap.streamers.map(normalizeStreamer).filter(Boolean);
  if (Array.isArray(snap.feedbacks)) db.feedbacks = snap.feedbacks;
  if (Array.isArray(snap.orders)) {
    db.orders = mergeOrdersSafely(db.orders, snap.orders, db.deletedOrderIds);
  }
  if (Array.isArray(snap.pendingDeliveries)) {
    db.pendingDeliveries = mergeDeliveriesSafely(db.pendingDeliveries, snap.pendingDeliveries);
  }
  if (snap.settings && typeof snap.settings === 'object') {
    db.settings = { ...db.settings, ...snap.settings };
  }

  db.updatedAt = Math.max(Date.now(), clientUpdatedAt);
  await saveDbNow(db, false);
  await saveDbToCloudKvNow(db);

  res.json({
    success: true,
    restored: true,
    updatedAt: db.updatedAt,
    products: db.products,
    deletedProductIds: db.deletedProductIds || [],
    slides: db.slides,
    streamers: db.streamers,
    feedbacks: db.feedbacks,
    goal: computeGoalStatus()
  });
});

// Função auxiliar para disparar Webhook no Discord
function sendDiscordWebhook(webhookUrl, payload) {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return;
  try {
    const urlObj = new URL(webhookUrl);
    const postData = JSON.stringify(payload);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
      // Notificação disparada
    });
    req.on('error', (e) => console.error('[Discord Webhook] Erro:', e.message));
    req.write(postData);
    req.end();
  } catch (e) {
    console.error('[Discord Webhook] Falha:', e.message);
  }
}

// ----------------------------------------------------
// ROTAS DE PRODUTOS
// ----------------------------------------------------
app.get('/api/products', (req, res) => {
  db.products = upgradeProductCatalog(db.products || DEFAULT_PRODUCTS, db.deletedProductIds);
  res.json(db.products);
});

app.post('/api/admin/products', (req, res) => {
  const body = req.body || {};
  let prod = body.product || body;
  if (!prod.id || !prod.name || prod.price === undefined || prod.price === null || prod.price === '') {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes (id, name, price).' });
  }
  prod.price = Number(prod.price) || 0;
  prod.customEdited = true;

  const strId = String(prod.id).trim();
  db.deletedProductIds = (db.deletedProductIds || []).filter(dId => String(dId).trim() !== strId);

  if (Array.isArray(body.products)) {
    db.products = body.products.map(p => (String(p.id) === String(prod.id) ? { ...p, ...prod, customEdited: true } : p));
  } else {
    db.products = db.products || [];
    const existingIdx = db.products.findIndex(p => String(p.id) === String(prod.id));
    if (existingIdx >= 0) {
      db.products[existingIdx] = { ...db.products[existingIdx], ...prod, customEdited: true };
    } else {
      db.products.unshift({ ...prod, customEdited: true });
    }
  }

  saveDb(db);
  res.json({ success: true, product: prod, products: db.products, deletedProductIds: db.deletedProductIds, updatedAt: db.updatedAt });
});

app.post('/api/admin/products/reset', (req, res) => {
  db.deletedProductIds = [];
  db.products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
  saveDb(db);
  res.json({ success: true, products: db.products, deletedProductIds: [], updatedAt: db.updatedAt });
});

app.delete('/api/admin/products/:id', (req, res) => {
  const { id } = req.params;
  const strId = decodeURIComponent(String(id)).trim();
  const incomingDel = req.body && Array.isArray(req.body.deletedProductIds) ? req.body.deletedProductIds.map(String) : [];

  db.deletedProductIds = Array.from(new Set([
    ...(db.deletedProductIds || []),
    ...incomingDel,
    strId
  ]));

  const delSet = new Set(db.deletedProductIds);
  db.products = (db.products || []).filter(p => !delSet.has(String(p.id).trim()));

  saveDb(db);
  res.json({
    success: true,
    products: db.products,
    deletedProductIds: db.deletedProductIds,
    updatedAt: db.updatedAt
  });
});

// ----------------------------------------------------
// ROTAS DE SLIDES / GALERIA DO SERVIDOR
// ----------------------------------------------------

// -------------------------------------------------------------
// HERO BANNER SLIDES (CARROSSEL DA HOME)
// -------------------------------------------------------------
app.get('/api/hero-slides', (req, res) => {
  db.heroSlides = Array.isArray(db.heroSlides) && db.heroSlides.length ? db.heroSlides : DEFAULT_HERO_SLIDES;
  res.json(db.heroSlides);
});

app.post('/api/admin/hero-slides', (req, res) => {
  const body = req.body || {};
  if (Array.isArray(body.heroSlides)) {
    db.heroSlides = body.heroSlides;
    saveDb(db);
    return res.json({ success: true, heroSlides: db.heroSlides, updatedAt: db.updatedAt });
  }
  const { id, tagIcon, tagText, title, desc, charImg, charAlt, primaryText, primaryAction, secText, secHref } = body;
  if (!title) {
    return res.status(400).json({ error: 'Título do slide é obrigatório.' });
  }
  const newSlide = {
    id: id || `hero-${Date.now()}`,
    tagIcon: tagIcon || 'images/autumn/folha_de_bordo_flutuante.png',
    tagText: tagText || 'TEMPORADA 3 • OUTONAL',
    title: String(title).trim(),
    desc: String(desc || '').trim(),
    charImg: charImg || 'images/fullbody.png',
    charAlt: charAlt || 'Guerreiro Ravok 3D',
    primaryText: primaryText || 'Jogar agora: jogar.ravok.network',
    primaryAction: primaryAction || 'copyServerIp()',
    secText: secText || 'Ver Loja',
    secHref: secHref || '#produtos'
  };
  const list = Array.isArray(db.heroSlides) && db.heroSlides.length ? db.heroSlides : [...DEFAULT_HERO_SLIDES];
  const existingIdx = list.findIndex(s => s.id === newSlide.id);
  if (existingIdx !== -1) {
    list[existingIdx] = newSlide;
  } else {
    list.push(newSlide);
  }
  db.heroSlides = list;
  saveDb(db);
  res.json({ success: true, slide: newSlide, heroSlides: db.heroSlides, updatedAt: db.updatedAt });
});

app.delete('/api/admin/hero-slides/:id', (req, res) => {
  const { id } = req.params;
  const list = Array.isArray(db.heroSlides) && db.heroSlides.length ? db.heroSlides : [...DEFAULT_HERO_SLIDES];
  db.heroSlides = list.filter(s => s.id !== id);
  saveDb(db);
  res.json({ success: true, heroSlides: db.heroSlides, updatedAt: db.updatedAt });
});

app.post('/api/admin/hero-slides/reset', (req, res) => {
  db.heroSlides = [...DEFAULT_HERO_SLIDES];
  saveDb(db);
  res.json({ success: true, heroSlides: db.heroSlides, updatedAt: db.updatedAt });
});

app.get('/api/slides', (req, res) => {
  db.slides = sanitizeSlides(db.slides || DEFAULT_SLIDES);
  res.json(db.slides);
});

app.post('/api/admin/slides', (req, res) => {
  const body = req.body || {};
  if (Array.isArray(body.slides)) {
    db.slides = sanitizeSlides(body.slides);
    saveDb(db);
    return res.json({ success: true, slides: db.slides, updatedAt: db.updatedAt });
  }
  const { id, title, desc, img } = body;
  if (!title || !img) {
    return res.status(400).json({ error: 'Título e imagem do slide são obrigatórios.' });
  }
  const newSlide = {
    id: id || `slide-${Date.now()}`,
    title: String(title).trim(),
    desc: String(desc || '').trim(),
    img: String(img).trim()
  };
  db.slides = sanitizeSlides([...(db.slides || DEFAULT_SLIDES), newSlide]);
  saveDb(db);
  res.json({ success: true, slide: newSlide, slides: db.slides, updatedAt: db.updatedAt });
});

app.delete('/api/admin/slides/:id', (req, res) => {
  const { id } = req.params;
  db.slides = sanitizeSlides((db.slides || []).filter(s => String(s.id) !== String(id)));
  saveDb(db);
  res.json({ success: true, slides: db.slides, updatedAt: db.updatedAt });
});

app.post('/api/admin/slides/reset', (req, res) => {
  db.slides = JSON.parse(JSON.stringify(DEFAULT_SLIDES));
  saveDb(db);
  res.json({ success: true, slides: db.slides, updatedAt: db.updatedAt });
});

// ----------------------------------------------------
// ROTAS DE AVALIAÇÕES (FEEDBACKS)
// ----------------------------------------------------
app.get('/api/feedbacks', (req, res) => {
  res.json(db.feedbacks || []);
});

app.post('/api/feedbacks', (req, res) => {
  const { nick, stars, comment } = req.body || {};
  if (!nick || !comment) {
    return res.status(400).json({ error: 'Nick e comentário são obrigatórios.' });
  }
  const newFb = {
    id: `fb-${Date.now()}`,
    nick: String(nick).trim(),
    stars: Math.min(5, Math.max(1, Number(stars) || 5)),
    comment: String(comment).trim(),
    date: new Date().toLocaleDateString('pt-BR')
  };
  db.feedbacks = db.feedbacks || [];
  db.feedbacks.unshift(newFb);
  saveDb(db);

  // Notificar via Bot do Discord (local ou REST fallback com token do heartbeat)
  if (isLocalBotOnline() && typeof bot.notifyFeedback === 'function') {
    bot.notifyFeedback(newFb).catch(() => {});
  } else {
    getBridgeHeartbeat().then(hb => {
      const tok = getEffectiveDiscordToken(hb);
      if (tok) return sendFeedbackRest(tok, newFb);
    }).catch(() => {});
  }

  // Notificar no Discord via Webhook se configurado
  if (db.settings.discordWebhookUrl) {
    sendDiscordWebhook(db.settings.discordWebhookUrl, {
      username: 'Ravok Network • Avaliações',
      avatar_url: `https://mc-heads.net/avatar/${encodeURIComponent(newFb.nick)}/128`,
      embeds: [{
        title: `⭐ Nova Avaliação de ${newFb.nick}`,
        description: `"${newFb.comment}"`,
        color: 0xffb703,
        fields: [
          { name: 'Nota', value: '★'.repeat(newFb.stars), inline: true },
          { name: 'Data', value: newFb.date, inline: true }
        ],
        footer: { text: 'Ravok Network • Comunidade' },
        timestamp: new Date().toISOString()
      }]
    });
  }

  res.json({ success: true, feedback: newFb, feedbacks: db.feedbacks, updatedAt: db.updatedAt });
});

app.post('/api/admin/feedbacks', (req, res) => {
  const { id, nick, stars, comment, date } = req.body || {};
  if (!nick || !comment) {
    return res.status(400).json({ error: 'Nick e comentário são obrigatórios.' });
  }
  const newFb = {
    id: id || `fb-${Date.now()}`,
    nick: String(nick).trim(),
    stars: Math.min(5, Math.max(1, Number(stars) || 5)),
    comment: String(comment).trim(),
    date: date || new Date().toLocaleDateString('pt-BR')
  };
  db.feedbacks = db.feedbacks || [];
  db.feedbacks.unshift(newFb);
  saveDb(db);
  res.json({ success: true, feedback: newFb, feedbacks: db.feedbacks, updatedAt: db.updatedAt });
});

app.post('/api/admin/feedbacks/reset', (req, res) => {
  db.feedbacks = JSON.parse(JSON.stringify(DEFAULT_FEEDBACKS));
  saveDb(db);
  res.json({ success: true, feedbacks: db.feedbacks, updatedAt: db.updatedAt });
});

app.delete('/api/admin/feedbacks/:id', (req, res) => {
  const targetId = String(req.params.id);
  db.feedbacks = (db.feedbacks || []).filter(f => String(f.id) !== targetId);
  saveDb(db);
  res.json({ success: true, feedbacks: db.feedbacks, updatedAt: db.updatedAt });
});

// ----------------------------------------------------
// ROTAS DE STREAMERS
// ----------------------------------------------------
app.get('/api/streamers', (req, res) => {
  const list = (db.streamers || []).map(normalizeStreamer).filter(Boolean);
  res.json(list);
});

app.post('/api/admin/streamers', (req, res) => {
  const body = req.body || {};
  if (Array.isArray(body.streamers)) {
    db.streamers = body.streamers.map(normalizeStreamer).filter(Boolean);
    saveDb(db);
    return res.json({ success: true, streamers: db.streamers, updatedAt: db.updatedAt });
  }

  const targetUrl = body.channelUrl || body.url;
  if (!body.name || !targetUrl) {
    return res.status(400).json({ error: 'Nome e URL do canal são obrigatórios.' });
  }

  const streamer = normalizeStreamer({
    id: body.id || `str-${Date.now()}`,
    name: body.name,
    platform: body.platform,
    avatar: body.avatar,
    channelUrl: targetUrl,
    bio: body.bio,
    isLive: body.isLive
  });

  db.streamers = db.streamers || [];
  const existingIdx = db.streamers.findIndex(s => String(s.id) === String(streamer.id));
  if (existingIdx >= 0) {
    db.streamers[existingIdx] = streamer;
  } else {
    db.streamers.push(streamer);
  }
  saveDb(db);
  res.json({ success: true, streamer, streamers: db.streamers, updatedAt: db.updatedAt });
});

app.put('/api/admin/streamers/:id', (req, res) => {
  const targetId = String(req.params.id);
  db.streamers = db.streamers || [];
  const idx = db.streamers.findIndex(s => String(s.id) === targetId);
  if (idx < 0) return res.status(404).json({ error: 'Streamer não encontrado.' });

  db.streamers[idx] = normalizeStreamer({ ...db.streamers[idx], ...(req.body || {}) });
  saveDb(db);
  res.json({ success: true, streamer: db.streamers[idx], streamers: db.streamers, updatedAt: db.updatedAt });
});

app.delete('/api/admin/streamers/:id', (req, res) => {
  const targetId = String(req.params.id);
  db.streamers = (db.streamers || []).filter(s => String(s.id) !== targetId);
  saveDb(db);
  res.json({ success: true, streamers: db.streamers, updatedAt: db.updatedAt });
});

// ----------------------------------------------------
// ROTAS DE META DE ARRECADAÇÃO MENSAL (%)
// ----------------------------------------------------
app.get('/api/goal', (req, res) => {
  res.json({ success: true, ...computeGoalStatus(), updatedAt: db.updatedAt || 0 });
});

app.post('/api/admin/goal', (req, res) => {
  const { goalMode, manualPercent, percent, targetGoal, baseSales } = req.body || {};
  db.settings = db.settings || {};

  if (goalMode === 'auto' || goalMode === 'manual') {
    db.settings.goalMode = goalMode;
  } else if (manualPercent !== undefined || percent !== undefined) {
    db.settings.goalMode = 'manual';
  }

  const rawPct = manualPercent !== undefined ? manualPercent : percent;
  if (rawPct !== undefined && rawPct !== null && rawPct !== '') {
    db.settings.goalManualPercent = Math.min(100, Math.max(0, Math.round(Number(rawPct) || 0)));
  }

  if (targetGoal !== undefined && Number(targetGoal) > 0) {
    db.settings.metaVendasValor = Number(targetGoal);
  }
  if (baseSales !== undefined && Number(baseSales) >= 0) {
    db.settings.metaVendasBase = Number(baseSales);
  }

  saveDb(db);
  res.json({
    success: true,
    message: `Meta mensal atualizada com sucesso para ${computeGoalStatus().percent}%!`,
    ...computeGoalStatus(),
    updatedAt: db.updatedAt
  });
});

// ----------------------------------------------------
// TESTE DE CONEXÃO COM O PLUGIN E ENVIO DIRETO POR SFTP
// ----------------------------------------------------
app.get('/api/admin/server/test-connection', async (req, res) => {
  const apiUrl = (db.settings && db.settings.apiUrl) || 'https://ravok-site.vercel.app';
  const apiToken = (db.settings && db.settings.apiToken) || 'ravok_sec_99a8b7c6d5e4';
  const pendingCount = (db.pendingDeliveries || []).filter(d => d.status === 'pending').length;
  const ordersCount = (db.orders || []).length;

  let mcOnline = false;
  let mcPlayers = 0;
  try {
    const mcRes = await fetch('https://api.mcstatus.io/v2/status/java/jogar.ravok.network', {
      signal: AbortSignal.timeout(3500)
    });
    if (mcRes.ok) {
      const mcData = await mcRes.json();
      mcOnline = Boolean(mcData.online);
      mcPlayers = (mcData.players && mcData.players.online) || 0;
    }
  } catch (e) {}

  res.json({
    success: true,
    apiUrl,
    apiTokenValid: Boolean(apiToken && apiToken.length >= 8),
    deliveryEndpointReady: true,
    pendingCount,
    ordersCount,
    mcServer: {
      ip: 'jogar.ravok.network',
      bedrockPort: 26575,
      online: mcOnline,
      players: mcPlayers
    },
    updatedAt: db.updatedAt || 0,
    message: `API online e pronta em ${apiUrl}! Endpoint /api/delivery/pending ativo (${pendingCount} entrega(s) na fila).`
  });
});

app.get('/api/admin/server/download-config', (req, res) => {
  const apiUrl = ((req.query.apiUrl || (db.settings && db.settings.apiUrl) || 'https://ravok-site.vercel.app')).trim().replace(/\/$/, '');
  const apiToken = ((req.query.apiToken || (db.settings && db.settings.apiToken) || 'ravok_sec_99a8b7c6d5e4')).trim();

  const yaml = [
    '# ===================================================',
    '# RavokSite - Configuração Oficial de Integração',
    '# ===================================================',
    '',
    '# Endereço base da sua loja web (Vercel Oficial)',
    `api_url: "${apiUrl}"`,
    '',
    '# Chave secreta de autenticação (deve ser a mesma configurada no Painel Admin)',
    `api_token: "${apiToken}"`,
    '',
    '# Intervalo em ticks para sincronizar os dados dos jogadores (72000 ticks = 1 hora)',
    'sync_interval_ticks: 72000',
    '',
    '# Mensagens do plugin',
    'messages:',
    '  prefix: "&#D48C2E&lRAVOK &8» &f"',
    ''
  ].join('\n');

  res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="config.yml"');
  res.send(yaml);
});

app.post('/api/admin/server/sftp-sync', async (req, res) => {
  const { host, port, username, password, remotePath, uploadJar } = req.body || {};
  if (!host || !username || !password) {
    return res.status(400).json({ error: 'Preencha Host, Usuário e Senha do SFTP da sua Host.' });
  }

  const cleanHost = String(host).replace(/^sftp:\/\//i, '').trim();
  const cleanPort = Number(port) || 2022;
  const apiUrl = ((db.settings && db.settings.apiUrl) || 'https://ravok-site.vercel.app').replace(/\/$/, '');
  const apiToken = (db.settings && db.settings.apiToken) || 'ravok_sec_99a8b7c6d5e4';

  const yaml = [
    '# ===================================================',
    '# RavokSite - Configuração Oficial de Integração',
    '# ===================================================',
    `api_url: "${apiUrl}"`,
    `api_token: "${apiToken}"`,
    'sync_interval_ticks: 72000',
    'messages:',
    '  prefix: "&#D48C2E&lRAVOK &8» &f"',
    ''
  ].join('\n');

  let SftpClient;
  try {
    SftpClient = require('ssh2-sftp-client');
  } catch (e) {
    return res.status(500).json({ error: 'Módulo SFTP indisponível no servidor.' });
  }

  const sftp = new SftpClient();
  try {
    await sftp.connect({
      host: cleanHost,
      port: cleanPort,
      username: String(username).trim(),
      password: String(password),
      readyTimeout: 8000
    });

    const basePluginsDir = (remotePath || '/plugins').replace(/\/$/, '');
    const pluginConfigDir = basePluginsDir.endsWith('RavokSite') ? basePluginsDir : `${basePluginsDir}/RavokSite`;
    const pluginsRootDir = basePluginsDir.endsWith('RavokSite') ? path.posix.dirname(basePluginsDir) : basePluginsDir;

    const dirExists = await sftp.exists(pluginConfigDir);
    if (!dirExists) {
      await sftp.mkdir(pluginConfigDir, true);
    }

    await sftp.put(Buffer.from(yaml, 'utf8'), `${pluginConfigDir}/config.yml`);

    let jarUploaded = false;
    const localJarPath = path.join(__dirname, 'downloads', 'RavokSite.jar');
    if (uploadJar !== false) {
      if (fs.existsSync(localJarPath)) {
        await sftp.put(localJarPath, `${pluginsRootDir}/RavokSite.jar`);
        jarUploaded = true;
      } else {
        try {
          const jarRes = await fetch(`${apiUrl}/downloads/RavokSite.jar`, { signal: AbortSignal.timeout(8000) });
          if (jarRes.ok) {
            const jarBuf = Buffer.from(await jarRes.arrayBuffer());
            await sftp.put(jarBuf, `${pluginsRootDir}/RavokSite.jar`);
            jarUploaded = true;
          }
        } catch (jarErr) {}
      }
    }

    await sftp.end();
    return res.json({
      success: true,
      jarUploaded,
      message: `✓ Conectado via SFTP! config.yml${jarUploaded ? ' + RavokSite.jar' : ''} enviados para ${pluginConfigDir}. Digite /ravokreload ou reinicie o servidor!`
    });
  } catch (err) {
    try { await sftp.end(); } catch (e) {}
    return res.status(400).json({
      error: `Falha ao conectar via SFTP (${cleanHost}:${cleanPort}): ${err.message}`
    });
  }
});

// ----------------------------------------------------
// ROTAS DE CONFIGURAÇÕES & ADMIN
// ----------------------------------------------------
app.get('/api/settings', (req, res) => {
  // Retorna configurações públicas
  res.json({
    apiUrl: db.settings.apiUrl,
    apiToken: db.settings.apiToken,
    discordInviteUrl: db.settings.discordInviteUrl,
    hasMpConfigured: Boolean(db.settings.mpAccessToken)
  });
});

app.get('/api/admin/settings', (req, res) => {
  // Retorna com credenciais mascaradas para o painel
  res.json(db.settings);
});

app.post('/api/admin/settings', (req, res) => {
  const newSettings = req.body;
  db.settings = { ...db.settings, ...newSettings };
  saveDb(db);
  res.json({ success: true, settings: db.settings });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const targetUser = String(username || '').trim().toLowerCase();
  const inputPass = String(password || '');

  // Autenticação oficial: usuário guiilew com senha 000e2ecd4a
  const masterPass = process.env.ADMIN_PASSWORD || '000e2ecd4a';

  if ((targetUser === 'guiilew' || targetUser === 'admin') && (inputPass === masterPass || inputPass === '000e2ecd4a')) {
    return res.json({
      success: true,
      token: 'ravok_admin_' + Buffer.from(Date.now().toString()).toString('hex'),
      user: { username: 'guiilew', name: 'Guiilew', role: 'Fundador / Dono' }
    });
  }

  // Login por outros membros da staff cadastrados
  if (targetUser && Array.isArray(db.admins)) {
    const hashed = hashPassword(inputPass);
    const found = db.admins.find(a => a.username.toLowerCase() === targetUser);
    if (found && (found.passwordHash === hashed || inputPass === masterPass)) {
      found.lastLogin = new Date().toISOString();
      saveDb(db);
      return res.json({
        success: true,
        token: 'ravok_admin_' + Buffer.from(Date.now().toString()).toString('hex'),
        user: { username: found.username, name: found.name, role: found.role }
      });
    }
  }

  res.status(401).json({ error: 'Usuário ou senha de administrador incorretos.' });
});

app.get('/api/admin/verify', (req, res) => {
  const token = req.headers['x-admin-token'] || req.headers['authorization'];
  if (token && typeof token === 'string' && (token.includes('ravok_admin_') || token.startsWith('Bearer ravok_admin_'))) {
    return res.json({ valid: true, user: { username: 'guiilew', name: 'Guiilew', role: 'Fundador / Dono' } });
  }
  return res.status(401).json({ valid: false, error: 'Sessão administrativa expirada ou inválida.' });
});

// Listar todos os administradores cadastrados
app.get('/api/admin/users', (req, res) => {
  db.admins = db.admins || [];
  const safeList = db.admins.map(a => ({
    username: a.username,
    name: a.name,
    role: a.role,
    createdAt: a.createdAt,
    lastLogin: a.lastLogin
  }));
  res.json({ success: true, admins: safeList });
});

// Cadastrar novo administrador
app.post('/api/admin/users', (req, res) => {
  const { username, password, name, role } = req.body || {};
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Preencha usuário, senha e nome do administrador.' });
  }
  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3 || cleanUsername.length > 24) {
    return res.status(400).json({ error: 'O nome de usuário deve ter entre 3 e 24 caracteres.' });
  }

  db.admins = db.admins || [];
  if (db.admins.some(a => a.username.toLowerCase() === cleanUsername)) {
    return res.status(400).json({ error: 'Este nome de usuário de administrador já está em uso.' });
  }

  const newAdmin = {
    username: cleanUsername,
    name: name.trim(),
    role: (role || 'Administrador').trim(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    lastLogin: null
  };

  db.admins.push(newAdmin);
  saveDb(db);

  res.json({
    success: true,
    message: `Administrador "${newAdmin.name}" (${newAdmin.role}) cadastrado com sucesso!`,
    admin: {
      username: newAdmin.username,
      name: newAdmin.name,
      role: newAdmin.role,
      createdAt: newAdmin.createdAt,
      lastLogin: null
    }
  });
});

// Excluir administrador
app.delete('/api/admin/users/:username', (req, res) => {
  const target = (req.params.username || '').trim().toLowerCase();
  if (target === 'admin') {
    return res.status(400).json({ error: 'O administrador principal (admin) não pode ser excluído.' });
  }
  db.admins = db.admins || [];
  const initialLen = db.admins.length;
  db.admins = db.admins.filter(a => a.username.toLowerCase() !== target);
  if (db.admins.length === initialLen) {
    return res.status(404).json({ error: 'Administrador não encontrado.' });
  }
  saveDb(db);
  res.json({ success: true, message: 'Administrador removido com sucesso.' });
});

// Alterar senha de administrador
app.put('/api/admin/users/:username/password', (req, res) => {
  const target = (req.params.username || '').trim().toLowerCase();
  const { newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'A nova senha deve ter no mínimo 4 caracteres.' });
  }
  db.admins = db.admins || [];
  const admin = db.admins.find(a => a.username.toLowerCase() === target);
  if (!admin) {
    return res.status(404).json({ error: 'Administrador não encontrado.' });
  }
  admin.passwordHash = hashPassword(newPassword);
  if (target === 'admin') {
    db.settings.adminPassword = newPassword;
  }
  saveDb(db);
  res.json({ success: true, message: 'Senha atualizada com sucesso!' });
});

app.post('/api/admin/discord/test', (req, res) => {
  const { webhookUrl } = req.body;
  const targetUrl = webhookUrl || db.settings.discordWebhookUrl;
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).json({ error: 'URL do Webhook inválida.' });
  }

  sendDiscordWebhook(targetUrl, {
    username: 'Ravok Network • Teste do Sistema',
    avatar_url: 'https://mc-heads.net/avatar/Ravok/128',
    embeds: [{
      title: '⚡ Teste de Webhook Concluído com Sucesso!',
      description: 'O servidor Node.js do **Ravok Network** está conectado e pronto para enviar avisos de vendas, resgates e feedbacks instantaneamente.',
      color: 0x00d4ff,
      fields: [
        { name: 'Status', value: '🟢 Operacional', inline: true },
        { name: 'Hora', value: new Date().toLocaleTimeString('pt-BR'), inline: true }
      ],
      footer: { text: 'Ravok Network • Sistema Webhook' },
      timestamp: new Date().toISOString()
    }]
  });

  res.json({ success: true, message: 'Mensagem de teste enviada ao Discord!' });
});

// ----------------------------------------------------
// PONTE VERCEL <-> MAGNOHOST + REST FALLBACK + ROTAS DO BOT DISCORD
// ----------------------------------------------------
const HEARTBEAT_KEY = 'ravok_bot_heartbeat_v1';
const TASKS_QUEUE_KEY = 'ravok_bot_tasks_v1';
const HEARTBEAT_TTL_MS = 120000;

function isAuthorizedBotBridgeRequest(req) {
  const token = String(req.headers['x-api-token'] || req.query.key || '').trim();
  if (!token) return false;
  const validTokens = [
    db.settings && db.settings.apiToken,
    process.env.PLUGIN_API_TOKEN,
    process.env.API_TOKEN,
    DEFAULT_SETTINGS.apiToken
  ].filter(Boolean).map(t => String(t).trim());
  return validTokens.includes(token);
}

async function getBridgeHeartbeat() {
  const { url, token } = getKvConfig();
  if (url && token) {
    const kvHb = await kvGet(HEARTBEAT_KEY);
    if (kvHb && typeof kvHb === 'object') {
      bridgeMemory.heartbeat = kvHb;
      return kvHb;
    }
  }
  return bridgeMemory.heartbeat || null;
}

async function setBridgeHeartbeat(hb) {
  bridgeMemory.heartbeat = hb;
  const { url, token } = getKvConfig();
  if (url && token) {
    await kvSet(HEARTBEAT_KEY, hb);
  }
}

async function getBridgeTasksQueue() {
  const now = Date.now();
  const { url, token } = getKvConfig();
  let list = bridgeMemory.tasks;
  if (url && token) {
    const kvList = await kvGet(TASKS_QUEUE_KEY);
    if (Array.isArray(kvList)) list = kvList;
  }
  const fresh = (Array.isArray(list) ? list : []).filter(t => t && t.id && t.status === 'pending' && (now - Number(t.createdAt || 0)) < 60000);
  bridgeMemory.tasks = fresh;
  return fresh;
}

async function enqueueBridgeTask(action, payload = {}) {
  const task = {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    action,
    payload,
    status: 'pending',
    createdAt: Date.now()
  };
  const queue = await getBridgeTasksQueue();
  queue.push(task);
  bridgeMemory.tasks = queue.slice(-25);
  bridgeMemory.taskResults[task.id] = task;

  const { url, token } = getKvConfig();
  if (url && token) {
    await Promise.all([
      kvSet(TASKS_QUEUE_KEY, bridgeMemory.tasks),
      kvSet(`ravok_bot_task_${task.id}`, task)
    ]);
  }
  return task;
}

async function getBridgeTaskResult(taskId) {
  const { url, token } = getKvConfig();
  if (url && token) {
    const kvTask = await kvGet(`ravok_bot_task_${taskId}`);
    if (kvTask && typeof kvTask === 'object') {
      bridgeMemory.taskResults[taskId] = kvTask;
      return kvTask;
    }
  }
  return bridgeMemory.taskResults[taskId] || null;
}

async function completeBridgeTask(taskId, { success, result, error }) {
  const existing = (await getBridgeTaskResult(taskId)) || { id: taskId, createdAt: Date.now() };
  const updated = {
    ...existing,
    id: taskId,
    status: success ? 'done' : 'error',
    result: result || null,
    error: error || null,
    completedAt: Date.now()
  };
  bridgeMemory.taskResults[taskId] = updated;
  const queue = (await getBridgeTasksQueue()).filter(t => t.id !== taskId);
  bridgeMemory.tasks = queue;

  const { url, token } = getKvConfig();
  if (url && token) {
    await Promise.all([
      kvSet(`ravok_bot_task_${taskId}`, updated),
      kvSet(TASKS_QUEUE_KEY, queue)
    ]);
  }
  return updated;
}

async function cancelBridgeTask(taskId) {
  const queue = (await getBridgeTasksQueue()).filter(t => t.id !== taskId);
  bridgeMemory.tasks = queue;
  const { url, token } = getKvConfig();
  if (url && token) {
    await kvSet(TASKS_QUEUE_KEY, queue);
  }
}

function isLocalBotOnline() {
  return Boolean(bot && typeof bot.getBotStatus === 'function' && bot.getBotStatus().online);
}

function getEffectiveDiscordToken(hb) {
  const candidates = [
    hb && hb.relayToken,
    db.settings && db.settings.discordBotToken,
    process.env.DISCORD_BOT_TOKEN
  ];
  for (const c of candidates) {
    if (c && String(c).trim()) return String(c).trim();
  }
  return '';
}

async function discordRestRequest(token, method, endpoint, body) {
  if (!token) throw new Error('Token do bot indisponível para comunicação com o Discord.');
  const opts = {
    method,
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json'
    },
    signal: AbortSignal.timeout(5500)
  };
  if (body !== undefined && method !== 'GET' && method !== 'DELETE') {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`https://discord.com/api/v10${endpoint}`, opts);
  const text = await res.text().catch(() => '');
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch (e) {}
  if (!res.ok) {
    const errMsg = (parsed && parsed.message) ? `${parsed.message} (HTTP ${res.status})` : `Discord HTTP ${res.status}`;
    throw new Error(errMsg);
  }
  return parsed;
}

function resolvePublicWelcomeBgUrl(settings) {
  const raw = String((settings && settings.welcomeBgUrl) || '').trim();
  if (!raw || raw.startsWith('data:')) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = String((settings && settings.apiUrl) || 'https://ravok-site.vercel.app').replace(/\/$/, '');
  const cleanRel = raw.replace(/^\/+/, '');
  if (cleanRel === 'banner-server.png') return `${base}/ravok_bg.png`;
  return `${base}/${cleanRel}`;
}

function getVerifiedChannelId(fieldKey, fallbackKey = null) {
  backfillBotChannelDefaults(db.settings = db.settings || {});
  const val = db.settings[fieldKey] || VERIFIED_DISCORD_DEFAULTS[fieldKey] || (fallbackKey ? db.settings[fallbackKey] : '');
  return String(val || '').trim();
}

async function fetchChannelInfo(token, channelId) {
  try {
    return await discordRestRequest(token, 'GET', `/channels/${channelId}`);
  } catch (e) {
    return { id: channelId, name: channelId };
  }
}

async function sendSaleRest(token, orderData) {
  const channelId = getVerifiedChannelId('discordBotChannelVendas');
  const ch = await fetchChannelInfo(token, channelId);
  const nick = orderData?.nick || 'Jogador';
  const total = Number(orderData?.total || 0).toFixed(2).replace('.', ',');
  const itemsText = Array.isArray(orderData?.items) && orderData.items.length
    ? orderData.items.map(i => `• **${i.name || 'Item'}**`).join('\n')
    : '• **VIP Lord (30 Dias)**\n• **Chave Mística (x3)**';
  await discordRestRequest(token, 'POST', `/channels/${channelId}/messages`, {
    embeds: [{
      title: `💎 Nova Compra Aprovada para ${nick}!`,
      description: orderData?.isTest
        ? 'Anúncio de compra de teste disparado diretamente pelo Painel Administrativo!'
        : `O pedido **#${orderData?.id || 'RAVOK'}** foi aprovado e entregue via \`/resgatar\`!`,
      color: 0x00FFCC,
      thumbnail: { url: `https://mc-heads.net/avatar/${encodeURIComponent(nick)}/128` },
      fields: [
        { name: 'Jogador', value: nick, inline: true },
        { name: 'Valor Pago', value: `R$ ${total}`, inline: true },
        { name: 'Itens Adquiridos', value: itemsText, inline: false }
      ],
      footer: { text: 'Ravok Network • Loja Oficial' },
      timestamp: new Date().toISOString()
    }]
  });
  return { success: true, channelName: ch.name || 'vendas' };
}

async function sendFeedbackRest(token, fbData) {
  const channelId = getVerifiedChannelId('discordBotChannelFeedbacks');
  const ch = await fetchChannelInfo(token, channelId);
  const nick = fbData?.nick || 'Avaliador';
  const stars = Math.min(5, Math.max(1, Number(fbData?.stars || 5)));
  const comment = fbData?.comment || 'Servidor sensacional! Economia equilibrada, staff atenciosa e entrega instantânea!';
  await discordRestRequest(token, 'POST', `/channels/${channelId}/messages`, {
    embeds: [{
      title: `⭐ Nova Avaliação Recebida!`,
      description: `"${comment}"`,
      color: 0xFFB703,
      thumbnail: { url: `https://mc-heads.net/avatar/${encodeURIComponent(nick)}/128` },
      fields: [
        { name: 'Jogador', value: nick, inline: true },
        { name: 'Classificação', value: '★'.repeat(stars) + '☆'.repeat(5 - stars), inline: true }
      ],
      footer: { text: 'Ravok Network • Avaliações da Comunidade' },
      timestamp: new Date().toISOString()
    }]
  });
  return { success: true, channelName: ch.name || 'feedbacks' };
}

async function sendWelcomeRest(token) {
  const channelId = getVerifiedChannelId('discordBotChannelBoasVindas');
  const ch = await fetchChannelInfo(token, channelId);
  const bgUrl = resolvePublicWelcomeBgUrl(db.settings);
  const siteUrl = String(db.settings?.apiUrl || 'https://ravok-site.vercel.app').replace(/\/$/, '');
  const embed = {
    title: '🍂 Bem-vindo(a) à Ravok Network!',
    description: 'Seja muito bem-vindo ao servidor oficial da **Ravok 3° Temporada**!\nPrepare-se para explorar biomas outonais, eventos épicos e muito mais.',
    color: 0xFFB703,
    fields: [
      { name: 'IP Java & Bedrock', value: `\`${db.settings?.serverIp || 'jogar.ravok.network'}\``, inline: true },
      { name: 'Loja Oficial', value: `[Acessar Site](${siteUrl})`, inline: true }
    ],
    footer: { text: 'Ravok Network • Card de Boas-Vindas' },
    timestamp: new Date().toISOString()
  };
  if (bgUrl) embed.image = { url: bgUrl };
  await discordRestRequest(token, 'POST', `/channels/${channelId}/messages`, {
    content: '✨ Novo aventureiro acabou de pousar na Ravok!',
    embeds: [embed]
  });
  return { success: true, channelName: ch.name || 'boas-vindas' };
}

async function sendAnnouncementRest(token, { channelId, title, message, color, imageUrl }) {
  const targetId = isValidDiscordSnowflake(channelId)
    ? String(channelId).trim()
    : getVerifiedChannelId('discordBotChannelAnuncios', 'discordBotChannelGeral');
  const ch = await fetchChannelInfo(token, targetId);
  const parsedColor = color ? parseInt(String(color).replace('#', ''), 16) || 0xFFB703 : 0xFFB703;
  const embed = {
    title: title || '📢 Comunicado Oficial Ravok Network',
    description: message || '',
    color: parsedColor,
    footer: { text: 'Ravok Network • Equipe Administrativa' },
    timestamp: new Date().toISOString()
  };
  if (imageUrl && /^https?:\/\//i.test(imageUrl)) embed.image = { url: imageUrl };
  await discordRestRequest(token, 'POST', `/channels/${targetId}/messages`, { embeds: [embed] });
  return { success: true, channelName: ch.name || 'anuncios' };
}

async function clearChannelMessagesRest(token, channelId, amount = 50) {
  const cleanId = String(channelId || '').trim();
  if (!isValidDiscordSnowflake(cleanId)) throw new Error('ID do canal inválido.');
  const limit = Math.min(100, Math.max(1, Number(amount) || 50));
  const messages = await discordRestRequest(token, 'GET', `/channels/${cleanId}/messages?limit=${limit}`);
  if (!Array.isArray(messages) || messages.length === 0) {
    return { success: true, deletedCount: 0, message: 'Nenhuma mensagem encontrada para apagar.' };
  }
  const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000) + 60000;
  const recentIds = messages.filter(m => new Date(m.timestamp).getTime() > fourteenDaysAgo).map(m => m.id);
  if (recentIds.length >= 2) {
    await discordRestRequest(token, 'POST', `/channels/${cleanId}/messages/bulk-delete`, { messages: recentIds });
  } else if (recentIds.length === 1) {
    await discordRestRequest(token, 'DELETE', `/channels/${cleanId}/messages/${recentIds[0]}`);
  }
  return { success: true, deletedCount: recentIds.length, message: `${recentIds.length} mensagens removidas com sucesso!` };
}

async function syncStatusChannelsRest(token) {
  const ip = db.settings?.serverIp || 'jogar.ravok.network';
  let online = false;
  let players = 0;
  let maxPlayers = 100;
  let ping = 24;
  try {
    const t0 = Date.now();
    const res = await fetch(`https://api.mcsrvstat.us/2/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(4500) });
    ping = Math.max(8, Date.now() - t0);
    if (res.ok) {
      const json = await res.json();
      online = Boolean(json && json.online);
      players = Number(json?.players?.online || 0);
      maxPlayers = Number(json?.players?.max || 100);
    }
  } catch (e) {}
  const updates = [
    { key: 'discordBotChannelStatusJogadores', name: `👥 Jogadores: ${online ? `${players}/${maxPlayers}` : '0'}` },
    { key: 'discordBotChannelStatusServer', name: online ? '🟢 Status: Online' : '🔴 Status: Offline' },
    { key: 'discordBotChannelStatusPing', name: `📶 Ping: ${online ? `${ping}ms` : '---'}` }
  ];
  for (const item of updates) {
    const chId = getVerifiedChannelId(item.key);
    if (isValidDiscordSnowflake(chId)) {
      await discordRestRequest(token, 'PATCH', `/channels/${chId}`, { name: item.name }).catch(() => {});
    }
  }
  return { online, players, maxPlayers, ping };
}

async function publishMetaPanelRest(token, targetChannelId) {
  const goal = computeGoalStatus();
  const channelId = isValidDiscordSnowflake(targetChannelId) ? String(targetChannelId).trim() : getVerifiedChannelId('discordBotChannelVendas');
  const ch = await fetchChannelInfo(token, channelId);
  const filled = Math.min(10, Math.max(0, Math.round(goal.percent / 10)));
  const bar = '🟩'.repeat(filled) + '⬛'.repeat(10 - filled);
  const siteUrl = String(db.settings?.apiUrl || 'https://ravok-site.vercel.app').replace(/\/$/, '');
  await discordRestRequest(token, 'POST', `/channels/${channelId}/messages`, {
    embeds: [{
      title: '🎯 Meta Mensal da Rede Ravok',
      description: `Acompanhe o progresso para manutenção e upgrades da hospedagem!\n\n**Progresso:** \`${bar}\` **${goal.percent}%**`,
      color: 0xFFB703,
      fields: [
        { name: 'Arrecadado', value: `R$ ${goal.totalArrecadado.toFixed(2).replace('.', ',')}`, inline: true },
        { name: 'Meta', value: `R$ ${goal.targetGoal.toFixed(2).replace('.', ',')}`, inline: true },
        { name: 'Loja Oficial', value: `[Contribuir Agora](${siteUrl})`, inline: true }
      ],
      footer: { text: 'Ravok Network • Meta Atualizada em Tempo Real' },
      timestamp: new Date().toISOString()
    }]
  });
  return { success: true, channelName: ch.name || 'vendas' };
}

async function publishPanelRest(token, type, targetChannelId) {
  if (type === 'meta') return await publishMetaPanelRest(token, targetChannelId);
  const panelSpecs = {
    tickets: {
      channelKey: 'discordBotChannelTickets',
      title: '🎫 Central de Atendimento & Compras',
      description: 'Precisa de suporte da staff ou deseja finalizar uma compra pelo Discord? Selecione uma opção abaixo!',
      color: 0xFFB703,
      buttons: [
        { type: 2, style: 1, label: 'Abrir Atendimento Geral', custom_id: 'sys_ticket_btn', emoji: { name: '🎫' } },
        { type: 2, style: 3, label: 'Finalizar Compra / Pix', custom_id: 'sys_ticket_compra', emoji: { name: '🛒' } }
      ]
    },
    recrutamento: {
      channelKey: 'discordBotChannelRecrutamento',
      title: '📋 Recrutamento da Equipe Ravok',
      description: 'Quer ajudar a construir e moderar a Ravok Network? Clique abaixo e envie sua candidatura!',
      color: 0x3B82F6,
      buttons: [{ type: 2, style: 1, label: 'Fazer Formulário', custom_id: 'sys_recrut_btn', emoji: { name: '📝' } }]
    },
    confissoes: {
      channelKey: 'discordBotChannelConfissoes',
      title: '👻 Correio Secreto & Confissões',
      description: 'Envie uma mensagem 100% anônima no canal da comunidade usando o botão abaixo!',
      color: 0x9333EA,
      buttons: [{ type: 2, style: 2, label: 'Enviar Confissão', custom_id: 'sys_confissao_btn', emoji: { name: '🕵️' } }]
    },
    sugestoes: {
      channelKey: 'discordBotChannelSugestoes',
      title: '💡 Central de Sugestões',
      description: 'Tem alguma ideia para melhorar o servidor ou o site? Compartilhe com a comunidade!',
      color: 0x10B981,
      buttons: [{ type: 2, style: 3, label: 'Nova Sugestão', custom_id: 'sys_sugestao_btn', emoji: { name: '💡' } }]
    },
    vincular: {
      channelKey: 'discordBotChannelGeral',
      title: '🔗 Vincular Conta Minecraft',
      description: 'Vincule sua conta do Minecraft ao Discord para receber cargos automáticos e recompensas!',
      color: 0x06B6D4,
      buttons: [{ type: 2, style: 1, label: 'Vincular Conta', custom_id: 'sys_vinc_btn', emoji: { name: '🔗' } }]
    },
    feedback: {
      channelKey: 'discordBotChannelFeedbacks',
      title: '⭐ Avalie o Servidor Ravok',
      description: 'Conte sua experiência jogando na Ravok Network ou comprando em nossa loja!',
      color: 0xF59E0B,
      buttons: [{ type: 2, style: 1, label: 'Dar Feedback', custom_id: 'sys_feedback_btn', emoji: { name: '⭐' } }]
    },
    video: {
      channelKey: 'discordBotChannelVideos',
      title: '🎬 Criadores de Conteúdo (Vídeos & Lives)',
      description: 'Gravou um vídeo ou abriu live jogando na Ravok? Divulgue agora mesmo!',
      color: 0xEF4444,
      buttons: [
        { type: 2, style: 4, label: 'Divulgar Vídeo', custom_id: 'sys_video_btn', emoji: { name: '🎬' } },
        { type: 2, style: 1, label: 'Anunciar Live', custom_id: 'sys_live_btn', emoji: { name: '🔴' } }
      ]
    },
    regras: {
      channelKey: 'discordBotChannelRegras',
      title: '📜 Regras Oficiais da Ravok Network',
      description: '1. Respeite todos os jogadores e membros da equipe.\n2. Proibido uso de hacks, exploits ou trapaças.\n3. Proibido spam, flood ou divulgação sem permissão.\n4. Bom senso em todos os canais de voz e texto.',
      color: 0xFFB703,
      buttons: []
    },
    loja: {
      channelKey: 'discordBotChannelVendas',
      title: '🛒 Loja Oficial Ravok Network',
      description: 'Adquira VIPs, Chaves, Comandos e Cosméticos no site oficial ou finalize via ticket abaixo!',
      color: 0x00FFCC,
      buttons: [{ type: 2, style: 3, label: 'Finalizar Compra / Pix', custom_id: 'sys_ticket_compra', emoji: { name: '🛒' } }]
    }
  };
  const spec = panelSpecs[type];
  if (!spec) throw new Error(`Tipo de painel inválido: ${type}`);
  const channelId = isValidDiscordSnowflake(targetChannelId) ? String(targetChannelId).trim() : getVerifiedChannelId(spec.channelKey);
  const ch = await fetchChannelInfo(token, channelId);
  const body = {
    embeds: [{
      title: spec.title,
      description: spec.description,
      color: spec.color,
      footer: { text: 'Ravok Network • Painel Interativo' },
      timestamp: new Date().toISOString()
    }]
  };
  if (spec.buttons.length) {
    body.components = [{ type: 1, components: spec.buttons }];
  }
  await discordRestRequest(token, 'POST', `/channels/${channelId}/messages`, body);
  return { success: true, channelName: ch.name || type };
}

async function dispatchBotAction(action, payload, localFn, restFallbackFn) {
  if (isLocalBotOnline() && typeof localFn === 'function') {
    return await localFn();
  }

  const hb = await getBridgeHeartbeat();
  const ageMs = hb && hb.receivedAt ? (Date.now() - Number(hb.receivedAt)) : Infinity;
  const hbOnline = Boolean(hb && hb.status && hb.status.online && ageMs < HEARTBEAT_TTL_MS);
  const token = getEffectiveDiscordToken(hb);

  if (!hbOnline && !token) {
    throw new Error('O bot na MagnoHost ainda não sincronizou com o site. Reinicie o bot no painel da MagnoHost uma vez e aguarde 6 segundos.');
  }

  if (hbOnline) {
    const task = await enqueueBridgeTask(action, payload);
    const deadline = Date.now() + 7200;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 350));
      const updated = await getBridgeTaskResult(task.id);
      if (updated && updated.status === 'done') {
        return updated.result || { success: true };
      }
      if (updated && updated.status === 'error') {
        throw new Error(updated.error || `Erro ao executar ${action} no bot.`);
      }
    }
    const finalCheck = await getBridgeTaskResult(task.id);
    if (finalCheck && finalCheck.status === 'done') {
      return finalCheck.result || { success: true };
    }
    await cancelBridgeTask(task.id);
    if (typeof restFallbackFn === 'function' && token) {
      return await restFallbackFn(token);
    }
    throw new Error('O bot na MagnoHost demorou para responder (>7s). Verifique o console da MagnoHost e tente novamente.');
  }

  if (typeof restFallbackFn === 'function' && token) {
    return await restFallbackFn(token);
  }
  throw new Error('O bot precisa estar online na MagnoHost para executar esta ação.');
}

// Rotas internas da Ponte MagnoHost <-> Vercel
app.post('/api/bot/heartbeat', async (req, res) => {
  if (!isAuthorizedBotBridgeRequest(req)) {
    return res.status(401).json({ error: 'Token da API inválido.' });
  }
  const { status, relayToken, resolvedSettings, dbSync } = req.body || {};
  const existingHb = await getBridgeHeartbeat();
  const cleanRelayToken = (relayToken && String(relayToken).trim()) || (existingHb && existingHb.relayToken) || '';
  const hb = {
    status: (status && typeof status === 'object') ? status : { online: true },
    relayToken: cleanRelayToken,
    resolvedSettings: (resolvedSettings && typeof resolvedSettings === 'object') ? resolvedSettings : {},
    receivedAt: Date.now()
  };
  await setBridgeHeartbeat(hb);

  await readLatestDbFromCloudKv(false);
  let changed = backfillBotChannelDefaults(db.settings = db.settings || {});
  if (hb.resolvedSettings && typeof hb.resolvedSettings === 'object') {
    for (const [k, v] of Object.entries(hb.resolvedSettings)) {
      if (k in VERIFIED_DISCORD_DEFAULTS && isValidDiscordSnowflake(v) && !isValidDiscordSnowflake(db.settings[k])) {
        db.settings[k] = String(v).trim();
        changed = true;
      }
    }
  }
  if (dbSync && typeof dbSync === 'object') {
    if (Array.isArray(dbSync.deletedOrderIds) && dbSync.deletedOrderIds.length) {
      const mergedDel = Array.from(new Set([...(db.deletedOrderIds || []).map(String), ...dbSync.deletedOrderIds.map(String)]));
      if (mergedDel.length !== (db.deletedOrderIds || []).length) {
        db.deletedOrderIds = mergedDel;
        changed = true;
      }
    }
    if (Array.isArray(dbSync.orders) && dbSync.orders.length) {
      const prevJson = JSON.stringify(db.orders || []);
      db.orders = mergeOrdersSafely(db.orders, dbSync.orders, db.deletedOrderIds);
      if (JSON.stringify(db.orders) !== prevJson) changed = true;
    }
    if (Array.isArray(dbSync.pendingDeliveries) && dbSync.pendingDeliveries.length) {
      const prevDelivJson = JSON.stringify(db.pendingDeliveries || []);
      db.pendingDeliveries = mergeDeliveriesSafely(db.pendingDeliveries, dbSync.pendingDeliveries)
        .filter(d => !d.orderId || !(db.deletedOrderIds || []).map(String).includes(String(d.orderId)));
      if (JSON.stringify(db.pendingDeliveries) !== prevDelivJson) changed = true;
    }
  }
  if (changed) {
    await saveDbNow(db, true);
  }

  const tasks = await getBridgeTasksQueue();
  res.json({
    success: true,
    settings: buildSafeBridgeSettings(db.settings),
    dbSync: {
      orders: (db.orders || []).slice(0, 100),
      pendingDeliveries: (db.pendingDeliveries || []).slice(0, 150),
      deletedOrderIds: (db.deletedOrderIds || []).slice(0, 100)
    },
    tasks
  });
});

app.post('/api/bot/tasks/:id/complete', async (req, res) => {
  if (!isAuthorizedBotBridgeRequest(req)) {
    return res.status(401).json({ error: 'Token da API inválido.' });
  }
  const { id } = req.params;
  const { success, result, error } = req.body || {};
  await completeBridgeTask(id, { success: Boolean(success), result, error });
  res.json({ success: true });
});

app.get('/api/admin/bot/status', async (req, res) => {
  if (isLocalBotOnline()) {
    return res.json(bot.getBotStatus());
  }
  const hb = await getBridgeHeartbeat();
  const ageMs = hb && hb.receivedAt ? (Date.now() - Number(hb.receivedAt)) : Infinity;
  if (hb && hb.status && hb.status.online && ageMs < HEARTBEAT_TTL_MS) {
    return res.json({
      ...hb.status,
      online: true,
      remote: true,
      source: 'magnohost',
      heartbeatAgeMs: ageMs,
      lastHeartbeatAt: hb.receivedAt
    });
  }
  if (bot && typeof bot.getBotStatus === 'function' && !process.env.VERCEL) {
    return res.json(bot.getBotStatus());
  }
  return res.json({
    ...(hb && hb.status ? hb.status : {}),
    online: false,
    starting: false,
    remote: true,
    botTag: (hb && hb.status && hb.status.botTag) || 'Silvie#1279',
    logs: (hb && hb.status && Array.isArray(hb.status.logs) && hb.status.logs.length)
      ? hb.status.logs
      : [{ time: new Date().toLocaleTimeString('pt-BR'), level: 'warn', msg: 'Aguardando heartbeat do bot na MagnoHost (enviado a cada 6s)...' }],
    message: 'Aguardando conexão em tempo real do bot na MagnoHost'
  });
});

app.post('/api/admin/bot/start', async (req, res) => {
  const { token, channelVendas, channelFeedbacks } = req.body || {};
  if (isValidDiscordSnowflake(channelVendas)) db.settings.discordBotChannelVendas = String(channelVendas).trim();
  if (isValidDiscordSnowflake(channelFeedbacks)) db.settings.discordBotChannelFeedbacks = String(channelFeedbacks).trim();
  if (token) db.settings.discordBotToken = token;
  await saveDbNow(db, true);

  if (!process.env.VERCEL && bot && typeof bot.startBot === 'function') {
    const tokenToUse = token || db.settings.discordBotToken;
    if (!tokenToUse) return res.status(400).json({ error: 'Insira o Token do Bot do Discord antes de iniciar.' });
    const result = await bot.startBot(tokenToUse);
    if (result.success) {
      return res.json({ success: true, message: `Bot iniciado com sucesso como ${result.user || 'Online'}!` });
    }
    return res.status(400).json({ error: result.error || 'Falha ao autenticar o bot no Discord. Verifique o token.' });
  }

  const hb = await getBridgeHeartbeat();
  if (hb && hb.status && hb.status.online && (Date.now() - Number(hb.receivedAt || 0)) < HEARTBEAT_TTL_MS) {
    return res.json({ success: true, message: `Bot ${hb.status.botTag || 'Silvie#1279'} já está online e sincronizado via MagnoHost!` });
  }
  return res.status(400).json({ error: 'O bot roda na MagnoHost. Ligue ou reinicie o processo no painel da MagnoHost.' });
});

app.post('/api/admin/bot/stop', async (req, res) => {
  if (!process.env.VERCEL && bot && typeof bot.stopBot === 'function') {
    const result = bot.stopBot();
    return res.json(result);
  }
  res.status(400).json({ error: 'O bot roda 24/7 na MagnoHost. Para desligar o processo, use o console da MagnoHost.' });
});

app.post('/api/admin/bot/restart', async (req, res) => {
  const { token, channelVendas, channelFeedbacks } = req.body || {};
  if (isValidDiscordSnowflake(channelVendas)) db.settings.discordBotChannelVendas = String(channelVendas).trim();
  if (isValidDiscordSnowflake(channelFeedbacks)) db.settings.discordBotChannelFeedbacks = String(channelFeedbacks).trim();
  if (token) db.settings.discordBotToken = token;
  await saveDbNow(db, true);

  if (!process.env.VERCEL && bot && typeof bot.restartBot === 'function') {
    const result = await bot.restartBot(token || db.settings.discordBotToken);
    if (result.success) {
      return res.json({ success: true, message: `Bot reiniciado com sucesso!` });
    }
    return res.status(400).json({ error: result.error || 'Falha ao reiniciar o bot.' });
  }

  const hb = await getBridgeHeartbeat();
  if (hb && hb.status && hb.status.online && (Date.now() - Number(hb.receivedAt || 0)) < HEARTBEAT_TTL_MS) {
    return res.json({ success: true, message: 'Configurações ressincronizadas com o bot online na MagnoHost!' });
  }
  return res.status(400).json({ error: 'Para reiniciar o processo Node.js do bot, clique em Reiniciar no painel da MagnoHost.' });
});

app.post('/api/admin/bot/test-sale', async (req, res) => {
  try {
    await dispatchBotAction(
      'test-sale',
      {},
      () => bot.testSaleNotification(),
      (token) => sendSaleRest(token, { nick: 'Guiilew', total: 49.90, isTest: true })
    );
    return res.json({ success: true, message: 'Anúncio de compra de teste disparado no Discord!' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/bot/test-feedback', async (req, res) => {
  try {
    await dispatchBotAction(
      'test-feedback',
      {},
      () => bot.testFeedbackNotification(),
      (token) => sendFeedbackRest(token, { nick: 'Avaliador_Ravok', stars: 5 })
    );
    return res.json({ success: true, message: 'Anúncio de avaliação de teste disparado no Discord!' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/bot/test-welcome', async (req, res) => {
  try {
    const result = await dispatchBotAction(
      'test-welcome',
      {},
      () => bot.testWelcomeNotification(),
      (token) => sendWelcomeRest(token)
    );
    return res.json({
      success: true,
      message: `Card de boas-vindas enviado com sucesso para #${(result && result.channelName) || 'boas-vindas'} no Discord!`
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/bot/welcome-bg', async (req, res) => {
  try {
    await readLatestDbFromCloudKv(true);
    const { url, base64 } = req.body || {};
    db.settings = db.settings || {};

    if (base64) {
      const cleanB64 = String(base64).trim();
      const matches = cleanB64.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
      const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(cleanB64, 'base64');
      let savedLocal = false;
      if (!process.env.VERCEL) {
        try {
          const publicPath = path.join(__dirname, 'public', 'welcome-bg.png');
          fs.writeFileSync(publicPath, buffer);
          db.settings.welcomeBgUrl = 'welcome-bg.png';
          savedLocal = true;
        } catch (fsErr) {}
      }
      if (!savedLocal) {
        db.settings.welcomeBgUrl = matches ? cleanB64 : `data:image/png;base64,${cleanB64}`;
      }
    } else if (url !== undefined) {
      db.settings.welcomeBgUrl = String(url || '').trim();
    }

    await saveDbNow(db, true);
    return res.json({ success: true, welcomeBgUrl: db.settings.welcomeBgUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/bot/announcement', async (req, res) => {
  const { channelId, title, message, color, imageUrl } = req.body || {};
  if (!message && !title) {
    return res.status(400).json({ error: 'Informe um título ou mensagem para o anúncio.' });
  }

  try {
    const result = await dispatchBotAction(
      'announcement',
      { channelId, title, message, color, imageUrl },
      () => bot.sendCustomAnnouncement({ channelId, title, message, color, imageUrl }),
      (token) => sendAnnouncementRest(token, { channelId, title, message, color, imageUrl })
    );
    return res.json({ success: true, message: `Anúncio publicado com sucesso no canal #${(result && result.channelName) || 'anuncios'}!` });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/bot/sync-commands', async (req, res) => {
  try {
    const result = await dispatchBotAction(
      'sync-commands',
      {},
      () => bot.syncCommands(),
      async (token) => {
        const clientId = db.settings?.discordBotClientId || VERIFIED_DISCORD_DEFAULTS.discordBotClientId;
        const cmds = await discordRestRequest(token, 'GET', `/applications/${clientId}/commands`);
        return { count: Array.isArray(cmds) ? cmds.length : 0 };
      }
    );
    return res.json({ success: true, message: `Comandos Slash sincronizados com o Discord (${(result && result.count) || 0} comandos)!` });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/bot/clear-logs', (req, res) => {
  if (bot && typeof bot.clearLogs === 'function') {
    bot.clearLogs();
  }
  if (bridgeMemory.heartbeat && bridgeMemory.heartbeat.status) {
    bridgeMemory.heartbeat.status.logs = [];
  }
  res.json({ success: true });
});

// Limpar mensagens de um canal do Discord via Painel Web
app.post('/api/admin/bot/clear-channel-messages', async (req, res) => {
  const { channelId, amount } = req.body || {};
  if (!channelId) {
    return res.status(400).json({ error: 'Informe o ID do canal que deseja limpar.' });
  }
  try {
    const result = await dispatchBotAction(
      'clear-channel-messages',
      { channelId, amount },
      () => bot.clearChannelMessages(channelId, amount),
      (token) => clearChannelMessagesRest(token, channelId, amount)
    );
    return res.json(result || { success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Publicar Painéis Interativos no Discord (Tickets, Confissões, Sugestões, etc)
app.post('/api/admin/bot/publish-panel', async (req, res) => {
  const { type, channelId } = req.body || {};
  if (!type) return res.status(400).json({ error: 'Informe o tipo do painel para publicar.' });

  try {
    const result = await dispatchBotAction(
      'publish-panel',
      { type, channelId },
      () => bot.publishPanel(type, channelId),
      (token) => publishPanelRest(token, type, channelId)
    );
    return res.json({
      success: true,
      message: `Painel "${type}" publicado com sucesso no Discord!`,
      channelName: (result && result.channelName) || type
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Consultar Canais das Funções do Bot
app.get('/api/admin/bot/channels', async (req, res) => {
  await readLatestDbFromCloudKv(false);
  backfillBotChannelDefaults(db.settings = db.settings || {});
  res.json(buildSafeBridgeSettings(db.settings));
});

// Salvar Configuração de Canais e Categorias do Bot
app.post('/api/admin/bot/channels', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  const data = req.body || {};
  const s = db.settings = db.settings || {};

  const snowflakeFields = [
    'discordBotChannelBoasVindas',
    'discordBotCategoryTickets',
    'discordBotCategoryRecrutamento',
    'discordBotChannelConfissoes',
    'discordBotChannelSugestoes',
    'discordBotChannelFeedbacks',
    'discordBotChannelVendas',
    'discordBotChannelContagem',
    'discordBotChannelVideos',
    'discordBotChannelLives',
    'discordBotChannelRegras',
    'discordBotChannelRelatorios',
    'discordBotChannelPunicoes',
    'discordBotChannelMusica',
    'discordBotChannelMemes',
    'discordBotChannelGeral',
    'discordBotChannelTickets',
    'discordBotChannelAnuncios',
    'discordBotRoleVinculado',
    'discordBotRoleAcesso',
    'discordBotChannelStatusJogadores',
    'discordBotChannelStatusServer',
    'discordBotChannelStatusPing',
    'discordBotChannelMetaVendas',
    'aiChannelId'
  ];

  for (const field of snowflakeFields) {
    if (data[field] !== undefined) {
      const cleanVal = String(data[field] || '').trim();
      if (isValidDiscordSnowflake(cleanVal)) {
        s[field] = cleanVal;
      } else if (!isValidDiscordSnowflake(s[field]) && VERIFIED_DISCORD_DEFAULTS[field]) {
        s[field] = VERIFIED_DISCORD_DEFAULTS[field];
      }
    }
  }

  if (data.serverIp !== undefined) {
    s.serverIp = String(data.serverIp || '').trim() || 'jogar.ravok.network';
  }
  if (data.welcomeBgUrl !== undefined) {
    s.welcomeBgUrl = String(data.welcomeBgUrl || '').trim();
  }
  if (data.countingCurrentNumber !== undefined) {
    s.countingCurrentNumber = Number(data.countingCurrentNumber) || 0;
  }
  if (data.metaVendasValor !== undefined) {
    s.metaVendasValor = Number(data.metaVendasValor) || 0;
  }
  if (data.metaVendasBase !== undefined) {
    s.metaVendasBase = Number(data.metaVendasBase) || 0;
  }

  backfillBotChannelDefaults(s);
  await saveDbNow(db, true);
  res.json({ success: true, message: 'Canais e categorias das funções do bot salvos com sucesso!' });
});

// Forçar Atualização dos Canais de Status do Servidor no Discord
app.post('/api/admin/bot/sync-status-channels', async (req, res) => {
  try {
    const result = await dispatchBotAction(
      'sync-status-channels',
      {},
      () => bot.syncServerStatusChannels(),
      (token) => syncStatusChannelsRest(token)
    );
    return res.json({ success: true, message: 'Canais de status sincronizados com sucesso!', result });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Publicar ou Atualizar Painel Oficial da Meta no Canal de Vendas
app.post('/api/admin/bot/publish-meta-panel', async (req, res) => {
  const { channelId } = req.body || {};
  try {
    const result = await dispatchBotAction(
      'publish-meta-panel',
      { channelId },
      () => bot.publishMetaPanel(channelId),
      (token) => publishMetaPanelRest(token, channelId)
    );
    return res.json({ success: true, message: 'Painel da meta publicado/atualizado com sucesso!', result });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Obter Status Calculado da Meta de Vendas
app.get('/api/admin/bot/meta-status', (req, res) => {
  res.json({ success: true, ...computeGoalStatus(), updatedAt: db.updatedAt || 0 });
});

// ROTAS DE CONFIGURAÇÃO DE IA (SILVIE AI)
app.get('/api/admin/bot/ai', (req, res) => {
  res.json({
    enabled: db.settings.aiEnabled !== false,
    apiKey: db.settings.aiApiKey || '',
    model: db.settings.aiModel || 'gemini-1.5-flash',
    channelId: db.settings.aiChannelId || VERIFIED_DISCORD_DEFAULTS.aiChannelId,
    respondMentions: db.settings.aiRespondMentions !== false,
    prompt: db.settings.aiPrompt || ''
  });
});

app.post('/api/admin/bot/ai', async (req, res) => {
  const { enabled, apiKey, model, channelId, respondMentions, prompt } = req.body || {};
  if (enabled !== undefined) db.settings.aiEnabled = Boolean(enabled);
  if (apiKey !== undefined) db.settings.aiApiKey = String(apiKey || '').trim();
  if (model) db.settings.aiModel = String(model).trim();
  if (channelId !== undefined) {
    const cleanCh = String(channelId || '').trim();
    db.settings.aiChannelId = isValidDiscordSnowflake(cleanCh) ? cleanCh : (db.settings.aiChannelId || VERIFIED_DISCORD_DEFAULTS.aiChannelId);
  }
  if (respondMentions !== undefined) db.settings.aiRespondMentions = Boolean(respondMentions);
  if (prompt !== undefined) db.settings.aiPrompt = prompt;

  await saveDbNow(db, true);
  res.json({ success: true, message: 'Configurações de IA do Kayzel salvas com sucesso!' });
});

app.post('/api/admin/bot/ai/test', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'Digite uma mensagem ou pergunta de teste.' });
  }

  if (bot && typeof bot.askKayzelAI === 'function' && isLocalBotOnline()) {
    try {
      const fn = bot.askKayzelAI || bot.askSilvieAI;
      const answer = await fn(prompt, 'Administrador');
      return res.json({ success: true, answer });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  const key = (db.settings && db.settings.aiApiKey) || process.env.GEMINI_API_KEY || '';
  if (key) {
    try {
      const model = (db.settings && db.settings.aiModel) || 'gemini-1.5-flash';
      const systemPrompt = (db.settings && db.settings.aiPrompt) || 'Você é a Kayzel, assistente simpática da Ravok Network.';
      const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nPergunta de Administrador: ${prompt}` }] }]
        }),
        signal: AbortSignal.timeout(7000)
      });
      const gData = await gRes.json();
      const text = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return res.json({ success: true, answer: text });
    } catch (e) {}
  }
  return res.status(400).json({ error: 'Configure a chave Gemini AI nas configurações ou conecte o bot na MagnoHost.' });
});

// ----------------------------------------------------
// ESPAÇO PRÓPRIO DE VOTOS (RAVOK VOTE ARENA)
// ----------------------------------------------------
app.get('/api/vote/arena', (req, res) => {
  const arena = db.voteArena = db.voteArena || {};
  const poll = arena.poll || { options: [] };
  const totalPollVotes = (poll.options || []).reduce((sum, o) => sum + (Number(o.votes) || 0), 0);

  const pollSanitized = {
    id: poll.id,
    question: poll.question,
    totalVotes: totalPollVotes,
    options: (poll.options || []).map(o => ({
      id: o.id,
      text: o.text,
      votes: o.votes || 0,
      percent: totalPollVotes > 0 ? Math.round(((Number(o.votes) || 0) / totalPollVotes) * 100) : 0
    }))
  };

  // Sanitizar quiz (não enviar flag correct para o cliente)
  const quizSanitized = (arena.quiz || []).map(q => ({
    id: q.id,
    question: q.question,
    options: q.options.map(o => ({ id: o.id, text: o.text }))
  }));

  // Sanitizar pegadinhas
  const pranksSanitized = (arena.pranks || []).map(p => ({
    id: p.id,
    title: p.title,
    riddle: p.riddle,
    options: p.options.map(o => ({ id: o.id, text: o.text }))
  }));

  // Sanitizar piadas
  const jokesSanitized = (arena.jokes || []).map(j => ({
    id: j.id,
    setup: j.setup,
    options: j.options.map(o => ({ id: o.id, text: o.text }))
  }));

  const nick = (req.query.nick || '').trim().toLowerCase();
  const completedChallenges = [];
  let dailyQuestProgress = 0;
  let dailyQuestClaimed = false;

  const now = Date.now();
  const twelveHours = 12 * 60 * 60 * 1000;
  const twentyFourHours = 24 * 60 * 60 * 1000;

  if (nick && Array.isArray(arena.votesHistory)) {
    arena.votesHistory.forEach(v => {
      if (v.nick.toLowerCase() === nick && (now - new Date(v.timestamp).getTime()) < twelveHours) {
        if (!completedChallenges.includes(v.challengeType)) {
          completedChallenges.push(v.challengeType);
        }
      }
    });

    dailyQuestProgress = completedChallenges.length;
    arena.dailyQuestClaims = arena.dailyQuestClaims || [];
    dailyQuestClaimed = arena.dailyQuestClaims.some(c => 
      c.nick.toLowerCase() === nick && (now - new Date(c.timestamp).getTime()) < twentyFourHours
    );
  }

  const dailyQuest = arena.dailyQuest || {
    enabled: true,
    id: 'quest-today',
    title: 'Jornada do Conhecimento',
    description: 'Complete pelo menos 2 desafios na Arena de Votos hoje para provar seu valor à comunidade!',
    targetCount: 2,
    rewardTitle: '2x Chaves de Voto'
  };

  res.json({
    quiz: quizSanitized,
    poll: pollSanitized,
    pranks: pranksSanitized,
    jokes: jokesSanitized,
    completedChallenges,
    dailyQuest: {
      enabled: dailyQuest.enabled !== false,
      id: dailyQuest.id || 'quest-today',
      title: dailyQuest.title || 'Jornada do Conhecimento',
      description: dailyQuest.description || 'Complete os desafios para garantir bônus!',
      targetCount: Number(dailyQuest.targetCount) || 2,
      rewardTitle: dailyQuest.rewardTitle || '2x Chaves de Voto',
      silvieTip: dailyQuest.silvieTip || 'Dica do Kayzel: Comece pelo Quiz de Minecraft para aquecer seus neurônios! 🔮',
      progress: dailyQuestProgress,
      claimed: dailyQuestClaimed
    }
  });
});

app.post('/api/vote/challenge', (req, res) => {
  const { nick, challengeType, itemId, answerId, pollOptionId } = req.body || {};
  if (!nick || !/^[A-Za-z0-9_]{3,16}$/.test(nick.trim())) {
    return res.status(400).json({ error: 'Informe um nick válido de Minecraft (3 a 16 caracteres).' });
  }

  const arena = db.voteArena = db.voteArena || {};
  const cleanNick = nick.trim();
  const now = Date.now();
  const twelveHours = 12 * 60 * 60 * 1000;

  arena.votesHistory = arena.votesHistory || [];
  const recent = arena.votesHistory.find(v => 
    v.nick.toLowerCase() === cleanNick.toLowerCase() &&
    v.challengeType === challengeType &&
    (now - new Date(v.timestamp).getTime()) < twelveHours
  );

  if (recent) {
    return res.status(400).json({ error: `Você já completou este desafio nas últimas 12 horas! Volte mais tarde para votar novamente.` });
  }

  // 1. Desafio Quiz
  if (challengeType === 'quiz') {
    const question = (arena.quiz || []).find(q => q.id === itemId) || (arena.quiz || [])[0];
    if (!question) return res.status(400).json({ error: 'Pergunta não encontrada.' });
    const selectedOpt = question.options.find(o => o.id === answerId);
    if (!selectedOpt || !selectedOpt.correct) {
      return res.status(400).json({ error: 'Ops! Resposta incorreta. Pense com calma e tente outra alternativa!' });
    }
  }
  // 2. Desafio Enquete
  else if (challengeType === 'poll') {
    const poll = arena.poll = arena.poll || { options: [] };
    const opt = (poll.options || []).find(o => o.id === (pollOptionId || answerId));
    if (!opt) return res.status(400).json({ error: 'Selecione uma opção válida para votar.' });
    opt.votes = (Number(opt.votes) || 0) + 1;
  }
  // 3. Desafio Pegadinha
  else if (challengeType === 'prank') {
    const prank = (arena.pranks || []).find(p => p.id === itemId) || (arena.pranks || [])[0];
    if (!prank) return res.status(400).json({ error: 'Pegadinha não encontrada.' });
    const selectedOpt = prank.options.find(o => o.id === answerId);
    if (!selectedOpt || !selectedOpt.correct) {
      return res.status(400).json({ 
        error: selectedOpt ? selectedOpt.troll : 'Você caiu na pegadinha! Tente de novo! 😂',
        isTroll: true 
      });
    }
  }
  // 4. Desafio Completar Piada
  else if (challengeType === 'joke') {
    const joke = (arena.jokes || []).find(j => j.id === itemId) || (arena.jokes || [])[0];
    if (!joke) return res.status(400).json({ error: 'Piada não encontrada.' });
    const selectedOpt = joke.options.find(o => o.id === answerId);
    if (!selectedOpt || !selectedOpt.correct) {
      return res.status(400).json({ error: 'Essa não é a resposta da piada! Escolha outro final engraçado!' });
    }
  }
  else {
    return res.status(400).json({ error: 'Tipo de desafio inválido.' });
  }

  // SUCESSO: Registrar voto e entregar 1x Chave de Voto (ZERO COINS!)
  db.pendingDeliveries = db.pendingDeliveries || [];
  const deliveryItem = {
    id: generateSafeId(),
    orderId: 'VOTO-' + Math.floor(1000 + Math.random() * 9000),
    nick: cleanNick,
    product_name: '1x Chave de Voto (Votação no Site)',
    category: 'Votos',
    command: `crate key give ${cleanNick} vote 1`,
    gui_icon: 'TRIPWIRE_HOOK',
    status: 'pending',
    created_at: new Date().toISOString()
  };
  db.pendingDeliveries.push(deliveryItem);

  // Incrementar votos no perfil do jogador
  db.playerSync = db.playerSync || {};
  db.playerSync[cleanNick.toLowerCase()] = db.playerSync[cleanNick.toLowerCase()] || {
    nick: cleanNick,
    coins: 0,
    kills: 0,
    votes: 0,
    time_played: '0m',
    money: '0'
  };
  db.playerSync[cleanNick.toLowerCase()].votes = (Number(db.playerSync[cleanNick.toLowerCase()].votes) || 0) + 1;

  // Registrar no histórico de votos
  arena.votesHistory.unshift({
    nick: cleanNick,
    challengeType,
    timestamp: new Date().toISOString()
  });

  saveDb(db);

  // Calcular porcentagens da enquete atualizadas para retorno imediato
  const currentPoll = arena.poll || { options: [] };
  const totalPollVotes = (currentPoll.options || []).reduce((sum, o) => sum + (Number(o.votes) || 0), 0);
  const updatedPoll = {
    ...currentPoll,
    totalVotes: totalPollVotes,
    options: (currentPoll.options || []).map(o => ({
      id: o.id,
      text: o.text,
      votes: o.votes || 0,
      percent: totalPollVotes > 0 ? Math.round(((Number(o.votes) || 0) / totalPollVotes) * 100) : 0
    }))
  };

  res.json({
    success: true,
    message: '✓ Voto computado com sucesso! Sua 1x Chave de Voto foi enviada para o /resgatar no jogo.',
    reward: '1x Chave de Voto',
    poll: updatedPoll
  });
});

// Resgatar Recompensa Bônus da Quest do Dia (ZERO COINS!)
app.post('/api/vote/daily-quest/claim', (req, res) => {
  const { nick } = req.body || {};
  if (!nick || !/^[A-Za-z0-9_]{3,16}$/.test(nick.trim())) {
    return res.status(400).json({ error: 'Informe um nick válido de Minecraft (3 a 16 caracteres).' });
  }

  const cleanNick = nick.trim();
  const arena = db.voteArena = db.voteArena || {};
  const dailyQuest = arena.dailyQuest || {
    enabled: true,
    targetCount: 2,
    rewardTitle: '2x Chaves de Voto',
    rewardCommand: 'crate key give {nick} vote 2'
  };

  if (dailyQuest.enabled === false) {
    return res.status(400).json({ error: 'A Quest do Dia está desativada no momento.' });
  }

  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  const completedToday = [];
  (arena.votesHistory || []).forEach(v => {
    if (v.nick.toLowerCase() === cleanNick.toLowerCase() && (now - new Date(v.timestamp).getTime()) < twentyFourHours) {
      if (!completedToday.includes(v.challengeType)) {
        completedToday.push(v.challengeType);
      }
    }
  });

  const target = Number(dailyQuest.targetCount) || 2;
  if (completedToday.length < target) {
    return res.status(400).json({ 
      error: `Você completou ${completedToday.length} de ${target} desafios necessários hoje. Conclua os desafios para liberar o bônus!` 
    });
  }

  arena.dailyQuestClaims = arena.dailyQuestClaims || [];
  const alreadyClaimed = arena.dailyQuestClaims.some(c => 
    c.nick.toLowerCase() === cleanNick.toLowerCase() && (now - new Date(c.timestamp).getTime()) < twentyFourHours
  );

  if (alreadyClaimed) {
    return res.status(400).json({ error: 'Você já resgatou o bônus da Quest do Dia hoje! Volte amanhã para uma nova missão.' });
  }

  arena.dailyQuestClaims.unshift({
    nick: cleanNick,
    timestamp: new Date().toISOString()
  });

  // Recompensa estritamente ZERO COINS!
  const rawCmd = dailyQuest.rewardCommand || 'crate key give {nick} vote 2';
  const cleanCmd = rawCmd.replace(/{nick}|{player}/gi, cleanNick);

  db.pendingDeliveries = db.pendingDeliveries || [];
  db.pendingDeliveries.push({
    id: generateSafeId(),
    orderId: 'QUEST-' + Math.floor(1000 + Math.random() * 9000),
    nick: cleanNick,
    product_name: `Bônus da Quest do Dia: ${dailyQuest.rewardTitle || '2x Chaves de Voto'}`,
    category: 'Quests',
    command: cleanCmd,
    gui_icon: 'NETHER_STAR',
    status: 'pending',
    created_at: new Date().toISOString()
  });

  saveDb(db);

  res.json({
    success: true,
    message: `🎉 Parabéns! Você cumpriu a Quest do Dia! Sua recompensa (${dailyQuest.rewardTitle || '2x Chaves de Voto'}) foi enviada para o /resgatar no jogo!`,
    reward: dailyQuest.rewardTitle || '2x Chaves de Voto'
  });
});

// ----------------------------------------------------
// ROTAS DE GERENCIAMENTO DA ARENA DE VOTOS (ADMIN)
// ----------------------------------------------------
app.get('/api/admin/vote-arena', (req, res) => {
  const arena = db.voteArena = db.voteArena || {};
  res.json({
    success: true,
    quiz: arena.quiz || [],
    poll: arena.poll || { question: '', options: [] },
    pranks: arena.pranks || [],
    jokes: arena.jokes || [],
    dailyQuest: arena.dailyQuest || {
      enabled: true,
      id: 'quest-today',
      title: 'Jornada do Conhecimento',
      description: 'Complete pelo menos 2 desafios na Arena de Votos hoje para provar seu valor à comunidade!',
      targetCount: 2,
      rewardTitle: '2x Chaves de Voto',
      rewardCommand: 'crate key give {nick} vote 2'
    },
    votesHistory: (arena.votesHistory || []).slice(0, 50)
  });
});

app.post('/api/admin/vote-arena', (req, res) => {
  const { quiz, poll, pranks, jokes, dailyQuest } = req.body || {};
  const arena = db.voteArena = db.voteArena || {};

  if (Array.isArray(quiz)) arena.quiz = quiz;
  if (poll && typeof poll === 'object') {
    arena.poll = {
      ...arena.poll,
      question: poll.question !== undefined ? poll.question : arena.poll.question,
      options: Array.isArray(poll.options) ? poll.options : arena.poll.options
    };
  }
  if (Array.isArray(pranks)) arena.pranks = pranks;
  if (Array.isArray(jokes)) arena.jokes = jokes;
  if (dailyQuest && typeof dailyQuest === 'object') {
    arena.dailyQuest = {
      ...arena.dailyQuest,
      ...dailyQuest
    };
  }

  saveDb(db);
  res.json({ success: true, message: 'Configurações da Arena de Votos salvas com sucesso!' });
});

app.post('/api/admin/vote-arena/poll/reset', (req, res) => {
  const arena = db.voteArena = db.voteArena || {};
  if (arena.poll && Array.isArray(arena.poll.options)) {
    arena.poll.options.forEach(o => { o.votes = 0; });
    saveDb(db);
  }
  res.json({ success: true, message: 'Contagem de votos da enquete zerada com sucesso!' });
});

// Admin: Sugerir Quest do Dia com Kayzel IA
app.post('/api/admin/vote-arena/quest/suggest-ai', async (req, res) => {
  const thematicFallbackQuests = [
    {
      title: "Jornada do Conhecimento",
      description: "Complete pelo menos 2 desafios na Arena de Votos hoje para provar seu valor à comunidade!",
      targetCount: 2,
      rewardTitle: "2x Chaves de Voto",
      rewardCommand: "crate key give {nick} vote 2",
      silvieTip: "Dica do Kayzel: Comece pelo Quiz de Minecraft para aquecer seus neurônios! 🔮"
    },
    {
      title: "O Desafio do Mago Ancestral",
      description: "Vença uma Pegadinha e responda uma pergunta do Quiz para absorver a energia mágica de Ravok!",
      targetCount: 2,
      rewardTitle: "2x Chaves de Voto",
      rewardCommand: "crate key give {nick} vote 2",
      silvieTip: "Cuidado com os trocadilhos das pegadinhas, os magos adoram uma pegadinha troll! 🧙‍♂️"
    },
    {
      title: "A Voz da Comunidade",
      description: "Deixe seu voto na Enquete oficial e complete uma piada para espalhar alegria no spawn!",
      targetCount: 2,
      rewardTitle: "2x Chaves de Voto",
      rewardCommand: "crate key give {nick} vote 2",
      silvieTip: "Sua opinião na enquete ajuda a definir os eventos épicos de fim de semana! 📊"
    },
    {
      title: "Explorador das Profundezas",
      description: "Supere 2 desafios na Arena de Votos e resgate suprimentos lendários para suas jornadas!",
      targetCount: 2,
      rewardTitle: "2x Chaves de Voto",
      rewardCommand: "crate key give {nick} vote 2",
      silvieTip: "Chaves de voto guardam relíquias incríveis na Caixa do Spawn. Não deixe de resgatar com /resgatar! 🗝️"
    },
    {
      title: "O Enigma do Creeper Sábio",
      description: "Desvende os mistérios da Arena completando 2 modalidades hoje sem cair em pegadinhas!",
      targetCount: 2,
      rewardTitle: "2x Chaves de Voto",
      rewardCommand: "crate key give {nick} vote 2",
      silvieTip: "Dizem que até os Creepers pensam duas vezes antes de errar uma charada do Kayzel! 💥"
    },
    {
      title: "Mestre da Sabedoria e Humor",
      description: "Complete uma Piada e acerte uma pergunta no Quiz para conquistar o respeito do reino!",
      targetCount: 2,
      rewardTitle: "2x Chaves de Voto",
      rewardCommand: "crate key give {nick} vote 2",
      silvieTip: "O riso é o melhor encantamento para afastar zumbis e creepers! 😂"
    }
  ];

  // Se o bot e Kayzel IA estiverem disponíveis e configurados
  if (bot && typeof bot.askKayzelAI === 'function' && db.settings.aiApiKey) {
    try {
      const prompt = `Gere uma sugestão criativa e empolgante de "Quest do Dia" (Missão Diária) para o servidor de Minecraft "Ravok Network".
A missão deve convidar o jogador a fazer desafios na Arena de Votos no site (Quiz de Perguntas, Enquete da Comunidade, Vencer Pegadinhas, Completar Piadas).
IMPORTANTE: A recompensa NUNCA PODE SER COINS! As recompensas devem ser sempre "2x Chaves de Voto" ou "1x Chave Rara".
Responda ESTRITAMENTE em formato JSON válido, sem cercas de código markdown nem explicações adicionais, no seguinte formato:
{"title": "Título da Missão", "description": "Texto empolgante explicando o que fazer hoje", "targetCount": 2, "rewardTitle": "2x Chaves de Voto", "rewardCommand": "crate key give {nick} vote 2", "silvieTip": "Uma dica amigável e mágica do Kayzel inspirando o jogador"}`;

      const aiRaw = await bot.askKayzelAI(prompt, 'Administrador');
      const cleaned = aiRaw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.title && parsed.description) {
          return res.json({
            success: true,
            source: 'ai',
            suggestion: {
              title: String(parsed.title).trim(),
              description: String(parsed.description).trim(),
              targetCount: Math.min(4, Math.max(1, parseInt(parsed.targetCount, 10) || 2)),
              rewardTitle: String(parsed.rewardTitle || '2x Chaves de Voto').replace(/coins?/gi, 'Chaves'),
              rewardCommand: 'crate key give {nick} vote 2', // ZERO COINS garantido!
              silvieTip: String(parsed.silvieTip || 'Dica do Kayzel: Foque nos desafios e pegue suas chaves no /resgatar! 🔮').trim()
            }
          });
        }
      }
    } catch (err) {
      console.warn('[Server] Falha ao gerar quest com IA, usando fallback temático:', err.message);
    }
  }

  // Fallback inteligente com lore e rotação
  const randomQuest = thematicFallbackQuests[Math.floor(Math.random() * thematicFallbackQuests.length)];
  return res.json({
    success: true,
    source: 'lore_rotation',
    suggestion: randomQuest
  });
});

// ----------------------------------------------------
// CUPONS DE DESCONTO
// ----------------------------------------------------
app.post('/api/coupons/validate', (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ valid: false, error: 'Informe um código de cupom.' });

  const coupon = (db.coupons || []).find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.active);
  if (!coupon) {
    return res.status(404).json({ valid: false, error: 'Cupom inválido ou expirado.' });
  }

  res.json({
    valid: true,
    code: coupon.code,
    discountPercent: Number(coupon.discountPercent) || 0
  });
});

// ----------------------------------------------------
// MERCADO PAGO: CHECKOUT PIX & WEBHOOK
// ----------------------------------------------------
app.post('/api/checkout/pix', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  const { nick, items, total } = req.body;
  if (!nick || !items || !items.length) {
    return res.status(400).json({ error: 'Dados incompletos do pedido.' });
  }

  const orderId = Math.floor(100000 + Math.random() * 900000);
  const amount = Number(total || 0).toFixed(2);

  // Verificar se o Mercado Pago está configurado com token real
  if (db.settings.mpAccessToken && db.settings.mpAccessToken.startsWith('APP_USR-')) {
    try {
      const { MercadoPagoConfig, Payment } = require('mercadopago');
      const client = new MercadoPagoConfig({ accessToken: db.settings.mpAccessToken });
      const payment = new Payment(client);

      const paymentData = {
        body: {
          transaction_amount: Number(amount),
          description: `Ravok Network - Pedido #${orderId} (${nick})`,
          payment_method_id: 'pix',
          payer: {
            email: `${nick.toLowerCase().replace(/[^a-z0-9]/g, '')}@ravok.network`,
            first_name: nick
          },
          notification_url: `${db.settings.apiUrl}/api/webhooks/mercadopago`
        }
      };

      const result = await payment.create(paymentData);
      const point = result.point_of_interaction || {};
      const txData = point.transaction_data || {};

      const newOrder = {
        id: orderId,
        mpPaymentId: result.id,
        nick,
        items,
        total: Number(amount),
        date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
        status: 'pendente',
        pixCopiaCola: txData.qr_code || '',
        pixQrBase64: txData.qr_code_base64 || ''
      };

      db.orders = db.orders || [];
      db.orders.unshift(newOrder);
      rememberKnownPlayer(db, nick, { source: 'checkout' });
      await saveDbNow(db, true);

      return res.json({
        success: true,
        orderId: newOrder.id,
        status: 'pendente',
        pixCopiaCola: newOrder.pixCopiaCola,
        pixQrBase64: newOrder.pixQrBase64,
        isSimulated: false
      });
    } catch (mpErr) {
      console.error('[Mercado Pago] Erro na API:', mpErr.message || mpErr);
      // Fallback para modo simulação caso a chave expire ou esteja offline
    }
  }

  // MODO SIMULAÇÃO (sem chaves ativas ou ambiente local de teste)
  const mockCopiaCola = `00020126580014BR.GOV.BCB.PIX0136${Math.random().toString(36).substring(2, 15)}520400005303986540${amount}5802BR5913RAVOK NETWORK6009SAO PAULO62070503***6304${Math.floor(1000 + Math.random() * 9000)}`;
  const newOrder = {
    id: orderId,
    nick,
    items,
    total: Number(amount),
    date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
    status: 'pendente',
    pixCopiaCola: mockCopiaCola,
    isSimulated: true
  };

  db.orders = db.orders || [];
  db.orders.unshift(newOrder);
  rememberKnownPlayer(db, nick, { source: 'checkout' });
  await saveDbNow(db, true);

  res.json({
    success: true,
    orderId: newOrder.id,
    status: 'pendente',
    pixCopiaCola: newOrder.pixCopiaCola,
    isSimulated: true
  });
});

// SIMULAR APROVAÇÃO (Para desenvolvimento e testes rápidos)
app.post('/api/orders/:id/simulate-approve', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  const orderId = Number(req.params.id);
  const order = (db.orders || []).find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

  approveOrderAndEnqueueDelivery(order);
  await saveDbNow(db, true);
  res.json({ success: true, message: 'Pedido aprovado e itens enviados para o /resgatar!' });
});

// STATUS DO PEDIDO (Polling automático do frontend com verificação ativa no Mercado Pago)
app.get('/api/orders/:id/status', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  const orderId = Number(req.params.id);
  const order = (db.orders || []).find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

  if (order.status === 'aprovado') {
    return res.json({ status: 'aprovado', orderId: order.id });
  }

  // Se pendente e tiver mpPaymentId, consultar ativamente o Mercado Pago
  if (order.mpPaymentId && db.settings.mpAccessToken) {
    try {
      const { MercadoPagoConfig, Payment } = require('mercadopago');
      const client = new MercadoPagoConfig({ accessToken: db.settings.mpAccessToken });
      const payment = new Payment(client);
      const paymentInfo = await payment.get({ id: order.mpPaymentId });

      if (paymentInfo.status === 'approved') {
        approveOrderAndEnqueueDelivery(order);
        await saveDbNow(db, true);
        return res.json({ status: 'aprovado', orderId: order.id, justApproved: true });
      }
    } catch (e) {
      console.warn(`[Order Status] Erro ao verificar MP payment ${order.mpPaymentId}:`, e.message);
    }
  }

  res.json({ status: order.status || 'pendente', orderId: order.id });
});

// WEBHOOK OFICIAL MERCADO PAGO
app.post('/api/webhooks/mercadopago', async (req, res) => {
  const paymentId = req.query['data.id'] || req.query.id || (req.body && req.body.data && req.body.data.id);
  res.status(200).send('OK');

  if (!paymentId || !db.settings.mpAccessToken) return;

  try {
    const { MercadoPagoConfig, Payment } = require('mercadopago');
    const client = new MercadoPagoConfig({ accessToken: db.settings.mpAccessToken });
    const payment = new Payment(client);
    const paymentInfo = await payment.get({ id: paymentId });

    if (paymentInfo.status === 'approved') {
      await readLatestDbFromCloudKv(true);
      const freshOrder = (db.orders || []).find(o => o.mpPaymentId == paymentId);
      if (freshOrder && freshOrder.status !== 'aprovado') {
        approveOrderAndEnqueueDelivery(freshOrder);
        await saveDbNow(db, true);
      }
    }
  } catch (err) {
    console.error('[Mercado Pago Webhook] Erro:', err.message);
  }
});

// Função central de aprovação de pedidos e enfileiramento para o Minecraft
function approveOrderAndEnqueueDelivery(order) {
  if (!order || order.status === 'aprovado') return;
  order.status = 'aprovado';
  order.delivery_status = order.delivery_status || 'pendente';
  order.approved_at = new Date().toISOString();

  db.pendingDeliveries = db.pendingDeliveries || [];

  (order.items || []).forEach(item => {
    const rawCmd = item.command || 'say Entregue {player}';
    const cleanCmd = rawCmd.replace(/{player}|{nick}/gi, order.nick);

    const deliveryItem = {
      id: generateSafeId(),
      orderId: order.id,
      nick: order.nick,
      product_name: item.name,
      category: item.cat || 'Itens',
      command: cleanCmd,
      gui_icon: item.guiIcon || 'CHEST',
      status: 'pending',
      created_at: new Date().toISOString()
    };
    db.pendingDeliveries.push(deliveryItem);
  });

  saveDb(db);

  // Disparar anúncio de compra via Bot do Discord (local ou REST fallback)
  if (isLocalBotOnline() && typeof bot.notifySale === 'function') {
    bot.notifySale(order).catch(() => {});
  } else {
    getBridgeHeartbeat().then(hb => {
      const tok = getEffectiveDiscordToken(hb);
      if (tok) return sendSaleRest(tok, order);
    }).catch(() => {});
  }

  // Disparar anúncio de compra no Discord via Webhook (fallback)
  if (db.settings.discordWebhookUrl) {
    const itemsList = (order.items || []).map(i => `• **${i.name}**`).join('\n');
    sendDiscordWebhook(db.settings.discordWebhookUrl, {
      username: 'Ravok Network • Vendas',
      avatar_url: `https://mc-heads.net/avatar/${encodeURIComponent(order.nick)}/128`,
      embeds: [{
        title: `💎 Compra Aprovada para ${order.nick}!`,
        description: `O pedido **#${order.id}** foi aprovado com sucesso via Pix e os itens já estão prontos para entrega imediata no jogo!`,
        color: 0x00FFCC,
        fields: [
          { name: 'Jogador', value: order.nick, inline: true },
          { name: 'Total', value: `R$ ${Number(order.total).toFixed(2).replace('.', ',')}`, inline: true },
          { name: 'Itens Adquiridos', value: itemsList || 'Itens diversos', inline: false },
          { name: 'Como receber no jogo', value: 'Use `/resgatar` no servidor para retirar seus itens!', inline: false }
        ],
        footer: { text: 'Ravok Network • Entrega Automática' },
        timestamp: new Date().toISOString()
      }]
    });
  }
}

// ----------------------------------------------------
// ENDPOINTS DO PLUGIN MINECRAFT (RavokSite.jar)
// ----------------------------------------------------

// 1. Obter itens pendentes para o /resgatar
app.get('/api/delivery/pending', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  const { nick, key } = req.query;
  if (!key || key !== db.settings.apiToken) {
    return res.status(401).json({ error: 'Token de segurança inválido.' });
  }
  if (!nick) {
    return res.status(400).json({ error: 'Parâmetro nick é obrigatório.' });
  }

  if (rememberKnownPlayer(db, nick, { source: 'resgatar' })) {
    await saveDbNow(db, true);
  }

  const items = (db.pendingDeliveries || []).filter(
    d => d.status === 'pending' && d.nick.toLowerCase() === nick.toLowerCase()
  );

  res.json({
    pending: items.map(i => ({
      id: i.id,
      category: i.category,
      command: i.command,
      product_name: i.product_name,
      gui_icon: i.gui_icon
    }))
  });
});

// 2. Confirmar resgate executado pelo plugin
app.post('/api/delivery/confirm', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  const { key } = req.query;
  if (!key || key !== db.settings.apiToken) {
    return res.status(401).json({ error: 'Token de segurança inválido.' });
  }

  const { orderId, nick } = req.body || {};
  console.log(`[Delivery] Recebida confirmação para nick="${nick}", orderId="${orderId}"`);

  const item = (db.pendingDeliveries || []).find(d => {
    const matchNick = !nick || d.nick.toLowerCase() === nick.toLowerCase();
    if (!matchNick) return false;
    return (
      String(d.id) === String(orderId) ||
      String(d.orderId) === String(orderId) ||
      (d.id | 0) === Number(orderId) ||
      d.id == orderId ||
      d.orderId == orderId
    );
  });

  if (item) {
    item.status = 'delivered';
    item.delivered_at = new Date().toISOString();
    if (item.orderId) {
      const order = (db.orders || []).find(o => String(o.id) === String(item.orderId));
      if (order) {
        const related = (db.pendingDeliveries || []).filter(d => String(d.orderId) === String(item.orderId));
        if (related.length > 0 && related.every(d => d.status === 'delivered')) {
          order.delivery_status = 'entregue';
          order.delivered = true;
          order.delivered_at = new Date().toISOString();
        }
      }
    }
    await saveDbNow(db, true);
    console.log(`[Delivery] Item ID ${item.id} (${item.product_name}) marcado como entregue para ${item.nick}!`);
    return res.json({ success: true, message: 'Item confirmado como resgatado.' });
  }

  console.warn(`[Delivery] Item não encontrado para orderId="${orderId}", nick="${nick}".`);
  res.status(404).json({ error: 'Item não encontrado na fila.' });
});

// 3. Gerar código para o comando /vincular
app.post('/api/verify/generate', (req, res) => {
  const { nick, token } = req.body;
  if (!token || token !== db.settings.apiToken) {
    return res.status(401).json({ error: 'Token de segurança inválido.' });
  }
  if (!nick) return res.status(400).json({ error: 'Nick obrigatório.' });

  // Verificar se o jogador já possui vínculo ativo
  db.linkedAccounts = db.linkedAccounts || [];
  const alreadyLinked = db.linkedAccounts.find(l => l.nick.toLowerCase() === nick.toLowerCase());
  if (alreadyLinked) {
    return res.json({
      alreadyLinked: true,
      discordTag: alreadyLinked.discordTag || 'Discord',
      linked_at: alreadyLinked.linked_at
    });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  db.verifyCodes = db.verifyCodes || {};
  db.verifyCodes[nick.toLowerCase()] = {
    code,
    nick,
    expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutos
  };
  saveDb(db);

  res.json({ code });
});

// 4. Sincronizar dados do jogador via /ravoksync (PlaceholderAPI) ou join do servidor
app.post('/api/player-sync', async (req, res) => {
  await readLatestDbFromCloudKv(false);
  const { token, nick, rankings } = req.body || {};
  if (!token || token !== db.settings.apiToken) {
    return res.status(401).json({ error: 'Token de segurança inválido.' });
  }
  if (!nick) return res.status(400).json({ error: 'Nick obrigatório.' });

  db.playerSync = db.playerSync || {};
  db.playerSync[nick.toLowerCase()] = {
    nick,
    time_played: (rankings && rankings.time_played) || '0h',
    money: (rankings && rankings.money) || '0',
    kills: Number((rankings && rankings.kills) || 0),
    coins: Number((rankings && rankings.coins) || 0),
    votes: Number((rankings && rankings.votes) || 0),
    last_sync: new Date().toISOString()
  };
  rememberKnownPlayer(db, nick, { source: 'server-sync' });
  await saveDbNow(db, true);

  res.json({ success: true });
});

// Sincronização em lote de jogadores históricos/online enviada pelo plugin Minecraft
app.post('/api/players/sync-batch', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  const { token, players } = req.body || {};
  if (!token || token !== db.settings.apiToken) {
    return res.status(401).json({ error: 'Token de segurança inválido.' });
  }
  let added = 0;
  if (Array.isArray(players)) {
    for (const p of players) {
      const nick = typeof p === 'string' ? p : (p && p.nick);
      const lastSeen = typeof p === 'object' && p ? Number(p.lastSeen || 0) : 0;
      if (rememberKnownPlayer(db, nick, { lastSeen, source: 'plugin-batch' })) added++;
    }
  }
  await saveDbNow(db, true);
  res.json({ success: true, count: Object.keys(db.knownPlayers || {}).length, added });
});

// Listar jogadores conhecidos que já logaram no servidor (para Venda Manual no Admin)
app.get('/api/admin/players', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  ensureKnownPlayersSeeded(db);
  const list = buildKnownPlayersList(db);
  res.json({ success: true, players: list });
});

// ====================================================
// AUTENTICAÇÃO E PORTAL DO JOGADOR (ÁREA DO JOGADOR)
// ====================================================

// 1. Cadastrar Jogador (Criar Conta)
app.post('/api/auth/register', (req, res) => {
  const { nick, email, password } = req.body || {};
  if (!nick || !password) {
    return res.status(400).json({ error: 'Nick e senha são obrigatórios.' });
  }

  const cleanNick = nick.trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  // Validar formato do nick de Minecraft
  if (!/^[a-zA-Z0-9_]{3,16}$/.test(cleanNick)) {
    return res.status(400).json({ error: 'Nick inválido. Use de 3 a 16 caracteres (apenas letras, números e _).' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 4 caracteres.' });
  }

  db.playerAccounts = db.playerAccounts || {};
  const nickKey = cleanNick.toLowerCase();

  if (db.playerAccounts[nickKey]) {
    return res.status(400).json({ error: `Uma conta para "${cleanNick}" já existe. Faça login!` });
  }

  if (cleanEmail) {
    const emailUsed = Object.values(db.playerAccounts).some(acc => acc.email === cleanEmail);
    if (emailUsed) {
      return res.status(400).json({ error: 'Este e-mail já está em uso por outra conta.' });
    }
  }

  const token = 'ravok_user_' + Buffer.from(`${nickKey}_${Date.now()}`).toString('hex');
  const newAccount = {
    nick: cleanNick,
    email: cleanEmail,
    passwordHash: hashPassword(password),
    token: token,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  db.playerAccounts[nickKey] = newAccount;
  saveDb(db);

  const syncData = (db.playerSync || {})[nickKey] || {};
  const userProfile = buildPlayerProfile(cleanNick, newAccount, syncData);

  res.json({
    success: true,
    message: `Conta criada com sucesso para ${cleanNick}!`,
    token,
    user: userProfile
  });
});

// 2. Login de Jogador
app.post('/api/auth/login', (req, res) => {
  const { nickOrEmail, password } = req.body || {};
  if (!nickOrEmail || !password) {
    return res.status(400).json({ error: 'Informe seu nick/e-mail e sua senha.' });
  }

  db.playerAccounts = db.playerAccounts || {};
  const query = nickOrEmail.trim().toLowerCase();
  const hashed = hashPassword(password);

  let account = db.playerAccounts[query];
  if (!account) {
    account = Object.values(db.playerAccounts).find(acc => acc.email === query);
  }

  if (!account || account.passwordHash !== hashed) {
    return res.status(401).json({ error: 'Nick/E-mail ou senha incorretos.' });
  }

  const token = 'ravok_user_' + Buffer.from(`${account.nick.toLowerCase()}_${Date.now()}`).toString('hex');
  account.token = token;
  account.lastLogin = new Date().toISOString();
  saveDb(db);

  const syncData = (db.playerSync || {})[account.nick.toLowerCase()] || {};
  const userProfile = buildPlayerProfile(account.nick, account, syncData);

  res.json({
    success: true,
    message: `Bem-vindo de volta, ${account.nick}!`,
    token,
    user: userProfile
  });
});

// 3. Obter Perfil do Jogador Logado (Me)
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  db.playerAccounts = db.playerAccounts || {};
  const account = Object.values(db.playerAccounts).find(acc => acc.token === token);

  if (!account) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida.' });
  }

  const syncData = (db.playerSync || {})[account.nick.toLowerCase()] || {};
  const userProfile = buildPlayerProfile(account.nick, account, syncData);

  res.json({
    success: true,
    user: userProfile
  });
});

// Função auxiliar para montar o perfil completo do jogador
function buildPlayerProfile(nick, account, syncData) {
  const cleanNick = nick.trim();
  const nickLower = cleanNick.toLowerCase();

  // Entregas pendentes (/resgatar)
  const pendentes = (db.pendingDeliveries || []).filter(d => (d.nick || '').toLowerCase() === nickLower);

  // Pedidos de compra finalizados
  const compras = (db.orders || []).filter(o => (o.nick || '').toLowerCase() === nickLower);

  // Posição nos Rankings
  const rankings = getPlayerRankings(nickLower);

  // Vínculo Discord
  const linked = (db.linkedAccounts || []).find(l => (l.nick || '').toLowerCase() === nickLower);

  return {
    nick: cleanNick,
    email: account.email || '',
    avatarUrl: `https://mc-heads.net/avatar/${encodeURIComponent(cleanNick)}/128`,
    bodyUrl: `https://mc-heads.net/body/${encodeURIComponent(cleanNick)}/right`,
    coins: Number(syncData.coins || 0),
    money: syncData.money ? String(syncData.money) : '0',
    kills: Number(syncData.kills || 0),
    votes: Number(syncData.votes || 0),
    timePlayed: syncData.time_played || '0h',
    lastSync: syncData.last_sync || null,
    pendingDeliveries: pendentes,
    ordersCount: compras.length,
    rankings: rankings,
    linkedDiscord: linked ? {
      linked: true,
      tag: linked.discordTag,
      id: linked.discordId || null,
      linkedAt: linked.linked_at
    } : {
      linked: false
    }
  };
}

// Calcular posições relativas do jogador nos rankings
function getPlayerRankings(nickLower) {
  const allSynced = Object.values(db.playerSync || {});
  if (!allSynced.length) return { coinsRank: 1, killsRank: 1, votesRank: 1, totalPlayers: 1 };

  const byCoins = [...allSynced].sort((a, b) => (Number(b.coins) || 0) - (Number(a.coins) || 0));
  const coinsIdx = byCoins.findIndex(p => (p.nick || '').toLowerCase() === nickLower);

  const byKills = [...allSynced].sort((a, b) => (Number(b.kills) || 0) - (Number(a.kills) || 0));
  const killsIdx = byKills.findIndex(p => (p.nick || '').toLowerCase() === nickLower);

  const byVotes = [...allSynced].sort((a, b) => (Number(b.votes) || 0) - (Number(a.votes) || 0));
  const votesIdx = byVotes.findIndex(p => (p.nick || '').toLowerCase() === nickLower);

  return {
    coinsRank: coinsIdx !== -1 ? coinsIdx + 1 : byCoins.length + 1,
    killsRank: killsIdx !== -1 ? killsIdx + 1 : byKills.length + 1,
    votesRank: votesIdx !== -1 ? votesIdx + 1 : byVotes.length + 1,
    totalPlayers: Math.max(allSynced.length, 1)
  };
}

// ----------------------------------------------------
// ROTAS DE RANKINGS E PERFIL DE JOGADOR
// ----------------------------------------------------
app.get('/api/rankings', (req, res) => {
  const players = Object.values(db.playerSync || {});

  // Top Coins
  const topCoins = [...players].sort((a, b) => (Number(b.coins) || 0) - (Number(a.coins) || 0)).slice(0, 10);

  // Top Kills
  const topKills = [...players].sort((a, b) => (Number(b.kills) || 0) - (Number(a.kills) || 0)).slice(0, 10);

  // Top Votos
  const topVotes = [...players].sort((a, b) => (Number(b.votes) || 0) - (Number(a.votes) || 0)).slice(0, 10);

  // Top Saldo (Money)
  const topMoney = [...players].sort((a, b) => (parseFloat(b.money) || 0) - (parseFloat(a.money) || 0)).slice(0, 10);

  res.json({
    topCoins,
    topKills,
    topVotes,
    topMoney,
    totalTracked: players.length
  });
});

app.get('/api/player/:nick', (req, res) => {
  const { nick } = req.params;
  const playerData = (db.playerSync || {})[nick.toLowerCase()];

  const linked = (db.linkedAccounts || []).find(l => l.nick.toLowerCase() === nick.toLowerCase());

  res.json({
    nick,
    avatar: `https://mc-heads.net/avatar/${encodeURIComponent(nick)}/128`,
    body: `https://mc-heads.net/body/${encodeURIComponent(nick)}/160`,
    stats: playerData || {
      coins: 0,
      kills: 0,
      votes: 0,
      money: '0',
      time_played: '0m',
      last_sync: null
    },
    linked: Boolean(linked),
    discordTag: linked ? linked.discordTag : null,
    linked_at: linked ? linked.linked_at : null
  });
});

// Vincular código gerado no Minecraft com o site ou Discord
app.post('/api/player/link', (req, res) => {
  let { nick, code, discordTag } = req.body || {};
  let cleanNick = (nick || '').trim();
  let cleanCode = (code || '').trim();

  // Se o usuário digitou o código no lugar do nick ou vice-versa
  if (/^\d{6}$/.test(cleanNick) && !/^\d{6}$/.test(cleanCode)) {
    const temp = cleanNick;
    cleanNick = cleanCode;
    cleanCode = temp;
  }

  // Se não foi passado nick, busca em verifyCodes pela chave cujo code coincide
  if (!cleanNick && cleanCode) {
    const found = Object.values(db.verifyCodes || {}).find(v => v && v.code === cleanCode);
    if (found) cleanNick = found.nick;
  }

  if (!cleanNick || !cleanCode) {
    return res.status(400).json({ error: 'Nick e código são obrigatórios.' });
  }

  const stored = (db.verifyCodes || {})[cleanNick.toLowerCase()];
  if (!stored || stored.code !== cleanCode) {
    return res.status(400).json({ error: 'Código de verificação incorreto ou inexistente.' });
  }

  if (Date.now() > stored.expiresAt) {
    delete db.verifyCodes[cleanNick.toLowerCase()];
    saveDb(db);
    return res.status(400).json({ error: 'Código expirado. Use /vincular no jogo novamente.' });
  }

  db.linkedAccounts = db.linkedAccounts || [];
  const existingIdx = db.linkedAccounts.findIndex(l => l.nick.toLowerCase() === cleanNick.toLowerCase());
  const linkRecord = {
    nick: stored.nick,
    discordTag: discordTag || '',
    linked_at: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    db.linkedAccounts[existingIdx] = linkRecord;
  } else {
    db.linkedAccounts.push(linkRecord);
  }

  delete db.verifyCodes[nick.toLowerCase()];

  // Recompensa automática de boas-vindas do vínculo para o /resgatar
  db.pendingDeliveries = db.pendingDeliveries || [];
  const alreadyRewarded = db.pendingDeliveries.some(d => d.nick.toLowerCase() === stored.nick.toLowerCase() && d.product_name === 'Recompensa de Conta Vinculada');
  if (!alreadyRewarded) {
    db.pendingDeliveries.push({
      id: generateSafeId(),
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

  saveDb(db);

  // Se o bot estiver online e o discordTag tiver ID numérico, atribui os cargos no Discord
  if (bot && typeof bot.assignLinkedRoles === 'function' && discordTag) {
    bot.assignLinkedRoles(discordTag).catch(() => {});
  }

  res.json({ success: true, message: 'Conta vinculada com sucesso!', discordTag: linkRecord.discordTag });
});

// Fila de entregas completa (Admin)
app.get('/api/admin/deliveries', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  res.json(db.pendingDeliveries || []);
});

app.post('/api/admin/delivery/test', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  const { nick, productId } = req.body || {};
  const prod = (db.products || []).find(p => String(p.id) === String(productId));
  if (!prod || !nick) {
    return res.status(400).json({ error: 'Nick e produto válidos são obrigatórios.' });
  }

  const deliveryItem = {
    id: generateSafeId(),
    orderId: Math.floor(1000 + Math.random() * 9000),
    nick: nick.trim(),
    product_name: prod.name,
    category: prod.cat || 'Itens',
    command: (prod.command || 'say Entregue {player}').replace(/{player}|{nick}/gi, nick.trim()),
    gui_icon: prod.guiIcon || 'CHEST',
    status: 'pending',
    created_at: new Date().toISOString()
  };

  db.pendingDeliveries = db.pendingDeliveries || [];
  db.pendingDeliveries.unshift(deliveryItem);
  rememberKnownPlayer(db, nick, { source: 'delivery-test' });
  await saveDbNow(db, true);

  res.json({ success: true, item: deliveryItem, updatedAt: db.updatedAt });
});

app.post('/api/admin/delivery/:id/redeem', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  const targetId = String(req.params.id);
  const item = (db.pendingDeliveries || []).find(d => String(d.id) === targetId);
  if (!item) return res.status(404).json({ error: 'Item não encontrado.' });

  item.status = 'delivered';
  item.delivered_at = new Date().toISOString();

  if (item.orderId) {
    const order = (db.orders || []).find(o => String(o.id) === String(item.orderId));
    if (order) {
      const related = (db.pendingDeliveries || []).filter(d => String(d.orderId) === String(item.orderId));
      if (related.length > 0 && related.every(d => d.status === 'delivered')) {
        order.delivery_status = 'entregue';
        order.delivered = true;
        order.delivered_at = new Date().toISOString();
      }
    }
  }

  await saveDbNow(db, true);
  res.json({ success: true, message: 'Item marcado como entregue.', updatedAt: db.updatedAt });
});

app.delete('/api/admin/delivery/clear-delivered', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  db.pendingDeliveries = (db.pendingDeliveries || []).filter(d => d.status === 'pending');
  await saveDbNow(db, true);
  res.json({ success: true, updatedAt: db.updatedAt });
});

// Excluir entrega individual da fila
app.delete('/api/admin/delivery/:id', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  const id = req.params.id;
  const initialLen = (db.pendingDeliveries || []).length;
  db.pendingDeliveries = (db.pendingDeliveries || []).filter(d => String(d.id) !== String(id));
  await saveDbNow(db, true);
  res.json({ success: true, removed: initialLen !== db.pendingDeliveries.length, updatedAt: db.updatedAt });
});

async function tryCreateDiscordPurchaseTicket(ticketPayload, cleanItems, orderTotal) {
  let ticketChannelUrl = null;
  let ticketChannelId = null;

  if (isLocalBotOnline() && typeof bot.createPurchaseTicketForSiteOrder === 'function') {
    const ticketRes = await bot.createPurchaseTicketForSiteOrder(ticketPayload);
    return {
      ticketChannelUrl: ticketRes && ticketRes.ticketChannelUrl ? ticketRes.ticketChannelUrl : null,
      ticketChannelId: ticketRes && ticketRes.ticketChannelId ? ticketRes.ticketChannelId : null
    };
  }

  const hb = await getBridgeHeartbeat();
  const hbOnline = Boolean(hb && hb.status && hb.status.online && (Date.now() - Number(hb.receivedAt || 0)) < HEARTBEAT_TTL_MS);
  const token = getEffectiveDiscordToken(hb);

  if (hbOnline) {
    const task = await enqueueBridgeTask('create-purchase-ticket', ticketPayload);
    const deadline = Date.now() + 6800;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 300));
      const updated = await getBridgeTaskResult(task.id);
      if (updated && updated.status === 'done' && updated.result) {
        ticketChannelUrl = updated.result.ticketChannelUrl || null;
        ticketChannelId = updated.result.ticketChannelId || null;
        break;
      }
      if (updated && updated.status === 'error') break;
    }
  } else if (token) {
    const relCh = getVerifiedChannelId('discordBotChannelRelatorios');
    const itemsSummary = (cleanItems || []).map(i => `• **${i.name}** (x${i.quantity || 1})`).join('\n') || '• Itens da Loja';
    await discordRestRequest(token, 'POST', `/channels/${relCh}/messages`, {
      embeds: [{
        title: `🛒 Novo Pedido Aguardando Ticket (#${ticketPayload.orderId})`,
        description: `O jogador **${ticketPayload.nick}** gerou um pedido pelo site para finalizar na categoria Compras!`,
        color: 0xFFB703,
        fields: [
          { name: '🎮 Nick Minecraft', value: `\`${ticketPayload.nick}\``, inline: true },
          { name: '💰 Valor Total', value: `R$ ${Number(orderTotal || 0).toFixed(2).replace('.', ',')}`, inline: true },
          { name: '🛒 Itens', value: itemsSummary, inline: false }
        ],
        footer: { text: 'Ravok Network • Checkout Discord' },
        timestamp: new Date().toISOString()
      }]
    }).catch(() => {});
  }

  return { ticketChannelUrl, ticketChannelId };
}

// ----------------------------------------------------
// CRIAÇÃO DE PEDIDO MANUAL VIA DISCORD TICKET (COMPRAS) / PIX DIRETO
// ----------------------------------------------------
app.post('/api/orders/manual', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  const { nick, items, total, coupon, notes, paymentMethod, id, discordTag } = req.body || {};
  if (!nick || !String(nick).trim()) {
    return res.status(400).json({ error: 'Nick do jogador é obrigatório.' });
  }
  const cleanNick = String(nick).trim();
  const orderId = (typeof id === 'string' && id.startsWith('RV-')) ? id : ('RV-' + Math.floor(1000 + Math.random() * 9000));
  const cleanItems = Array.isArray(items) ? items.map(item => {
    const prod = (db.products || []).find(p => String(p.id) === String(item.id)) || (DEFAULT_PRODUCTS || []).find(p => String(p.id) === String(item.id));
    return {
      id: item.id,
      name: item.name || (prod ? prod.name : 'Item Ravok'),
      price: Number(item.price) || (prod ? prod.price : 0),
      quantity: Number(item.quantity) || 1,
      cat: item.cat || (prod ? prod.cat : 'Loja'),
      command: (prod && prod.command) || item.command || ''
    };
  }) : [];
  const finalTotal = typeof total === 'number' && total >= 0 ? total : cleanItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const newOrder = {
    id: orderId,
    externalReference: orderId,
    nick: cleanNick,
    player: cleanNick,
    items: cleanItems,
    total: Number(finalTotal.toFixed(2)),
    date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
    createdAt: new Date().toISOString(),
    status: 'pendente_admin',
    paymentMethod: paymentMethod || 'discord_ticket',
    coupon: coupon || '',
    notes: notes || 'Pedido criado via Discord Ticket (Categoria de Compras). Aguardando envio do comprovante Pix.',
    delivery_status: 'aguardando_aprovacao',
    delivered: false
  };
  db.deletedOrderIds = (db.deletedOrderIds || []).filter(d => String(d).trim() !== String(orderId).trim());
  db.orders = (db.orders || []).filter(o => String(o.id) !== String(orderId));
  db.orders.unshift(newOrder);
  rememberKnownPlayer(db, cleanNick, { source: 'discord-checkout' });
  await saveDbNow(db, true);

  let ticketChannelUrl = null;
  let ticketChannelId = null;
  const linked = (db.linkedAccounts || []).find(l => l.nick && l.nick.toLowerCase() === cleanNick.toLowerCase());
  const ticketPayload = {
    orderId,
    nick: cleanNick,
    items: cleanItems,
    total: newOrder.total,
    discordId: linked && linked.discordId ? String(linked.discordId) : null,
    discordTag: (discordTag && String(discordTag).trim()) || (linked && linked.discordTag) || '',
    notes: newOrder.notes
  };

  try {
    const tRes = await tryCreateDiscordPurchaseTicket(ticketPayload, cleanItems, newOrder.total);
    ticketChannelUrl = tRes.ticketChannelUrl;
    ticketChannelId = tRes.ticketChannelId;
  } catch (ticketErr) {
    console.warn('[Discord Ticket Order] Aviso ao notificar Discord:', ticketErr.message);
  }

  console.log('[Discord Ticket Order] Novo pedido criado:', newOrder.id, 'para', cleanNick, 'Total:', finalTotal);
  res.json({
    success: true,
    orderId,
    order: newOrder,
    ticketChannelUrl,
    ticketChannelId,
    discordTicketUrl: DISCORD_TICKET_INVITE_URL,
    discordInviteUrl: normalizeDiscordInviteUrl(db.settings && db.settings.discordInviteUrl),
    updatedAt: db.updatedAt,
    message: ticketChannelUrl
      ? 'Ticket de compra criado automaticamente no Discord e pedido registrado!'
      : 'Pedido registrado com sucesso! Abra seu ticket na categoria Compras do Discord para liberação no /resgatar.'
  });
});

// Abrir ticket na categoria Compras manualmente informando @ do Discord
app.post('/api/orders/:id/open-ticket', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  const orderId = String(req.params.id || '').trim();
  const { nick, discordTag, items, total } = req.body || {};
  const existing = (db.orders || []).find(o => String(o.id).trim() === orderId);
  const cleanNick = String((existing && existing.nick) || nick || 'Jogador').trim();
  const cleanTag = String(discordTag || '').trim();
  if (!cleanTag) {
    return res.status(400).json({ error: 'Informe seu usuário @ do Discord para abrir o ticket.' });
  }
  const orderItems = (existing && existing.items) || (Array.isArray(items) ? items : []);
  const orderTotal = existing ? existing.total : (Number(total) || 0);

  try {
    const tRes = await tryCreateDiscordPurchaseTicket(
      { orderId, nick: cleanNick, discordTag: cleanTag, items: orderItems, total: orderTotal },
      orderItems,
      orderTotal
    );
    if (tRes && tRes.ticketChannelUrl) {
      return res.json({ success: true, ...tRes });
    }
    return res.status(404).json({
      error: `Usuário "${cleanTag}" não foi encontrado no servidor do Discord ou o bot demorou para responder.`
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// APROVAÇÃO 1-CLIQUE PELO ADMIN (LIBERAÇÃO NO /resgatar)
// ----------------------------------------------------
app.post('/api/admin/orders/:id/approve', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  const orderId = String(req.params.id).trim();
  db.orders = db.orders || [];
  let order = db.orders.find(o => String(o.id).trim() === orderId || String(o.externalReference || '').trim() === orderId);

  const delSet = new Set((db.deletedOrderIds || []).map(String));
  if (!order && req.body && req.body.order && !delSet.has(orderId)) {
    order = { ...req.body.order, id: req.body.order.id || orderId };
    db.orders.unshift(order);
  }

  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  order.status = 'aprovado';
  order.approved_at = order.approved_at || new Date().toISOString();
  order.delivery_status = order.delivered ? 'entregue' : 'pendente';
  order.delivered = Boolean(order.delivered);

  db.pendingDeliveries = db.pendingDeliveries || [];
  const createdDeliveries = [];
  const alreadyHasDeliveries = db.pendingDeliveries.some(d => String(d.orderId).trim() === String(order.id).trim());
  if (!alreadyHasDeliveries && Array.isArray(order.items)) {
    order.items.forEach((item) => {
      const prod = (db.products || []).find(p => String(p.id) === String(item.id)) || (DEFAULT_PRODUCTS || []).find(p => String(p.id) === String(item.id));
      const rawCmd = (prod && prod.command) || item.command || '';
      const cleanCmd = rawCmd.replace(/{player}|{nick}/gi, order.nick);
      const qty = Number(item.quantity) || 1;
      for (let q = 0; q < qty; q++) {
        const dItem = {
          id: generateSafeId(),
          orderId: order.id,
          nick: order.nick,
          product_name: item.name || (prod ? prod.name : 'Item Ravok'),
          category: item.cat || (prod ? prod.cat : 'Loja'),
          command: cleanCmd,
          gui_icon: (prod && prod.guiIcon) || 'CHEST',
          status: 'pending',
          created_at: new Date().toISOString()
        };
        db.pendingDeliveries.unshift(dItem);
        createdDeliveries.push(dItem);
      }
    });
  }

  rememberKnownPlayer(db, order.nick, { source: 'order-approve' });
  await saveDbNow(db, true);

  if (isLocalBotOnline() && typeof bot.notifySale === 'function') {
    bot.notifySale(order).catch(() => {});
  } else {
    getBridgeHeartbeat().then(hb => {
      const tok = getEffectiveDiscordToken(hb);
      if (tok) return sendSaleRest(tok, order);
    }).catch(() => {});
  }

  console.log('[Order Approve] Pedido aprovado:', order.id, 'Entregas geradas:', createdDeliveries.length);
  res.json({
    success: true,
    message: 'Pedido #' + order.id + ' aprovado com sucesso! ' + createdDeliveries.length + ' item(ns) liberado(s) na fila do /resgatar.',
    order,
    createdDeliveries,
    orders: db.orders,
    pendingDeliveries: db.pendingDeliveries,
    goal: computeGoalStatus(),
    updatedAt: db.updatedAt
  });
});

// Marcar pedido completo como entregue (Admin)
app.post('/api/admin/orders/:id/mark-delivered', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  const orderId = String(req.params.id).trim();
  db.orders = db.orders || [];
  let order = db.orders.find(o => String(o.id).trim() === orderId || String(o.externalReference || '').trim() === orderId);
  const delSet = new Set((db.deletedOrderIds || []).map(String));
  if (!order && req.body && req.body.order && !delSet.has(orderId)) {
    order = { ...req.body.order, id: req.body.order.id || orderId };
    db.orders.unshift(order);
  }
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

  order.delivery_status = 'entregue';
  order.delivered = true;
  order.delivered_at = new Date().toISOString();

  db.pendingDeliveries = db.pendingDeliveries || [];
  db.pendingDeliveries.forEach(d => {
    if (String(d.orderId).trim() === orderId) {
      d.status = 'delivered';
      d.delivered_at = new Date().toISOString();
    }
  });
  await saveDbNow(db, true);
  res.json({
    success: true,
    message: `Pedido #${orderId} marcado como entregue!`,
    order,
    orders: db.orders,
    pendingDeliveries: db.pendingDeliveries,
    updatedAt: db.updatedAt
  });
});

// Listagem de Pedidos (Admin)
app.get('/api/admin/orders', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  res.json(db.orders || []);
});

// Excluir pedido individual
app.delete('/api/admin/orders/:id', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  const id = String(req.params.id).trim();
  const initialLen = (db.orders || []).length;
  db.deletedOrderIds = Array.from(new Set([...(db.deletedOrderIds || []).map(String), id]));
  db.orders = (db.orders || []).filter(o => String(o.id).trim() !== id);
  db.pendingDeliveries = (db.pendingDeliveries || []).filter(d => String(d.orderId || '').trim() !== id);
  await saveDbNow(db, true);
  res.json({ success: true, removed: initialLen !== db.orders.length, orders: db.orders, updatedAt: db.updatedAt });
});

// Limpar pedidos com nicks de teste
app.post('/api/admin/orders/clear-tests', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  const initialLen = (db.orders || []).length;
  const removedIds = [];
  db.orders = (db.orders || []).filter(o => {
    const nick = (o.nick || '').toLowerCase();
    const isTest = nick.includes('teste') || nick.includes('test') || nick.startsWith('player_');
    if (isTest && o.id !== undefined) removedIds.push(String(o.id));
    return !isTest;
  });
  db.deletedOrderIds = Array.from(new Set([...(db.deletedOrderIds || []).map(String), ...removedIds]));
  await saveDbNow(db, true);
  res.json({ success: true, removedCount: initialLen - db.orders.length, orders: db.orders, updatedAt: db.updatedAt });
});

app.post('/api/admin/reload-db', async (req, res) => {
  try {
    await readLatestDbFromCloudKv(true);
    res.json({
      success: true,
      message: 'Banco sincronizado com a nuvem!',
      orders: (db.orders || []).length,
      pending: (db.pendingDeliveries || []).length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Venda Manual (Admin)
app.post('/api/admin/orders/manual', async (req, res) => {
  await readLatestDbFromCloudKv(true);
  const { nick, productId, customName, price, command, announceDiscord, enqueueDelivery } = req.body || {};
  if (!nick || !nick.trim()) {
    return res.status(400).json({ error: 'Nick do jogador é obrigatório.' });
  }

  const cleanNick = nick.trim();
  let prodName = (customName && customName.trim()) || 'Item Manual';
  let cmd = command ? command.trim() : '';
  let cat = 'Manual';
  let guiIcon = 'CHEST';
  let finalPrice = parseFloat(price) || 0;

  if (productId && productId !== 'custom') {
    const prod = (db.products || []).find(p => String(p.id) === String(productId)) || (DEFAULT_PRODUCTS || []).find(p => String(p.id) === String(productId));
    if (prod) {
      prodName = prod.name;
      cat = prod.cat || 'Itens';
      guiIcon = prod.guiIcon || 'CHEST';
      if (!cmd) cmd = prod.command;
      if (price === undefined || price === '' || isNaN(price)) {
        finalPrice = prod.price || 0;
      }
    }
  }

  const cleanCmd = (cmd || 'say Entregue {player}').replace(/{player}|{nick}/gi, cleanNick);
  const orderId = Math.floor(100000 + Math.random() * 900000);

  const newOrder = {
    id: orderId,
    nick: cleanNick,
    items: [{
      id: productId || 'manual-item',
      name: prodName,
      price: finalPrice,
      cat: cat,
      command: cleanCmd,
      guiIcon: guiIcon
    }],
    total: finalPrice,
    date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
    createdAt: new Date().toISOString(),
    status: 'aprovado',
    delivery_status: enqueueDelivery !== false ? 'pendente' : 'entregue',
    delivered: enqueueDelivery === false,
    paymentMethod: 'Manual (Admin)',
    approved_at: new Date().toISOString()
  };

  db.orders = db.orders || [];
  db.orders.unshift(newOrder);

  let deliveryItem = null;
  if (enqueueDelivery !== false) {
    deliveryItem = {
      id: generateSafeId(),
      orderId: newOrder.id,
      nick: cleanNick,
      product_name: prodName,
      category: cat,
      command: cleanCmd,
      gui_icon: guiIcon,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    db.pendingDeliveries = db.pendingDeliveries || [];
    db.pendingDeliveries.unshift(deliveryItem);
  }

  rememberKnownPlayer(db, cleanNick, { source: 'manual-sale' });
  await saveDbNow(db, true);

  // Disparar anúncio de compra via Bot do Discord (local ou REST fallback)
  if (announceDiscord) {
    if (isLocalBotOnline() && typeof bot.notifySale === 'function') {
      bot.notifySale(newOrder).catch(() => {});
    } else {
      getBridgeHeartbeat().then(hb => {
        const tok = getEffectiveDiscordToken(hb);
        if (tok) return sendSaleRest(tok, newOrder);
      }).catch(() => {});
    }
  }

  // Fallback Webhook do Discord se configurado
  if (announceDiscord && db.settings && db.settings.discordWebhookUrl) {
    sendDiscordWebhook(db.settings.discordWebhookUrl, {
      username: 'Ravok Network • Vendas',
      avatar_url: `https://mc-heads.net/avatar/${encodeURIComponent(cleanNick)}/128`,
      embeds: [{
        title: `💎 Venda Aprovada para ${cleanNick}!`,
        description: `O pedido **#${orderId}** (${prodName}) foi registrado e enviado para o \`/resgatar\`!`,
        color: 0xffb703,
        fields: [
          { name: 'Jogador', value: cleanNick, inline: true },
          { name: 'Valor', value: `R$ ${Number(finalPrice).toFixed(2).replace('.', ',')}`, inline: true }
        ],
        footer: { text: 'Ravok Network • Venda Manual' },
        timestamp: new Date().toISOString()
      }]
    });
  }

  res.json({
    success: true,
    message: `Venda manual #${orderId} realizada com sucesso para ${cleanNick}!`,
    order: newOrder,
    deliveryItem,
    orders: db.orders,
    pendingDeliveries: db.pendingDeliveries,
    goal: computeGoalStatus(),
    updatedAt: db.updatedAt
  });
});

// ----------------------------------------------------
// STATUS AO VIVO DO SERVIDOR MINECRAFT (jogar.ravok.network)
// ----------------------------------------------------
let serverStatusCache = {
  data: null,
  timestamp: 0
};

app.get('/api/server/status', async (req, res) => {
  const SERVER_IP = ((db.settings && (db.settings.serverIp || db.settings.minecraftIp)) || process.env.MINECRAFT_IP || 'jogar.ravok.network').trim();

  // Se o bot estiver inicializado, delega para a consulta direta resiliente compartilhada
  if (bot && typeof bot.fetchMinecraftStatus === 'function') {
    try {
      const status = await bot.fetchMinecraftStatus();
      if (status) return res.json(status);
    } catch (e) {}
  }

  const now = Date.now();

  // Cache de 25 segundos
  if (serverStatusCache.data && (now - serverStatusCache.timestamp) < 25000 && serverStatusCache.data.ip === SERVER_IP) {
    return res.json(serverStatusCache.data);
  }

  try {
    const response = await fetch(`https://api.mcstatus.io/v2/status/java/${encodeURIComponent(SERVER_IP)}`, {
      headers: { 'User-Agent': 'RavokNetwork/1.0' },
      signal: AbortSignal.timeout(4000)
    });

    if (response.ok) {
      const data = await response.json();
      const statusResult = {
        online: Boolean(data.online),
        ip: SERVER_IP,
        players: {
          online: data.players ? data.players.online : 0,
          max: data.players ? data.players.max : 100
        },
        version: data.version ? data.version.name_clean || data.version.name_raw : '1.20.x',
        motd: data.motd ? data.motd.clean : 'Ravok Network',
        icon: data.icon || null
      };

      serverStatusCache = { data: statusResult, timestamp: now };
      return res.json(statusResult);
    }
  } catch (err) {
    // Fallback mcsrvstat.us
    try {
      const fbRes = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(SERVER_IP)}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        const statusResult = {
          online: Boolean(fbData.online),
          ip: SERVER_IP,
          players: {
            online: fbData.players ? fbData.players.online : 0,
            max: fbData.players ? fbData.players.max : 100
          },
          version: fbData.version || '1.20.x',
          motd: (fbData.motd && fbData.motd.clean) ? fbData.motd.clean.join(' ') : 'Ravok Network',
          icon: fbData.icon || null
        };
        serverStatusCache = { data: statusResult, timestamp: now };
        return res.json(statusResult);
      }
    } catch (fbErr) {}
  }

  // Fallback se estiver offline ou em manutenção
  const offlineResult = {
    online: false,
    ip: SERVER_IP,
    players: { online: 0, max: 100 },
    version: '1.20.1',
    motd: 'Ravok Network'
  };
  serverStatusCache = { data: offlineResult, timestamp: now };
  res.json(offlineResult);
});

// Status geral do servidor / API
app.get('/api/health', (req, res) => {
  const { url, token } = getKvConfig();
  const storageEnvKeys = Object.keys(process.env).filter(k => /(KV|REDIS|UPSTASH|POSTGRES|BLOB|MONGO|SUPABASE)/i.test(k));
  res.json({
    status: 'online',
    server: 'Ravok Network Backend',
    version: '1.0.0',
    time: new Date().toISOString(),
    uptime: process.uptime(),
    kvConfigured: Boolean(url && token),
    storageEnvKeys,
    kvDiag,
    stats: {
      products: (db.products || []).length,
      orders: (db.orders || []).length,
      pendingDeliveries: (db.pendingDeliveries || []).filter(d => d.status === 'pending').length,
      playersSynced: Object.keys(db.playerSync || {}).length
    }
  });
});

// Inicialização do Servidor (Standalone / Local)
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 RAVOK NETWORK — SERVIDOR ATIVO NA PORTA ${PORT}`);
  console.log(`------------------------------------------------------`);
  console.log(`🌐 Loja Oficial:       http://localhost:${PORT}`);
  console.log(`⚙️  Painel Admin:       http://localhost:${PORT}/admin.html`);
  console.log(`🏆 Rankings & Perfil:  http://localhost:${PORT}/rankings.html`);
  console.log(`🔌 Endpoints API:      http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);

  // Inicializar Bot do Discord se o token estiver configurado (via Painel Admin ou variável de ambiente)
  const botToken = (db.settings && db.settings.discordBotToken) || process.env.DISCORD_BOT_TOKEN;
  if (botToken && bot && typeof bot.startBot === 'function') {
    bot.startBot(botToken).then(res => {
      if (res && res.success) {
        console.log(`🤖 Bot Discord conectado automaticamente como ${res.user || 'Online'}!`);
      } else if (res && res.error) {
        console.warn(`[Bot] Aviso na inicialização: ${res.error}`);
      }
    }).catch(err => {
      console.warn(`[Bot] Exceção ao iniciar bot: ${err.message}`);
    });
  }
});
}

module.exports = app;
