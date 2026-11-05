// ====================================================
// ARENA DE VOTOS & QUEST DO DIA · RAVOK NETWORK
// ====================================================

const by = s => document.querySelector(s);
let currentSlide = 0;
let slideInterval = null;
let voteData = null;

function toast(msg) {
  const t = by('#voteToast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

// ----------------------------------------------------
// 1. CARROSSEL DE SLIDES HERO
// ----------------------------------------------------
function initCarousel() {
  const slides = document.querySelectorAll('.vote-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  if (!slides.length) return;

  function showSlide(idx) {
    currentSlide = (idx + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('active', i === currentSlide));
    dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
  }

  const prevBtn = by('#prevSlideBtn');
  const nextBtn = by('#nextSlideBtn');
  if (prevBtn) prevBtn.onclick = () => { showSlide(currentSlide - 1); resetInterval(); };
  if (nextBtn) nextBtn.onclick = () => { showSlide(currentSlide + 1); resetInterval(); };

  dots.forEach((dot, i) => {
    dot.onclick = () => { showSlide(i); resetInterval(); };
  });

  function startInterval() {
    slideInterval = setInterval(() => showSlide(currentSlide + 1), 6000);
  }
  function resetInterval() {
    clearInterval(slideInterval);
    startInterval();
  }

  const carouselWrap = by('#voteCarousel');
  if (carouselWrap) {
    carouselWrap.onmouseenter = () => clearInterval(slideInterval);
    carouselWrap.onmouseleave = () => startInterval();
  }

  startInterval();
}

// ----------------------------------------------------
// 2. GERENCIAMENTO DE JOGADOR (NICK & SKIN)
// ----------------------------------------------------
function getActivePlayer() {
  return localStorage.getItem('ravokPlayer') || '';
}

function setActivePlayer(nick) {
  const clean = (nick || '').trim();
  if (clean) {
    localStorage.setItem('ravokPlayer', clean);
  } else {
    localStorage.removeItem('ravokPlayer');
  }
  updatePlayerUI();
  loadVotePageData();
}

function updatePlayerUI() {
  const player = getActivePlayer();
  const nickText = by('#playerNickText');
  const skinImg = by('#playerSkinHead');

  if (player) {
    if (nickText) nickText.textContent = player;
    if (skinImg) skinImg.src = `https://mc-heads.net/avatar/${encodeURIComponent(player)}/44`;
  } else {
    if (nickText) nickText.textContent = 'Não informado (Clique para definir)';
    if (skinImg) skinImg.src = 'https://mc-heads.net/avatar/Steve/44';
  }
}

// Modal de alteração de nick
const nickModal = by('#playerNickModal');
const nickForm = by('#playerNickForm');
const openNickBtn = by('#openChangeNickModalBtn');

if (openNickBtn) {
  openNickBtn.onclick = () => {
    by('#playerNickInput').value = getActivePlayer();
    if (nickModal) nickModal.showModal();
  };
}

if (nickForm) {
  nickForm.onsubmit = (e) => {
    e.preventDefault();
    const newNick = by('#playerNickInput').value.trim();
    if (!/^[A-Za-z0-9_]{3,16}$/.test(newNick)) {
      toast('Informe um nick válido de Minecraft (3 a 16 letras, números ou _).');
      return;
    }
    setActivePlayer(newNick);
    if (nickModal) nickModal.close();
    toast(`✓ Nick definido como "${newNick}"!`);
  };
}

// ----------------------------------------------------
// 3. CARREGAMENTO E RENDERIZAÇÃO DA ARENA DE VOTOS
// ----------------------------------------------------
async function loadVotePageData() {
  const player = getActivePlayer();
  const query = player ? `?nick=${encodeURIComponent(player)}` : '';

  try {
    const res = await fetch(`/api/vote/arena${query}`);
    if (res.ok) {
      voteData = await res.json();
      renderVotePage();
    }
  } catch (err) {
    console.error('Erro ao buscar dados de votação:', err);
  }
}

function renderVotePage() {
  if (!voteData) return;

  const player = getActivePlayer();
  const completed = voteData.completedChallenges || [];

  // Atualizar badge de desafios concluídos hoje
  const badge = by('#challengesDoneBadge');
  if (badge) {
    badge.textContent = player 
      ? `${completed.length} de 4 desafios feitos hoje` 
      : 'Identifique-se para votar';
  }

  // 1. Renderizar Quest do Dia
  renderDailyQuest();

  // 2. Renderizar Quiz
  renderQuizChallenge();

  // 3. Renderizar Enquete
  renderPollChallenge();

  // 4. Renderizar Pegadinha
  renderPrankChallenge();

  // 5. Renderizar Piada
  renderJokeChallenge();
}

// ----------------------------------------------------
// 4. SISTEMA DA QUEST DO DIA
// ----------------------------------------------------
function renderDailyQuest() {
  const quest = voteData.dailyQuest || {};
  const card = by('#dailyQuestCard');
  if (!card) return;

  if (quest.enabled === false) {
    card.style.display = 'none';
    return;
  }
  card.style.display = 'block';

  if (by('#questTitleDisplay')) by('#questTitleDisplay').textContent = quest.title || 'Jornada do Conhecimento';
  if (by('#questDescDisplay')) by('#questDescDisplay').textContent = quest.description || 'Complete os desafios hoje!';
  if (by('#questRewardDisplay')) by('#questRewardDisplay').textContent = quest.rewardTitle || '2x Chaves de Voto';

  const tipBox = by('#questSilvieTipBox');
  const tipText = by('#questSilvieTipText');
  if (tipBox && tipText) {
    if (quest.silvieTip && quest.silvieTip.trim()) {
      tipText.textContent = quest.silvieTip.trim();
      tipBox.style.display = 'flex';
    } else {
      tipBox.style.display = 'none';
    }
  }

  const progress = Number(quest.progress) || 0;
  const target = Number(quest.targetCount) || 2;
  const percent = Math.min(100, Math.round((progress / target) * 100));

  if (by('#questProgressNumbers')) {
    by('#questProgressNumbers').textContent = `${progress} / ${target} Concluídos (${percent}%)`;
  }
  if (by('#questProgressBar')) {
    by('#questProgressBar').style.width = `${percent}%`;
  }

  const claimBtn = by('#claimDailyQuestBtn');
  if (!claimBtn) return;

  if (quest.claimed) {
    claimBtn.className = 'btn-claim-quest claimed';
    claimBtn.disabled = true;
    claimBtn.innerHTML = '<span>✓ Recompensa Resgatada Hoje!</span>';
  } else if (progress >= target) {
    claimBtn.className = 'btn-claim-quest ready';
    claimBtn.disabled = false;
    claimBtn.innerHTML = `<span>🎁 Resgatar Bônus (${quest.rewardTitle || '2x Chaves'})!</span>`;
    claimBtn.onclick = claimDailyQuestBonus;
  } else {
    claimBtn.className = 'btn-claim-quest locked';
    claimBtn.disabled = true;
    const remaining = target - progress;
    claimBtn.innerHTML = `<span>🔒 Complete mais ${remaining} desafio${remaining > 1 ? 's' : ''} hoje</span>`;
  }
}

async function claimDailyQuestBonus() {
  const player = getActivePlayer();
  if (!player) {
    toast('Primeiro informe seu nick no Minecraft!');
    if (nickModal) nickModal.showModal();
    return;
  }

  const claimBtn = by('#claimDailyQuestBtn');
  if (claimBtn) claimBtn.disabled = true;

  try {
    const res = await fetch('/api/vote/daily-quest/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick: player })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      toast(data.message || '🎉 Parabéns! Recompensa enviada para o /resgatar!');
      await loadVotePageData();
    } else {
      toast(data.error || 'Não foi possível resgatar o bônus.');
      if (claimBtn) claimBtn.disabled = false;
    }
  } catch (err) {
    toast('Erro de conexão ao resgatar bônus.');
    if (claimBtn) claimBtn.disabled = false;
  }
}

// ----------------------------------------------------
// 5. RENDERIZAÇÃO DOS 4 DESAFIOS
// ----------------------------------------------------
function renderQuizChallenge() {
  const q = (voteData.quiz && voteData.quiz[0]) || null;
  const title = by('#quizQuestionTitle');
  const wrap = by('#quizOptionsWrap');
  if (!title || !wrap) return;

  if (!q) {
    title.textContent = 'Nenhuma pergunta disponível no momento.';
    wrap.innerHTML = '';
    return;
  }

  title.textContent = q.question;
  wrap.innerHTML = (q.options || []).map(opt => `
    <button type="button" class="challenge-opt-btn" onclick="submitChallenge('quiz', '${q.id}', '${opt.id}', this)">
      <span>${escapeHtml(opt.text)}</span>
      <span style="font-size:12px; color:var(--muted);">Responder ↵</span>
    </button>
  `).join('');
}

function renderPollChallenge() {
  const poll = voteData.poll;
  const title = by('#pollQuestionTitle');
  const wrap = by('#pollOptionsWrap');
  if (!title || !wrap) return;

  if (!poll || !poll.options || !poll.options.length) {
    title.textContent = 'Nenhuma enquete ativa no momento.';
    wrap.innerHTML = '';
    return;
  }

  title.textContent = poll.question;
  wrap.innerHTML = (poll.options || []).map(opt => `
    <button type="button" class="challenge-opt-btn" onclick="submitChallenge('poll', '${poll.id}', '${opt.id}', this)">
      <span>${escapeHtml(opt.text)}</span>
      <span style="font-size:12px; color:var(--blue-bright);">Votar 🗳️</span>
    </button>
  `).join('');

  renderPollResultsBars(poll);
}

function renderPollResultsBars(poll) {
  const resultsBox = by('#pollResultsWrap');
  if (!resultsBox || !poll || !poll.options) return;
  resultsBox.style.display = 'block';

  resultsBox.innerHTML = `
    <div style="font-size:13px; font-weight:800; color:#55e6d8; margin-bottom:12px; display:flex; justify-content:space-between;">
      <span>📊 RESULTADOS AO VIVO DA COMUNIDADE</span>
      <span style="color:var(--muted);">${poll.totalVotes || 0} votos computados</span>
    </div>
    ${poll.options.map(o => `
      <div class="poll-result-bar">
        <div class="poll-bar-header">
          <span style="color:#e2e8f0; font-weight:600;">${escapeHtml(o.text)}</span>
          <strong style="color:var(--blue);">${o.percent || 0}% (${o.votes || 0})</strong>
        </div>
        <div class="poll-bar-bg">
          <div class="poll-bar-fill" style="width: ${o.percent || 0}%;"></div>
        </div>
      </div>
    `).join('')}
  `;
}

function renderPrankChallenge() {
  const prank = (voteData.pranks && voteData.pranks[0]) || null;
  const title = by('#prankRiddleTitle');
  const wrap = by('#prankOptionsWrap');
  if (!title || !wrap) return;

  if (!prank) {
    title.textContent = 'Nenhuma pegadinha disponível no momento.';
    wrap.innerHTML = '';
    return;
  }

  title.textContent = `"${prank.riddle}"`;
  wrap.innerHTML = (prank.options || []).map(opt => `
    <button type="button" class="challenge-opt-btn" onclick="submitChallenge('prank', '${prank.id}', '${opt.id}', this)">
      <span>${escapeHtml(opt.text)}</span>
      <span style="font-size:12px; color:var(--muted);">Escolher ↵</span>
    </button>
  `).join('');
}

function renderJokeChallenge() {
  const joke = (voteData.jokes && voteData.jokes[0]) || null;
  const title = by('#jokeSetupTitle');
  const wrap = by('#jokeOptionsWrap');
  if (!title || !wrap) return;

  if (!joke) {
    title.textContent = 'Nenhuma piada disponível no momento.';
    wrap.innerHTML = '';
    return;
  }

  title.textContent = `"${joke.setup}"`;
  wrap.innerHTML = (joke.options || []).map(opt => `
    <button type="button" class="challenge-opt-btn" onclick="submitChallenge('joke', '${joke.id}', '${opt.id}', this)">
      <span>${escapeHtml(opt.text)}</span>
      <span style="font-size:12px; color:var(--muted);">Completar 😂</span>
    </button>
  `).join('');
}

// ----------------------------------------------------
// 6. SUBMISSÃO DE DESAFIOS & RESGATE DE CHAVE
// ----------------------------------------------------
window.submitChallenge = async function(type, itemId, answerId, btnEl) {
  const player = getActivePlayer();
  if (!player) {
    toast('Primeiro informe seu nick no Minecraft para receber a chave!');
    if (nickModal) nickModal.showModal();
    return;
  }

  const feedbackBox = by(`#${type}Feedback`);
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
        renderPollResultsBars(data.poll);
      }

      const successCard = by('#voteSuccessCard');
      if (successCard) successCard.style.display = 'flex';

      toast('🎉 Voto computado com sucesso! Sua 1x Chave de Voto está no /resgatar!');

      // Atualiza progresso da Quest do Dia e contagem de desafios
      await loadVotePageData();
    } else {
      if (btnEl) {
        btnEl.classList.add('wrong');
        setTimeout(() => btnEl.classList.remove('wrong'), 1600);
      }
      if (feedbackBox) {
        feedbackBox.className = 'challenge-feedback error';
        feedbackBox.style.display = 'block';
        feedbackBox.textContent = data.error || 'Resposta incorreta.';
      }
      toast(data.error || 'Ops! Resposta incorreta.');
    }
  } catch (err) {
    toast('Erro de conexão ao enviar voto. Tente novamente.');
  }
};

// ----------------------------------------------------
// 7. NAVEGAÇÃO ENTRE AS ABAS DOS DESAFIOS
// ----------------------------------------------------
document.querySelectorAll('.arena-tab-nav').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.arena-tab-nav').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.arena-pane').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const targetId = btn.dataset.target;
    const targetPane = by(`#${targetId}`);
    if (targetPane) targetPane.classList.add('active');
  };
});

// ----------------------------------------------------
// 8. INICIALIZAÇÃO DA PÁGINA
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initCarousel();
  updatePlayerUI();
  loadVotePageData();
});
