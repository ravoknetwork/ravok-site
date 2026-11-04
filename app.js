let cart = [];
const money = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const by = s => document.querySelector(s);
// Catálogo padrão de produtos
// Catálogo padrão de produtos - Temporada 3 (Outono & Pôr do Sol) - Estilo ReallyWorld
// Catálogo padrão de produtos - Temporada 3 (Outono & Pôr do Sol) - Estilo ReallyWorld
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
    image: 'images/kits/previewknight.png',
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
    image: 'images/kits/previewlord.png',
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
    image: 'images/kits/previewpaladin.png',
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
    image: 'images/gallery/npc_vip_aurora.png',
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
    badge: 'VALOR INESTIMÁVEL',
    badgeColor: 'gold',
    tag: '[SOLAR]',
    tagClass: 'solar',
    icon: '👑',
    image: 'images/kits/previewking.png',
    name: 'VIP SOLAR',
    description: 'O mais alto escalão dos nobres da Era de Ouro. Concedido exclusivamente em Eventos Históricos e Torneios do Reino. Casas ILIMITADAS, voar com /fly, /god e /repair all.',
    price: 0,
    oldPrice: null,
    inestimavel: true,
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
    badge: 'DIGNIDADE DIVINA',
    badgeColor: 'purple',
    tag: '[DEUSA]',
    tagClass: 'deusa',
    icon: '🔮',
    image: 'images/prefixes/deusa.png',
    name: 'VIP DEUSA',
    description: 'A patente mais sagrada e suprema da Ravok Network! Aura iridescente divina, acesso a TODOS os kits do servidor, /fly e comandos divinos. Valor Inestimável.',
    price: 0,
    oldPrice: null,
    inestimavel: true,
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

// Slides padrão da galeria
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

// Streamers padrão
const DEFAULT_STREAMERS = [
  {
    id: 'str-1',
    name: 'RavokPlayerTV',
    platform: 'Twitch',
    channelUrl: 'https://twitch.tv',
    avatar: 'https://mc-heads.net/avatar/RavokPlayer/64',
    isLive: true,
    bio: 'Transmissões diárias construindo megabases e explorando as dungeons do servidor!'
  },
  {
    id: 'str-2',
    name: 'CraftMasterBR',
    platform: 'YouTube',
    channelUrl: 'https://youtube.com',
    avatar: 'https://mc-heads.net/avatar/CraftMaster/64',
    isLive: false,
    bio: 'Série completa de Survival RPG, farm de coins e abertura de caixas raras.'
  },
  {
    id: 'str-3',
    name: 'LunaGamer',
    platform: 'TikTok',
    channelUrl: 'https://tiktok.com',
    avatar: 'https://mc-heads.net/avatar/LunaGamer/64',
    isLive: true,
    bio: 'Clipes diários com os melhores momentos, PvP na arena e sorteios para inscritos!'
  }
];

// Feedbacks padrão
const DEFAULT_FEEDBACKS = [
  {
    id: 'fb-1',
    nick: 'DargonLord',
    stars: 5,
    comment: 'O melhor servidor de survival que já joguei! Economia bem balanceada, suporte rápido e a entrega do VIP caiu na hora com o /resgatar.',
    date: '02/09/2026'
  },
  {
    id: 'fb-2',
    nick: 'StellaCraft',
    stars: 5,
    comment: 'Os pets mágicos são incrivelmente fofos e as caixas de voto realmente dão itens que valem a pena. Comunidade nota 10!',
    date: '03/09/2026'
  },
  {
    id: 'fb-3',
    nick: 'Pedro_Gamer99',
    stars: 5,
    comment: 'Zero lag e o sistema de RTP por continentes/mundo normal funciona liso. Parabéns à equipe do Ravok!',
    date: '04/09/2026'
  }
];

// Utilitários de leitura do LocalStorage
function getProducts() {
  const saved = localStorage.getItem('ravok_products_v5');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  localStorage.setItem('ravok_products_v5', JSON.stringify(DEFAULT_PRODUCTS));
  return DEFAULT_PRODUCTS;
}

function getSlides() {
  const saved = localStorage.getItem('ravok_slider_slides_s3_v4');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= DEFAULT_SLIDES.length) return parsed;
    } catch (e) {}
  }
  localStorage.setItem('ravok_slider_slides_s3_v4', JSON.stringify(DEFAULT_SLIDES));
  return DEFAULT_SLIDES;
}

