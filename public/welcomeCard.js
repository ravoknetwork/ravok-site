const path = require('path');
const fs = require('fs');

let canvasModule = null;
try {
  canvasModule = require('@napi-rs/canvas');
} catch (e) {
  try {
    canvasModule = require(path.join(__dirname, 'node_modules', '@napi-rs', 'canvas'));
  } catch (err) {
    console.warn('[WelcomeCard] @napi-rs/canvas indisponível:', err.message);
  }
}

/**
 * Cria a imagem personalizada de boas-vindas para a Ravok Network.
 * Suporta imagem de fundo customizada ou o layout geométrico de alta fidelidade.
 */
async function generateWelcomeCard({
  username,
  avatarUrl,
  memberCount,
  serverName = 'Ravok Network',
  badgeText = null,
  welcomePrefix = 'Welcome',
  backgroundImage = null
}) {
  if (!canvasModule) {
    throw new Error('Canvas não instalado');
  }

  const { createCanvas, loadImage } = canvasModule;

  const width = 760;
  const height = 420;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  function roundRect(x, y, w, h, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  ctx.clearRect(0, 0, width, height);

  // Tentativa de carregar imagem de fundo personalizada se fornecida
  let loadedBgImage = null;
  if (backgroundImage) {
    try {
      if (typeof backgroundImage === 'string') {
        if (backgroundImage.startsWith('http://') || backgroundImage.startsWith('https://')) {
          const res = await fetch(backgroundImage);
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            loadedBgImage = await loadImage(buf);
          }
        } else if (backgroundImage.startsWith('data:image')) {
          const base64Data = backgroundImage.split(',')[1];
          const buf = Buffer.from(base64Data, 'base64');
          loadedBgImage = await loadImage(buf);
        } else {
          // Arquivo local
          let localPath = backgroundImage;
          if (!path.isAbsolute(localPath)) {
            localPath = path.join(__dirname, backgroundImage);
          }
          if (fs.existsSync(localPath)) {
            loadedBgImage = await loadImage(localPath);
          }
        }
      } else if (Buffer.isBuffer(backgroundImage)) {
        loadedBgImage = await loadImage(backgroundImage);
      }
    } catch (bgErr) {
      console.warn('[WelcomeCard] Falha ao carregar backgroundImage personalizada:', bgErr.message);
    }
  }

  const cardX = 60;
  const cardY = 35;
  const cardW = width - 120;
  const cardH = height - 70;
  const cardR = 28;

  if (loadedBgImage) {
    // ----------------------------------------------------
    // MODO COM IMAGEM DE FUNDO ESCOLHIDA PELO USUÁRIO
    // ----------------------------------------------------
    // 1. Recorte do card arredondado para a imagem de fundo
    ctx.save();
    roundRect(cardX, cardY, cardW, cardH, cardR);
    ctx.clip();

    // 2. Desenho com escala de cobertura (cover)
    const imgRatio = loadedBgImage.width / loadedBgImage.height;
    const cardRatio = cardW / cardH;
    let renderW, renderH, renderX, renderY;

    if (imgRatio > cardRatio) {
      renderH = cardH;
      renderW = cardH * imgRatio;
      renderX = cardX + (cardW - renderW) / 2;
      renderY = cardY;
    } else {
      renderW = cardW;
      renderH = cardW / imgRatio;
      renderX = cardX;
      renderY = cardY + (cardH - renderH) / 2;
    }
    ctx.drawImage(loadedBgImage, renderX, renderY, renderW, renderH);

    // 3. Gradiente escurecedor suave para legibilidade cristalina
    const grad = ctx.createLinearGradient(0, cardY, 0, cardY + cardH);
    grad.addColorStop(0, 'rgba(46, 28, 21, 0.78)');
    grad.addColorStop(0.5, 'rgba(36, 21, 16, 0.86)');
    grad.addColorStop(1, 'rgba(26, 14, 10, 0.96)');
    ctx.fillStyle = grad;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    // 4. Borda e glow sutil no contorno
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 193, 7, 0.45)';
    ctx.lineWidth = 2;
    roundRect(cardX, cardY, cardW, cardH, cardR);
    ctx.stroke();
    ctx.restore();
  } else {
    // ----------------------------------------------------
    // MODO PADRÃO GEOMÉTRICO MODERNO (OUTONO & PÔR DO SOL)
    // ----------------------------------------------------
    // Formato laranja queimado decorativo atrás
    ctx.fillStyle = '#D84315';
    roundRect(75, 45, 170, 230, 40);
    ctx.fill();

    // Formato âmbar dourado decorativo atrás
    ctx.fillStyle = '#FFC107';
    roundRect(width - 245, height - 215, 170, 170, 40);
    ctx.fill();

    // Card Principal Escuro Madeira Nobre
    const defCardX = 95;
    const defCardY = 55;
    const defCardW = width - 190;
    const defCardH = height - 110;
    const defCardR = 30;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 12;

    ctx.fillStyle = '#241510';
    roundRect(defCardX, defCardY, defCardW, defCardH, defCardR);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(216, 67, 21, 0.4)';
    ctx.lineWidth = 1.5;
    roundRect(defCardX, defCardY, defCardW, defCardH, defCardR);
    ctx.stroke();
  }

  // Pílula superior: "Member #540"
  const pillLabel = badgeText || `Member #${memberCount || '1'}`;
  const pillW = Math.max(180, pillLabel.length * 11 + 32);
  const pillH = 34;
  const pillX = width / 2 - pillW / 2;
  const pillY = (loadedBgImage ? cardY : 55) + 16;
  const pillR = 12;

  ctx.fillStyle = loadedBgImage ? 'rgba(216, 67, 21, 0.35)' : '#2E1C15';
  roundRect(pillX, pillY, pillW, pillH, pillR);
  ctx.fill();

  if (loadedBgImage) {
    ctx.strokeStyle = 'rgba(255, 193, 7, 0.5)';
    ctx.lineWidth = 1;
    roundRect(pillX, pillY, pillW, pillH, pillR);
    ctx.stroke();
  }

  ctx.fillStyle = loadedBgImage ? '#FFE082' : '#F4E8C1';
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pillLabel, width / 2, pillY + pillH / 2);

  // Círculo do Avatar (Centralizado)
  const avatarRadius = 54;
  const avatarX = width / 2;
  const avatarY = (loadedBgImage ? cardY : 55) + 120;

  // Anel externo branco grosso com sombra suave
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius + 4, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  // Recorte circular do avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  try {
    let avatarImg;
    if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.startsWith('http')) {
      const res = await fetch(avatarUrl);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        avatarImg = await loadImage(buf);
      }
    }
    if (!avatarImg) {
      avatarImg = await loadImage('https://cdn.discordapp.com/embed/avatars/0.png');
    }
    ctx.drawImage(avatarImg, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
  } catch (err) {
    console.warn('[WelcomeCard] Falha ao carregar avatar:', err.message);
  }
  ctx.restore();

  // Textos Centrais
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';

  let displayNick = username || 'Aventureiro';
  if (displayNick.length > 18) {
    displayNick = displayNick.substring(0, 16) + '...';
  }
  ctx.fillText(`${welcomePrefix} ${displayNick}`, width / 2, avatarY + avatarRadius + 42);

  ctx.fillStyle = '#949ba4';
  ctx.font = 'italic 16px "Segoe UI", Arial, sans-serif';
  ctx.fillText('to', width / 2, avatarY + avatarRadius + 67);

  ctx.fillStyle = loadedBgImage ? '#FFC107' : '#FFE082';
  ctx.font = 'bold 23px "Segoe UI", Arial, sans-serif';
  ctx.fillText(serverName, width / 2, avatarY + avatarRadius + 95);

  return canvas.toBuffer('image/png');
}

module.exports = {
  generateWelcomeCard
};
