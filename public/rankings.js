const by = s => document.querySelector(s);

function toast(msg) {
  const t = by('#rankToast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// Dados padrão caso o servidor de Minecraft ainda não tenha executado /ravoksync
const MOCK_PLAYERS = [
  { nick: 'Guiileu', coins: 2850, kills: 142, time_played: '84h', votes: 35, money: '145000' },
  { nick: 'DarkKnight99', coins: 1920, kills: 230, time_played: '112h', votes: 28, money: '98400' },
  { nick: 'LethiciaCraft', coins: 1450, kills: 89, time_played: '65h', votes: 42, money: '76200' },
  { nick: 'VortexPvP', coins: 1100, kills: 310, time_played: '95h', votes: 19, money: '54000' },
  { nick: 'ShadowBuilder', coins: 890, kills: 45, time_played: '130h', votes: 31, money: '189000' },
  { nick: 'DragonSlayer', coins: 650, kills: 178, time_played: '52h', votes: 15, money: '41200' }
];

let currentType = 'coins';
let rankingsData = null;

async function loadRankings() {
  try {
    const res = await fetch('/api/rankings');
    if (res.ok) {
      rankingsData = await res.json();
    }
  } catch (e) {
    console.warn('API offline, usando fallback mock local.');
  }

  renderRankings(currentType);
}

function getSortedList(type) {
  let list = [];

  if (rankingsData && rankingsData.totalTracked > 0) {
    if (type === 'coins') list = rankingsData.topCoins || [];
    if (type === 'kills') list = rankingsData.topKills || [];
    if (type === 'votes') list = rankingsData.topVotes || [];
    if (type === 'time') list = rankingsData.topTime || [];
    if (type === 'money') list = rankingsData.topMoney || [];
  }

  // Se não houver dados sincronizados ainda, usa mock
  if (!list.length) {
    const copy = [...MOCK_PLAYERS];
    if (type === 'coins') copy.sort((a, b) => b.coins - a.coins);
    if (type === 'kills') copy.sort((a, b) => b.kills - a.kills);
    if (type === 'votes') copy.sort((a, b) => b.votes - a.votes);
    if (type === 'time') copy.sort((a, b) => parseInt(b.time_played) - parseInt(a.time_played));
    if (type === 'money') copy.sort((a, b) => parseFloat(b.money) - parseFloat(a.money));
    return copy;
  }

  return list;
}

function formatValue(type, val) {
  if (type === 'coins') return `✦ ${Number(val || 0).toLocaleString('pt-BR')} Coins`;
  if (type === 'kills') return `⚔️ ${Number(val || 0)} Kills`;
  if (type === 'votes') return `🗳️ ${Number(val || 0)} Votos`;
  if (type === 'time') return `⏳ ${val || '0h'}`;
  if (type === 'money') return `R$ ${Number(val || 0).toLocaleString('pt-BR')}`;
  return val;
}

function getRawValue(type, player) {
  if (type === 'coins') return player.coins;
  if (type === 'kills') return player.kills;
  if (type === 'votes') return player.votes;
  if (type === 'time') return player.time_played;
  if (type === 'money') return player.money;
  return 0;
}

function renderRankings(type) {
  const list = getSortedList(type);
  const podium = by('#podiumArea');
  const rows = by('#leaderboardRows');

  // Top 3 (Pódio)
  const first = list[0];
  const second = list[1];
  const third = list[2];

  let podiumHtml = '';

  if (second) {
    podiumHtml += `
      <div class="podium-card silver">
        <span class="podium-badge">2º Lugar</span>
        <img class="podium-avatar" src="https://mc-heads.net/avatar/${encodeURIComponent(second.nick)}/80" alt="${second.nick}">
        <strong class="podium-nick">${second.nick}</strong>
        <span class="podium-val">${formatValue(type, getRawValue(type, second))}</span>
        <div style="margin-top:14px;"><button class="btn-sm" onclick="openPlayerModal('${second.nick}')">Ver Perfil</button></div>
      </div>
    `;
  }

  if (first) {
    podiumHtml += `
      <div class="podium-card gold">
        <span class="podium-badge">👑 1º Lugar</span>
        <img class="podium-avatar" src="https://mc-heads.net/avatar/${encodeURIComponent(first.nick)}/100" alt="${first.nick}">
        <strong class="podium-nick">${first.nick}</strong>
        <span class="podium-val">${formatValue(type, getRawValue(type, first))}</span>
        <div style="margin-top:14px;"><button class="primary" style="padding:7px 16px; font-size:12px;" onclick="openPlayerModal('${first.nick}')">Ver Perfil</button></div>
      </div>
    `;
  }

  if (third) {
    podiumHtml += `
      <div class="podium-card bronze">
        <span class="podium-badge">3º Lugar</span>
        <img class="podium-avatar" src="https://mc-heads.net/avatar/${encodeURIComponent(third.nick)}/80" alt="${third.nick}">
        <strong class="podium-nick">${third.nick}</strong>
        <span class="podium-val">${formatValue(type, getRawValue(type, third))}</span>
        <div style="margin-top:14px;"><button class="btn-sm" onclick="openPlayerModal('${third.nick}')">Ver Perfil</button></div>
      </div>
    `;
  }

  podium.innerHTML = podiumHtml || '<p style="color:var(--muted); text-align:center; grid-column:1/-1;">Nenhum dado registrado ainda.</p>';

  // Tabela (4º ao 10º)
  const rest = list.slice(3, 10);
  if (!rest.length) {
    rows.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--muted); padding:30px;">Apenas o top 3 registrado até o momento.</td></tr>';
    return;
  }

  rows.innerHTML = rest.map((p, idx) => `
    <tr>
      <td class="rank-pos">#${idx + 4}</td>
      <td>
        <div class="player-cell">
          <img src="https://mc-heads.net/avatar/${encodeURIComponent(p.nick)}/32" alt="${p.nick}">
          <strong style="color:#fff;">${p.nick}</strong>
        </div>
      </td>
      <td><strong style="color:var(--blue); font-family:'DM Mono';">${formatValue(type, getRawValue(type, p))}</strong></td>
      <td style="text-align:right;">
        <button class="btn-sm" onclick="openPlayerModal('${p.nick}')">Perfil ↗</button>
      </td>
    </tr>
  `).join('');
}

// Navegação entre abas
document.querySelectorAll('.ranking-tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.ranking-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentType = btn.dataset.type;
    renderRankings(currentType);
  };
});

