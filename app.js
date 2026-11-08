let cart = [];
const money = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const by = s => document.querySelector(s);
// Catálogo padrão de produtos
// Catálogo padrão de produtos - Temporada 3 (Outono & Pôr do Sol) - Estilo ReallyWorld
// Catálogo padrão de produtos - Temporada 3 (Outono & Pôr do Sol) - Estilo ReallyWorld
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
    "price": 4.9,
    "command": "darfly {player} 30m",
    "perksList": [
      "30 minutos de voo livre (/fly) no Survival",
      "100% Acumulativo (estoca tempo comprando mais)",
      "Ativação imediata via /resgatar usando /darfly"
    ]
  },
  {
    "id": "voucher-skin-aleatoria",
    "cat": "Vouchers",
    "badge": "NOVIDADE",
    "badgeColor": "gold",
    "icon": "📜",
    "image": "images/products/voucher_skin_pixel_hd.png",
    "name": "Voucher Skin Aleatória",
    "description": "Resgate no servidor com clique esquerdo para receber 1 visual exclusivo aleatório para suas ferramentas (Espada, Picareta, Machado, etc.). São 136 modelos raros!",
    "price": 9.99,
    "oldPrice": 19.9,
    "perksList": [
      "136 Visuais raros possíveis",
      "Resgate com 1 clique no inventário",
      "Compatível com espadas, picaretas e machados",
      "Não perde ao morrer"
    ],
    "command": "crazyvouchers:voucher give Random_Toolskin 1 {player}"
  },
  {
    "id": "pet-dino",
    "cat": "Pets",
    "badge": "3D",
    "badgeColor": "orange",
    "icon": "🦖",
    "image": "images/products/pet_dino_hd.png",
    "name": "Pet Dinossauro 3D",
    "description": "Um companheiro pré-histórico com animações customizadas e efeitos sonoros.",
    "price": 29.9,
    "command": "mcpets spawn dino {player} false"
  },
  {
    "id": "pet-cubee",
    "cat": "Pets",
    "badge": "MÁGICO",
    "badgeColor": "gold",
    "icon": "🧊",
    "image": "images/products/pet_cubee_hd.png",
    "name": "Pet Cubee Mágico",
    "description": "Cubinho flutuante que segue você com partículas de luz e animações suaves.",
    "price": 34.9,
    "command": "mcpets spawn cubee_magico {player} false"
  },
  {
    "id": "cosmetic-fire",
    "cat": "Cosméticos",
    "badge": "RARO",
    "badgeColor": "red",
    "icon": "🪓",
    "image": "images/products/machado_chamas_hd.png",
    "name": "Machado das Chamas",
    "description": "Skin cosmética para machados com partículas de fogo perpétuas.",
    "price": 14.9,
    "command": "uc menu effects {player}"
  },
  {
    "id": "cosmetic-sword",
    "cat": "Cosméticos",
    "badge": "LENDÁRIO",
    "badgeColor": "gold",
    "icon": "⚔️",
    "image": "images/products/espada_solar_hd.png",
    "name": "Espada Rúnica Solar",
    "description": "Visual temático da Temporada 3 com runas brilhantes e efeito sonoro.",
    "price": 19.9,
    "command": "uc menu effects {player}"
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
    "command": "excellentenchants:ee book give {player} smelter 1",
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
    "price": 3.9,
    "command": "excellentenchants:ee book give {player} decapitator 1",
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
    "command": "excellentenchants:ee book give {player} tunnel 1",
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
    "command": "excellentenchants:ee book give {player} veinminer 1",
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
    "price": 4.5,
    "command": "excellentenchants:ee book give {player} vampire 1",
    "perksList": [
      "Roubo de vida e cura constante a cada golpe",
      "Vantagem indispensável em masmorras e chefões",
      "Compatível com espadas de diamante e netherite"
    ]
  },
  {
    "id": "enchant-silkspawner",
    "cat": "Encantamentos",
    "badge": "EXCELLENT",
    "badgeColor": "green",
    "icon": "📖",
    "image": "images/products/livro_silkspawner.png",
    "name": "Livro: Caçador de Almas (Spawners)",
    "description": "Encantamento ExcellentEnchants supremo para picaretas. Permite quebrar, coletar e transportar Gaiolas de Monstros (Spawners) intactas para sua fazenda!",
    "price": 4.9,
    "command": "excellentenchants:ee book give {player} silk_spawner 1",
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
    "command": "crazyvouchers:voucher give Back_Command 1 {player}",
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
    "command": "crazyvouchers:voucher give Feed_Command 1 {player}",
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
    "command": "crazyvouchers:voucher give Heal_Command 1 {player}",
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
    "command": "crazyvouchers:voucher give Repair_Command 1 {player}",
    "perksList": [
      "Acesso definitivo ao comando /repair no Survival",
      "Repara armas, armaduras e ferramentas sem gastar XP",
      "Ativação imediata via /resgatar"
    ]
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
function sanitizeClientSlides(list) {
  if (!Array.isArray(list)) return [];
  const broken = ['ravok_bg_hq.png', 'hero-landscape.png', 'gallery-1.png'];
  return list.filter(s => s && typeof s.img === 'string' && s.img.trim() && !broken.some(b => s.img.includes(b)));
}

function normalizeClientStreamer(s) {
  if (!s || !s.name) return null;
  const link = s.channelUrl || s.url || 'https://twitch.tv';
  return {
    ...s,
    url: link,
    channelUrl: link,
    avatar: s.avatar || `https://mc-heads.net/avatar/${encodeURIComponent(s.name)}/64`,
    bio: s.bio || 'Transmissões e vídeos oficiais jogando no servidor Ravok Network!'
  };
}

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
  'voucher-skin-aleatoria': 'images/products/voucher_skin_pixel_hd.png',
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
  'pet-dino': 'images/products/pet_dino_hd.png',
  'pet-cubee': 'images/products/pet_cubee_hd.png',
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

function getDeletedProductIds() {
  try {
    const raw = localStorage.getItem('ravok_deleted_products_v1');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function upgradeClientProducts(list) {
  const delSet = new Set(getDeletedProductIds().map(String));
  if (!Array.isArray(list)) return DEFAULT_PRODUCTS.filter(p => !delSet.has(String(p.id)));
  const mapped = list.filter(p => p && !delSet.has(String(p.id))).map(raw => {
    if (!raw || typeof raw !== 'object') return null;
    const p = { ...raw };
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

    // Se o item foi editado manualmente pelo administrador, NÃO altera a imagem nem o conteúdo!
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
      } else if (p.cat === 'Vouchers') {
        p.image = 'images/products/voucher_skin_pixel_hd.png';
      } else if (p.cat === 'Encantamentos') {
        p.image = 'images/products/livro_fortuna_4.png';
      } else if (p.cat === 'Comandos') {
        p.image = 'images/products/cmd_repair_hd.png';
      } else if (p.cat === 'Pets') {
        p.image = 'images/products/pet_dino_hd.png';
      } else if (p.cat === 'Cosméticos') {
        p.image = 'images/products/espada_solar_hd.png';
      }
    }
    if (!p.prefixImg && OFFICIAL_PREFIX_IMGS[p.id]) {
      p.prefixImg = OFFICIAL_PREFIX_IMGS[p.id];
    }
    return p;
  }).filter(Boolean);

  // Injetar novos produtos padrão (ex: Encantamentos e Comandos) SOMENTE se não foram deletados pelo admin
  const existingIds = new Set(mapped.map(p => String(p.id)));
  DEFAULT_PRODUCTS.forEach(def => {
    const defId = String(def.id);
    if (!existingIds.has(defId) && !delSet.has(defId)) {
      mapped.push({ ...def });
      existingIds.add(defId);
    }
  });

  return mapped.filter(p => !delSet.has(String(p.id)));
}

function getProducts() {
  const saved = localStorage.getItem('ravok_products_v7') || localStorage.getItem('ravok_products_v6') || localStorage.getItem('ravok_products_v5');
  const delSet = new Set(getDeletedProductIds().map(String));
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const upgraded = upgradeClientProducts(parsed).filter(p => !delSet.has(String(p.id)));
        if (upgraded.length >= 10) return upgraded;
      }
    } catch (e) {}
  }
  const fallback = upgradeClientProducts(DEFAULT_PRODUCTS).filter(p => !delSet.has(String(p.id)));
  return (fallback && fallback.length > 0) ? fallback : DEFAULT_PRODUCTS;
}