window.goToSlide = function(idx) {
  currentSlideIndex = idx;
  renderSlider();
  const el = by('#galeria');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

function getStreamers() {
  const saved = localStorage.getItem('ravok_streamers');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  localStorage.setItem('ravok_streamers', JSON.stringify(DEFAULT_STREAMERS));
  return DEFAULT_STREAMERS;
}

function getFeedbacks() {
  const saved = localStorage.getItem('ravok_feedbacks');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  localStorage.setItem('ravok_feedbacks', JSON.stringify(DEFAULT_FEEDBACKS));
  return DEFAULT_FEEDBACKS;
}

function getDiscordSettings() {
  const saved = localStorage.getItem('ravok_discord_settings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return {
    inviteUrl: 'https://discord.gg',
    webhookUrl: ''
  };
}

// Enviar Notificação ao Discord via Webhook
async function sendDiscordNotification(title, description, fields = [], color = 0x00d4ff) {
  const settings = getDiscordSettings();
  if (!settings.webhookUrl || !settings.webhookUrl.startsWith('http')) return;

  try {
    const payload = {
      username: 'Ravok Network',
      avatar_url: 'https://mc-heads.net/avatar/Ravok/128',
      embeds: [{
        title: title,
        description: description,
        color: color,
        fields: fields,
        footer: { text: 'loja.ravok.network • Sistema Oficial' },
        timestamp: new Date().toISOString()
      }]
    };

    await fetch(settings.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('Erro ao disparar webhook do Discord:', err);
  }
}

// Carregar mascote personalizada se houver
function loadCustomMascot() {
  const customImg = localStorage.getItem('ravok_mascot_image');
  const imgEl = document.getElementById('heroMascotImg');
  if (customImg && imgEl) {
    imgEl.src = customImg;
  }
}

let products = getProducts();
const CATEGORY_META = {
  'Todos': { icon: '🏷️', label: 'Todos os Itens' },
  'VIPs': { icon: '👑', label: 'Privilégios & VIPs' },
  'Coins': { icon: '🪙', label: 'Moedas & Coins' },
  'Chaves': { icon: '🗝️', label: 'Caixas & Chaves' },
  'Vouchers': { icon: '📜', label: 'Vouchers & Skins' },
  'Pets': { icon: '🐾', label: 'Mascotes 3D' },
  'Cosméticos': { icon: '⚔️', label: 'Cosméticos & Armas' }
};

let activeCategory = 'Todos';


function filterCategoryAndScroll(category) {
  activeCategory = category;
  renderProducts();
  const el = by('#produtos');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}
window.filterCategoryAndScroll = filterCategoryAndScroll;

function renderProducts() {
  products = getProducts();
  const CATEGORY_ORDER = ['Todos', 'VIPs', 'Coins', 'Chaves', 'Vouchers', 'Pets', 'Cosméticos'];
  const availableCats = new Set(products.map(p => p.cat));
  const rawCategories = ['Todos', ...CATEGORY_ORDER.filter(c => c !== 'Todos' && availableCats.has(c))];
  availableCats.forEach(c => {
    if (!rawCategories.includes(c)) rawCategories.push(c);
  });
  
  // Render Left Category Sidebar
  const sidebarEl = by('#rwCategorySidebar') || by('#filters');
  if (sidebarEl) {
    sidebarEl.innerHTML = rawCategories.map(c => {
      const meta = CATEGORY_META[c] || { icon: '⭐', label: c };
      const isActive = c === activeCategory;
      const count = c === 'Todos' ? products.length : products.filter(p => p.cat === c).length;
      return `
        <button type="button" class="rw-cat-btn ${isActive ? 'active' : ''}" data-filter="${c}">
          <span class="rw-cat-icon">${meta.icon}</span>
          <span class="rw-cat-text">${meta.label}</span>
          <span class="rw-cat-count">${count}</span>
        </button>
      `;
    }).join('');
  }

  const filtered = activeCategory === 'Todos' 
    ? products 
    : products.filter(p => p.cat === activeCategory);

  const gridEl = by('#productGrid');
  if (gridEl) {
    gridEl.innerHTML = filtered.map(p => {
      const badgeText = p.badge || (p.cat === 'VIPs' ? 'SUPREMO' : 'OUTONO');
      const badgeClass = p.badgeColor || (p.cat === 'VIPs' ? 'gold' : 'orange');

      return `
        <article class="rw-card">
          <span class="rw-card-badge ${badgeClass}">${badgeText}</span>
          <div class="rw-card-media" onclick="openProductDetails('${p.id}')" style="cursor:pointer;" title="Clique para ver vantagens completas">
            <img src="${p.image || 'images/emblema_ravok_outonal.png'}" alt="${p.name}" class="rw-card-img" loading="lazy">
          </div>
          <div class="rw-card-info">
            ${p.tag ? `
              <div class="rw-card-tag-badge">
                <span class="tag-label">TAG</span>
                <span class="tag-val ${p.tagClass || ''}">${p.tag}</span>
              </div>
            ` : ''}
            <h3 class="rw-card-name">${p.name}</h3>
            
            ${p.perksList && p.perksList.length > 0 ? `
              <div class="rw-card-perks">
                ${p.perksList.slice(0, 2).map(perk => `
                  <div class="rw-card-perk-item">
                    <span class="icon">✓</span>
                    <span>${perk}</span>
                  </div>
                `).join('')}
              </div>
              <button type="button" class="rw-perks-toggle-btn" onclick="openProductDetails('${p.id}')">
                <span>Ver Vantagens 📜</span>
              </button>
            ` : `
              <p style="font-size:12px; color:rgba(255,255,255,0.7); margin:0 0 10px 0; line-height:1.4;">${p.description || ''}</p>
            `}

            <div class="rw-card-price-row">
              ${p.inestimavel || p.price === 0 ? `
                <span class="rw-card-price" style="color:var(--amber-gold); font-size:15px; font-weight:800; text-shadow:0 0 10px rgba(255,193,7,0.5);">✨ Valor Inestimável</span>
              ` : `
                <span class="rw-card-price-label">a partir de</span>
                <span class="rw-card-price">${money(p.price)}</span>
                ${p.oldPrice ? `<span class="rw-card-old-price">${money(p.oldPrice)}</span>` : ''}
              `}
            </div>
            ${p.inestimavel || p.price === 0 ? `
              <button type="button" class="rw-buy-btn" style="background:linear-gradient(135deg, rgba(255,193,7,0.15), rgba(216,67,21,0.25)); border:1px solid var(--amber-gold); color:var(--amber-gold);" onclick="openProductDetails('${p.id}')">Rank Especial</button>
            ` : `
              <button type="button" class="rw-buy-btn" data-add="${p.id}">Comprar</button>
            `}
          </div>
        </article>
      `;
    }).join('');
  }

  document.querySelectorAll('[data-filter]').forEach(b => {
    b.onclick = () => {
      activeCategory = b.dataset.filter;
      renderProducts();
    };
  });

  document.querySelectorAll('[data-add]').forEach(b => {
    b.onclick = () => addToCart(b.dataset.add);
  });
}

// ====================================================
// MODAL DE DETALHES E VANTAGENS DO VIP
// ====================================================
function openProductDetails(id) {
  const p = getProducts().find(item => item.id === id);
  if (!p) return;

  const modal = by('#vipDetailsModal');
  if (!modal) return;

  const titleEl = by('#vipModalTitle');
  const imgEl = by('#vipModalImg');
  const priceEl = by('#vipModalPrice');
  const oldPriceEl = by('#vipModalOldPrice');

  if (titleEl) titleEl.textContent = p.name;
  if (imgEl) imgEl.src = p.image || 'images/emblema_ravok_outonal.png';
  
  const buyBtn = by('#vipModalBuyBtn');

  if (p.inestimavel || p.price === 0) {
    if (priceEl) priceEl.textContent = '✨ Valor Inestimável';
    if (oldPriceEl) oldPriceEl.style.display = 'none';
    if (buyBtn) {
      buyBtn.textContent = 'Rank Especial (Não Comprável)';
      buyBtn.style.background = 'rgba(255,255,255,0.08)';
      buyBtn.style.color = 'var(--amber-gold)';
      buyBtn.style.border = '1px solid var(--amber-gold)';
      buyBtn.onclick = () => {
        alert('Este rank possui Valor Inestimável e é concedido apenas em eventos sagrados ou conquistas épicas do reino!');
      };
    }
  } else {
    if (priceEl) priceEl.textContent = money(p.price);
    if (oldPriceEl) {
      if (p.oldPrice) {
        oldPriceEl.textContent = money(p.oldPrice);
        oldPriceEl.style.display = 'inline';
      } else {
        oldPriceEl.style.display = 'none';
      }
    }
    if (buyBtn) {
      buyBtn.textContent = 'Adicionar à Sacola';
      buyBtn.style.background = '';
      buyBtn.style.color = '';
      buyBtn.style.border = '';
      buyBtn.onclick = () => {
        addToCart(p.id);
        modal.close();
      };
    }
  }

  const tagWrap = by('#vipModalTagWrap');
  if (tagWrap) {
    if (p.tag) {
      tagWrap.innerHTML = `
        <div class="rw-card-tag-badge" style="margin:0;">
          <span class="tag-label">TAG OFICIAL:</span>
          <span class="tag-val ${p.tagClass || ''}" style="font-size:13px;">${p.tag}</span>
        </div>
      `;
      tagWrap.style.display = 'block';
    } else {
      tagWrap.style.display = 'none';
    }
  }

  const perksContainer = by('#vipModalPerksList');
  if (perksContainer) {
    if (p.perksList && p.perksList.length > 0) {
      perksContainer.innerHTML = p.perksList.map(perk => `
        <div class="vip-perk-card">
          <span class="badge">VANTAGEM</span>
          <span>${perk}</span>
        </div>
      `).join('');
    } else {
      perksContainer.innerHTML = `<p style="font-size:13px; color:rgba(255,255,255,0.8); grid-column:span 2;">${p.description || ''}</p>`;
    }
  }

  const cmdsContainer = by('#vipModalCmdsWrap');
  const cmdsCloud = by('#vipModalCmdsCloud');
  if (cmdsContainer && cmdsCloud) {
    if (p.commandsList && p.commandsList.length > 0) {
      cmdsContainer.style.display = 'block';
      cmdsCloud.innerHTML = p.commandsList.map(cmd => `
        <span class="vip-cmd-tag">${cmd}</span>
      `).join('');
    } else {
      cmdsContainer.style.display = 'none';
    }
  }

  modal.showModal();
}
window.openProductDetails = openProductDetails;

// ====================================================
// CALCULADORA DINÂMICA DE COINS (ESTILO REALLYWORLD)
// ====================================================
function updateCoinsCalculator() {
  const slider = by('#coinsSlider');
  if (!slider) return;
  const coins = parseInt(slider.value, 10);
  
  // R$ 1,00 = ~35 Coins (descontos progressivos)
  let price = (coins * 0.032).toFixed(2);
  if (coins >= 1000) price = (coins * 0.028).toFixed(2);
  if (coins >= 3000) price = (coins * 0.025).toFixed(2);

  const priceEl = by('#calcPriceDisplay');
  const coinsEl = by('#calcCoinsDisplay');
  if (priceEl) priceEl.textContent = money(price);
  if (coinsEl) coinsEl.textContent = `${coins.toLocaleString('pt-BR')} Coins`;
}

function buyCustomCoins() {
  const slider = by('#coinsSlider');
  const coins = slider ? parseInt(slider.value, 10) : 700;
  
  let price = Number((coins * 0.032).toFixed(2));
  if (coins >= 1000) price = Number((coins * 0.028).toFixed(2));
  if (coins >= 3000) price = Number((coins * 0.025).toFixed(2));

  const customItem = {
    id: 'coins-custom-' + Date.now(),
    cat: 'Coins',
    name: `Pacote ${coins.toLocaleString('pt-BR')} Coins`,
    price: price,
    icon: '🪙',
    image: 'images/autumn/pedra_do_sol_ancestral.png',
    command: `coins give {player} ${coins}`
  };

  cart.push(customItem);
  renderCart();
  toast(`✓ "${customItem.name}" adicionado à sacola!`);
  
  // Abrir sacola
  const drawer = by('#drawer');
  const overlay = by('#overlay');
  if (drawer && overlay) {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.classList.add('show');
  }
}
window.updateCoinsCalculator = updateCoinsCalculator;
window.buyCustomCoins = buyCustomCoins;


function addToCart(id) {
  const prod = products.find(p => p.id === id);
  if (!prod) return;
  if (prod.inestimavel || prod.price === 0) {
    alert(`O rank ${prod.name} possui Valor Inestimável e não pode ser comprado diretamente na loja. Participe de eventos, torneios ou desafios especiais no servidor para conquistá-lo!`);
    return;
  }
  cart.push(prod);
  renderCart();
  toast(`"${prod.name}" adicionado à sacola.`);
}

let activeCoupon = null;

function getCartTotal() {
  const subtotal = cart.reduce((acc, p) => acc + Number(p.price), 0);
  if (!activeCoupon) return subtotal;
  const discount = subtotal * (Number(activeCoupon.discountPercent || 0) / 100);
  return Math.max(0, subtotal - discount);
}

function renderCart() {
  by('#cartCount').textContent = cart.length;
  if (!cart.length) {
    by('#cartItems').innerHTML = '<p style="color:#8da2c0; text-align:center; margin-top:40px;">Sua sacola está vazia.</p>';
  } else {
    by('#cartItems').innerHTML = cart.map((p, i) => `
      <div class="cart-item">
        <div class="mini">${p.icon && !p.icon.startsWith('http') ? p.icon : '✦'}</div>
        <div style="flex:1;">
          <strong>${p.name}</strong>
          <span>${money(p.price)}</span>
        </div>
        <button data-remove="${i}" title="Remover item">×</button>
      </div>
    `).join('');
  }

  const subtotal = cart.reduce((acc, p) => acc + Number(p.price), 0);
  if (activeCoupon) {
    const total = getCartTotal();
    by('#cartTotal').innerHTML = `<span style="font-size:12px; color:#8da2c0; text-decoration:line-through; margin-right:6px;">${money(subtotal)}</span>${money(total)}`;
  } else {
    by('#cartTotal').textContent = money(subtotal);
  }

  // Listener para aplicar cupom
  const applyBtn = by('#applyCouponBtn');
  if (applyBtn && !applyBtn.dataset.bound) {
    applyBtn.dataset.bound = 'true';
    applyBtn.onclick = async () => {
      const input = by('#couponInput');
      const code = input ? input.value.trim() : '';
      if (!code) return toast('Digite o código do cupom.');
      try {
        const res = await fetch('/api/coupons/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        const data = await res.json();
        if (res.ok && data.valid) {
          activeCoupon = data;
          const badge = by('#couponAppliedBadge');
          if (badge) {
            badge.textContent = `✓ Cupom ${data.code} aplicado (-${data.discountPercent}%)`;
            badge.style.display = 'block';
          }
          toast(`✓ Cupom "${data.code}" ativado com sucesso! -${data.discountPercent}%`);
          renderCart();
        } else {
          toast(data.error || 'Cupom inválido ou expirado.');
        }
      } catch (e) {
        toast('Erro ao validar cupom.');
      }
    };
  }

  document.querySelectorAll('[data-remove]').forEach(b => {
    b.onclick = () => {
      const idx = parseInt(b.dataset.remove, 10);
      cart.splice(idx, 1);
      renderCart();
    };
  });
}

// ====================================================
// SLIDER / CARROSSEL DA GALERIA DO SERVIDOR
// ====================================================
let currentSlideIndex = 0;
let slideInterval = null;

function renderSlider() {
  const slides = getSlides();
  const wrapper = by('#sliderWrapper');
  const dots = by('#sliderDots');

  if (!slides.length) {
    wrapper.innerHTML = '<div style="color:var(--muted); text-align:center; padding:100px;">Nenhuma foto na galeria.</div>';
    return;
  }

  wrapper.innerHTML = slides.map((s, idx) => `
    <div class="slide-item ${idx === currentSlideIndex ? 'active' : ''}">
      <img src="${s.img}" alt="${s.title}">
      <div class="slide-caption">
        <h3>${s.title}</h3>
        <p>${s.desc || ''}</p>
      </div>
    </div>
  `).join('');

  dots.innerHTML = slides.map((_, idx) => `
    <button class="slider-dot ${idx === currentSlideIndex ? 'active' : ''}" data-slide="${idx}" aria-label="Slide ${idx + 1}"></button>
  `).join('');

  document.querySelectorAll('.slider-dot').forEach(b => {
    b.onclick = () => goToSlide(parseInt(b.dataset.slide, 10));
  });

  startSliderAutoPlay();
}

function goToSlide(index) {
  const slides = getSlides();
  if (!slides.length) return;
  currentSlideIndex = (index + slides.length) % slides.length;

  document.querySelectorAll('.slide-item').forEach((s, idx) => {
    s.classList.toggle('active', idx === currentSlideIndex);
  });
  document.querySelectorAll('.slider-dot').forEach((d, idx) => {
    d.classList.toggle('active', idx === currentSlideIndex);
  });

  resetSliderTimer();
}

function startSliderAutoPlay() {
  clearInterval(slideInterval);
  slideInterval = setInterval(() => {
    goToSlide(currentSlideIndex + 1);
  }, 5000);
}

function resetSliderTimer() {
  clearInterval(slideInterval);
  startSliderAutoPlay();
}

by('#sliderPrevBtn').onclick = () => goToSlide(currentSlideIndex - 1);
by('#sliderNextBtn').onclick = () => goToSlide(currentSlideIndex + 1);

// ====================================================
// STREAMERS & CRIADORES DE CONTEÚDO
// ====================================================
function renderStreamers() {
  const streamers = getStreamers();
  const grid = by('#streamersGrid');

  if (!streamers.length) {
    grid.innerHTML = '<p style="color:var(--muted); grid-column:1/-1;">Nenhum criador parceiro registrado no momento.</p>';
    return;
  }

  grid.innerHTML = streamers.map(s => `
    <article class="streamer-card">
      <div class="streamer-top">
        <div class="streamer-avatar">
          <img src="${s.avatar}" alt="${s.name}">
        </div>
        <div class="streamer-info">
          <h3>${s.name}</h3>
          <div style="display:flex; gap:8px; align-items:center;">
            <span class="streamer-platform" style="color:var(--blue-bright);">✦ ${s.platform}</span>
            ${s.isLive ? '<span class="badge-live"><i></i> AO VIVO</span>' : '<span class="badge-partner">OFICIAL</span>'}
          </div>
        </div>
      </div>
      <p class="streamer-bio">${s.bio || ''}</p>
      <a class="streamer-btn" href="${s.channelUrl}" target="_blank">
        <span>Acompanhar Canal</span> <span>↗</span>
      </a>
    </article>
  `).join('');
}

// ====================================================
// FEEDBACKS & AVALIAÇÕES DA COMUNIDADE
// ====================================================
function renderFeedbacks() {
  const feedbacks = getFeedbacks();
  const grid = by('#feedbacksGrid');

  if (!feedbacks.length) {
    grid.innerHTML = '<p style="color:var(--muted); grid-column:1/-1;">Seja o primeiro a deixar uma avaliação!</p>';
    return;
  }

  grid.innerHTML = feedbacks.map(f => {
    const starStr = '★'.repeat(f.stars) + '☆'.repeat(5 - f.stars);
    return `
      <article class="feedback-card">
        <div class="feedback-header">
          <img class="feedback-head-img" src="https://mc-heads.net/avatar/${f.nick}/64" alt="${f.nick}">
          <div class="feedback-nick">
            <strong>${f.nick}</strong>
            <small>${f.date || 'Recente'}</small>
          </div>
        </div>
        <div class="stars">${starStr}</div>
        <p class="feedback-text">"${f.comment}"</p>
      </article>
    `;
  }).join('');
}

// Modal de Feedback
by('#openFeedbackModalBtn').onclick = () => {
  const player = localStorage.getItem('ravokPlayer');
  if (player) by('#fbNick').value = player;
  by('#feedbackModal').showModal();
};

by('#feedbackForm').onsubmit = (e) => {
  e.preventDefault();
  const nick = by('#fbNick').value.trim();
  const stars = parseInt(by('#fbStars').value, 10) || 5;
  const comment = by('#fbComment').value.trim();

  if (!nick || !comment) return;

  const feedbacks = getFeedbacks();
  const newFb = {
    id: `fb-${Date.now()}`,
    nick: nick,
    stars: stars,
    comment: comment,
    date: new Date().toLocaleDateString('pt-BR')
  };
  feedbacks.unshift(newFb);
  localStorage.setItem('ravok_feedbacks', JSON.stringify(feedbacks));

  // Notificar no Discord via Webhook
  sendDiscordNotification(
    '⭐ Nova Avaliação no Site!',
    `**Jogador:** \`${nick}\`\n**Nota:** ${'★'.repeat(stars)}\n**Comentário:** "${comment}"`,
    [],
    0xfbbf24
  );

  by('#feedbackModal').close();
  by('#feedbackForm').reset();
  renderFeedbacks();
  toast('Obrigado pelo seu feedback!');
};

// ====================================================
// DISCORD LINK
// ====================================================
function updateDiscordLink() {
  const settings = getDiscordSettings();
  if (settings.inviteUrl && by('#discordLinkBtn')) {
    by('#discordLinkBtn').href = settings.inviteUrl;
  }
}

// ====================================================
// MODAIS, CHECKOUT & NICK
// ====================================================
function openDrawer() {
  by('#drawer').classList.add('open');
  by('#overlay').classList.add('show');
}

function closeAll() {
  stopOrderPolling();
  by('#drawer').classList.remove('open');
  by('#overlay').classList.remove('show');
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
}

function toast(text) {
  const t = by('#toast');
  t.textContent = text;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ====================================================
// STATUS DO SERVIDOR MINECRAFT (jogar.ravok.network)
// ====================================================
const SERVER_IP = 'jogar.ravok.network';

async function loadServerStatus() {
  let data = null;

  if (window.location.protocol.startsWith('http')) {
    try {
      const res = await fetch('/api/server/status');
      if (res.ok) data = await res.json();
    } catch (e) {}
  }

  // Fallback se aberto offline via file://
  if (!data) {
    try {
      const res = await fetch(`https://api.mcstatus.io/v2/status/java/${SERVER_IP}`);
      if (res.ok) {
        const raw = await res.json();
        data = {
          online: Boolean(raw.online),
          players: { online: raw.players ? raw.players.online : 0, max: raw.players ? raw.players.max : 100 },
          version: raw.version ? (raw.version.name_clean || raw.version.name_raw) : '1.21.x'
        };
      }
    } catch (e) {}
  }

  const dot = by('#serverPulseDot');
  const heroDot = by('#heroPulseDot');
  const badge = by('#serverStatusBadge');
  const playersText = by('#serverPlayersText');
  const heroOnlineNum = by('#heroOnlineCountNum');
  const heroPlayersCount = by('#heroPlayersCount');
  const versionTag = by('#serverVersionTag');
  const heroVersionTag = by('#heroVersionTag');

  if (data && data.online) {
    if (dot) dot.className = 'status-pulse-dot';
    if (heroDot) heroDot.className = 'status-pulse-dot-large';
    if (badge) {
      badge.textContent = '✦ Online';
      badge.className = 'status-badge-live';
    }
    const count = data.players ? data.players.online : 0;
    if (playersText) {
      playersText.innerHTML = `<b id="onlineCountNum">${count}</b> online`;
    }
    if (heroOnlineNum) {
      heroOnlineNum.textContent = count;
    }
    if (heroPlayersCount) {
      heroPlayersCount.innerHTML = `<b id="heroOnlineCountNum">${count}</b> jogador${count === 1 ? '' : 'es'} online`;
    }
    if (data.version) {
      if (versionTag) versionTag.textContent = data.version;
      if (heroVersionTag) heroVersionTag.textContent = data.version;
    }
  } else {
    if (dot) dot.className = 'status-pulse-dot offline';
    if (heroDot) heroDot.className = 'status-pulse-dot-large offline';
    if (badge) {
      badge.textContent = '🔴 Offline';
      badge.className = 'status-badge-live offline';
    }
    if (playersText) {
      playersText.textContent = 'Aguardando inicialização';
    }
    if (heroPlayersCount) {
      heroPlayersCount.innerHTML = `<span style="color:#ef4444;">Servidor Offline</span>`;
    }
  }
}

// Copiar IP jogar.ravok.network com feedback visual interativo
function copyServerIpAction() {
  const copyBtn = by('#heroCopyIpBtn');
  const copyLabel = by('.copy-label');
  const copiedLabel = by('.copied-label');

  navigator.clipboard.writeText(SERVER_IP).then(() => {
    toast(`✓ IP "${SERVER_IP}" copiado para a área de transferência!`);
    if (copyBtn) copyBtn.classList.add('copied');
    if (copyLabel) copyLabel.style.display = 'none';
    if (copiedLabel) copiedLabel.style.display = 'inline';

    setTimeout(() => {
      if (copyBtn) copyBtn.classList.remove('copied');
      if (copyLabel) copyLabel.style.display = 'inline';
      if (copiedLabel) copiedLabel.style.display = 'none';
    }, 2500);
  }).catch(() => {
    toast(`IP: ${SERVER_IP}`);
  });
}

const copyIpBox = by('#copyIp');
if (copyIpBox) {
  copyIpBox.onclick = (e) => {
    e.preventDefault();
    copyServerIpAction();
  };
}

const heroCopyBtn = by('#heroCopyIpBtn');
if (heroCopyBtn) {
  heroCopyBtn.onclick = (e) => {
    e.stopPropagation();
    copyServerIpAction();
  };
}

// ====================================================
// ESPAÇO PRÓPRIO DE VOTOS (RAVOK VOTE ARENA)
// ====================================================
let voteArenaData = null;

async function openVoteArena() {
  const dialog = by('#voteArenaDialog');
  if (!dialog) return;

  const player = localStorage.getItem('ravokPlayer') || '';
  updateVotePlayerDisplay(player);

  dialog.showModal();
  await loadVoteArenaData(player);
}

function updateVotePlayerDisplay(player) {
  const nickDisp = by('#votePlayerNickDisplay');
  const avatar = by('#votePlayerAvatar');
  if (player) {
    if (nickDisp) nickDisp.textContent = player;
    if (avatar) avatar.src = `https://mc-heads.net/avatar/${encodeURIComponent(player)}/36`;
  } else {
    if (nickDisp) nickDisp.textContent = 'Não informado (clique ao lado)';
    if (avatar) avatar.src = 'https://mc-heads.net/avatar/Steve/36';
  }
}

const voteChangeNickBtn = by('#voteChangeNickBtn');
if (voteChangeNickBtn) {
  voteChangeNickBtn.onclick = () => {
    by('#playerDialog').showModal();
  };
}

async function loadVoteArenaData(player) {
  try {
    const query = player ? `?nick=${encodeURIComponent(player)}` : '';
    const res = await fetch(`/api/vote/arena${query}`);
    if (res.ok) {
      voteArenaData = await res.json();
      renderVoteArena();
    }
  } catch (e) {
    console.warn('Erro ao carregar arena de votos da API.');
  }
}

function renderVoteArena() {
  if (!voteArenaData) return;

  // 1. Renderizar Quiz
  const q = (voteArenaData.quiz && voteArenaData.quiz[0]) || null;
  if (q && by('#quizQuestionText') && by('#quizOptionsContainer')) {
    by('#quizQuestionText').textContent = q.question;
    by('#quizOptionsContainer').innerHTML = q.options.map(opt => `
      <button type="button" class="challenge-opt-btn" onclick="window.submitVoteChallenge('quiz', '${q.id}', '${opt.id}', this)">
        <span>${opt.text}</span>
        <span style="font-size:12px; color:var(--muted);">Responder ↵</span>
      </button>
    `).join('');
  }

  // 2. Renderizar Enquete
  const poll = voteArenaData.poll;
  if (poll && by('#pollQuestionText') && by('#pollOptionsContainer')) {
    by('#pollQuestionText').textContent = poll.question;
    by('#pollOptionsContainer').innerHTML = (poll.options || []).map(opt => `
      <button type="button" class="challenge-opt-btn" onclick="window.submitVoteChallenge('poll', '${poll.id}', '${opt.id}', this)">
        <span>${opt.text}</span>
        <span style="font-size:12px; color:var(--blue-bright);">Votar 🗳️</span>
      </button>
    `).join('');

    renderPollResults(poll);
  }

  // 3. Renderizar Pegadinha
  const prank = (voteArenaData.pranks && voteArenaData.pranks[0]) || null;
  if (prank && by('#prankRiddleText') && by('#prankOptionsContainer')) {
    by('#prankRiddleText').textContent = `"${prank.riddle}"`;
    by('#prankOptionsContainer').innerHTML = (prank.options || []).map(opt => `
      <button type="button" class="challenge-opt-btn" onclick="window.submitVoteChallenge('prank', '${prank.id}', '${opt.id}', this)">
        <span>${opt.text}</span>
        <span style="font-size:12px; color:var(--muted);">Escolher ↵</span>
      </button>
    `).join('');
  }

  // 4. Renderizar Piada
  const joke = (voteArenaData.jokes && voteArenaData.jokes[0]) || null;
  if (joke && by('#jokeSetupText') && by('#jokeOptionsContainer')) {
    by('#jokeSetupText').textContent = `"${joke.setup}"`;
    by('#jokeOptionsContainer').innerHTML = (joke.options || []).map(opt => `
      <button type="button" class="challenge-opt-btn" onclick="window.submitVoteChallenge('joke', '${joke.id}', '${opt.id}', this)">
        <span>${opt.text}</span>
        <span style="font-size:12px; color:var(--muted);">Completar 😂</span>
      </button>
    `).join('');
  }
}

function renderPollResults(poll) {
  const container = by('#pollResultsContainer');
  if (!container || !poll || !poll.options) return;
  container.innerHTML = `
    <div style="font-size:12px; font-weight:700; color:var(--ravok-neon-aqua); margin-bottom:8px;">
      📊 RESULTADOS PARCIAIS DA COMUNIDADE (${poll.totalVotes || 0} votos totais):
    </div>
    ${poll.options.map(o => `
      <div class="poll-result-bar">
        <div class="poll-bar-header">
          <span style="color:#e2e8f0;">${o.text}</span>
          <strong style="color:var(--blue);">${o.percent || 0}% (${o.votes || 0})</strong>
        </div>
        <div class="poll-bar-bg">
          <div class="poll-bar-fill" style="width: ${o.percent || 0}%;"></div>
        </div>
      </div>
    `).join('')}
  `;
}

// Submeter Desafio da Arena de Votos
window.submitVoteChallenge = async function(type, itemId, answerId, btnEl) {
  const player = localStorage.getItem('ravokPlayer');
  if (!player) {
    toast('Primeiro informe seu nick no Minecraft para receber a chave!');
    by('#playerDialog').showModal();
    return;
  }

  const feedbackBox = by(`#${type}FeedbackBox`);
  if (feedbackBox) feedbackBox.style.display = 'none';

  try {
    const res = await fetch('/api/vote/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nick: player,
        challengeType: type,
        itemId,
        answerId,
        pollOptionId: answerId
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (btnEl) btnEl.classList.add('correct');
      if (feedbackBox) {
        feedbackBox.className = 'challenge-feedback success';
        feedbackBox.style.display = 'block';
        feedbackBox.textContent = data.message || '✓ Voto validado! Sua 1x Chave de Voto foi enviada para o /resgatar!';
      }

      if (type === 'poll' && data.poll) {
        const resBox = by('#pollResultsContainer');
        if (resBox) resBox.style.display = 'block';
        renderPollResults(data.poll);
      }

      const rewardBox = by('#voteRewardSuccessBox');
      if (rewardBox) rewardBox.style.display = 'flex';

      toast('🎉 Voto computado! Entre no servidor e use /resgatar para pegar sua Chave de Voto!');
    } else {
      if (btnEl) btnEl.classList.add('wrong');
      setTimeout(() => btnEl && btnEl.classList.remove('wrong'), 1500);
      if (feedbackBox) {
        feedbackBox.className = 'challenge-feedback error';
        feedbackBox.style.display = 'block';
        feedbackBox.textContent = data.error || 'Não foi possível computar o voto.';
      }
      toast(data.error || 'Resposta incorreta.');
    }
  } catch (err) {
    toast('Erro de conexão ao enviar voto. Tente novamente.');
  }
};

// Alternar abas da Arena de Votos
document.querySelectorAll('.vote-tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.vote-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.vote-challenge-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    const targetPane = by(`#pane-${tab}`);
    if (targetPane) targetPane.classList.add('active');
  };
});

by('#cartButton').onclick = openDrawer;
by('#overlay').onclick = closeAll;
document.querySelectorAll('[data-close]').forEach(b => b.onclick = closeAll);
by('#openPlayer').onclick = () => by('#playerDialog').showModal();
if (by('#voteButton')) by('#voteButton').onclick = openVoteArena;

// Salvar Nick do Jogador
by('#savePlayer').onclick = () => {
  const n = by('#playerName').value.trim();
  if (!/^[A-Za-z0-9_]{3,16}$/.test(n)) {
    return toast('Informe um nick válido de Minecraft (3 a 16 caracteres).');
  }
  localStorage.setItem('ravokPlayer', n);
  updateVotePlayerDisplay(n);
  closeAll();
  toast(`Nick "${n}" salvo com sucesso!`);
};

by('#playerName').value = localStorage.getItem('ravokPlayer') || '';

let currentCheckoutOrder = null;
let orderPollTimer = null;

function startOrderPolling(orderId) {
  stopOrderPolling();
  if (!window.location.protocol.startsWith('http') || !orderId) return;

  orderPollTimer = setInterval(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'aprovado') {
          stopOrderPolling();
          cart = [];
          renderCart();
          closeAll();
          toast(`✓ Pagamento Aprovado! Seus itens foram enviados para o jogo. Use /resgatar no servidor para retirar!`);
        }
      }
    } catch (e) {}
  }, 2500);
}

