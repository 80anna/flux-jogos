(() => {
  'use strict';

  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d');
  const mini = document.getElementById('minimap');
  const mc = mini.getContext('2d');
  const $ = id => document.getElementById(id);
  if (!ctx || !mc) {
    $('toast').textContent = 'Canvas is not available in this browser. Try a current browser to play.';
    return;
  }

  const W = 2600, H = 2400, ROAD = 108;
  const xs = [200, 600, 1000, 1400, 1800];
  const ys = [180, 580, 980, 1380, 1780, 2180];
  const pickup = { x: 1800, y: 1030 };
  const drops = [{ x: 600, y: 580, name: 'the Little Havana client' }, { x: 1400, y: 2180, name: 'the south-side garage' }, { x: 200, y: 980, name: 'the warehouse client' }];
  const colors = { road: '#536866', edge: '#b8c6b0', line: '#c6cfb7', dark: '#173c3b', water: '#67b8b1', mint: '#69e2ba', coral: '#f78261' };
  const city = document.createElement('canvas');
  city.width = W; city.height = H;
  const g = city.getContext('2d');
  const buildings = [];
  const palms = [];
  let seed = 48;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const nearest = (arr, value) => arr.reduce((a, b) => Math.abs(b - value) < Math.abs(a - value) ? b : a);
  const roundRect = (c, x, y, w, h, r, fill) => { c.fillStyle = fill; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };

  function palm(c, x, y, size = 1) {
    c.save(); c.translate(x, y); c.scale(size, size);
    c.strokeStyle = '#3a605044'; c.lineWidth = 8; c.beginPath(); c.moveTo(3, 2); c.lineTo(21, 24); c.stroke();
    c.strokeStyle = '#917e54'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 5); c.lineTo(-4, -7); c.stroke();
    c.translate(-4, -7);
    for (let j = 0; j < 7; j++) {
      c.rotate(Math.PI * 2 / 7); c.fillStyle = j % 2 ? '#357a60' : '#43886a';
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(10, -14, 29, -6); c.quadraticCurveTo(15, -5, 0, 0); c.fill();
    }
    c.restore();
  }

  function building(x, y, w, h, color, style) {
    buildings.push({ x, y, w, h });
    roundRect(g, x + 9, y + 12, w, h, 3, '#294c4b35');
    roundRect(g, x, y, w, h, 3, '#ddd3b8');
    roundRect(g, x, y, w, h - 8, 3, color);
    g.strokeStyle = '#ffffff55'; g.lineWidth = 3; g.strokeRect(x + 7, y + 7, w - 14, h - 23);
    g.fillStyle = '#385d5944';
    for (let q = 12; q < w - 20; q += 22) g.fillRect(x + q, y + h - 7, 11, 3);
    if (style % 3 === 0) {
      roundRect(g, x + 20, y + 20, Math.min(w - 40, 64), 34, 2, '#486e73');
      g.strokeStyle = '#9db8b5'; g.lineWidth = 1;
      for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x + 24 + k * 14, y + 22); g.lineTo(x + 24 + k * 14, y + 52); g.stroke(); }
    } else {
      roundRect(g, x + 18, y + 18, 21, 26, 2, '#abb5a7');
      g.fillStyle = '#748e87'; g.fillRect(x + 21, y + 22, 15, 4); g.fillRect(x + 21, y + 30, 15, 4);
    }
    if (w > 100 && h > 85) roundRect(g, x + w - 39, y + h - 44, 20, 22, 2, '#ebe0c3');
  }

  function makeCity() {
    g.fillStyle = '#a7b99a'; g.fillRect(0, 0, W, H);
    g.fillStyle = colors.water; g.fillRect(2050, 0, 550, H);
    g.fillStyle = '#89c8bc'; g.fillRect(2050, 0, 70, H);
    g.fillStyle = '#b4d7c0'; g.fillRect(2050, 0, 25, H);
    g.fillStyle = '#e4d6ad'; g.fillRect(1910, 0, 140, H);
    g.fillStyle = '#d3ccaa'; g.fillRect(1872, 0, 38, H);
    g.strokeStyle = '#f8efd055'; g.lineWidth = 2;
    for (let y = 10; y < H; y += 34) {
      for (let x = 2130; x < W; x += 116) {
        g.beginPath(); g.moveTo(x + (y % 3) * 8, y); g.bezierCurveTo(x + 13, y - 5, x + 32, y + 5, x + 45, y); g.stroke();
      }
    }
    for (const x of xs) {
      g.fillStyle = colors.edge; g.fillRect(x - 66, 0, 132, H);
      g.fillStyle = colors.road; g.fillRect(x - ROAD / 2, 0, ROAD, H);
    }
    for (const y of ys) {
      g.fillStyle = colors.edge; g.fillRect(0, y - 66, 1872, 132);
      g.fillStyle = colors.road; g.fillRect(0, y - ROAD / 2, 1872, ROAD);
    }
    g.strokeStyle = colors.line; g.lineWidth = 2; g.setLineDash([17, 23]);
    for (const x of xs) {
      g.beginPath(); g.moveTo(x - 3, 0); g.lineTo(x - 3, H); g.stroke();
      g.beginPath(); g.moveTo(x + 3, 0); g.lineTo(x + 3, H); g.stroke();
    }
    for (const y of ys) {
      g.beginPath(); g.moveTo(0, y - 3); g.lineTo(1872, y - 3); g.stroke();
      g.beginPath(); g.moveTo(0, y + 3); g.lineTo(1872, y + 3); g.stroke();
    }
    g.setLineDash([]);
    for (const x of xs) for (const y of ys) {
      g.fillStyle = colors.road; g.fillRect(x - 54, y - 54, 108, 108);
      g.fillStyle = '#d4d8bf';
      for (let q = -36; q <= 36; q += 12) {
        g.fillRect(x + q, y - 67, 6, 14); g.fillRect(x + q, y + 53, 6, 14);
        g.fillRect(x - 67, y + q, 14, 6); g.fillRect(x + 53, y + q, 14, 6);
      }
      g.fillStyle = '#48605b';
      for (const dx of [-70, 70]) for (const dy of [-70, 70]) { g.beginPath(); g.arc(x + dx, y + dy, 4, 0, Math.PI * 2); g.fill(); }
    }
    const roofs = ['#e3b298', '#d5b783', '#a4bfb3', '#e6c69e', '#bca6a3', '#a6b9c2'];
    for (let ix = 0; ix < xs.length - 1; ix++) {
      for (let iy = 0; iy < ys.length - 1; iy++) {
        const x = xs[ix] + 84, y = ys[iy] + 84;
        if ((ix === 2 && iy === 2) || (ix === 0 && iy === 3)) {
          roundRect(g, x, y, 232, 232, 8, '#83a77b');
          g.fillStyle = '#c6c6a3'; g.fillRect(x + 108, y, 16, 232); g.fillRect(x, y + 108, 232, 16);
          g.beginPath(); g.arc(x + 116, y + 116, 36, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#80b9ae'; g.beginPath(); g.arc(x + 116, y + 116, 24, 0, Math.PI * 2); g.fill();
          for (let t = 0; t < 12; t++) { const px = x + 24 + random() * 184, py = y + 24 + random() * 184; if (Math.abs(px - x - 116) > 28 && Math.abs(py - y - 116) > 28) palms.push([px, py, 1.2]); }
        } else if (ix === 3 && iy === 1) {
          building(x, y, 232, 92, '#e2b398', 3);
          roundRect(g, x + 18, y + 116, 123, 91, 4, '#ede2c2');
          roundRect(g, x + 25, y + 123, 109, 77, 8, '#65bcb7');
          g.strokeStyle = '#c8e9d5'; g.lineWidth = 2; g.strokeRect(x + 35, y + 133, 89, 57);
          for (let q = 0; q < 4; q++) { g.fillStyle = '#f1d7b1'; g.fillRect(x + 162, y + 115 + q * 26, 28, 12); palms.push([x + 216, y + 125 + q * 30, 0.7]); }
        } else {
          const split = 104;
          for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
            const bx = x + a * 128, by = y + b * 128;
            building(bx, by, split - Math.floor(random() * 14), split - Math.floor(random() * 20), roofs[Math.floor(random() * roofs.length)], ix + iy + a + b);
          }
          palms.push([x + 116, y + 114, 0.85]);
        }
        for (let q = 0; q < 3; q++) { palms.push([x + q * 90, y - 13, 0.75]); palms.push([x - 12, y + q * 90, 0.75]); }
      }
    }
    for (let y = 70; y < H; y += 95) {
      palms.push([1891, y, 1.1]);
      if (y % 3) {
        const x = 1972 + random() * 35;
        g.fillStyle = '#ca876c'; g.beginPath(); g.arc(x, y + 20, 12, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#f7e5b8'; g.beginPath(); g.moveTo(x, y + 20); g.arc(x, y + 20, 12, 0, Math.PI); g.closePath(); g.fill();
        g.fillStyle = '#f5e6c4'; g.fillRect(x + 16, y + 11, 9, 24);
      }
    }
    // Boardwalk and small marina are scenery, not drivable roads.
    for (const y of [330, 1670]) {
      g.fillStyle = '#ae9873'; g.fillRect(1908, y, 315, 28);
      g.fillStyle = '#dfc49c'; g.fillRect(1910, y, 310, 21);
      for (let x = 1912; x < 2220; x += 9) { g.fillStyle = '#ae987377'; g.fillRect(x, y, 1, 21); }
      g.fillStyle = '#dfc49c'; g.fillRect(2200, y - 50, 22, 120);
      for (let k = -1; k <= 1; k++) {
        g.save(); g.translate(2260, y + k * 48); g.rotate(Math.PI / 2);
        roundRect(g, -10, -29, 20, 58, 9, '#e5e6ce'); roundRect(g, -7, -8, 14, 25, 3, '#668b87'); g.restore();
      }
    }
    g.save(); g.translate(1758, 1580); g.rotate(-Math.PI / 2); g.font = '600 15px sans-serif'; g.fillStyle = '#c6d0b8'; g.textAlign = 'center'; g.fillText('O C E A N   D R I V E', 0, 0); g.restore();
    g.font = '600 13px sans-serif'; g.fillStyle = '#d9dfc9'; g.fillText('SUNSET AVENUE', 1110, 1385);
    g.save(); g.translate(2380, 1170); g.rotate(-Math.PI / 2); g.fillStyle = '#326f723f'; g.font = '500 27px sans-serif'; g.textAlign = 'center'; g.fillText('A T L A N T I C   O C E A N', 0, 0); g.restore();
    for (const p of palms) palm(g, ...p);
  }
  makeCity();

  let vw = 1, vh = 1, dpr = 1, zoom = 0.85;
  let player, traffic, cops, cash, heat, escapeTime, arrestTime, collisionCooldown, mission, jobNumber, elapsed, ended, paused;
  let toastTime = 6, hudTime = 0, time = 0;
  const camera = { x: 0, y: 0 };
  const keys = new Set();
  const touch = new Set();
  const down = name => touch.has(name) || (name === 'forward' && (keys.has('KeyW') || keys.has('ArrowUp'))) || (name === 'brake' && (keys.has('KeyS') || keys.has('ArrowDown'))) || (name === 'left' && (keys.has('KeyA') || keys.has('ArrowLeft'))) || (name === 'right' && (keys.has('KeyD') || keys.has('ArrowRight'))) || (name === 'handbrake' && keys.has('Space'));

  function resize() {
    const box = canvas.getBoundingClientRect(); vw = Math.max(1, box.width); vh = Math.max(1, box.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
    zoom = vw < 600 ? 0.64 : 0.85;
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  function showToast(text, duration = 5) { $('toast').textContent = text; $('toast').classList.remove('is-hidden'); toastTime = duration; }

  function reset() {
    player = { x: 1800, y: 1420, angle: -Math.PI / 2, speed: 0, health: 100 };
    traffic = [];
    for (let i = 0; i < 30; i++) {
      const vertical = i % 2 === 0, dir = i % 4 < 2 ? 1 : -1;
      const lane = vertical ? xs[i % xs.length] : ys[i % ys.length];
      const pos = 30 + (i * 239) % 2300;
      const car = { x: vertical ? lane - dir * 23 : pos, y: vertical ? pos : lane + dir * 23, vertical, dir, lane, speed: 62 + (i * 17) % 55, color: ['#f0d4a0', '#9abfbc', '#d9dbcd', '#bf8777', '#718f91'][i % 5] };
      if (distance(car, player) > 120) traffic.push(car);
    }
    cops = []; cash = 2400; heat = 0; escapeTime = 0; arrestTime = 0; collisionCooldown = 0;
    jobNumber = 0; mission = 'ready'; elapsed = 0; ended = false; paused = false;
    keys.clear(); clearTouch(); $('game-message').hidden = true; setPauseButton();
    updateMission(); updateHUD(); showToast('Welcome to Palm Bay. The coral coupe is yours.', 6);
    camera.x = player.x - vw / zoom / 2; camera.y = player.y - vh / zoom / 2;
  }

  function target() { return mission === 'deliver' || mission === 'complete' ? drops[jobNumber % drops.length] : pickup; }

  function updateMission() {
    const content = {
      ready: ['SIDE HUSTLE', 'Special delivery', 'A package. A waiting client. No questions. Pick it up at the turquoise marker.', 'Take the job', '01 / 03'],
      pickup: ['JOB ACCEPTED', 'First, the package.', 'Follow the turquoise route. Slow down inside the pickup ring to collect the package.', 'Reach the pickup', '01 / 03'],
      deliver: ['PACKAGE ON BOARD', 'Make the drop.', `Deliver to ${drops[jobNumber % drops.length].name}. Lose the police before you pull in.`, 'Delivery in progress', '02 / 03'],
      complete: ['DELIVERY COMPLETE', 'Clean getaway.', 'Package delivered. Your car is repaired, your wallet is heavier. Fancy another lap?', 'Another job', '03 / 03']
    }[mission];
    $('mission-kind').textContent = content[0]; $('mission-title').textContent = content[1]; $('mission-copy').textContent = content[2];
    $('mission-action').textContent = content[3] + (mission === 'ready' || mission === 'complete' ? ' ↗' : '');
    $('mission-action').disabled = mission === 'pickup' || mission === 'deliver'; $('mission-step').textContent = content[4];
    $('reward').textContent = mission === 'complete' ? 'PAID $600' : '+$600';
  }

  $('mission-action').addEventListener('click', () => {
    if (ended) return;
    if (mission === 'complete') jobNumber++;
    mission = 'pickup'; elapsed = 0; updateMission(); showToast('Job accepted. Pick up the package on Ocean Drive.');
  });

  function setPauseButton() {
    $('pause-label').textContent = paused ? 'Resume' : 'Pause'; $('pause').setAttribute('aria-label', paused ? 'Resume game' : 'Pause game');
    $('pause').setAttribute('aria-pressed', String(paused)); $('pause-icon').innerHTML = paused ? '<path d="m8 5 11 7-11 7Z"/>' : '<path d="M9 5v14M15 5v14"/>';
  }

  function setPaused(value) {
    if (ended) return;
    paused = value; keys.clear(); clearTouch(); setPauseButton();
    $('game-message').hidden = !paused;
    if (paused) { $('message-kicker').textContent = 'TAKE A BREATHER'; $('message-title').textContent = 'City on hold.'; $('message-copy').textContent = 'Your next wrong turn can wait.'; $('resume').textContent = 'Back to the streets ↗'; }
  }
  $('pause').addEventListener('click', () => setPaused(!paused));
  $('restart').addEventListener('click', () => { reset(); canvas.focus({ preventScroll: true }); });
  $('resume').addEventListener('click', () => { if (ended) reset(); else setPaused(false); canvas.focus({ preventScroll: true }); });
  canvas.addEventListener('pointerdown', () => canvas.focus({ preventScroll: true }));

  const movementCodes = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
  window.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'Space' && e.target.closest('button, a')) return;
    if (movementCodes.includes(e.code)) { e.preventDefault(); if (!paused && !ended) keys.add(e.code); }
    if (!e.repeat && (e.code === 'KeyP' || e.code === 'Escape')) { e.preventDefault(); setPaused(!paused); }
    if (!e.repeat && e.code === 'KeyR') reset();
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
  function clearTouch() { touch.clear(); document.querySelectorAll('[data-control]').forEach(b => b.classList.remove('pressed')); }
  document.querySelectorAll('[data-control]').forEach(button => {
    button.addEventListener('pointerdown', e => { e.preventDefault(); if (paused || ended) return; button.setPointerCapture(e.pointerId); touch.add(button.dataset.control); button.classList.add('pressed'); });
    const release = () => { touch.delete(button.dataset.control); button.classList.remove('pressed'); };
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
    button.addEventListener('contextmenu', e => e.preventDefault());
  });
  window.addEventListener('blur', () => setPaused(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });

  function addHeat(amount) {
    heat = Math.min(3, heat + amount); escapeTime = 0;
    while (cops.length < Math.ceil(heat)) {
      let candidates = [];
      for (const x of xs) for (const y of ys) {
        const d = Math.hypot(x - player.x, y - player.y);
        if (d > 420 && d < 900) candidates.push({ x, y });
      }
      if (!candidates.length) candidates = [{ x: 1400, y: 580 }];
      const spawn = candidates[Math.floor(random() * candidates.length)];
      cops.push({ x: spawn.x, y: spawn.y, angle: 0, goal: null });
    }
  }

  function resolveBuildings(body, radius) {
    let hit = false;
    body.x = clamp(body.x, 30, 2016); body.y = clamp(body.y, 30, H - 30);
    for (const b of buildings) {
      if (body.x < b.x - radius || body.x > b.x + b.w + radius || body.y < b.y - radius || body.y > b.y + b.h + radius) continue;
      const px = clamp(body.x, b.x, b.x + b.w), py = clamp(body.y, b.y, b.y + b.h);
      let dx = body.x - px, dy = body.y - py;
      const d = Math.hypot(dx, dy);
      if (d >= radius) continue;
      if (d > 0.001) { body.x = px + dx / d * radius; body.y = py + dy / d * radius; }
      else {
        const edges = [body.x - b.x, b.x + b.w - body.x, body.y - b.y, b.y + b.h - body.y];
        const side = edges.indexOf(Math.min(...edges));
        if (side === 0) body.x = b.x - radius; else if (side === 1) body.x = b.x + b.w + radius; else if (side === 2) body.y = b.y - radius; else body.y = b.y + b.h + radius;
      }
      hit = true;
    }
    return hit;
  }

  function crash(damage, crime) {
    if (collisionCooldown > 0) return;
    player.health = Math.max(0, player.health - damage); collisionCooldown = 0.85;
    if (crime) { addHeat(1); showToast('Hit and run. Patrol is looking for your coral coupe.'); }
    else if (damage > 5) showToast('Easy on the bodywork. Deliveries repair your car.', 3);
  }

  function finish(reason) {
    if (ended) return;
    ended = true; keys.clear(); clearTouch();
    $('game-message').hidden = false; $('message-kicker').textContent = 'END OF THE ROAD';
    $('message-title').textContent = reason === 'busted' ? 'Busted.' : 'Wrecked.';
    $('message-copy').textContent = reason === 'busted' ? 'They caught you standing still. Keep moving next time.' : 'That coupe has seen better days. A fresh set of keys is waiting.';
    $('resume').textContent = 'Try another run ↗'; updateHUD(); $('resume').focus({ preventScroll: true });
  }

  function updateTraffic(dt) {
    const verticalGreen = Math.floor(time / 7) % 2 === 0;
    for (const c of traffic) {
      const pos = c.vertical ? c.y : c.x;
      const crossings = c.vertical ? ys : xs;
      const next = crossings.find(v => c.dir > 0 ? v - pos > 0 && v - pos < 90 : pos - v > 0 && pos - v < 90);
      const red = c.vertical !== verticalGreen;
      const stop = next !== undefined && Math.abs(next - pos) > 61 && red;
      if (!stop) {
        if (c.vertical) c.y += c.dir * c.speed * dt; else c.x += c.dir * c.speed * dt;
      }
      if (c.vertical) { if (c.y > H + 40) c.y = -40; if (c.y < -40) c.y = H + 40; }
      else { if (c.x > 1870) c.x = -40; if (c.x < -40) c.x = 1870; }
      if (distance(c, player) < 31) {
        const impact = Math.abs(player.speed);
        if (collisionCooldown <= 0) { crash(impact > 90 ? 12 : 4, impact > 65); player.speed *= -0.28; }
        const dx = player.x - c.x, dy = player.y - c.y, d = Math.hypot(dx, dy) || 1;
        player.x += dx / d * 3; player.y += dy / d * 3;
      }
    }
  }

  function updateCops(dt) {
    let closest = Infinity;
    for (const c of cops) {
      const d = distance(c, player); closest = Math.min(closest, d);
      if (!c.goal || Math.hypot(c.x - c.goal.x, c.y - c.goal.y) < 8) {
        const nx = nearest(xs, c.x), ny = nearest(ys, c.y);
        const tx = nearest(xs, player.x), ty = nearest(ys, player.y);
        if (Math.abs(c.x - nx) > 9 || Math.abs(c.y - ny) > 9) c.goal = { x: nx, y: ny };
        else if (nx !== tx) c.goal = { x: nx + Math.sign(tx - nx) * 400, y: ny };
        else if (ny !== ty) c.goal = { x: nx, y: ny + Math.sign(ty - ny) * 400 };
        else c.goal = { x: player.x, y: player.y };
      }
      if (d < 155) c.goal = { x: player.x, y: player.y };
      const dx = c.goal.x - c.x, dy = c.goal.y - c.y;
      const len = Math.hypot(dx, dy);
      if (len > 1) { c.angle = Math.atan2(dy, dx); const step = Math.min(len, (185 + heat * 14) * dt); c.x += dx / len * step; c.y += dy / len * step; }
      if (resolveBuildings(c, 18)) c.goal = { x: nearest(xs, c.x), y: nearest(ys, c.y) };
      if (d < 32) { player.speed *= 0.97; if (Math.abs(player.speed) > 65) crash(5, false); }
    }
    if (heat > 0) {
      if (closest > 480) escapeTime += dt; else escapeTime = Math.max(0, escapeTime - dt * 0.5);
      if (escapeTime >= 8) { heat = 0; cops = []; escapeTime = 0; showToast('You lost them. Back off the radar.'); }
      if (closest < 68 && Math.abs(player.speed) < 35) arrestTime += dt; else arrestTime = Math.max(0, arrestTime - dt * 2);
      if (arrestTime > 3.5) finish('busted');
    } else arrestTime = 0;
  }

  function update(dt) {
    time += dt; elapsed += dt; collisionCooldown = Math.max(0, collisionCooldown - dt);
    toastTime -= dt; if (toastTime <= 0) $('toast').classList.add('is-hidden');
    const gas = down('forward'), brake = down('brake'), handbrake = down('handbrake');
    const roadDistance = Math.min(Math.abs(player.x - nearest(xs, player.x)), Math.abs(player.y - nearest(ys, player.y)));
    const onRoad = roadDistance < 57;
    if (gas) player.speed += (player.speed < -10 ? 370 : 172) * dt;
    if (brake) player.speed -= (player.speed > 10 ? 360 : 115) * dt;
    const friction = handbrake ? 2.0 : onRoad ? 0.29 : 1.6;
    player.speed *= Math.exp(-friction * dt);
    if (!gas && !brake) player.speed *= Math.exp(-0.55 * dt);
    player.speed = clamp(player.speed, -105, onRoad ? 355 : 170);
    if (Math.abs(player.speed) < 0.9 && !gas && !brake) player.speed = 0;
    const steering = (down('right') ? 1 : 0) - (down('left') ? 1 : 0);
    player.angle += steering * Math.sign(player.speed) * Math.min(Math.abs(player.speed) / 90, 1) * (handbrake ? 3.2 : 2.0) * dt;
    const oldX = player.x, oldY = player.y;
    player.x += Math.cos(player.angle) * player.speed * dt; player.y += Math.sin(player.angle) * player.speed * dt;
    const impact = Math.abs(player.speed);
    const boundary = player.x < 30 || player.x > 2016 || player.y < 30 || player.y > H - 30;
    if (resolveBuildings(player, 17) || boundary) {
      if (impact > 45) crash(Math.min(18, impact * 0.06), false);
      player.speed *= -0.25;
      if (!Number.isFinite(player.x) || !Number.isFinite(player.y)) { player.x = oldX; player.y = oldY; player.speed = 0; }
    }
    updateTraffic(dt); updateCops(dt);
    if (player.health <= 0) finish('wrecked');
    if (!ended && distance(player, target()) < 53 && Math.abs(player.speed) < 70) {
      if (mission === 'pickup') { mission = 'deliver'; addHeat(1); updateMission(); showToast('Package collected. A patrol spotted you. Make some distance!'); }
      else if (mission === 'deliver' && heat === 0) { mission = 'complete'; cash += 600; player.health = 100; updateMission(); showToast('Delivered. +$600, and a little complimentary bodywork.'); }
    }
    const destX = clamp(player.x - vw / zoom / 2, -30, W - vw / zoom + 30);
    const destY = clamp(player.y - vh / zoom / 2, -30, H - vh / zoom + 30);
    camera.x += (destX - camera.x) * Math.min(1, dt * 6); camera.y += (destY - camera.y) * Math.min(1, dt * 6);
    hudTime += dt; if (hudTime > 0.1) { updateHUD(); hudTime = 0; }
  }

  function updateHUD() {
    $('cash').textContent = '$' + cash.toLocaleString('en-US');
    $('speed').textContent = String(Math.round(Math.abs(player.speed) * 0.24)).padStart(2, '0');
    $('gear').textContent = player.speed < -2 ? 'R' : player.speed < 2 ? 'N' : 'D';
    $('condition').value = player.health;
    $('heat-label').textContent = heat ? (arrestTime > 0.3 ? 'BEING BUSTED' : 'WANTED LEVEL ' + Math.ceil(heat)) : 'OFF THE RADAR';
    const stars = $('heat-icons'); stars.setAttribute('aria-label', `Wanted level: ${Math.ceil(heat)} out of three`);
    [...stars.children].forEach((s, i) => s.classList.toggle('active', i < Math.ceil(heat)));
    $('pursuit-hint').textContent = heat ? (escapeTime > 0.5 ? `Losing the tail… ${Math.ceil(8 - escapeTime)}s` : arrestTime > 0.3 ? 'Move! Police are closing in.' : 'Get 480 m away. Stay clear for 8s.') : 'Keep it clean. Or don’t.';
    const dist = Math.round(distance(player, target()) / 10) * 10;
    $('distance').textContent = mission === 'complete' ? 'DELIVERY COMPLETE · +$600' : `${mission === 'deliver' ? 'DROP-OFF' : 'COURIER PICKUP'} · ${dist} m`;
    $('district').textContent = player.x > 1650 ? 'Ocean Drive' : player.x > 950 ? 'Sunset District' : player.y > 1500 ? 'South Palms' : 'Little Havana';
  }

  function car(c, x, y, angle, color, police = false, isPlayer = false) {
    c.save(); c.translate(x, y); c.rotate(angle);
    roundRect(c, -19, -9, 43, 23, 5, '#183b3b45');
    roundRect(c, -22, -11, 44, 22, 5, police ? '#e4e6d9' : color);
    c.fillStyle = '#263f40'; c.fillRect(-15, -13, 9, 3); c.fillRect(10, -13, 8, 3); c.fillRect(-15, 10, 9, 3); c.fillRect(10, 10, 8, 3);
    roundRect(c, -10, -8, 21, 16, 3, police ? '#263f40' : '#355557');
    c.fillStyle = '#92c1b9'; c.beginPath(); c.moveTo(7, -7); c.lineTo(12, -7); c.lineTo(14, 7); c.lineTo(7, 7); c.closePath(); c.fill();
    roundRect(c, -5, -7, 10, 14, 2, police ? '#e0e5d9' : color);
    c.fillStyle = '#faf2bd'; c.fillRect(18, -8, 3, 5); c.fillRect(18, 3, 3, 5);
    c.fillStyle = '#b65247'; c.fillRect(-22, -8, 2, 4); c.fillRect(-22, 4, 2, 4);
    if (police) { c.fillStyle = Math.sin(time * 4) > 0 ? '#f37e65' : '#558fb4'; c.fillRect(-1, -8, 5, 16); c.fillStyle = '#f4e8cb'; c.fillRect(0, -2, 3, 4); }
    if (isPlayer) { c.strokeStyle = '#f8d1a4'; c.lineWidth = 1; c.strokeRect(-4, -6, 8, 12); }
    c.restore();
  }

  function drawRoute() {
    const t = target();
    if (mission === 'complete') return;
    const nx = nearest(xs, player.x), ny = nearest(ys, player.y), tx = nearest(xs, t.x), ty = nearest(ys, t.y);
    ctx.strokeStyle = '#69e2ba'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.moveTo(player.x, player.y);
    if (Math.abs(player.x - nx) < Math.abs(player.y - ny)) ctx.lineTo(nx, player.y); else ctx.lineTo(player.x, ny);
    ctx.lineTo(nx, ny); ctx.lineTo(tx, ny); ctx.lineTo(tx, ty); ctx.lineTo(t.x, t.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#69e2ba33'; ctx.beginPath(); ctx.arc(t.x, t.y, 51, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#9af2d0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(t.x, t.y, 45, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = colors.dark; ctx.beginPath(); ctx.arc(t.x, t.y, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = colors.mint; ctx.lineWidth = 2; ctx.strokeRect(t.x - 8, t.y - 8, 16, 16); ctx.beginPath(); ctx.moveTo(t.x, t.y - 8); ctx.lineTo(t.x, t.y + 8); ctx.stroke();
  }

  function drawMarker() {
    if (mission === 'complete') return;
    const t = target(), sx = (t.x - camera.x) * zoom, sy = (t.y - camera.y) * zoom;
    if (sx > 80 && sx < vw - 80 && sy > 190 && sy < vh - 90) return;
    const cx = vw / 2, cy = vh / 2;
    const dx = sx - cx, dy = sy - cy;
    const factor = Math.min((vw / 2 - 45) / (Math.abs(dx) || 1), (vh / 2 - 100) / (Math.abs(dy) || 1), 1);
    const x = cx + dx * factor, y = cy + dy * factor;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(dy, dx));
    ctx.fillStyle = colors.dark; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = colors.mint; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-5, -7); ctx.lineTo(-2, 0); ctx.lineTo(-5, 7); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function drawMinimap() {
    const sx = mini.width / W, sy = mini.height / H;
    mc.fillStyle = '#749783'; mc.fillRect(0, 0, mini.width, mini.height);
    mc.fillStyle = '#589c9b'; mc.fillRect(2050 * sx, 0, 550 * sx, mini.height);
    mc.fillStyle = '#d2c29c'; mc.fillRect(1900 * sx, 0, 150 * sx, mini.height);
    mc.strokeStyle = '#c7d3bc'; mc.lineWidth = 3;
    for (const x of xs) { mc.beginPath(); mc.moveTo(x * sx, 0); mc.lineTo(x * sx, mini.height); mc.stroke(); }
    for (const y of ys) { mc.beginPath(); mc.moveTo(0, y * sy); mc.lineTo(1872 * sx, y * sy); mc.stroke(); }
    if (mission !== 'complete') {
      mc.fillStyle = colors.mint; mc.strokeStyle = colors.dark; mc.lineWidth = 2;
      mc.beginPath(); mc.arc(target().x * sx, target().y * sy, 5, 0, Math.PI * 2); mc.fill(); mc.stroke();
    }
    for (const c of cops) { mc.fillStyle = '#dd624e'; mc.beginPath(); mc.arc(c.x * sx, c.y * sy, 3, 0, Math.PI * 2); mc.fill(); }
    mc.save(); mc.translate(player.x * sx, player.y * sy); mc.rotate(player.angle);
    mc.fillStyle = colors.coral; mc.strokeStyle = colors.dark; mc.lineWidth = 1.5;
    mc.beginPath(); mc.moveTo(7, 0); mc.lineTo(-5, -4); mc.lineTo(-3, 0); mc.lineTo(-5, 4); mc.closePath(); mc.fill(); mc.stroke(); mc.restore();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = colors.water; ctx.fillRect(0, 0, vw, vh);
    ctx.save(); ctx.scale(zoom, zoom); ctx.translate(-camera.x, -camera.y);
    ctx.drawImage(city, 0, 0);
    drawRoute();
    for (const c of traffic) {
      if (Math.abs(c.x - player.x) < vw / zoom && Math.abs(c.y - player.y) < vh / zoom) car(ctx, c.x, c.y, c.vertical ? c.dir * Math.PI / 2 : c.dir > 0 ? 0 : Math.PI, c.color);
    }
    for (const c of cops) car(ctx, c.x, c.y, c.angle, '', true);
    car(ctx, player.x, player.y, player.angle, colors.coral, false, true);
    // Small white chevron identifies the player's car without covering it.
    ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.angle); ctx.strokeStyle = '#fff4d9'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-37, -6); ctx.lineTo(-31, 0); ctx.lineTo(-37, 6); ctx.stroke(); ctx.restore();
    ctx.restore(); drawMarker(); drawMinimap();
  }

  reset();
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.034); last = now;
    if (!paused && !ended) update(dt);
    draw(); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
