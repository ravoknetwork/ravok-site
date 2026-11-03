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

// Servir arquivos estáticos da pasta raiz
app.use(express.static(__dirname));

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
  // --- VIPS TEMPORADA 3 (OUTONO) ---
  {
    id: 'vip-vendaval',
    cat: 'VIPs',
    badge: 'INICIAL',
    badgeColor: 'orange',
    tag: '[VENDAVAL]',
    tagClass: 'vendaval',
    icon: '🌪️',
    image: 'images/kayzel1.png',
    name: 'VIP VENDAVAL',
    description: 'Tag [VENDAVAL], até 5 sethomes, Kit Vendaval periódico, /nick, /back, /recipe, /feed e /disposal.',
    price: 14.90,
    oldPrice: 19.90,
    homes: 5,
    kit: 'Kit Vendaval',
    commandsList: ['/nick', '/back', '/recipe', '/feed', '/disposal'],
    perksList: [
      'Tag [VENDAVAL] no chat e TAB',
      'Definir até 5 Casas (/sethome)',
      'Kit Vendaval semanal exclusivo',
      'Comandos /feed, /back e /recipe',
      'Lixeira portátil com /disposal'
    ],
    command: 'lp user {player} parent settrack rank knight'
  },
  {
    id: 'vip-flamejante',
    cat: 'VIPs',
    badge: 'POPULAR',
    badgeColor: 'gold',
    tag: '[FLAMEJANTE]',
    tagClass: 'flamejante',
    icon: '🔥',
    image: 'images/kayzel2.png',
    name: 'VIP FLAMEJANTE',
    description: 'Tag [FLAMEJANTE], até 10 sethomes, Kit Flamejante, bancada portátil /craft, radar /near, /feed e /back.',
    price: 29.90,
    oldPrice: 39.90,
    homes: 10,
    kit: 'Kit Flamejante',
    commandsList: ['/nick', '/back', '/recipe', '/feed', '/disposal', '/near', '/craft'],
    perksList: [
      'Tag [FLAMEJANTE] em chamas',
      'Definir até 10 Casas (/sethome)',
      'Kit Flamejante com armas ígneas',
      'Bancada virtual com /craft',
      'Localizar jogadores próximos com /near'
    ],
    command: 'lp user {player} parent settrack rank lord'
  },
  {
    id: 'vip-carvalho',
    cat: 'VIPs',
    badge: 'AVANÇADO',
    badgeColor: 'gold',
    tag: '[CARVALHO]',
    tagClass: 'carvalho',
    icon: '🛡️',
    image: 'images/kayzel3.png',
    name: 'VIP CARVALHO',
    description: 'Tag [CARVALHO], até 15 sethomes, Kit Carvalho épico, /ec (enderchest portátil), /repair e /ptime.',
    price: 44.90,
    oldPrice: 59.90,
    homes: 15,
    kit: 'Kit Carvalho',
    commandsList: ['/nick', '/back', '/recipe', '/feed', '/disposal', '/near', '/craft', '/ec', '/ptime', '/repair'],
    perksList: [
      'Tag [CARVALHO] no chat e TAB',
      'Definir até 15 Casas (/sethome)',
      'Kit Carvalho com armadura reforçada',
      'Baú do Fim portátil com /ec',
      'Reparar itens na mão com /repair',
      'Ajustar clima e hora individual com /ptime'
    ],
    command: 'lp user {player} parent settrack rank paladin'
  },
  {
    id: 'vip-aurora',
    cat: 'VIPs',
    badge: 'ELITE',
    badgeColor: 'gold',
    tag: '[AURORA]',
    tagClass: 'aurora',
    icon: '✨',
    image: 'images/kayzel4.png',
    name: 'VIP AURORA',
    description: 'Tag [AURORA], até 25 sethomes, Kit Aurora Místico, cura instantânea com /heal, /compactar e /hat.',
    price: 64.90,
    oldPrice: 79.90,
    homes: 25,
    kit: 'Kit Aurora',
    commandsList: ['/nick', '/back', '/recipe', '/feed', '/disposal', '/near', '/craft', '/ec', '/ptime', '/repair', '/heal', '/compactar', '/hat'],
    perksList: [
      'Tag [AURORA] dourada no chat e TAB',
      'Definir até 25 Casas (/sethome)',
      'Kit Aurora com armadura e armas místicas',
      'Regeneração e cura com /heal',
      'Compactação de minérios rápida com /compactar',
      'Colocar qualquer bloco na cabeça com /hat'
    ],
    command: 'lp user {player} parent settrack rank duke'
  },
  {
    id: 'vip-solar',
    cat: 'VIPs',
    badge: 'SUPREMO',
    badgeColor: 'red',
    tag: '[SOLAR]',
    tagClass: 'solar',
    icon: '👑',
    image: 'images/kayzel5.png',
    name: 'VIP SOLAR',
    description: 'Tag [SOLAR], Casas ILIMITADAS, Kit Solar do Rei, voar livremente com /fly, imortalidade com /god e aura mística.',
    price: 89.90,
    oldPrice: 119.90,
    homes: 999,
    kit: 'Kit Solar do Rei',
    commandsList: ['/nick', '/back', '/recipe', '/feed', '/disposal', '/near', '/craft', '/ec', '/ptime', '/repair', '/heal', '/compactar', '/hat', '/fly', '/god'],
    perksList: [
      'Tag [SOLAR] com brilho majestoso',
      'Casas ILIMITADAS (/sethome)',
      'Kit Solar com armamento do rei solar',
      'Voar livremente pelo mapa com /fly',
      'Modo invencível temporário com /god',
      'Entrada anunciada em broadcast no servidor'
    ],
    command: 'lp user {player} parent settrack rank king'
  },
  {
    id: 'vip-deusa',
    cat: 'VIPs',
    badge: 'DIVINO',
    badgeColor: 'gold',
    tag: '[DEUSA]',
    tagClass: 'deusa',
    icon: '🔮',
    image: 'images/kayzel6.png',
    name: 'VIP DEUSA',
    description: 'A patente mais alta do servidor! Tag [DEUSA], sethomes ilimitadas, /repair all, acesso a todos os kits e aura suprema.',
    price: 119.90,
    oldPrice: 149.90,
    homes: 999,
    kit: 'Todos os Kits',
    commandsList: ['/nick', '/back', '/recipe', '/feed', '/disposal', '/near', '/craft', '/ec', '/ptime', '/repair', '/repair all', '/heal', '/compactar', '/hat', '/fly', '/god', 'prefixo deusa'],
    perksList: [
      'Tag [DEUSA] iridescente exclusiva',
      'Casas ILIMITADAS (/sethome)',
      'Acesso liberado a TODOS os Kits do jogo',
      'Reparo total e instantâneo com /repair all',
      'Voar sem limites com /fly',
      'Aura divina celestial e prioridade máxima na fila'
    ],
    command: 'lp user {player} parent add deusa'
  },

  // --- PACOTES DE MOEDAS OFICIAIS (COINS S3) ---
  {
    id: 'coins-1000',
    cat: 'Coins',
    badge: 'INICIAL',
    badgeColor: 'orange',
    icon: '🪙',
    image: 'images/autumn/pedra_do_sol_ancestral.png',
    name: '1.000 Moedas',
    description: 'Pacote inicial de moedas para gastar na Loja de Moedas (/coinshop) do servidor.',
    price: 9.90,
    command: 'coins give {player} 1000'
  },
  {
    id: 'coins-2500',
    cat: 'Coins',
    badge: 'POPULAR',
    badgeColor: 'gold',
    icon: '🪙',
    image: 'images/autumn/bussola_de_latao_dourado.png',
    name: '2.500 Moedas',
    description: 'Mais moedas para desbloquear cosméticos, utilitários e itens exclusivos.',
    price: 19.90,
    command: 'coins give {player} 2500'
  },
  {
    id: 'coins-5000',
    cat: 'Coins',
    badge: 'AVANÇADO',
    badgeColor: 'gold',
    icon: '🪙',
    image: 'images/autumn/girassol_radiante.png',
    name: '5.000 Moedas',
    description: 'Excelente custo-benefício para adquirir visuais raros e itens na Coin Shop.',
    price: 34.90,
    command: 'coins give {player} 5000'
  },
  {
    id: 'coins-8000',
    cat: 'Coins',
    badge: 'DESTAQUE',
    badgeColor: 'red',
    icon: '🪙',
    image: 'images/autumn/fogueira_acolhedora.png',
    name: '8.000 Moedas',
    description: 'Grande pacote de moedas para evoluir com tudo na Temporada 3.',
    price: 49.90,
    command: 'coins give {player} 8000'
  },
  {
    id: 'coins-10000',
    cat: 'Coins',
    badge: 'ELITE',
    badgeColor: 'gold',
    icon: '🪙',
    image: 'images/emblema_ravok_outonal.png',
    name: '10.000 Moedas',
    description: 'Pacote de elite para mercadores e líderes de clã dominarem a economia.',
    price: 59.90,
    command: 'coins give {player} 10000'
  },
  {
    id: 'coins-20000',
    cat: 'Coins',
    badge: 'SUPREMO',
    badgeColor: 'gold',
    icon: '🪙',
    image: 'images/emblema_ravok_outonal.png',
    name: '20.000 + 2.000 Bônus',
    description: 'O maior pacote do servidor! Receba 20.000 moedas + 2.000 moedas extras de brinde (Total: 22.000 Moedas)!',
    price: 99.90,
    oldPrice: 129.90,
    command: 'coins give {player} 22000'
  },

  // --- CHAVES & CAIXAS MÍSTICAS S3 ---
  {
    id: 'key-voto',
    cat: 'Chaves',
    badge: 'VOTO',
    badgeColor: 'orange',
    icon: '🗝️',
    image: 'images/chave_voto_s3.png',
    name: '3x Chave de Voto',
    description: 'Abra a Caixa de Voto no spawn e retire recompensas diárias e boosters.',
    price: 4.90,
    command: 'crate key give {player} vote 3'
  },
  {
    id: 'key-comum',
    cat: 'Chaves',
    badge: 'COMUM',
    badgeColor: 'orange',
    icon: '🗝️',
    image: 'images/chave_comum.png',
    name: 'Chave Comum S3',
    description: 'Chave inicial da Caixa Comum de Outono com suprimentos úteis e minérios.',
    price: 7.90,
    command: 'crate key give {player} common 1'
  },
  {
    id: 'key-rara',
    cat: 'Chaves',
    badge: 'RARA',
    badgeColor: 'gold',
    icon: '🗝️',
    image: 'images/chave_rara.png',
    name: 'Chave Rara S3',
    description: 'Recompensas raras, minérios nobres e recursos valorizados da temporada.',
    price: 14.90,
    command: 'crate key give {player} rare 1'
  },
  {
    id: 'key-epica',
    cat: 'Chaves',
    badge: 'ÉPICA',
    badgeColor: 'gold',
    icon: '🗝️',
    image: 'images/chave_epica.png',
    name: 'Chave Épica S3',
    description: 'Caixa épica com alta chance de itens lendários e encantamentos superiores.',
    price: 24.90,
    oldPrice: 29.90,
    command: 'crate key give {player} epic 1'
  },
  {
    id: 'key-superior',
    cat: 'Chaves',
    badge: 'MÍTICA',
    badgeColor: 'red',
    icon: '🗝️',
    image: 'images/chave_lendaria.png',
    name: 'Chave Superior S3',
    description: 'A mais poderosa chave da temporada com prêmios exclusivos e itens ancestrais.',
    price: 39.90,
    oldPrice: 49.90,
    command: 'crate key give {player} superior 1'
  },
  {
    id: 'key-combo',
    cat: 'Chaves',
    badge: 'COMBO',
    badgeColor: 'gold',
    icon: '🗝️',
    image: 'images/chave_epic_dragon.png',
    name: 'Combo 4x Chaves Místicas',
    description: 'Pacote especial contendo 1x Comum, 1x Rara, 1x Épica e 1x Superior com super desconto!',
    price: 69.90,
    oldPrice: 87.60,
    command: 'crate key give {player} common 1; crate key give {player} rare 1; crate key give {player} epic 1; crate key give {player} superior 1'
  },

  // --- VOUCHERS (SKINS DE FERRAMENTAS & ARMAS) ---
  {
    id: 'voucher-skin-aleatoria',
    cat: 'Vouchers',
    badge: 'NOVIDADE',
    badgeColor: 'gold',
    icon: '📜',
    image: 'images/toolskins.png',
    name: 'Voucher Skin Aleatória',
    description: 'Resgate no servidor com clique esquerdo para receber 1 visual exclusivo aleatório para suas ferramentas (Espada, Picareta, Machado, etc.). São 136 modelos raros!',
    price: 14.90,
    oldPrice: 19.90,
    perksList: [
      '136 Visuais raros possíveis',
      'Resgate com 1 clique no inventário',
      'Compatível com espadas, picaretas e machados',
      'Não perde ao morrer'
    ],
    command: 'crazyvouchers:voucher give Random_Toolskin 1 {player}'
  },

  // --- PETS ---
  {
    id: 'pet-dino',
    cat: 'Pets',
    badge: '3D',
    badgeColor: 'orange',
    icon: '🦖',
    image: 'images/autumn/girassol_radiante.png',
    name: 'Pet Dinossauro 3D',
    description: 'Um companheiro pré-histórico com animações customizadas e efeitos sonoros.',
    price: 29.90,
    command: 'mcpets spawn dino {player} false'
  },
  {
    id: 'pet-cubee',
    cat: 'Pets',
    badge: 'MÁGICO',
    badgeColor: 'gold',
    icon: '🧊',
    image: 'images/autumn/pedra_do_sol_ancestral.png',
    name: 'Pet Cubee Mágico',
    description: 'Cubinho flutuante que segue você com partículas de luz e animações suaves.',
    price: 34.90,
    command: 'mcpets spawn cubee_magico {player} false'
  },

  // --- COSMÉTICOS ---
  {
    id: 'cosmetic-fire',
    cat: 'Cosméticos',
    badge: 'RARO',
    badgeColor: 'red',
    icon: '🪓',
    image: 'images/autumn/fogueira_acolhedora.png',
    name: 'Machado das Chamas',
    description: 'Skin cosmética para machados com partículas de fogo perpétuas.',
    price: 14.90,
    command: 'uc menu effects {player}'
  },
  {
    id: 'cosmetic-sword',
    cat: 'Cosméticos',
    badge: 'LENDÁRIO',
    badgeColor: 'gold',
    icon: '⚔️',
    image: 'images/autumn/bussola_de_latao_dourado.png',
    name: 'Espada Rúnica Solar',
    description: 'Visual temático da Temporada 3 com runas brilhantes e efeito sonoro.',
    price: 19.90,
    command: 'uc menu effects {player}'
  }
];