function stopOrderPolling() {
  if (orderPollTimer) {
    clearInterval(orderPollTimer);
    orderPollTimer = null;
  }
}

// Checkout com Mercado Pago / Pix
by('#checkout').onclick = async () => {
  if (!cart.length) {
    return toast('Adicione pelo menos um produto à sacola.');
  }
  const player = localStorage.getItem('ravokPlayer');
  if (!player) {
    closeAll();
    by('#playerDialog').showModal();
    return toast('Primeiro informe o seu nick no Minecraft.');
  }

  const total = getCartTotal();
  by('#checkoutNick').textContent = player;
  by('#checkoutValue').textContent = money(total);
  by('#checkoutOrderId').textContent = 'Gerando Pix...';

  // Chamar Backend se estiver em HTTP
  if (window.location.protocol.startsWith('http')) {
    try {
      const res = await fetch('/api/checkout/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick: player, items: cart, total })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        currentCheckoutOrder = data;
        by('#checkoutOrderId').textContent = `#${data.orderId}`;
        by('#pixCopiaColaInput').value = data.pixCopiaCola || '';
        
        if (data.pixQrBase64) {
          by('#pixQrImg').src = `data:image/png;base64,${data.pixQrBase64}`;
          by('#pixQrImg').style.display = 'block';
          by('#pixQrPlaceholder').style.display = 'none';
        } else {
          by('#pixQrImg').style.display = 'none';
          by('#pixQrPlaceholder').style.display = 'block';
        }

        closeAll();
        by('#checkoutDialog').showModal();
        startOrderPolling(data.orderId);
        return;
      }
    } catch (e) {
      console.warn('Falha no checkout do backend, usando modo offline.');
    }
  }

  // Fallback offline (file://)
  const orderId = Math.floor(100000 + Math.random() * 900000);
  currentCheckoutOrder = {
    orderId,
    pixCopiaCola: `00020126580014BR.GOV.BCB.PIX0136${Math.random().toString(36).substring(2, 15)}520400005303986540${total.toFixed(2)}5802BR5913RAVOK NETWORK6009SAO PAULO62070503***6304ABCD`,
    isSimulated: true
  };
  by('#checkoutOrderId').textContent = `#${orderId}`;
  by('#pixCopiaColaInput').value = currentCheckoutOrder.pixCopiaCola;
  by('#pixQrImg').style.display = 'none';
  by('#pixQrPlaceholder').style.display = 'block';

  closeAll();
  by('#checkoutDialog').showModal();
};

