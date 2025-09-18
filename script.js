// ===== Tabs accesibles =====
const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
function activateTab(tab) {
  tabs.forEach(t => {
    const selected = t === tab;
    t.classList.toggle('tab--active', selected);
    t.setAttribute('aria-selected', selected ? 'true' : 'false');
    const panel = document.getElementById(t.getAttribute('aria-controls'));
    if (panel) panel.classList.toggle('is-active', selected);
  });
  if (tab.id === 'tab-graphic') renderRadar();
}
tabs.forEach(tab => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', e => {
    const i = tabs.indexOf(tab);
    if (e.key === 'ArrowRight') { e.preventDefault(); tabs[(i+1)%tabs.length].focus(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); tabs[(i-1+tabs.length)%tabs.length].focus(); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateTab(tab); }
  });
});

// Estado inicial: Stats activo por defecto
const initial = document.getElementById('tab-stats') || tabs[0];
if (initial) activateTab(initial);

// ===== Helpers: cargar skills de localStorage con fallback =====
const KEY = 'skills.v1';
const FALLBACK = [
  { label:'Programming', value:78, icon:'🧠' },
  { label:'3d Art', value:28, icon:'📦' },
  { label:'Sound', value:55, icon:'🎵' },
  { label:'Level Design', value:46, icon:'🔳' },
  { label:'Game Design', value:40, icon:'🧩' },
];

function loadSkills() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [...FALLBACK];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return [...FALLBACK];
    return parsed.map(s => ({
      label: String(s.label ?? '').slice(0,40) || 'Skill',
      value: Math.max(0, Math.min(100, Number(s.value ?? 0))),
      icon: String(s.icon ?? '').slice(0,4)
    })).slice(0, 12);
  } catch {
    return [...FALLBACK];
  }
}

// ===== Pintar Stats desde los datos =====
function renderStats() {
  const wrap = document.querySelector('.stats');
  if (!wrap) return;
  const data = loadSkills();
  wrap.innerHTML = '';
  data.forEach(s => {
    const row = document.createElement('div');
    row.className = 'stat';
    row.innerHTML = `
      <div class="stat__icon">${s.icon || '✨'}</div>
      <div class="stat__bar">
        <div class="bar"><div class="bar__fill" style="--pct:${s.value}%"></div></div>
      </div>
      <div class="stat__label">${s.label}</div>
    `;
    wrap.appendChild(row);
  });
  // animación
  requestAnimationFrame(() => {
    wrap.querySelectorAll('.bar__fill').forEach(el => {
      const pct = getComputedStyle(el).getPropertyValue('--pct').trim() || '0%';
      el.style.width = '0%';
      requestAnimationFrame(() => { el.style.width = pct; });
    });
  });
}

// ===== Animación de XP en el header =====
window.addEventListener('load', () => {
  const xp = document.querySelector('.level__xp__fill');
  if (xp) {
    const pct = getComputedStyle(xp).getPropertyValue('--pct').trim() || '0%';
    xp.style.width = '0%';
    requestAnimationFrame(() => { xp.style.width = pct; });
  }
  renderStats();
});

// ===== Radar Chart (sin librerías) =====
function getRadarData() {
  const data = loadSkills();
  return {
    labels: data.map(s => s.label),
    values: data.map(s => s.value)
  };
}

function renderRadar() {
  const panel = document.getElementById('panel-graphic');
  if (!panel || !panel.classList.contains('is-active')) return;

  const canvas = document.getElementById('radarChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const { labels, values } = getRadarData();
  const N = labels.length || 5;

  // --- Medidas del canvas ---
  const wrap = canvas.parentElement;
  const wrapW = (wrap?.getBoundingClientRect().width || 480);
  const cssW = Math.max(320, Math.min(520, Math.floor(wrapW - 32) || 480));
  const cssH = Math.round(cssW * 0.85);

  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // --- Dibujo ---
  const w = cssW, h = cssH;
  const cx = w / 2;
  const cy = h / 2 + 6;
  const radius = Math.min(w, h) * 0.36;
  const step = (Math.PI * 2) / N;

  const colors = {
    grid: 'rgba(255,255,255,0.20)',
    line: '#6b63ff',
    fill: 'rgba(241, 92, 203, 0.50)',
    point: '#ff80d5',
    text: '#ffffff'
  };

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Anillos (20,40,60,80,100)
  ctx.lineWidth = 1;
  ctx.strokeStyle = colors.grid;
  for (let r = 1; r <= 5; r++) {
    const rr = radius * (r / 5);
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const ang = -Math.PI / 2 + i * step;
      const x = cx + rr * Math.cos(ang);
      const y = cy + rr * Math.sin(ang);
      (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    }
    ctx.closePath();
    ctx.stroke();

    ctx.font = "12px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.textAlign = "center";
    ctx.fillText(String(20 * r), cx, cy - rr - 4);
  }

  // Ejes radiales
  for (let i = 0; i < N; i++) {
    const ang = -Math.PI / 2 + i * step;
    const x = cx + radius * Math.cos(ang);
    const y = cy + radius * Math.sin(ang);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  // Polígono de datos
  const pts = [];
  for (let i = 0; i < N; i++) {
    const v = (values[i] || 0) / 100;
    const ang = -Math.PI / 2 + i * step;
    const x = cx + radius * v * Math.cos(ang);
    const y = cy + radius * v * Math.sin(ang);
    pts.push([x, y]);
  }

  // Relleno y borde
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = colors.fill;
  ctx.fill();

  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Puntos
  pts.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = colors.point;
    ctx.fill();
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // Etiquetas
  ctx.font = "16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
  ctx.fillStyle = colors.text;
  ctx.textBaseline = "middle";
  for (let i = 0; i < N; i++) {
    const ang = -Math.PI / 2 + i * step;
    const rx = cx + (radius + 26) * Math.cos(ang);
    const ry = cy + (radius + 26) * Math.sin(ang);
    if (Math.cos(ang) > 0.25) ctx.textAlign = "left";
    else if (Math.cos(ang) < -0.25) ctx.textAlign = "right";
    else ctx.textAlign = "center";
    ctx.fillText(labels[i], rx, ry);
  }
}

// Redibuja en resize y al abrir el tab
window.addEventListener('resize', renderRadar);
document.getElementById('tab-graphic')?.addEventListener('click', () => {
  setTimeout(renderRadar, 0);
});
window.addEventListener('DOMContentLoaded', renderRadar);


