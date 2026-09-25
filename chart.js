// Shared logic for the chore charts. Each page declares its own list in
// window.CHART and this builds and runs it.
(function () {
  const config = window.CHART;

  const chartEl = document.getElementById('chart');
  const progressEl = document.getElementById('progress');
  const celebrateText = document.getElementById('celebrateText');
  const secretBtn = document.getElementById('secretBtn');
  const resetBtn = document.getElementById('resetBtn');
  const canvas = document.getElementById('fireworks-canvas');
  const ctx = canvas.getContext('2d');

  document.getElementById('title').textContent = config.title;
  document.getElementById('sub').textContent = config.subtitle || "Tap a chore when it's done!";
  celebrateText.textContent = config.celebrate || '\u{1F389} All Done! \u{1F389}';
  resetBtn.textContent = config.resetLabel || 'Reset Day';
  if (config.bodyClass) document.body.classList.add(config.bodyClass);

  // --- build the chart from the page's list ---------------------------------

  function makeRow(chore, counts) {
    const row = document.createElement('div');
    row.className = 'chore' + (counts ? '' : ' after') + (chore.secret ? ' secret' : '');
    row.dataset.key = chore.key;

    const left = document.createElement('div');
    left.className = 'chore-left';
    const emoji = document.createElement('span');
    emoji.className = 'emoji';
    emoji.textContent = chore.emoji;
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = chore.label;
    left.append(emoji, label);

    const star = document.createElement('span');
    star.className = 'star';
    star.textContent = '⭐';

    row.append(left, star);
    return row;
  }

  config.sections.forEach(section => {
    if (section.label) {
      const header = document.createElement('div');
      header.className = 'section';
      const emoji = document.createElement('span');
      emoji.className = 'sec-emoji';
      emoji.textContent = section.emoji;
      header.append(emoji, document.createTextNode(section.label));
      chartEl.appendChild(header);
    }
    section.chores.forEach(chore => {
      chartEl.appendChild(makeRow(chore, section.counts !== false));
    });
  });

  const chores = document.querySelectorAll('.chore');
  const secretChore = document.querySelector('.chore.secret');

  // --- fireworks ------------------------------------------------------------

  let fireworksRunning = false;
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const colors = ['#ff4d94', '#ffd93d', '#4dd0ff', '#7cff4d', '#c94dff', '#ff884d'];

  function launchFirework() {
    const x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
    const y = Math.random() * canvas.height * 0.4 + canvas.height * 0.1;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const count = 45;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 3;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
        size: 2 + Math.random() * 2
      });
    }
  }

  function animate() {
    if (!fireworksRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      p.alpha -= 0.012;
      ctx.globalAlpha = Math.max(p.alpha, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    particles = particles.filter(p => p.alpha > 0);
    requestAnimationFrame(animate);
  }

  function startFireworks() {
    fireworksRunning = true;
    celebrateText.classList.remove('show');
    void celebrateText.offsetWidth;
    celebrateText.classList.add('show');
    animate();
    launchFirework();
    let bursts = 1;
    const interval = setInterval(() => {
      launchFirework();
      bursts++;
      if (bursts >= 8) clearInterval(interval);
    }, 350);
    setTimeout(() => {
      fireworksRunning = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = [];
    }, 4500);
  }

  // --- progress -------------------------------------------------------------

  let wasComplete = false;

  // The party is for finishing the counted section. Chores after it earn a
  // star but don't gate it.
  function countedChores() {
    return Array.from(chores).filter(c =>
      !c.classList.contains('after') &&
      (!c.classList.contains('secret') || c.classList.contains('revealed'))
    );
  }

  function updateProgress() {
    const counted = countedChores();
    const done = counted.filter(c => c.classList.contains('done')).length;
    progressEl.textContent = done + ' / ' + counted.length + ' done';
    const complete = done === counted.length;
    if (complete && !wasComplete) {
      startFireworks();
    }
    wasComplete = complete;
  }

  chores.forEach(c => {
    c.addEventListener('click', () => {
      c.classList.toggle('done');
      updateProgress();
    });
  });

  resetBtn.addEventListener('click', () => {
    chores.forEach(c => c.classList.remove('done'));
    updateProgress();
  });

  // Hidden button in the upper right corner: shows/hides a secret chore.
  if (secretChore) {
    secretBtn.addEventListener('click', () => {
      secretChore.classList.toggle('revealed');
      if (!secretChore.classList.contains('revealed')) {
        secretChore.classList.remove('done');
      }
      updateProgress();
    });
  } else {
    secretBtn.remove();
  }

  updateProgress();
})();