// Botão Copiar Código Pix
const copyPixBtn = by('#copyPixBtn');
if (copyPixBtn) {
  copyPixBtn.onclick = () => {
    const input = by('#pixCopiaColaInput');
    if (input && input.value) {
      navigator.clipboard.writeText(input.value).then(() => {
        toast('✓ Código Pix Copia e Cola copiado!');
      }).catch(() => {
        input.select();
        toast('Selecione e copie o código Pix.');
      });
    }
  };
}

// Ao clicar em "Simular / Confirmar Pagamento Aprovado" (se existir)
const simularPagamentoBtn = by('#simularPagamentoBtn');
if (simularPagamentoBtn) {
  simularPagamentoBtn.onclick = async () => {
    stopOrderPolling();
  const player = localStorage.getItem('ravokPlayer') || 'Jogador';
  const total = cart.reduce((acc, p) => acc + Number(p.price), 0);
  const orderId = currentCheckoutOrder ? currentCheckoutOrder.orderId : Date.now();

  // Se estiver em HTTP, aprova no backend
  if (window.location.protocol.startsWith('http') && currentCheckoutOrder && currentCheckoutOrder.orderId) {
    try {
      const res = await fetch(`/api/orders/${currentCheckoutOrder.orderId}/simulate-approve`, { method: 'POST' });
      if (res.ok) {
        cart = [];
        renderCart();
        closeAll();
        toast(`✓ Pagamento Aprovado! Entre no servidor e use /resgatar para receber.`);
        return;
      }
    } catch (e) {
      console.warn('Erro ao aprovar no backend, salvando localmente.');
    }
  }

  // Fallback LocalStorage
  const orders = JSON.parse(localStorage.getItem('ravok_orders') || '[]');
  orders.unshift({
    id: orderId,
    nick: player,
    items: [...cart],
    total: total,
    status: 'aprovado',
    date: new Date().toLocaleString('pt-BR')
  });
  localStorage.setItem('ravok_orders', JSON.stringify(orders));

  const pendingDeliveries = JSON.parse(localStorage.getItem('ravok_pending_deliveries') || '[]');
  cart.forEach(item => {
    pendingDeliveries.push({
      id: orderId + Math.floor(Math.random() * 1000),
      orderId: orderId,
      nick: player,
      product_name: item.name,
      category: item.cat || 'Itens',
      command: (item.command || `say Entregue ${item.name} para {player}`).replace('{player}', player),
      gui_icon: item.guiIcon || 'CHEST',
      created_at: new Date().toISOString(),
      status: 'pending'
    });
  });
  localStorage.setItem('ravok_pending_deliveries', JSON.stringify(pendingDeliveries));

  cart = [];
  renderCart();
  closeAll();

  toast(`Pagamento Aprovado! Entre no servidor e use /resgatar para receber.`);
  };
}