function getSlides() {
  const saved = localStorage.getItem('ravok_slider_slides_s3_v4');
  if (saved) {
    try {
      const parsed = sanitizeClientSlides(JSON.parse(saved));
      if (parsed.length > 0) return parsed;
    } catch (e) {}
  }
  localStorage.setItem('ravok_slider_slides_s3_v4', JSON.stringify(DEFAULT_SLIDES));
  return DEFAULT_SLIDES;
}

window.goToSlide = function(idx) {
  stepSlider(idx);
};

function getStreamers() {
  const saved = localStorage.getItem('ravok_streamers');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const clean = parsed.map(normalizeClientStreamer).filter(Boolean);
        if (clean.length > 0) {
          return clean;
        }
      }
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
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
  'Todos': { iconImg: 'images/icons/staricon_32.png', icon: '🏷️', label: 'Todos os Itens' },
  'VIPs': { iconImg: 'images/icons/bigmedal_32.png', icon: '👑', label: 'Privilégios & VIPs' },
  'Coins': { iconImg: 'images/icons/coin_32.png', icon: '🪙', label: 'Moedas & Coins' },
  'Chaves': { iconImg: 'images/icons/deliveries_32.png', icon: '🗝️', label: 'Caixas & Chaves' },
  'Encantamentos': { iconImg: 'images/icons/enchantedbook_32.png', icon: '📖', label: 'Encantamentos' },
  'Comandos': { iconImg: 'images/icons/feather_32.png', icon: '🔧', label: 'Comandos & Permissões' },
  'Vouchers': { iconImg: 'images/icons/toolskins_32.png', icon: '📜', label: 'Vouchers & Skins' },
  'Pets': { iconImg: 'images/icons/sword_32.png', icon: '🐾', label: 'Mascotes 3D' },
  'Cosméticos': { iconImg: 'images/icons/cosmetics_32.png', icon: '⚔️', label: 'Cosméticos & Armas' }
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
  const CATEGORY_ORDER = ['Todos', 'VIPs', 'Coins', 'Chaves', 'Encantamentos', 'Comandos', 'Vouchers', 'Pets', 'Cosméticos'];
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
      const iconMarkup = meta.iconImg
        ? `<img src="${meta.iconImg}" alt="" class="rw-cat-tex-icon" onerror="this.style.display='none'">`
        : `<span class="rw-cat-icon">${meta.icon}</span>`;
      return `
        <button type="button" class="rw-cat-btn ${isActive ? 'active' : ''}" data-filter="${c}">
          ${iconMarkup}
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
                ${p.prefixImg ? `<img src="${p.prefixImg}" alt="${p.tag}" style="height:15px; image-rendering:pixelated; vertical-align:middle;">` : `<span class="tag-val ${p.tagClass || ''}">${p.tag}</span>`}
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
          ${p.prefixImg ? `<img src="${p.prefixImg}" alt="${p.tag}" style="height:17px; image-rendering:pixelated; vertical-align:middle;">` : `<span class="tag-val ${p.tagClass || ''}" style="font-size:13px;">${p.tag}</span>`}
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
    image: 'images/products/moedas_2500.png',
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
        <div class="mini">${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:32px; height:32px; object-fit:contain;">` : (p.icon && !p.icon.startsWith('http') ? p.icon : '✦')}</div>
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
  if (!wrapper || !dots) return;

  if (!slides.length) {
    const sliderBox = by('#serverSlider');
    if (sliderBox) sliderBox.style.display = 'none';
    return;
  }
  if (by('#serverSlider')) by('#serverSlider').style.display = '';
  if (currentSlideIndex >= slides.length) currentSlideIndex = 0;

  wrapper.innerHTML = slides.map((s, idx) => `
    <div class="slide-item ${idx === currentSlideIndex ? 'active' : ''}">
      <img src="${s.img}" alt="${s.title || 'Ravok Network'}" onerror="this.src='images/gallery/spawn_ravok_outonal.png'">
      <div class="slide-caption">
        <h3>${s.title || 'Ravok Network'}</h3>
        <p>${s.desc || ''}</p>
      </div>
    </div>
  `).join('');

  dots.innerHTML = slides.map((_, idx) => `
    <button class="slider-dot ${idx === currentSlideIndex ? 'active' : ''}" data-slide="${idx}" aria-label="Slide ${idx + 1}"></button>
  `).join('');

  document.querySelectorAll('.slider-dot').forEach(b => {
    b.onclick = () => stepSlider(parseInt(b.dataset.slide, 10));
  });

  startSliderAutoPlay();

  // Atualizar miniaturas da galeria dinamicamente
  const thumbsGrid = by('#galleryThumbsGrid') || document.querySelector('.gallery-photo-grid') || document.querySelector('.gallery-thumbs-grid');
  if (thumbsGrid && slides.length) {
    thumbsGrid.innerHTML = slides.map((s, idx) => `
      <div class="gallery-thumb-item ${idx === currentSlideIndex ? 'active' : ''}" onclick="goToSlide(${idx})">
        <img src="${s.img}" alt="${s.title || ''}" onerror="this.src='images/gallery/spawn_ravok_outonal.png'">
        <span class="gallery-thumb-caption">${s.title || ('Foto ' + (idx + 1))}</span>
      </div>
    `).join('');
  }
}

