(() => {
  const txtButton = document.getElementById('txt_id');
  const buttonGame = document.getElementById('button-game');

  const contentProfile = document.getElementById('contentProfile');
  const screenGame = document.getElementById('screen_game');
  const screenShop = document.getElementById('screen_shop');
  const backGame = document.getElementById('ids_back_game');

  const restartButton = document.getElementById('restartButton');
  const canvas = document.getElementById('game');

  // Если страница не профиль/элементы не найдены — ничего не делаем
  if (!txtButton || !buttonGame || !screenGame || !canvas) return;

  const ctx = canvas.getContext('2d');
  const scoreElement = document.getElementById('score');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const bestScoreElement = document.getElementById('best_score');
  const finalTimeEl = document.getElementById('finalTime');
  const finalScoreEl = document.getElementById('finalScore');

  const keyUI = {
    KeyW: document.getElementById('key-W'),
    KeyA: document.getElementById('key-A'),
    KeyS: document.getElementById('key-S'),
    KeyD: document.getElementById('key-D'),
    Space: document.getElementById('key-SPACE'),
  };

  const keys = {};

  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    const el = keyUI[e.code];
    if (el) el.classList.add('key-pressed');
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    const el = keyUI[e.code];
    if (el) el.classList.remove('key-pressed');
  });

  function formatTime(t) {
    const minutes = Math.floor(t / 60);
    const seconds = t % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  const assets = {
    ship: new Image(),
    bullet: new Image(),
    asteroid: new Image(),
    earth: new Image(),
  };

  assets.ship.src = '/static/image/profile_img/ship.png';
  assets.bullet.src = '/static/image/profile_img/bullet.png';
  assets.asteroid.src = '/static/image/profile_img/Asteroid.png';
  assets.earth.src = '/static/image/profile_img/planet_earth.png';

  let bestScore = 0;
  let bestTime = 0;

  // Загружаем рекорд один раз
  fetch('/space/get-record/')
    .then((res) => res.json())
    .then((data) => {
      bestScore = data.score || 0;
      bestTime = data.time || 0;
      if (bestScoreElement) {
        bestScoreElement.innerHTML = `ОЧКИ: ${bestScore}<br>ВРЕМЯ: ${formatTime(bestTime)}`;
      }
    })
    .catch(() => {});

  // ---- Swiper магазина ----
  let shopSwiper = null;

  function initOrUpdateShopSwiper() {
    if (!screenShop || typeof Swiper === 'undefined') return;

    // ВАЖНО: инициализируем на реальном swiper-контейнере внутри магазина
    const shopRoot = screenShop.querySelector('.swiper');
    if (!shopRoot) return;

    const nextEl = screenShop.querySelector('.swiper-button-next');
    const prevEl = screenShop.querySelector('.swiper-button-prev');

    if (!shopSwiper) {
      shopSwiper = new Swiper(shopRoot, {
        slidesPerView: 1,
        spaceBetween: 20,
        navigation: {
          nextEl,
          prevEl,
        },
        observer: true,
        observeParents: true,
        watchOverflow: true,
      });
    } else {
      shopSwiper.update();
      shopSwiper.updateSize();
      shopSwiper.updateSlides();
      shopSwiper.updateProgress();
    }
  }

  // ---- Контроллер игры ----
  let running = false;
  let rafId = null;
  let asteroidIntervalId = null;

  let score = 0;
  let survivalTime = 0;
  let lastTimeUpdate = performance.now();
  let cameraShake = 0;

  const player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 1.2,
    friction: 0.92,
    w: 60,
    h: 60,
    shootCooldown: 0,
    radius: 26,
  };

  let bullets = [];
  let asteroids = [];
  let particles = [];
  let stars = [];

  const earth = {
    x: 0,
    y: 0,
    size: 700,
    vx: 0.15,
    vy: 0.1,
    active: true,
  };

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    player.x = canvas.width / 2;
    player.y = canvas.height - 100;

    earth.x = canvas.width - 400;
    earth.y = canvas.height - 400;
  }

  function createStars() {
    stars = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() * 6 + 1,
        length: Math.random() * 12,
      });
    }
  }

  function spawnAsteroid() {
    const size = Math.random() * 60 + 40;
    asteroids.push({
      x: Math.random() * canvas.width,
      y: -size,
      size,
      speed: 2 + score / 2000,
      hp: Math.ceil(size / 20),
      angle: 0,
    });
  }

  function shoot() {
    if (player.shootCooldown > 0) return;

    bullets.push({
      x: player.x,
      y: player.y,
      vy: -14,
    });

    player.shootCooldown = 6;
  }

  function createExplosion(x, y) {
    for (let i = 0; i < 40; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 30 + Math.random() * 10,
        size: 2 + Math.random() * 2,
      });
    }
    cameraShake = 10;
  }

  function clearLoops() {
    running = false;

    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    if (asteroidIntervalId != null) {
      clearInterval(asteroidIntervalId);
      asteroidIntervalId = null;
    }
  }

  function resetGameState() {
    score = 0;
    survivalTime = 0;
    lastTimeUpdate = performance.now();
    cameraShake = 0;

    player.vx = 0;
    player.vy = 0;
    player.shootCooldown = 0;

    bullets = [];
    asteroids = [];
    particles = [];
    createStars();

    earth.active = true;
    earth.x = canvas.width - 400;
    earth.y = canvas.height - 400;

    if (gameOverScreen) gameOverScreen.classList.add('hidden');
  }

  function update() {
    if (!running) return;

    if (keys['KeyA']) player.vx -= player.speed;
    if (keys['KeyD']) player.vx += player.speed;
    if (keys['KeyW']) player.vy -= player.speed;
    if (keys['KeyS']) player.vy += player.speed;

    player.vx *= player.friction;
    player.vy *= player.friction;

    player.x += player.vx;
    player.y += player.vy;

    player.x = Math.max(player.w / 2, Math.min(canvas.width - player.w / 2, player.x));
    player.y = Math.max(player.h / 2, Math.min(canvas.height - player.h / 2, player.y));

    if (keys['Space']) shoot();
    if (player.shootCooldown > 0) player.shootCooldown--;

    const now = performance.now();
    if (now - lastTimeUpdate >= 1000) {
      survivalTime++;
      lastTimeUpdate = now;
    }

    // stars
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > canvas.height) s.y = 0;
    }

    // earth
    if (earth.active) {
      earth.x += earth.vx;
      earth.y += earth.vy;

      if (earth.x > canvas.width + 800 || earth.y > canvas.height + 800) {
        earth.active = false;
      }
    }

    // bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y += b.vy;
      if (b.y < 0) bullets.splice(i, 1);
    }

    // asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      a.angle += 0.03;

      a.x = Math.max(a.size / 2, Math.min(canvas.width - a.size / 2, a.x));

      // bullet -> asteroid
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;

        if (dx * dx + dy * dy < (a.size / 2) * (a.size / 2)) {
          bullets.splice(j, 1);
          a.hp--;

          if (a.hp <= 0) {
            createExplosion(a.x, a.y);
            score += 50 + Math.floor(Math.random() * 101);
            asteroids.splice(i, 1);
          }
          break;
        }
      }

      // player -> asteroid
      const dxP = player.x - a.x;
      const dyP = player.y - a.y;

      if (dxP * dxP + dyP * dyP < (a.size / 2 + 20) * (a.size / 2 + 20)) {
        // Финал игры
        running = false;
        clearLoops();

        const currentScore = Math.floor(score);
        const currentTime = survivalTime;

        fetch('/space/save-record/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: currentScore, time: currentTime }),
        })
          .then((res) => res.json())
          .then((data) => {
            bestScore = data.best_score;
            bestTime = data.best_time;
            if (bestScoreElement) {
              bestScoreElement.innerHTML = `ОЧКИ: ${bestScore}<br>ВРЕМЯ: ${formatTime(bestTime)}`;
            }
          })
          .catch(() => {});

        if (finalTimeEl) finalTimeEl.innerText = formatTime(survivalTime);
        if (finalScoreEl) finalScoreEl.innerText = currentScore;

        // Локальная логика обновления рекорда (как в исходнике)
        if (currentScore > bestScore || currentTime > bestTime) {
          if (currentScore > bestScore) {
            bestScore = currentScore;
            localStorage.setItem('bestScore', bestScore);
          }
          if (currentTime > bestTime) {
            bestTime = currentTime;
            localStorage.setItem('bestTime', bestTime);
          }
          if (bestScoreElement) {
            bestScoreElement.innerHTML = `ОЧКИ: ${bestScore}<br>ВРЕМЯ: ${formatTime(bestTime)}`;
          }
        }

        if (gameOverScreen) gameOverScreen.classList.remove('hidden');
        break;
      }
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;

      p.vx *= 0.95;
      p.vy *= 0.95;

      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    if (particles.length > 300) particles.splice(0, 50);

    const minutes = Math.floor(survivalTime / 60);
    const seconds = survivalTime % 60;

    if (scoreElement) {
      scoreElement.innerText = `ВРЕМЯ: ${minutes}:${seconds.toString().padStart(2, '0')} \n ОЧКИ: ${Math.floor(score)}`;
    }
  }

  function render() {
    if (!ctx) return;

    ctx.save();

    if (cameraShake > 0) {
      ctx.translate(
        Math.random() * cameraShake - cameraShake / 2,
        Math.random() * cameraShake - cameraShake / 2
      );
      cameraShake *= 0.9;
    }

    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // earth
    if (earth.active) {
      ctx.globalAlpha = 0.75;
      ctx.drawImage(assets.earth, earth.x, earth.y, earth.size, earth.size);
      ctx.globalAlpha = 1;
    }

    // stars
    for (const s of stars) {
      ctx.strokeStyle = 'white';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x, s.y + s.length);
      ctx.stroke();
    }

    // bullets
    for (const b of bullets) {
      ctx.drawImage(assets.bullet, b.x - 6, b.y, 12, 24);
    }

    // player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.vx * 0.05);
    ctx.drawImage(assets.ship, -player.w / 2, -player.h / 2, player.w, player.h);
    ctx.restore();

    // asteroids
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.drawImage(assets.asteroid, -a.size / 2, -a.size / 2, a.size, a.size);
      ctx.restore();
    }

    // particles
    ctx.fillStyle = 'white';
    for (const p of particles) {
      const size = p.size * 2;
      ctx.globalAlpha = p.life / 40;
      ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  function tick() {
    if (!running) return;

    update();
    render();

    rafId = requestAnimationFrame(tick);
  }

  function startGame() {
    if (running) return;

    running = true;

    requestAnimationFrame(() => {
      if (!running) return;

      resizeCanvas();
      resetGameState();

      render();

      asteroidIntervalId = setInterval(spawnAsteroid, 800);
      rafId = requestAnimationFrame(tick);
    });
  }

  function stopGame() {
    if (!running) return;
    clearLoops();
    if (gameOverScreen) gameOverScreen.classList.add('hidden');
  }

  function closeShop() {
    if (!screenShop) return;
    screenShop.classList.add('hidden');
    screenShop.classList.remove('screen_shop_ship');
  }

  function showGameBlock() {
    screenGame.classList.remove('hidden');
    screenGame.classList.remove('hidden-shop');
    screenGame.classList.add('screen_game');

    if (contentProfile) contentProfile.classList.add('hidden');
  }

  function showProfileBlock() {
    screenGame.classList.add('hidden');
    screenGame.classList.remove('screen_game');
    screenGame.classList.remove('hidden-shop');

    if (contentProfile) contentProfile.classList.remove('hidden');
  }

  function closeGameAndReset() {
    resizeCanvas();
    resetGameState();
    clearLoops();

    screenGame.classList.add('hidden');
    screenGame.classList.remove('screen_game');
    screenGame.classList.remove('hidden-shop');
  }

  // Рестарт (кнопка внутри gameOverScreen)
  if (restartButton) {
    restartButton.addEventListener('click', () => {
      running = true;

      requestAnimationFrame(() => {
        resizeCanvas();
        resetGameState();
        render();

        asteroidIntervalId = setInterval(spawnAsteroid, 800);
        rafId = requestAnimationFrame(tick);
      });
    });
  }

  function isClickOnToggle(e) {
    const target = e.target;
    if (!target) return false;
    return target.id === 'button-game' || target.id === 'txt_id';
  }

  document.body.addEventListener('click', (e) => {
    if (!isClickOnToggle(e)) return;

    // Если магазин открыт — кнопка должна вернуть на профиль, а не в игру
    if (screenShop && !screenShop.classList.contains('hidden')) {
      closeShop();
      stopGame();
      showProfileBlock();
      txtButton.innerText = 'ЗАПУСК ПОЛЁТА';
      return;
    }

    // Логика текста кнопки — оставляем как было
    if (txtButton.innerText === 'ЗАВЕРШИТЬ МИССИЮ') {
      txtButton.innerText = 'ЗАПУСК ПОЛЁТА';
    } else {
      txtButton.innerText = 'ЗАВЕРШИТЬ МИССИЮ';
    }

    // Если открыта игра из магазина или обычный режим — сохраняем исходную логику
    if (screenGame.classList.contains('hidden-shop')) {
      screenGame.classList.remove('hidden-shop');
      screenGame.classList.add('hidden');
      if (contentProfile) contentProfile.classList.toggle('hidden');
    } else {
      screenGame.classList.toggle('hidden');
      screenGame.classList.toggle('screen_game');
      if (contentProfile) contentProfile.classList.toggle('hidden');
    }

    const gameIsHidden = screenGame.classList.contains('hidden');
    if (gameIsHidden) stopGame();
    else startGame();
  });

  // Магазин внутри игры — игра сбрасывается и останавливается
  document.body.addEventListener('click', (e) => {
    const target = e.target;
    if (!target) return;
    if (!target.closest || !target.closest('#shops')) return;

    const screenShopEl = screenShop || document.getElementById('screen_shop');
    if (!screenShopEl) return;

    closeGameAndReset();

    screenShopEl.classList.remove('hidden');
    screenShopEl.classList.add('screen_shop_ship');

    requestAnimationFrame(() => {
      initOrUpdateShopSwiper();
    });
  });

  // Возврат из магазина — показать блок с игрой и запустить её
  if (backGame) {
    backGame.addEventListener('click', () => {
      const screenShopEl = screenShop || document.getElementById('screen_shop');
      if (!screenShopEl) return;

      screenShopEl.classList.add('hidden');
      screenShopEl.classList.remove('screen_shop_ship');

      showGameBlock();
      startGame();
      txtButton.innerText = 'ЗАВЕРШИТЬ МИССИЮ';
    });
  }
})();