// Sincronização automática com a API Node.js (quando disponível)
async function syncWithBackend() {
  if (!window.location.protocol.startsWith('http')) return;
  try {
    // Sincronizar produtos
    const resProd = await fetch('/api/products');
    if (resProd.ok) {
      const prods = await resProd.json();
      if (Array.isArray(prods) && prods.length) {
        localStorage.setItem('ravok_products_v5', JSON.stringify(prods));
        products = prods;
        renderProducts();
      }
    }

    // Sincronizar streamers
    const resStr = await fetch('/api/streamers');
    if (resStr.ok) {
      const streamers = await resStr.json();
      if (Array.isArray(streamers) && streamers.length) {
        localStorage.setItem('ravok_streamers', JSON.stringify(streamers));
        renderStreamers();
      }
    }

    // Sincronizar feedbacks
    const resFb = await fetch('/api/feedbacks');
    if (resFb.ok) {
      const feedbacks = await resFb.json();
      if (Array.isArray(feedbacks) && feedbacks.length) {
        localStorage.setItem('ravok_feedbacks', JSON.stringify(feedbacks));
        renderFeedbacks();
      }
    }

    // Sincronizar link do Discord
    const resSet = await fetch('/api/settings');
    if (resSet.ok) {
      const settings = await resSet.json();
      if (settings.discordInviteUrl && by('#discordLinkBtn')) {
        by('#discordLinkBtn').href = settings.discordInviteUrl;
      }
    }
  } catch (e) {
    console.log('Operando com cache local.');
  }
}