function stepSlider(index) {
  const slides = getSlides();
  if (!slides.length) return;
  currentSlideIndex = (index + slides.length) % slides.length;

  document.querySelectorAll('.slide-item').forEach((s, idx) => {
    s.classList.toggle('active', idx === currentSlideIndex);
  });
  document.querySelectorAll('.slider-dot').forEach((d, idx) => {
    d.classList.toggle('active', idx === currentSlideIndex);
  });
  document.querySelectorAll('.gallery-thumb-item').forEach((t, idx) => {
    t.classList.toggle('active', idx === currentSlideIndex);
  });

  resetSliderTimer();
}

function startSliderAutoPlay() {
  clearInterval(slideInterval);
  slideInterval = setInterval(() => {
    stepSlider(currentSlideIndex + 1);
  }, 5000);
}

function resetSliderTimer() {
  clearInterval(slideInterval);
  startSliderAutoPlay();

  // Atualizar miniaturas da galeria dinamicamente
  const thumbsGrid = by('#galleryThumbsGrid') || document.querySelector('.gallery-thumbs-grid');
  if (thumbsGrid && slides.length) {
    thumbsGrid.innerHTML = slides.map((s, idx) => `
      <div class="gallery-thumb-item ${idx === currentSlideIndex ? 'active' : ''}" onclick="goToSlide(${idx})">
        <img src="${s.img}" alt="${s.title || ''}" onerror="this.src='images/gallery/spawn_ravok_outonal.png'">
        <span>${s.title || ('Foto ' + (idx + 1))}</span>
      </div>
    `).join('');
  }
}