// Modal Perfil de Jogador
window.openPlayerModal = async (nick) => {
  const modal = by('#playerProfileModal');
  by('#profNick').textContent = nick;
  by('#profBodyImg').src = `https://mc-heads.net/body/${encodeURIComponent(nick)}/160`;

  try {
    const res = await fetch(`/api/player/${encodeURIComponent(nick)}`);
    if (res.ok) {
      const data = await res.json();
      by('#profCoins').textContent = (data.stats.coins || 0).toLocaleString('pt-BR');
      by('#profKills').textContent = data.stats.kills || 0;
      by('#profTime').textContent = data.stats.time_played || '0h';
      by('#profVotes').textContent = data.stats.votes || 0;

      const badge = by('#profLinkedBadge');
      const dcBox = by('#profDiscordContainer');
      const dcTag = by('#profDiscordTag');
      if (data.linked) {
        badge.textContent = '✓ CONTA OFICIALMENTE VINCULADA';
        badge.style.color = 'var(--ravok-accent-cyan, #00f2fe)';
        badge.style.fontWeight = '800';
        if (dcBox && dcTag && data.discordTag) {
          dcTag.textContent = data.discordTag;
          dcBox.style.display = 'block';
        } else if (dcBox) {
          dcBox.style.display = 'none';
        }
      } else {
        badge.textContent = '✦ PERFIL DE JOGADOR ✦';
        badge.style.color = 'var(--ravok-accent-blue, #38bdf8)';
        if (dcBox) dcBox.style.display = 'none';
      }
    } else {
      loadMockProfile(nick);
    }
  } catch (e) {
    loadMockProfile(nick);
  }

  modal.showModal();
};

function loadMockProfile(nick) {
  const mock = MOCK_PLAYERS.find(p => p.nick.toLowerCase() === nick.toLowerCase()) || {
    coins: 0, kills: 0, time_played: '0m', votes: 0
  };
  by('#profCoins').textContent = Number(mock.coins).toLocaleString('pt-BR');
  by('#profKills').textContent = mock.kills;
  by('#profTime').textContent = mock.time_played;
  by('#profVotes').textContent = mock.votes;
  if (by('#profDiscordContainer')) by('#profDiscordContainer').style.display = 'none';
}

// Formulário de busca de jogador
by('#searchPlayerForm').onsubmit = (e) => {
  e.preventDefault();
  const nick = by('#searchNickInput').value.trim();
  if (nick) openPlayerModal(nick);
};

// Modal de Vincular Conta
by('#openLinkModalBtn').onclick = () => {
  by('#linkAccountModal').showModal();
};

by('#linkAccountForm').onsubmit = async (e) => {
  e.preventDefault();
  const nick = by('#linkNick').value.trim();
  const code = by('#linkCode').value.trim();
  const discordTag = (by('#linkDiscordTag')?.value || '').trim();

  try {
    const res = await fetch('/api/player/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick, code, discordTag })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      toast('✓ Conta vinculada com sucesso ao Ravok Network!');
      by('#linkAccountModal').close();
      by('#linkAccountForm').reset();
      openPlayerModal(nick);
    } else {
      toast(data.error || 'Erro ao vincular conta. Verifique o código.');
    }
  } catch (err) {
    toast('Erro de conexão ao vincular. Tente novamente.');
  }
};

// Carregar ao iniciar
loadRankings();