// ====================================================
// META DE ARRECADAÇÃO MENSAL (MANUTENÇÃO DO SERVIDOR)
// ====================================================
async function loadSalesGoal() {
  // Meta zerada por padrão para ser configurada posteriormente
  let goalData = {
    totalArrecadado: 0,
    targetGoal: 2000,
    percent: 0,
    falta: 2000
  };

  // 1. Tentar ler do backend/bot se configurado ativamente
  try {
    const res = await fetch('/api/admin/bot/meta-status');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.targetGoal > 0 && data.totalArrecadado > 0) {
        goalData = data;
      }
    }
  } catch (e) {
    // Modo offline: manter meta zerada
  }

  // Atualizar elementos no DOM
  const percentEl = by('#goalPercentPill');
  const fillEl = by('#goalProgressFill');
  const percentDisplayEl = by('#goalPercentDisplay');
  const percentVal = Math.min(100, Math.max(0, goalData.percent || 0));
  const isZero = percentVal <= 0;

  if (percentEl) percentEl.textContent = `${percentVal}% Atingida`;
  if (fillEl) {
    fillEl.style.width = `${percentVal}%`;
    const glow = fillEl.querySelector('.rw-goal-progress-glow');
    if (glow) glow.style.display = isZero ? 'none' : 'block';
  }
  if (percentDisplayEl) percentDisplayEl.textContent = `${percentVal}%`;

  // Atualizar milestones dinâmicos
  const m50 = by('#goalMilestone50');
  const m75 = by('#goalMilestone75');
  const m100 = by('#goalMilestone100');
  if (m50) m50.classList.toggle('reached', percentVal >= 50);
  if (m75) m75.classList.toggle('reached', percentVal >= 75);
  if (m100) m100.classList.toggle('reached', percentVal >= 100);
}
window.loadSalesGoal = loadSalesGoal;


// ====================================================
// CARROSSEL DE SLIDES DO BANNER PRINCIPAL (HERO SLIDER)
// ====================================================
const HERO_SLIDES = [
  {
    tagIcon: 'images/autumn/folha_de_bordo_flutuante.png',
    tagText: 'TEMPORADA 3 • OUTONAL',
    title: 'COLHEITA &amp;<br>GLÓRIA ANCESTRAL',
    desc: 'A nova era da Ravok Network chegou! Explore a atmosfera outonal, novos biomas de montanha, sistema de economia renovado e recompensas com entrega automática via Pix.',
    charImg: 'images/fullbody.png',
    charAlt: 'Guerreiro Ravok 3D',
    primaryHtml: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg><span>Jogar agora: <b id="serverIpBanner">jogar.ravok.network</b></span>',
    primaryOnClick: 'copyServerIp()',
    secHtml: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><span>Texturas HD</span>',
    secHref: 'downloads/Ravok-ResourcePack-PTBR.zip',
    secDownload: 'Ravok-ResourcePack-PTBR.zip'
  },
  {
    tagIcon: 'images/autumn/girassol_radiante.png',
    tagText: 'RANKS VIP • BENEFÍCIOS REAIS',
    title: 'TORNE-SE UMA<br>LENDA NO REINO',
    desc: 'Desbloqueie os Ranks Vendaval, Flamejante, Carvalho, Aurora, Solar e Deusa. Ganhe acesso a voo (/fly), kits diários, /god e comandos VIP exclusivos!',
    charImg: 'images/kayzel2.png',
    charAlt: 'Cavaleiro VIP Flamejante',
    primaryHtml: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg><span>Ver Ranks VIP na Loja</span>',
    primaryOnClick: "filterCategoryAndScroll('VIPs')",
    secHtml: '<span>Ver Vantagens 📜</span>',
    secHref: '#produtos',
    secOnClick: "openProductDetails('vip-solar')"
  },
  {
    tagIcon: 'images/autumn/bussola_de_latao_dourado.png',
    tagText: 'ECONOMIA • COINS &amp; MERCADO',
    title: 'PACOTES DE COINS<br>&amp; MERCADO OFICIAL',
    desc: 'Adquira pacotes de 1.000 a 22.000 Moedas oficiais com bônus exclusivos! Troque no Mercado dos Mercadores (/coinshop) por itens raros, cosméticos e encantamentos únicos.',
    charImg: 'images/kayzel4.png',
    charAlt: 'Mercador de Moedas',
    primaryHtml: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1"></path><path d="M12 6v2m0 8v2"></path></svg><span>Adquirir Coins com Bônus</span>',
    primaryOnClick: "filterCategoryAndScroll('Coins')",
    secHtml: '<span>Ver Pacotes de Moedas</span>',
    secHref: '#produtos',
    secOnClick: "filterCategoryAndScroll('Coins')"
  },
  {
    tagIcon: 'images/toolskins.png',
    tagText: 'CHAVES &amp; VOUCHERS • NOVIDADE S3',
    title: 'CHAVES MÍSTICAS &amp;<br>VISUAIS DE FERRAMENTAS',
    desc: 'Abra Caixas Místicas com Chaves Lendárias e garanta o novo Voucher de Skin Aleatória com mais de 130 visuais épicos para espadas, machados, picaretas e arcos!',
    charImg: 'images/kayzel5.png',
    charAlt: 'Guerreiro das Chaves e Vouchers',
    primaryHtml: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg><span>Ver Chaves &amp; Vouchers</span>',
    primaryOnClick: "filterCategoryAndScroll('Vouchers')",
    secHtml: '<span>Abrir Caixas</span>',
    secHref: '#produtos',
    secOnClick: "filterCategoryAndScroll('Chaves')"
  }
];

let currentHeroSlide = 0;
let heroSliderInterval = null;