if (by('#sliderPrevBtn')) by('#sliderPrevBtn').onclick = () => stepSlider(currentSlideIndex - 1);
if (by('#sliderNextBtn')) by('#sliderNextBtn').onclick = () => stepSlider(currentSlideIndex + 1);

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
if (by('#openFeedbackModalBtn')) {
  by('#openFeedbackModalBtn').onclick = () => {
    const player = localStorage.getItem('ravokPlayer');
    if (player && by('#fbNick')) by('#fbNick').value = player;
    if (by('#feedbackModal')) by('#feedbackModal').showModal();
  };
}

if (by('#feedbackForm')) {
  by('#feedbackForm').onsubmit = async (e) => {
    e.preventDefault();
    const nick = by('#fbNick').value.trim();
    const stars = parseInt(by('#fbStars').value, 10) || 5;
    const comment = by('#fbComment').value.trim();

    if (!nick || !comment) return;

    let savedOnBackend = false;
    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('/api/feedbacks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nick, stars, comment })
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.feedbacks)) {
            localStorage.setItem('ravok_feedbacks', JSON.stringify(data.feedbacks));
            localStorage.setItem('ravok_feedbacks_synced', '1');
            savedOnBackend = true;
          }
        }
      } catch (err) {}
    }

    if (!savedOnBackend) {
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

      sendDiscordNotification(
        '⭐ Nova Avaliação no Site!',
        `**Jogador:** \`${nick}\`\n**Nota:** ${'★'.repeat(stars)}\n**Comentário:** "${comment}"`,
        [],
        0xfbbf24
      );
    }

    try {
      const bc = new BroadcastChannel('ravok_sync');
      bc.postMessage({ type: 'feedbacks' });
      bc.close();
    } catch (e) {}

    if (by('#feedbackModal')) by('#feedbackModal').close();
    by('#feedbackForm').reset();
    renderFeedbacks();
    toast('Obrigado pelo seu feedback!');
  };
}

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