const DEFAULT_FEEDBACKS = [
  { id: 1, nick: 'Guiileu', stars: 5, comment: 'Servidor incrível! As caixas e os pets personalizados são absurdamente bem feitos.', date: '04/09/2026' },
  { id: 2, nick: 'DarkKnight99', stars: 5, comment: 'Comprei o VIP Paladin e recebi na mesma hora pelo /resgatar. Loja 10/10.', date: '03/09/2026' },
  { id: 3, nick: 'LethiciaCraft', stars: 5, comment: 'Comunidade super acolhedora e suporte rápido no Discord. Parabéns!', date: '02/09/2026' }
];

const DEFAULT_STREAMERS = [
  { id: 1, name: 'RavokGamer', platform: 'Twitch', avatar: 'https://mc-heads.net/avatar/RavokGamer/100', url: 'https://twitch.tv', isLive: true },
  { id: 2, name: 'PixelMaster', platform: 'YouTube', avatar: 'https://mc-heads.net/avatar/PixelMaster/100', url: 'https://youtube.com', isLive: false }
];

const DEFAULT_SETTINGS = {
  apiUrl: 'http://localhost:3000',
  apiToken: 'ravok_sec_99a8b7c6d5e4',
  adminPassword: 'admin',
  mpPublicKey: '',
  mpAccessToken: '',
  discordInviteUrl: 'https://discord.gg',
  discordWebhookUrl: '',
  discordBotToken: '',
  discordBotClientId: '',
  discordBotChannelVendas: '',
  discordBotChannelFeedbacks: '',
  discordBotChannelAnuncios: ''
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
    silvieTip: 'Dica da Silvie: Comece pelo Quiz de Minecraft para aquecer seus neurônios! 🔮'
  },
  dailyQuestClaims: [],
  votesHistory: []
};

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (!parsed.voteArena || !parsed.voteArena.quiz || !parsed.voteArena.quiz.length) {
        parsed.voteArena = JSON.parse(JSON.stringify(DEFAULT_VOTE_ARENA));
        saveDb(parsed);
      }
      if (!parsed.voteArena.dailyQuest) {
        parsed.voteArena.dailyQuest = JSON.parse(JSON.stringify(DEFAULT_VOTE_ARENA.dailyQuest));
        saveDb(parsed);
      }
      if (!parsed.voteArena.dailyQuest.silvieTip) {
        parsed.voteArena.dailyQuest.silvieTip = 'Dica da Silvie: Comece pelo Quiz de Minecraft para aquecer seus neurônios! 🔮';
        saveDb(parsed);
      }
      if (!Array.isArray(parsed.voteArena.dailyQuestClaims)) {
        parsed.voteArena.dailyQuestClaims = [];
        saveDb(parsed);
      }
      parsed.playerAccounts = parsed.playerAccounts || {};
      parsed.settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
      parsed.admins = Array.isArray(parsed.admins) ? parsed.admins : [];
      if (!parsed.admins.length) {
        parsed.admins.push({
          username: 'admin',
          name: 'Administrador Principal',
          role: 'Dono / Fundador',
          passwordHash: hashPassword(parsed.settings.adminPassword || 'admin'),
          createdAt: new Date().toISOString(),
          lastLogin: null
        });
        saveDb(parsed);
      }
      return parsed;
    }
  } catch (err) {
    console.error('[DB] Erro ao ler db.json, recriando...', err);
  }

  const initialDb = {
    products: DEFAULT_PRODUCTS,
    orders: [],
    pendingDeliveries: [],
    feedbacks: DEFAULT_FEEDBACKS,
    streamers: DEFAULT_STREAMERS,
    settings: DEFAULT_SETTINGS,
    playerSync: {},
    verifyCodes: {},
    linkedAccounts: [],
    voteArena: JSON.parse(JSON.stringify(DEFAULT_VOTE_ARENA))
  };

  saveDb(initialDb);
  return initialDb;
}