function renderHeroSlide(idx) {
  if (idx < 0 || idx >= HERO_SLIDES.length) return;
  currentHeroSlide = idx;
  const slide = HERO_SLIDES[idx];

  const content = by('#rwHeroBannerContent');
  const charWrap = by('#rwHeroBannerCharWrap');
  const tagImg = by('#heroBannerTagImg');
  const tagText = by('#heroBannerTagText');
  const title = by('#heroBannerTitle');
  const desc = by('#heroBannerDesc');
  const playBtn = by('#heroBannerPlayBtn');
  const secBtn = by('#heroBannerSecBtn');
  const charImg = by('#heroBannerCharImg');

  if (content) content.classList.add('slide-fading');
  if (charWrap) charWrap.classList.add('slide-fading');

  setTimeout(() => {
    if (tagImg) tagImg.src = slide.tagIcon;
    if (tagText) tagText.innerHTML = slide.tagText;
    if (title) title.innerHTML = slide.title;
    if (desc) desc.innerHTML = slide.desc;

    if (playBtn) {
      playBtn.innerHTML = slide.primaryHtml;
      playBtn.setAttribute('onclick', slide.primaryOnClick);
    }

    if (secBtn) {
      secBtn.innerHTML = slide.secHtml;
      if (slide.secHref) secBtn.setAttribute('href', slide.secHref);
      else secBtn.removeAttribute('href');
      if (slide.secDownload) secBtn.setAttribute('download', slide.secDownload);
      else secBtn.removeAttribute('download');
      if (slide.secOnClick) secBtn.setAttribute('onclick', slide.secOnClick);
      else secBtn.removeAttribute('onclick');
    }

    if (charImg) {
      charImg.src = slide.charImg;
      charImg.alt = slide.charAlt;
    }

    document.querySelectorAll('.rw-banner-dot').forEach((dot, dIdx) => {
      dot.classList.toggle('active', dIdx === currentHeroSlide);
    });

    if (content) content.classList.remove('slide-fading');
    if (charWrap) charWrap.classList.remove('slide-fading');
  }, 220);
}

function nextHeroSlide() {
  const nextIdx = (currentHeroSlide + 1) % HERO_SLIDES.length;
  renderHeroSlide(nextIdx);
}

function startHeroSlider() {
  if (heroSliderInterval) clearInterval(heroSliderInterval);
  heroSliderInterval = setInterval(nextHeroSlide, 6500);
}

function initHeroSlider() {
  document.querySelectorAll('.rw-banner-dot').forEach((dot) => {
    dot.onclick = () => {
      const idx = parseInt(dot.dataset.heroSlide, 10);
      if (!isNaN(idx)) {
        renderHeroSlide(idx);
        startHeroSlider();
      }
    };
  });

  const banner = by('#rwHeroBannerCard');
  if (banner) {
    banner.addEventListener('mouseenter', () => {
      if (heroSliderInterval) clearInterval(heroSliderInterval);
    });
    banner.addEventListener('mouseleave', () => {
      startHeroSlider();
    });
  }

  startHeroSlider();
}

// Inicialização completa
loadCustomMascot();
loadServerStatus();
loadSalesGoal();
initHeroSlider();
setInterval(loadServerStatus, 25000);
renderProducts();
renderCart();
renderSlider();
renderStreamers();
renderFeedbacks();
updateDiscordLink();
syncWithBackend();
initPlayerAuth();

// ====================================================
// SISTEMA DE CONTAS, SALDO DE COINS E PORTAL DO JOGADOR
// ====================================================
let currentLoggedUser = null;

// Obter token do jogador armazenado
function getPlayerToken() {
  return localStorage.getItem('ravok_user_token');
}

function setPlayerToken(token) {
  if (token) {
    localStorage.setItem('ravok_user_token', token);
  } else {
    localStorage.removeItem('ravok_user_token');
  }
}

// Inicializar e carregar sessão do jogador
async function initPlayerAuth() {
  const token = getPlayerToken();
  if (!token) {
    renderPlayerTopbar(null);
    return;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        currentLoggedUser = data.user;
        localStorage.setItem('ravokPlayer', currentLoggedUser.nick);
        renderPlayerTopbar(currentLoggedUser);
        return;
      }
    }
  } catch (e) {
    console.warn('[Auth] Erro ao validar sessão:', e.message);
  }

  setPlayerToken(null);
  currentLoggedUser = null;
  renderPlayerTopbar(null);
}

// Atualiza a visualização na barra superior
function renderPlayerTopbar(user) {
  const unloggedGroup = by('#unloggedAuthGroup');
  const unloggedBtn = by('#openAuthModalBtn');
  const registerBtn = by('#openRegisterModalBtn');
  const loggedPill = by('#playerLoggedPill');
  const avatarImg = by('#topbarPlayerAvatar');
  const nickSpan = by('#topbarPlayerNick');
  const coinsSpan = by('#topbarPlayerCoins');

  if (user) {
    if (unloggedGroup) unloggedGroup.style.display = 'none';
    if (unloggedBtn) unloggedBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (loggedPill) {
      loggedPill.style.display = 'inline-flex';
      if (avatarImg) avatarImg.src = user.avatarUrl || `https://mc-heads.net/avatar/${encodeURIComponent(user.nick)}/32`;
      if (nickSpan) nickSpan.textContent = user.nick;
      if (coinsSpan) coinsSpan.textContent = `🪙 ${Number(user.coins || 0).toLocaleString('pt-BR')} Coins`;
    }
  } else {
    if (unloggedGroup) unloggedGroup.style.display = 'inline-flex';
    if (unloggedBtn) unloggedBtn.style.display = 'inline-flex';
    if (registerBtn) registerBtn.style.display = 'inline-flex';
    if (loggedPill) loggedPill.style.display = 'none';
  }
}

// Copiar IP do servidor com feedback elegante (Java e Bedrock)
function copyServerIp(target = 'all') {
  if (target === 'bedrock') {
    const ip = 'jogar.ravok.network';
    const port = '26575';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(`${ip}:${port}`).then(() => {
        toast(`📱 IP Bedrock copiado: ${ip} (Porta: ${port})`);
      }).catch(() => {
        prompt('IP e Porta Bedrock:', `${ip} | Porta: ${port}`);
      });
    } else {
      prompt('IP e Porta Bedrock:', `${ip} | Porta: ${port}`);
    }
    return;
  }

  const ip = 'jogar.ravok.network';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(ip).then(() => {
      toast('☕ IP Java copiado: jogar.ravok.network (Bedrock Porta: 26575)');
    }).catch(() => {
      prompt('Copie o IP do servidor:', ip);
    });
  } else {
    prompt('Copie o IP do servidor:', ip);
  }
}
window.copyServerIp = copyServerIp;

// Abrir e alternar abas do modal de autenticação
function openAuthModal(initialTab = 'login') {
  const modal = by('#authModal');
  if (!modal) return;
  switchAuthTab(initialTab);
  modal.showModal();
}

function switchAuthTab(tabName) {
  const tabBtns = document.querySelectorAll('.auth-tab-btn');
  tabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-auth-tab') === tabName);
  });

  const tabContents = {
    login: by('#authTabLogin'),
    register: by('#authTabRegister'),
    staff: by('#authTabStaff')
  };

  Object.entries(tabContents).forEach(([name, el]) => {
    if (el) {
      el.style.display = name === tabName ? 'block' : 'none';
      el.classList.toggle('active', name === tabName);
    }
  });
}

// Exportar para o escopo global (para onclick inline funcionar sempre)
window.openAuthModal = openAuthModal;
window.switchAuthTab = switchAuthTab;
window.openPlayerPortal = openPlayerPortal;

// Listeners de alternância de abas no Auth Modal
document.querySelectorAll('.auth-tab-btn').forEach(btn => {
  btn.onclick = () => {
    const tab = btn.getAttribute('data-auth-tab');
    switchAuthTab(tab);
  };
});

// Botão deslogado na topbar (Entrar)
const openAuthBtn = by('#openAuthModalBtn');
if (openAuthBtn) {
  openAuthBtn.onclick = () => openAuthModal('login');
}

// Botão deslogado na topbar (Criar Conta)
const openRegBtn = by('#openRegisterModalBtn');
if (openRegBtn) {
  openRegBtn.onclick = () => openAuthModal('register');
}

// Botão Staff na topbar
const openStaffBtn = by('#openStaffAuthBtn');
if (openStaffBtn) {
  openStaffBtn.onclick = () => openAuthModal('staff');
}

// Preview dinâmico da skin do Minecraft ao digitar no registro
const regNickInput = by('#registerNick');
const regSkinPreview = by('#registerSkinPreview');
let nickDebounce = null;
if (regNickInput && regSkinPreview) {
  regNickInput.oninput = () => {
    clearTimeout(nickDebounce);
    nickDebounce = setTimeout(() => {
      const val = regNickInput.value.trim();
      if (val.length >= 3) {
        regSkinPreview.src = `https://mc-heads.net/avatar/${encodeURIComponent(val)}/64`;
      } else {
        regSkinPreview.src = 'https://mc-heads.net/avatar/steve/64';
      }
    }, 300);
  };
}

// Formulário de Cadastro (Criar Conta)
const playerRegForm = by('#playerRegisterForm');
if (playerRegForm) {
  playerRegForm.onsubmit = async (e) => {
    e.preventDefault();
    const nick = by('#registerNick').value.trim();
    const email = by('#registerEmail').value.trim();
    const password = by('#registerPassword').value;

    toast('Criando sua conta Ravok...');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick, email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPlayerToken(data.token);
        currentLoggedUser = data.user;
        localStorage.setItem('ravokPlayer', currentLoggedUser.nick);
        renderPlayerTopbar(currentLoggedUser);
        by('#authModal').close();
        toast(`✓ Bem-vindo à Ravok Network, ${currentLoggedUser.nick}!`);
        openPlayerPortal();
      } else {
        toast(`Erro: ${data.error || 'Falha ao criar conta.'}`);
      }
    } catch (err) {
      toast('Erro ao conectar com o servidor.');
    }
  };
}