if (by('#cartButton')) by('#cartButton').onclick = openDrawer;
if (by('#overlay')) by('#overlay').onclick = closeAll;
document.querySelectorAll('[data-close]').forEach(b => b.onclick = closeAll);
if (by('#openPlayer')) by('#openPlayer').onclick = () => by('#playerDialog') && by('#playerDialog').showModal();
if (by('#voteButton')) by('#voteButton').onclick = openVoteArena;

// Salvar Nick do Jogador
if (by('#savePlayer')) {
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
}

if (by('#playerName')) {
  by('#playerName').value = localStorage.getItem('ravokPlayer') || '';
}

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
if (by('#checkout')) by('#checkout').onclick = async () => {
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
    let localSnap = null;
    try {
      const rawSnap = localStorage.getItem('ravok_admin_snapshot_v2') || localStorage.getItem('ravok_admin_snapshot_v1');
      if (rawSnap) {
        localSnap = JSON.parse(rawSnap);
        if (localSnap && Array.isArray(localSnap.products)) {
          localSnap.products = upgradeClientProducts(localSnap.products);
        }
      }
    } catch (e) {}

    const resState = await fetch('/api/sync-state');
    if (resState.ok) {
      let state = await resState.json();

      // Se este navegador editou no Painel Admin e o servidor reiniciou (cold-start), re-hidrata automaticamente!
      if (localSnap && Number(localSnap.updatedAt || 0) > Number(state.updatedAt || 0)) {
        try {
          const restoreRes = await fetch('/api/admin/restore-snapshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(localSnap)
          });
          if (restoreRes.ok) {
            const refreshed = await fetch('/api/sync-state');
            if (refreshed.ok) state = await refreshed.json();
          }
        } catch (reErr) {}
      }

      const localDel = getDeletedProductIds().map(String);
      const serverDel = Array.isArray(state.deletedProductIds) ? state.deletedProductIds.map(String) : [];
      const combinedDel = Array.from(new Set([...localDel, ...serverDel]));
      if (combinedDel.length > 0) {
        try {
          localStorage.setItem('ravok_deleted_products_v1', JSON.stringify(combinedDel));
        } catch (e) {}
      }

      if (Array.isArray(state.products) && state.products.length > 0) {
        let mergedProds = state.products;
        if (localSnap && Array.isArray(localSnap.products) && localSnap.products.length > 0) {
          const localMap = new Map(localSnap.products.map(p => [p.id, p]));
          mergedProds = mergedProds.map(p => {
            const loc = localMap.get(p.id);
            if (loc && loc.customEdited && (!p.customEdited || Number(localSnap.updatedAt || 0) >= Number(state.updatedAt || 0))) {
              return loc;
            }
            return p;
          });
        }
        const cleanProds = upgradeClientProducts(mergedProds);
        if (cleanProds.length > 0) {
          try {
            localStorage.setItem('ravok_products_v6', JSON.stringify(cleanProds));
            localStorage.setItem('ravok_products_synced', '1');
          } catch (e) {}
          products = cleanProds;
          renderProducts();
        }
      }

      if (Array.isArray(state.slides) && state.slides.length > 0) {
        const cleanSlides = sanitizeClientSlides(state.slides);
        localStorage.setItem('ravok_slider_slides_s3_v4', JSON.stringify(cleanSlides.length ? cleanSlides : DEFAULT_SLIDES));
        renderSlider();
      }

      if (Array.isArray(state.streamers) && state.streamers.length > 0) {
        const cleanStr = state.streamers.map(normalizeClientStreamer).filter(Boolean);
        if (cleanStr.length > 0) {
          localStorage.setItem('ravok_streamers', JSON.stringify(cleanStr));
          localStorage.setItem('ravok_streamers_synced', '1');
          renderStreamers();
        }
      }

      if (Array.isArray(state.feedbacks) && state.feedbacks.length > 0) {
        localStorage.setItem('ravok_feedbacks', JSON.stringify(state.feedbacks));
        localStorage.setItem('ravok_feedbacks_synced', '1');
        renderFeedbacks();
      }

      if (state.goal) {
        localStorage.setItem('ravok_goal_v1', JSON.stringify(state.goal));
        applyGoalUI(state.goal);
      }

      if (state.discordInviteUrl && by('#discordLinkBtn')) {
        by('#discordLinkBtn').href = state.discordInviteUrl;
      }
      return;
    }

    // Fallback para endpoints individuais
    const [resProd, resSlides, resStr, resFb, resGoal] = await Promise.all([
      fetch('/api/products'),
      fetch('/api/slides'),
      fetch('/api/streamers'),
      fetch('/api/feedbacks'),
      fetch('/api/goal')
    ]);

    if (resProd.ok) {
      const prods = await resProd.json();
      if (Array.isArray(prods)) {
        const cleanProds = upgradeClientProducts(prods);
        localStorage.setItem('ravok_products_v6', JSON.stringify(cleanProds));
        localStorage.setItem('ravok_products_synced', '1');
        products = cleanProds;
        renderProducts();
      }
    }
    if (resSlides.ok) {
      const slides = sanitizeClientSlides(await resSlides.json());
      if (slides.length) {
        localStorage.setItem('ravok_slider_slides_s3_v4', JSON.stringify(slides));
        renderSlider();
      }
    }
    if (resStr.ok) {
      const streamers = (await resStr.json()).map(normalizeClientStreamer).filter(Boolean);
      localStorage.setItem('ravok_streamers', JSON.stringify(streamers));
      localStorage.setItem('ravok_streamers_synced', '1');
      renderStreamers();
    }
    if (resFb.ok) {
      const feedbacks = await resFb.json();
      if (Array.isArray(feedbacks)) {
        localStorage.setItem('ravok_feedbacks', JSON.stringify(feedbacks));
        localStorage.setItem('ravok_feedbacks_synced', '1');
        renderFeedbacks();
      }
    }
    if (resGoal.ok) {
      const goal = await resGoal.json();
      if (goal && goal.success) {
        localStorage.setItem('ravok_goal_v1', JSON.stringify(goal));
        applyGoalUI(goal);
      }
    }
  } catch (e) {
    console.log('Operando com cache local.');
  }
}