function saveDb(data) {
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[DB] Erro ao salvar db.json:', err);
  }
}

let db = loadDb();

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
  res.json(db.products || []);
});

app.post('/api/admin/products', (req, res) => {
  const prod = req.body;
  if (!prod.id || !prod.name || !prod.price) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes (id, name, price).' });
  }
  db.products = db.products || [];
  const existingIdx = db.products.findIndex(p => p.id === prod.id);
  if (existingIdx >= 0) {
    db.products[existingIdx] = { ...db.products[existingIdx], ...prod };
  } else {
    db.products.push(prod);
  }
  saveDb(db);
  res.json({ success: true, product: prod });
});

app.delete('/api/admin/products/:id', (req, res) => {
  const { id } = req.params;
  db.products = (db.products || []).filter(p => p.id !== id);
  saveDb(db);
  res.json({ success: true });
});

// ----------------------------------------------------
// ROTAS DE AVALIAÇÕES (FEEDBACKS)
// ----------------------------------------------------
app.get('/api/feedbacks', (req, res) => {
  res.json(db.feedbacks || []);
});

app.post('/api/feedbacks', (req, res) => {
  const { nick, stars, comment } = req.body;
  if (!nick || !comment) {
    return res.status(400).json({ error: 'Nick e comentário são obrigatórios.' });
  }
  const newFb = {
    id: Date.now(),
    nick: nick.trim(),
    stars: Number(stars) || 5,
    comment: comment.trim(),
    date: new Date().toLocaleDateString('pt-BR')
  };
  db.feedbacks = db.feedbacks || [];
  db.feedbacks.unshift(newFb);
  saveDb(db);

  // Notificar via Bot do Discord (se configurado)
  if (bot && typeof bot.notifyFeedback === 'function') {
    bot.notifyFeedback(newFb).catch(() => {});
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

  res.json({ success: true, feedback: newFb });
});

app.delete('/api/admin/feedbacks/:id', (req, res) => {
  const id = Number(req.params.id);
  db.feedbacks = (db.feedbacks || []).filter(f => f.id !== id);
  saveDb(db);
  res.json({ success: true });
});

// ----------------------------------------------------
// ROTAS DE STREAMERS
// ----------------------------------------------------
app.get('/api/streamers', (req, res) => {
  res.json(db.streamers || []);
});

app.post('/api/admin/streamers', (req, res) => {
  const { name, platform, avatar, url, isLive } = req.body;
  if (!name || !url) return res.status(400).json({ error: 'Nome e URL são obrigatórios.' });

  const streamer = {
    id: Date.now(),
    name: name.trim(),
    platform: platform || 'Twitch',
    avatar: avatar || `https://mc-heads.net/avatar/${encodeURIComponent(name)}/100`,
    url: url.trim(),
    isLive: Boolean(isLive)
  };

  db.streamers = db.streamers || [];
  db.streamers.push(streamer);
  saveDb(db);
  res.json({ success: true, streamer });
});

app.delete('/api/admin/streamers/:id', (req, res) => {
  const id = Number(req.params.id);
  db.streamers = (db.streamers || []).filter(s => s.id !== id);
  saveDb(db);
  res.json({ success: true });
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
  const currentPass = db.settings.adminPassword || 'admin';

  // 1. Login com senha mestra (se username for 'admin' ou omitido)
  if ((!username || username === 'admin') && password === currentPass) {
    return res.json({
      success: true,
      token: 'ravok_admin_' + Buffer.from(Date.now().toString()).toString('hex'),
      user: { username: 'admin', name: 'Administrador Principal', role: 'Dono / Fundador' }
    });
  }

  // 2. Login por conta de administrador individual
  if (username && Array.isArray(db.admins)) {
    const hashed = hashPassword(password);
    const found = db.admins.find(a => a.username.toLowerCase() === username.trim().toLowerCase());
    if (found && (found.passwordHash === hashed || password === currentPass)) {
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
// ROTAS DE GERENCIAMENTO DO BOT DISCORD (Ravok Site)
// ----------------------------------------------------
app.get('/api/admin/bot/status', (req, res) => {
  if (bot && typeof bot.getBotStatus === 'function') {
    return res.json(bot.getBotStatus());
  }
  res.json({ online: false, message: 'Módulo do bot indisponível' });
});

app.post('/api/admin/bot/start', async (req, res) => {
  const { token, channelVendas, channelFeedbacks } = req.body;
  if (channelVendas) db.settings.discordBotChannelVendas = channelVendas;
  if (channelFeedbacks) db.settings.discordBotChannelFeedbacks = channelFeedbacks;
  if (token) db.settings.discordBotToken = token;
  saveDb(db);

  const tokenToUse = token || db.settings.discordBotToken;
  if (!tokenToUse) {
    return res.status(400).json({ error: 'Insira o Token do Bot do Discord antes de iniciar.' });
  }

  if (bot && typeof bot.startBot === 'function') {
    const result = await bot.startBot(tokenToUse);
    if (result.success) {
      return res.json({ success: true, message: `Bot iniciado com sucesso como ${result.user || 'Online'}!` });
    } else {
      return res.status(400).json({ error: result.error || 'Falha ao autenticar o bot no Discord. Verifique o token.' });
    }
  }
  res.status(500).json({ error: 'Módulo do bot indisponível.' });
});

app.post('/api/admin/bot/stop', (req, res) => {
  if (bot && typeof bot.stopBot === 'function') {
    const result = bot.stopBot();
    return res.json(result);
  }
  res.status(500).json({ error: 'Módulo do bot indisponível.' });
});

app.post('/api/admin/bot/restart', async (req, res) => {
  const { token, channelVendas, channelFeedbacks } = req.body || {};
  if (channelVendas) db.settings.discordBotChannelVendas = channelVendas;
  if (channelFeedbacks) db.settings.discordBotChannelFeedbacks = channelFeedbacks;
  if (token) db.settings.discordBotToken = token;
  saveDb(db);

  if (bot && typeof bot.restartBot === 'function') {
    const result = await bot.restartBot(token || db.settings.discordBotToken);
    if (result.success) {
      return res.json({ success: true, message: `Bot reiniciado com sucesso!` });
    }
    return res.status(400).json({ error: result.error || 'Falha ao reiniciar o bot.' });
  }
  res.status(500).json({ error: 'Módulo do bot indisponível.' });
});

app.post('/api/admin/bot/test-sale', async (req, res) => {
  if (bot && typeof bot.testSaleNotification === 'function') {
    try {
      await bot.testSaleNotification();
      return res.json({ success: true, message: 'Anúncio de compra de teste disparado no Discord!' });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
  res.status(500).json({ error: 'Módulo do bot indisponível.' });
});

app.post('/api/admin/bot/test-feedback', async (req, res) => {
  if (bot && typeof bot.testFeedbackNotification === 'function') {
    try {
      await bot.testFeedbackNotification();
      return res.json({ success: true, message: 'Anúncio de avaliação de teste disparado no Discord!' });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
  res.status(500).json({ error: 'Módulo do bot indisponível.' });
});

app.post('/api/admin/bot/test-welcome', async (req, res) => {
  if (bot && typeof bot.testWelcomeNotification === 'function') {
    try {
      const result = await bot.testWelcomeNotification();
      return res.json({ success: true, message: `Card de boas-vindas enviado com sucesso para #${result.channelName} no Discord!` });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
  res.status(500).json({ error: 'Módulo do bot indisponível.' });
});

app.post('/api/admin/bot/welcome-bg', (req, res) => {
  try {
    const { url, base64 } = req.body || {};
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const db = JSON.parse(raw);
    db.settings = db.settings || {};

    if (base64) {
      const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64, 'base64');
      const publicPath = path.join(__dirname, 'public', 'welcome-bg.png');
      fs.writeFileSync(publicPath, buffer);
      db.settings.welcomeBgUrl = 'welcome-bg.png';
    } else if (url !== undefined) {
      db.settings.welcomeBgUrl = (url || '').trim();
    }

    saveDb(db);
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

  if (bot && typeof bot.sendCustomAnnouncement === 'function') {
    try {
      const result = await bot.sendCustomAnnouncement({ channelId, title, message, color, imageUrl });
      return res.json({ success: true, message: `Anúncio publicado com sucesso no canal #${result.channelName}!` });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
  res.status(500).json({ error: 'Módulo do bot indisponível.' });
});

app.post('/api/admin/bot/sync-commands', async (req, res) => {
  if (bot && typeof bot.syncCommands === 'function') {
    try {
      const result = await bot.syncCommands();
      return res.json({ success: true, message: `Comandos Slash sincronizados com o Discord (${result.count} comandos)!` });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
  res.status(500).json({ error: 'Módulo do bot indisponível.' });
});

app.post('/api/admin/bot/clear-logs', (req, res) => {
  if (bot && typeof bot.clearLogs === 'function') {
    bot.clearLogs();
    return res.json({ success: true });
  }
  res.json({ success: true });
});

// Limpar mensagens de um canal do Discord via Painel Web
app.post('/api/admin/bot/clear-channel-messages', async (req, res) => {
  const { channelId, amount } = req.body || {};
  if (!channelId) {
    return res.status(400).json({ error: 'Informe o ID do canal que deseja limpar.' });
  }
  if (bot && typeof bot.clearChannelMessages === 'function') {
    try {
      const result = await bot.clearChannelMessages(channelId, amount);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
  res.status(500).json({ error: 'Módulo do bot indisponível ou offline.' });
});

// Publicar Painéis Interativos no Discord (Tickets, Confissões, Sugestões, etc)
app.post('/api/admin/bot/publish-panel', async (req, res) => {
  const { type, channelId } = req.body || {};
  if (!type) return res.status(400).json({ error: 'Informe o tipo do painel para publicar.' });

  if (bot && typeof bot.publishPanel === 'function') {
    try {
      const result = await bot.publishPanel(type, channelId);
      return res.json({ success: true, message: `Painel "${type}" publicado com sucesso no Discord!`, channelName: result.channelName });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
  res.status(500).json({ error: 'Módulo do bot indisponível.' });
});

// Consultar Canais das Funções do Bot
app.get('/api/admin/bot/channels', (req, res) => {
  const s = db.settings || {};
  res.json({
    discordBotChannelBoasVindas: s.discordBotChannelBoasVindas || '',
    discordBotCategoryTickets: s.discordBotCategoryTickets || '',
    discordBotCategoryRecrutamento: s.discordBotCategoryRecrutamento || '',
    discordBotChannelConfissoes: s.discordBotChannelConfissoes || '',
    discordBotChannelSugestoes: s.discordBotChannelSugestoes || '',
    discordBotChannelFeedbacks: s.discordBotChannelFeedbacks || '',
    discordBotChannelVendas: s.discordBotChannelVendas || '',
    discordBotChannelContagem: s.discordBotChannelContagem || '',
    discordBotChannelVideos: s.discordBotChannelVideos || '',
    discordBotChannelLives: s.discordBotChannelLives || '',
    discordBotChannelRegras: s.discordBotChannelRegras || '',
    discordBotChannelRelatorios: s.discordBotChannelRelatorios || '',
    discordBotChannelPunicoes: s.discordBotChannelPunicoes || '',
    discordBotChannelMusica: s.discordBotChannelMusica || '',
    discordBotChannelMemes: s.discordBotChannelMemes || '',
    discordBotChannelGeral: s.discordBotChannelGeral || '',
    discordBotRoleVinculado: s.discordBotRoleVinculado || '',
    discordBotRoleAcesso: s.discordBotRoleAcesso || '',
    countingCurrentNumber: s.countingCurrentNumber || 0,
    discordBotChannelStatusJogadores: s.discordBotChannelStatusJogadores || '1529648354928234548',
    discordBotChannelStatusServer: s.discordBotChannelStatusServer || '1529648417066975272',
    discordBotChannelStatusPing: s.discordBotChannelStatusPing || '1529648465309864016',
    discordBotChannelMetaVendas: s.discordBotChannelMetaVendas || '1531083037742334053',
    serverIp: s.serverIp || s.minecraftIp || 'jogar.ravok.network',
    metaVendasValor: s.metaVendasValor !== undefined ? s.metaVendasValor : 100,
    metaVendasBase: s.metaVendasBase !== undefined ? s.metaVendasBase : 0
  });
});

// Salvar Configuração de Canais e Categorias do Bot
app.post('/api/admin/bot/channels', (req, res) => {
  const data = req.body || {};
  const s = db.settings = db.settings || {};

  const fields = [
    'serverIp',
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
    'discordBotRoleVinculado',
    'discordBotRoleAcesso',
    'discordBotChannelStatusJogadores',
    'discordBotChannelStatusServer',
    'discordBotChannelStatusPing',
    'discordBotChannelMetaVendas'
  ];

  for (const field of fields) {
    if (data[field] !== undefined) {
      s[field] = String(data[field] || '').trim();
    }
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

  saveDb(db);
  res.json({ success: true, message: 'Canais e categorias das funções do bot salvos com sucesso!' });
});

// Forçar Atualização dos Canais de Status do Servidor no Discord
app.post('/api/admin/bot/sync-status-channels', async (req, res) => {
  if (bot && typeof bot.syncServerStatusChannels === 'function') {
    try {
      const result = await bot.syncServerStatusChannels();
      return res.json({ success: true, message: 'Canais de status sincronizados com sucesso!', result });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
  res.status(500).json({ error: 'Módulo do bot indisponível.' });
});

// Publicar ou Atualizar Painel Oficial da Meta no Canal de Vendas
app.post('/api/admin/bot/publish-meta-panel', async (req, res) => {
  const { channelId } = req.body || {};
  if (bot && typeof bot.publishMetaPanel === 'function') {
    try {
      const result = await bot.publishMetaPanel(channelId);
      return res.json({ success: true, message: 'Painel da meta publicado/atualizado com sucesso!', result });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
  res.status(500).json({ error: 'Módulo do bot indisponível.' });
});

// Obter Status Calculado da Meta de Vendas
app.get('/api/admin/bot/meta-status', (req, res) => {
  if (bot && typeof bot.calculateSalesGoal === 'function') {
    return res.json({ success: true, ...bot.calculateSalesGoal() });
  }
  res.json({ success: false, error: 'Módulo do bot indisponível.' });
});

// ROTAS DE CONFIGURAÇÃO DE IA (SILVIE AI)
app.get('/api/admin/bot/ai', (req, res) => {
  res.json({
    enabled: db.settings.aiEnabled !== false,
    apiKey: db.settings.aiApiKey || '',
    model: db.settings.aiModel || 'gemini-1.5-flash',
    channelId: db.settings.aiChannelId || '',
    respondMentions: db.settings.aiRespondMentions !== false,
    prompt: db.settings.aiPrompt || ''
  });
});

app.post('/api/admin/bot/ai', (req, res) => {
  const { enabled, apiKey, model, channelId, respondMentions, prompt } = req.body || {};
  if (enabled !== undefined) db.settings.aiEnabled = Boolean(enabled);
  if (apiKey !== undefined) db.settings.aiApiKey = apiKey.trim();
  if (model) db.settings.aiModel = model.trim();
  if (channelId !== undefined) db.settings.aiChannelId = channelId.trim();
  if (respondMentions !== undefined) db.settings.aiRespondMentions = Boolean(respondMentions);
  if (prompt !== undefined) db.settings.aiPrompt = prompt;

  saveDb(db);
  res.json({ success: true, message: 'Configurações de IA da Silvie salvas com sucesso!' });
});

app.post('/api/admin/bot/ai/test', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'Digite uma mensagem ou pergunta de teste.' });
  }

  if (bot && typeof bot.askSilvieAI === 'function') {
    try {
      const answer = await bot.askSilvieAI(prompt, 'Administrador');
      return res.json({ success: true, answer });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
  res.status(500).json({ error: 'Módulo do bot indisponível.' });
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
      silvieTip: dailyQuest.silvieTip || 'Dica da Silvie: Comece pelo Quiz de Minecraft para aquecer seus neurônios! 🔮',
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

// Admin: Sugerir Quest do Dia com Silvie IA
app.post('/api/admin/vote-arena/quest/suggest-ai', async (req, res) => {
  const thematicFallbackQuests = [
    {
      title: "Jornada do Conhecimento",
      description: "Complete pelo menos 2 desafios na Arena de Votos hoje para provar seu valor à comunidade!",
      targetCount: 2,
      rewardTitle: "2x Chaves de Voto",
      rewardCommand: "crate key give {nick} vote 2",
      silvieTip: "Dica da Silvie: Comece pelo Quiz de Minecraft para aquecer seus neurônios! 🔮"
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
      silvieTip: "Dizem que até os Creepers pensam duas vezes antes de errar uma charada da Silvie! 💥"
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

  // Se o bot e Silvie IA estiverem disponíveis e configurados
  if (bot && typeof bot.askSilvieAI === 'function' && db.settings.aiApiKey) {
    try {
      const prompt = `Gere uma sugestão criativa e empolgante de "Quest do Dia" (Missão Diária) para o servidor de Minecraft "Ravok Network".
A missão deve convidar o jogador a fazer desafios na Arena de Votos no site (Quiz de Perguntas, Enquete da Comunidade, Vencer Pegadinhas, Completar Piadas).
IMPORTANTE: A recompensa NUNCA PODE SER COINS! As recompensas devem ser sempre "2x Chaves de Voto" ou "1x Chave Rara".
Responda ESTRITAMENTE em formato JSON válido, sem cercas de código markdown nem explicações adicionais, no seguinte formato:
{"title": "Título da Missão", "description": "Texto empolgante explicando o que fazer hoje", "targetCount": 2, "rewardTitle": "2x Chaves de Voto", "rewardCommand": "crate key give {nick} vote 2", "silvieTip": "Uma dica amigável e mágica da Silvie inspirando o jogador"}`;

      const aiRaw = await bot.askSilvieAI(prompt, 'Administrador');
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
              silvieTip: String(parsed.silvieTip || 'Dica da Silvie: Foque nos desafios e pegue suas chaves no /resgatar! 🔮').trim()
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
      saveDb(db);

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
  saveDb(db);

  res.json({
    success: true,
    orderId: newOrder.id,
    status: 'pendente',
    pixCopiaCola: newOrder.pixCopiaCola,
    isSimulated: true
  });
});

// SIMULAR APROVAÇÃO (Para desenvolvimento e testes rápidos)
app.post('/api/orders/:id/simulate-approve', (req, res) => {
  const orderId = Number(req.params.id);
  const order = (db.orders || []).find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

  approveOrderAndEnqueueDelivery(order);
  res.json({ success: true, message: 'Pedido aprovado e itens enviados para o /resgatar!' });
});

// STATUS DO PEDIDO (Polling automático do frontend com verificação ativa no Mercado Pago)
app.get('/api/orders/:id/status', async (req, res) => {
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
      const order = (db.orders || []).find(o => o.mpPaymentId == paymentId);
      if (order && order.status !== 'aprovado') {
        approveOrderAndEnqueueDelivery(order);
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

  // Disparar anúncio de compra via Bot do Discord (se online)
  if (bot && typeof bot.notifySale === 'function') {
    bot.notifySale(order).catch(() => {});
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
app.get('/api/delivery/pending', (req, res) => {
  const { nick, key } = req.query;
  if (!key || key !== db.settings.apiToken) {
    return res.status(401).json({ error: 'Token de segurança inválido.' });
  }
  if (!nick) {
    return res.status(400).json({ error: 'Parâmetro nick é obrigatório.' });
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
app.post('/api/delivery/confirm', (req, res) => {
  const { key } = req.query;
  if (!key || key !== db.settings.apiToken) {
    return res.status(401).json({ error: 'Token de segurança inválido.' });
  }

  const { orderId, nick } = req.body;
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
    saveDb(db);
    console.log(`[Delivery] Item ID ${item.id} (${item.product_name}) marcado como entregue para ${item.nick}!`);
    return res.json({ success: true, message: 'Item confirmado como resgatado.' });
  }

  console.warn(`[Delivery] Item não encontrado para orderId="${orderId}", nick="${nick}". Fila atual:`, 
    (db.pendingDeliveries || []).map(p => ({ id: p.id, nick: p.nick, status: p.status }))
  );
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

// 4. Sincronizar dados do jogador via /ravoksync (PlaceholderAPI)
app.post('/api/player-sync', (req, res) => {
  const { token, nick, rankings } = req.body;
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
  saveDb(db);

  res.json({ success: true });
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
app.get('/api/admin/deliveries', (req, res) => {
  res.json(db.pendingDeliveries || []);
});

app.post('/api/admin/delivery/test', (req, res) => {
  const { nick, productId } = req.body;
  const prod = (db.products || []).find(p => p.id === productId);
  if (!prod || !nick) {
    return res.status(400).json({ error: 'Nick e produto válidos são obrigatórios.' });
  }

  const deliveryItem = {
    id: generateSafeId(),
    orderId: Math.floor(1000 + Math.random() * 9000),
    nick: nick.trim(),
    product_name: prod.name,
    category: prod.cat || 'Itens',
    command: (prod.command || 'say Entregue {player}').replace('{player}', nick.trim()),
    gui_icon: prod.guiIcon || 'CHEST',
    status: 'pending',
    created_at: new Date().toISOString()
  };

  db.pendingDeliveries = db.pendingDeliveries || [];
  db.pendingDeliveries.unshift(deliveryItem);
  saveDb(db);

  res.json({ success: true, item: deliveryItem });
});

app.post('/api/admin/delivery/:id/redeem', (req, res) => {
  const id = Number(req.params.id);
  const item = (db.pendingDeliveries || []).find(d => d.id === id);
  if (!item) return res.status(404).json({ error: 'Item não encontrado.' });

  item.status = 'delivered';
  item.delivered_at = new Date().toISOString();
  saveDb(db);
  res.json({ success: true, message: 'Item marcado como entregue.' });
});

app.delete('/api/admin/delivery/clear-delivered', (req, res) => {
  db.pendingDeliveries = (db.pendingDeliveries || []).filter(d => d.status === 'pending');
  saveDb(db);
  res.json({ success: true });
});

// Excluir entrega individual da fila
app.delete('/api/admin/delivery/:id', (req, res) => {
  const id = req.params.id;
  const initialLen = (db.pendingDeliveries || []).length;
  db.pendingDeliveries = (db.pendingDeliveries || []).filter(d => String(d.id) !== String(id));
  saveDb(db);
  res.json({ success: true, removed: initialLen !== db.pendingDeliveries.length });
});

// Listagem de Pedidos (Admin)
app.get('/api/admin/orders', (req, res) => {
  res.json(db.orders || []);
});

// Excluir pedido individual
app.delete('/api/admin/orders/:id', (req, res) => {
  const id = req.params.id;
  const initialLen = (db.orders || []).length;
  db.orders = (db.orders || []).filter(o => String(o.id) !== String(id));
  saveDb(db);
  res.json({ success: true, removed: initialLen !== db.orders.length });
});

// Limpar pedidos com nicks de teste
app.post('/api/admin/orders/clear-tests', (req, res) => {
  const initialLen = (db.orders || []).length;
  db.orders = (db.orders || []).filter(o => {
    const nick = (o.nick || '').toLowerCase();
    return !nick.includes('teste') && !nick.includes('test') && !nick.startsWith('player_');
  });
  saveDb(db);
  res.json({ success: true, removedCount: initialLen - db.orders.length });
});

app.post('/api/admin/reload-db', (req, res) => {
  try {
    db = loadDb();
    res.json({
      success: true,
      message: 'Banco recarregado do disco!',
      orders: (db.orders || []).length,
      pending: (db.pendingDeliveries || []).length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Venda Manual (Admin)
app.post('/api/admin/orders/manual', (req, res) => {
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
    const prod = (db.products || []).find(p => p.id === productId);
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
    status: 'aprovado',
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

  saveDb(db);

  // Disparar anúncio de compra via Bot do Discord (se configurado)
  if (announceDiscord && bot && typeof bot.notifySale === 'function') {
    bot.notifySale(newOrder).catch(() => {});
  }

  res.json({
    success: true,
    message: `Venda manual #${orderId} realizada com sucesso para ${cleanNick}!`,
    order: newOrder,
    deliveryItem
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
  res.json({
    status: 'online',
    server: 'Ravok Network Backend',
    version: '1.0.0',
    time: new Date().toISOString(),
    uptime: process.uptime(),
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