// Formulário de Login (Jogador)
const playerLoginForm = by('#playerLoginForm');
if (playerLoginForm) {
  playerLoginForm.onsubmit = async (e) => {
    e.preventDefault();
    const nickOrEmail = by('#loginNickOrEmail').value.trim();
    const password = by('#loginPassword').value;

    toast('Autenticando...');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickOrEmail, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPlayerToken(data.token);
        currentLoggedUser = data.user;
        localStorage.setItem('ravokPlayer', currentLoggedUser.nick);
        renderPlayerTopbar(currentLoggedUser);
        by('#authModal').close();
        toast(`✓ Bem-vindo de volta, ${currentLoggedUser.nick}!`);
        openPlayerPortal();
      } else {
        toast(`Erro: ${data.error || 'Credenciais inválidas.'}`);
      }
    } catch (err) {
      toast('Erro ao conectar com o servidor.');
    }
  };
}

// Formulário de Login Staff / Admin
const staffLoginForm = by('#staffLoginForm');
if (staffLoginForm) {
  staffLoginForm.onsubmit = async (e) => {
    e.preventDefault();
    const username = (by('#staffUser')?.value || '').trim();
    const password = by('#staffPassword')?.value || '';

    toast('Validando credenciais administrativas...');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast('✓ Acesso autorizado! Redirecionando para o Painel...');
        localStorage.setItem('ravok_admin_token', data.token);
        if (data.user) localStorage.setItem('ravok_admin_user', JSON.stringify(data.user));
        setTimeout(() => {
          window.location.href = 'admin.html';
        }, 600);
      } else {
        toast(`Erro: ${data.error || 'Acesso negado.'}`);
      }
    } catch (err) {
      toast('Erro ao autenticar com o servidor.');
    }
  };
}

// Abrir e Preencher o Portal do Jogador
async function openPlayerPortal() {
  if (!currentLoggedUser) {
    openAuthModal('login');
    return;
  }

  const modal = by('#playerPortalModal');
  if (!modal) return;

  try {
    const token = getPlayerToken();
    if (token) {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) currentLoggedUser = data.user;
      }
    }
  } catch (e) {}

  const u = currentLoggedUser;
  renderPlayerTopbar(u);

  if (by('#portalNickTitle')) by('#portalNickTitle').textContent = u.nick;
  if (by('#portalSkinBody')) by('#portalSkinBody').src = u.bodyUrl || `https://mc-heads.net/body/${encodeURIComponent(u.nick)}/right`;
  if (by('#portalCoinsAmount')) by('#portalCoinsAmount').textContent = `${Number(u.coins || 0).toLocaleString('pt-BR')} Coins`;
  if (by('#portalMoneyAmount')) by('#portalMoneyAmount').textContent = `$${parseFloat(u.money || 0).toLocaleString('pt-BR')}`;
  
  if (by('#portalCoinsRank')) by('#portalCoinsRank').textContent = `#${u.rankings?.coinsRank || 1} no Servidor`;
  if (by('#portalKillsVal')) by('#portalKillsVal').textContent = `${u.kills || 0} kills (#${u.rankings?.killsRank || 1})`;
  if (by('#portalTimeVal')) by('#portalTimeVal').textContent = u.timePlayed || '0h';
  if (by('#portalVotesVal')) by('#portalVotesVal').textContent = `${u.votes || 0} votos (#${u.rankings?.votesRank || 1})`;

  // Vínculos da Conta (Minecraft e Discord)
  const mcNickDisplay = by('#portalMcNickDisplay');
  if (mcNickDisplay) mcNickDisplay.textContent = `Nick: ${u.nick}`;

  const discordTagDisplay = by('#portalDiscordTagDisplay');
  const discordStatusBadge = by('#portalDiscordStatusBadge');
  const discordDescText = by('#portalDiscordDescText');
  const discordActionRow = by('#portalDiscordActionRow');

  if (u.linkedDiscord && u.linkedDiscord.linked) {
    if (discordTagDisplay) discordTagDisplay.textContent = u.linkedDiscord.tag || 'Conta Vinculada';
    if (discordStatusBadge) {
      discordStatusBadge.className = 'badge-status-linked';
      discordStatusBadge.textContent = '✓ Vinculado';
    }
    if (discordDescText) {
      discordDescText.innerHTML = `Sua conta está conectada ao Discord oficial (<strong>${u.linkedDiscord.tag || ''}</strong>)! Seus cargos e benefícios de comunidade estão ativos.`;
    }
    if (discordActionRow) discordActionRow.style.display = 'none';
  } else {
    if (discordTagDisplay) discordTagDisplay.textContent = 'Aguardando vínculo...';
    if (discordStatusBadge) {
      discordStatusBadge.className = 'badge-status-unlinked';
      discordStatusBadge.textContent = 'Pendente';
    }
    if (discordDescText) {
      discordDescText.innerHTML = `Vincule sua conta para receber cargos VIPs e de Membro no Discord da Ravok! No Discord oficial, use o canal de vínculo e confirme com seu nick <code>${u.nick}</code>.`;
    }
    if (discordActionRow) discordActionRow.style.display = 'block';
  }

  const deliveriesText = by('#portalDeliveriesText');
  if (deliveriesText) {
    const pend = u.pendingDeliveries || [];
    if (pend.length > 0) {
      const nomes = pend.map(p => p.productName || p.name).join(', ');
      deliveriesText.innerHTML = `✦ Você tem <strong>${pend.length} item(ns)</strong> aguardando resgate (${nomes})! Entre em <code>jogar.ravok.network</code> e digite <code>/resgatar</code> para retirar!`;
    } else {
      deliveriesText.innerHTML = `Nenhum item pendente no momento. Quando você comprar na loja, seus produtos aparecem aqui para retirada com <code>/resgatar</code> no Minecraft!`;
    }
  }

  modal.showModal();
}

const squircleQuickNick = by('#squircleQuickNick');
if (squircleQuickNick) {
  squircleQuickNick.onclick = () => {
    const dialog = by('#playerDialog');
    if (dialog) dialog.showModal();
  };
}

const playerLoggedPill = by('#playerLoggedPill');
if (playerLoggedPill) {
  playerLoggedPill.onclick = openPlayerPortal;
}

const portalLogoutBtn = by('#portalLogoutBtn');
if (portalLogoutBtn) {
  portalLogoutBtn.onclick = () => {
    setPlayerToken(null);
    currentLoggedUser = null;
    renderPlayerTopbar(null);
    by('#playerPortalModal').close();
    toast('Você saiu da sua conta.');
  };
}

// Validação do Código de Vínculo do Minecraft (/vincular)
const submitCodeBtn = by('#portalSubmitCodeBtn');
const verifyCodeInput = by('#portalVerifyCodeInput');
const verifyFeedback = by('#portalVerifyFeedback');

if (submitCodeBtn && verifyCodeInput) {
  submitCodeBtn.onclick = async () => {
    const code = verifyCodeInput.value.trim();
    if (!code) {
      if (verifyFeedback) {
        verifyFeedback.className = 'verify-feedback error';
        verifyFeedback.textContent = 'Informe o código gerado pelo /vincular no jogo.';
        verifyFeedback.style.display = 'block';
      }
      return;
    }

    submitCodeBtn.disabled = true;
    submitCodeBtn.textContent = 'Validando...';

    try {
      const res = await fetch('/api/player/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nick: currentLoggedUser.nick,
          code: code
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        verifyFeedback.className = 'verify-feedback success';
        verifyFeedback.textContent = '🎉 ' + (data.message || 'Conta validada! Sua Chave de Voto está pronta no /resgatar!');
        verifyFeedback.style.display = 'block';
        verifyCodeInput.value = '';
        toast('🎉 Vínculo confirmado! Recompensa disponível no /resgatar!');
        openPlayerPortal();
      } else {
        verifyFeedback.className = 'verify-feedback error';
        verifyFeedback.textContent = '❌ ' + (data.error || 'Código incorreto ou expirado.');
        verifyFeedback.style.display = 'block';
      }
    } catch (err) {
      verifyFeedback.className = 'verify-feedback error';
      verifyFeedback.textContent = '❌ Erro ao conectar com o servidor.';
      verifyFeedback.style.display = 'block';
    } finally {
      submitCodeBtn.disabled = false;
      submitCodeBtn.textContent = 'Validar Código';
    }
  };
}