// ====================================================
// META DE ARRECADAÇÃO MENSAL (MANUTENÇÃO DO SERVIDOR)
// ====================================================
function applyGoalUI(goalData) {
  const percentEl = by('#goalPercentPill');
  const fillEl = by('#goalProgressFill');
  const percentDisplayEl = by('#goalPercentDisplay');
  const percentVal = Math.min(100, Math.max(0, Math.round(Number((goalData && goalData.percent) || 0))));
  const isZero = percentVal <= 0;

  if (percentEl) percentEl.textContent = `${percentVal}% Atingida`;
  if (fillEl) {
    fillEl.style.width = `${percentVal}%`;
    const glow = fillEl.querySelector('.rw-goal-progress-glow');
    if (glow) glow.style.display = isZero ? 'none' : 'block';
  }
  if (percentDisplayEl) percentDisplayEl.textContent = `${percentVal}%`;

  const m50 = by('#goalMilestone50');
  const m75 = by('#goalMilestone75');
  const m100 = by('#goalMilestone100');
  if (m50) m50.classList.toggle('reached', percentVal >= 50);
  if (m75) m75.classList.toggle('reached', percentVal >= 75);
  if (m100) m100.classList.toggle('reached', percentVal >= 100);
}

async function loadSalesGoal() {
  let goalData = { percent: 0 };

  try {
    const cached = localStorage.getItem('ravok_goal_v1');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.percent !== undefined) {
        goalData = parsed;
        applyGoalUI(goalData);
      }
    }
  } catch (e) {}

  if (window.location.protocol.startsWith('http')) {
    try {
      const res = await fetch('/api/goal');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          goalData = data;
          localStorage.setItem('ravok_goal_v1', JSON.stringify(data));
        }
      }
    } catch (e) {}
  }

  applyGoalUI(goalData);
}
window.loadSalesGoal = loadSalesGoal;

// Escutar atualizações em tempo real vindas do Painel Admin (mesmo navegador / outra aba)
try {
  const ravokSyncChannel = new BroadcastChannel('ravok_sync');
  ravokSyncChannel.onmessage = () => {
    renderProducts();
    renderSlider();
    renderStreamers();
    renderFeedbacks();
    loadSalesGoal();
    syncWithBackend();
  };
} catch (e) {}

window.addEventListener('storage', (ev) => {
  if (!ev.key) return;
  if (ev.key === 'ravok_products_v6' || ev.key === 'ravok_products_v5') renderProducts();
  if (ev.key === 'ravok_slider_slides_s3_v4') renderSlider();
  if (ev.key === 'ravok_hero_slides_s3') { renderHeroDots(); renderHeroSlide(0); }
  if (ev.key === 'ravok_streamers') renderStreamers();
  if (ev.key === 'ravok_feedbacks') renderFeedbacks();
  if (ev.key === 'ravok_goal_v1') loadSalesGoal();
});

// ====================================================
// CARROSSEL DE SLIDES DO BANNER PRINCIPAL (HERO SLIDER)
// ====================================================
const HERO_SLIDES = [
  {
    tagIcon: 'images/autumn/folha_de_bordo_flutuante.png',
    tagText: 'TEMPORADA 3 • OUTONAL',
    title: 'COLHEITA &amp;<br>GLÓRIA ANCESTRAL',
    desc: 'A nova era da Ravok Network chegou! Explore a atmosfera outonal, desbloqueie os VIPs Vendaval, Flamejante, Carvalho, Aurora, Solar e Deusa, novas Chaves S3 e texturas oficiais exclusivas com entrega automática.',
    charImg: 'images/fullbody.png',
    charAlt: 'Guerreiro Ravok 3D',
    primaryHtml: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg><span>Jogar agora: <b id="serverIpBanner">jogar.ravok.network</b> <span style="font-size:11px; opacity:0.85; margin-left:4px; font-weight:normal;">(Bedrock: 26575)</span></span>',
    primaryOnClick: 'copyServerIp()',
    secHtml: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><span>Texturas HD</span>',
    secHref: '/texturas'
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
    tagIcon: 'images/products/voucher_toolskin_hd.png',
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

function getHeroSlides() {
  const saved = localStorage.getItem('ravok_hero_slides_s3');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  return HERO_SLIDES;
}

function renderHeroSlide(idx) {
  const slides = getHeroSlides();
  if (idx < 0 || idx >= slides.length) idx = 0;
  currentHeroSlide = idx;
  const slide = slides[idx]; if (!slide) return;

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
  const slides = getHeroSlides();
  const nextIdx = (currentHeroSlide + 1) % (slides.length || 1);
  renderHeroSlide(nextIdx);
}

function startHeroSlider() {
  if (heroSliderInterval) clearInterval(heroSliderInterval);
  heroSliderInterval = setInterval(nextHeroSlide, 6500);
}

function renderHeroDots() {
  const slides = getHeroSlides();
  const dotsContainer = by('#heroBannerDots');
  if (!dotsContainer) return;
  dotsContainer.innerHTML = slides.map((s, idx) => `
    <span class="rw-banner-dot ${idx === currentHeroSlide ? 'active' : ''}" data-hero-slide="${idx}" aria-label="Slide ${idx + 1}"></span>
  `).join('');

  dotsContainer.querySelectorAll('.rw-banner-dot').forEach((dot) => {
    dot.onclick = () => {
      const idx = parseInt(dot.dataset.heroSlide, 10);
      if (!isNaN(idx)) {
        renderHeroSlide(idx);
        startHeroSlider();
      }
    };
  });
}

function initHeroSlider() {
  renderHeroDots();

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

// Inicialização completa e segura da aplicação
function initApp() {
  try { renderProducts(); } catch (err) { console.error('Erro renderProducts:', err); }
  try { renderCart(); } catch (err) { console.error('Erro renderCart:', err); }
  try { renderSlider(); } catch (err) { console.error('Erro renderSlider:', err); }
  try { renderStreamers(); } catch (err) { console.error('Erro renderStreamers:', err); }
  try { renderFeedbacks(); } catch (err) { console.error('Erro renderFeedbacks:', err); }
  try { initHeroSlider(); } catch (err) { console.error('Erro initHeroSlider:', err); }
  try { loadCustomMascot(); } catch (err) {}
  try { loadServerStatus(); } catch (err) {}
  try { loadSalesGoal(); } catch (err) {}
  try { updateDiscordLink(); } catch (err) {}
  try { initPlayerAuth(); } catch (err) {}
  try { syncWithBackend(); } catch (err) {}
}

initApp();
if (typeof document !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
}
setInterval(loadServerStatus, 25000);

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

