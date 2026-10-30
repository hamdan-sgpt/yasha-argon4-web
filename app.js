// whatsapp: format 62xxxxxxxxxx, tanpa + atau spasi.
// TODO: isi link undangan Discord.
const CONFIG = {
  whatsapp: '6285648752799',
  discord: '',
  testimoni: 'https://whatsapp.com/channel/0029VaroKet2phHQbWegrN03',
};

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const formatRp = (n) => rupiah.format(n).replace(/\s/g, '');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMenu();
  initContactLinks();
  initOrder();
  initPicker();
  initHearts();
  initShopDemo();
  initReveal();
});

// Mainin ulang animasi CSS di elemen yang sama
function replay(el, cls) {
  if (reduceMotion) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

function initTheme() {
  const btn = document.getElementById('theme-toggle');
  const root = document.documentElement;

  const sync = () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'gelap' : 'terang';
    btn.setAttribute('aria-label', `Ganti ke tema ${next}`);
  };
  sync();

  btn.addEventListener('click', () => {
    const theme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('hc-theme', theme); } catch (e) { /* storage diblok, tema tetap ganti untuk sesi ini */ }
    sync();
  });
}

function initMenu() {
  const btn = document.getElementById('menu-toggle');
  const nav = document.getElementById('site-nav');

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Tutup' : 'Menu';
  };

  // Di DOM, nav ada sebelum tombol Menu, jadi fokus dipindah manual biar Tab berikutnya masuk ke link menu.
  btn.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    setOpen(open);
    if (open) nav.querySelector('a').focus();
  });
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      btn.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('is-open') && !nav.contains(e.target) && !btn.contains(e.target)) setOpen(false);
  });
}

function initContactLinks() {
  const list = document.getElementById('footer-links');
  const add = (label, href) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = label;
    li.appendChild(a);
    list.appendChild(li);
  };
  if (CONFIG.whatsapp) add('WhatsApp', `https://wa.me/${CONFIG.whatsapp}`);
  if (CONFIG.discord) add('Discord', CONFIG.discord);
  if (CONFIG.testimoni) add('Channel testimoni', CONFIG.testimoni);
}

function initOrder() {
  const form = document.getElementById('order-form');
  const nameInput = document.getElementById('f-nama');
  const nameError = document.getElementById('err-nama');
  const sourceBox = document.getElementById('addon-source');
  const sourceNote = document.getElementById('source-note');
  const status = document.getElementById('order-status');
  const waBtn = document.getElementById('btn-wa');
  const copyBtn = document.getElementById('btn-copy');
  const fallback = document.getElementById('copy-fallback');
  const fallbackText = document.getElementById('copy-fallback-text');

  const out = {
    pkgName: document.getElementById('sum-pkg-name'),
    pkgPrice: document.getElementById('sum-pkg-price'),
    addonPrice: document.getElementById('sum-addon-price'),
    addons: document.getElementById('sum-addons'),
    total: document.getElementById('sum-total'),
    days: document.getElementById('sum-days'),
    discuss: document.getElementById('sum-discuss'),
    barPkg: document.getElementById('bar-pkg'),
    barTotal: document.getElementById('bar-total'),
  };

  if (!CONFIG.whatsapp) {
    waBtn.disabled = true;
    waBtn.textContent = 'Nomor WhatsApp belum diatur';
  }

  const read = () => {
    const pkg = form.querySelector('input[name="paket"]:checked');
    const nego = pkg.dataset.nego === 'true';
    const addons = [...form.querySelectorAll('input[name="addon"]:checked')];
    const fitur = [...form.querySelectorAll('input[name="fitur"]:checked')].map((el) => el.value);
    const base = nego ? 0 : Number(pkg.dataset.price);
    const addonTotal = addons.reduce((sum, el) => sum + Number(el.dataset.price), 0);
    const days = nego ? null : Math.max(1, Number(pkg.dataset.days) + addons.reduce((sum, el) => sum + Number(el.dataset.days), 0));
    return {
      pkgName: pkg.closest('.pkg').querySelector('.pkg-name').textContent.trim(),
      nego,
      base,
      addons: addons.map((el) => ({ name: el.value, price: Number(el.dataset.price) })),
      addonTotal,
      total: base + addonTotal,
      days,
      fitur,
      nama: nameInput.value.trim(),
      versi: form.versi.value,
      hosting: form.hosting.value,
      catatan: form.catatan.value.trim(),
    };
  };

  let lastTotal = '';
  const render = () => {
    const isPlugin = form.querySelector('input[name="paket"]:checked').dataset.plugin === 'true';
    if (!isPlugin && sourceBox.checked) sourceBox.checked = false;
    sourceBox.disabled = !isPlugin;
    sourceNote.hidden = isPlugin;

    const o = read();
    const totalText = o.nego
      ? (o.addonTotal ? `Nego + ${formatRp(o.addonTotal)}` : 'Nego di chat')
      : formatRp(o.total);

    out.pkgName.textContent = o.pkgName;
    out.pkgPrice.textContent = o.nego ? 'Nego' : formatRp(o.base);
    out.addonPrice.textContent = formatRp(o.addonTotal);
    out.total.textContent = totalText;
    out.days.textContent = o.nego ? 'sesuai brief' : `${o.days} hari`;
    out.barPkg.textContent = o.pkgName;
    out.barTotal.textContent = totalText;
    if (lastTotal && lastTotal !== totalText) { replay(out.total, 'bump'); replay(out.barTotal, 'bump'); }
    lastTotal = totalText;

    out.addons.replaceChildren();
    if (o.addons.length === 0) {
      const li = document.createElement('li');
      li.className = 'muted';
      li.textContent = 'Belum ada tambahan';
      out.addons.appendChild(li);
    } else {
      o.addons.forEach((a) => {
        const li = document.createElement('li');
        li.textContent = `${a.name} (${formatRp(a.price)})`;
        out.addons.appendChild(li);
      });
    }

    const notes = [];
    if (o.nego) notes.push('Harga paket ini ditentuin bareng di chat, setelah saya tahu fitur dan jumlah pemainnya.');
    if (o.fitur.length) notes.push(`Dibahas pas brief, belum masuk total: ${o.fitur.join(', ')}.`);
    out.discuss.hidden = notes.length === 0;
    out.discuss.textContent = notes.join(' ');
  };

  const buildMessage = (o) => {
    const lines = [
      'Halo Yasha - Argon 4, saya mau pesan:',
      '',
      `Paket: ${o.pkgName} (${o.nego ? 'harga nego' : formatRp(o.base)})`,
      `Tambahan: ${o.addons.length ? o.addons.map((a) => `${a.name} (${formatRp(a.price)})`).join(', ') : '-'}`,
      `Fitur yang mau dibahas: ${o.fitur.length ? o.fitur.join(', ') : '-'}`,
      '',
      `Nama/IGN: ${o.nama}`,
      `Versi Minecraft: ${o.versi}`,
      `Tempat server: ${o.hosting}`,
      `Catatan: ${o.catatan || '-'}`,
      '',
      o.nego
        ? `Estimasi: harga paket dibahas di chat${o.addonTotal ? `, tambahan ${formatRp(o.addonTotal)}` : ''}`
        : `Estimasi: ${formatRp(o.total)}, sekitar ${o.days} hari kerja`,
    ];
    return lines.join('\n');
  };

  const setStatus = (text, kind) => {
    status.textContent = text;
    status.className = `status ${kind ? `is-${kind}` : ''}`;
  };

  const validate = () => {
    const ok = nameInput.value.trim().length > 0;
    nameInput.setAttribute('aria-invalid', String(!ok));
    nameError.hidden = ok;
    if (!ok) {
      setStatus('Pesanan belum lengkap: nama atau IGN masih kosong.', 'error');
      nameInput.focus();
    }
    return ok;
  };

  nameInput.addEventListener('input', () => {
    if (nameInput.getAttribute('aria-invalid') === 'true' && nameInput.value.trim()) {
      nameInput.setAttribute('aria-invalid', 'false');
      nameError.hidden = true;
      setStatus('', '');
    }
  });

  form.addEventListener('change', render);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!CONFIG.whatsapp || !validate()) return;
    const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(buildMessage(read()))}`;
    const win = window.open(url, '_blank', 'noopener');
    if (!win) window.location.href = url;
    setStatus('WhatsApp dibuka di tab baru. Tinggal tekan kirim di sana.', 'ok');
  });

  copyBtn.addEventListener('click', async () => {
    if (!validate()) return;
    const text = buildMessage(read());
    fallback.hidden = true;
    try {
      if (!navigator.clipboard) throw new Error('clipboard tidak tersedia');
      await navigator.clipboard.writeText(text);
      setStatus(CONFIG.discord
        ? 'Pesanan tersalin. Tempel di DM Discord atau channel order.'
        : 'Pesanan tersalin. Tempel di chat ke saya.', 'ok');
    } catch (err) {
      fallbackText.value = text;
      fallback.hidden = false;
      fallbackText.focus();
      fallbackText.select();
      setStatus('Browser nggak ngizinin salin otomatis. Teksnya udah dipilih di bawah, tekan Ctrl+C.', 'error');
    }
  });

  // Tombol "Pesan paket ini" di hero: pilih paketnya, lalu bawa ke form
  document.querySelectorAll('[data-pick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const radio = form.querySelector(`input[name="paket"][value="${btn.dataset.pick}"]`);
      radio.checked = true;
      render();
      radio.closest('.pkg').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      radio.focus({ preventScroll: true });
    });
  });

  initOrderBar(form);
  render();
}

// Bar total di HP: muncul selama form kelihatan tapi ringkasannya belum, sembunyi pas keyboard kebuka
function initOrderBar(form) {
  const bar = document.getElementById('order-bar');
  const steps = form.querySelector('.order-steps');
  const summary = document.getElementById('summary');
  if (!('IntersectionObserver' in window)) return;

  let stepsVisible = false;
  let summaryVisible = false;
  let typing = false;
  const update = () => { bar.hidden = !(stepsVisible && !summaryVisible && !typing); };

  new IntersectionObserver(([e]) => { stepsVisible = e.isIntersecting; update(); }).observe(steps);
  new IntersectionObserver(([e]) => { summaryVisible = e.isIntersecting; update(); }).observe(summary);
  form.addEventListener('focusin', (e) => { if (e.target.matches('input[type="text"], textarea, select')) { typing = true; update(); } });
  form.addEventListener('focusout', () => { typing = false; update(); });
}

function initPicker() {
  const tabs = [...document.querySelectorAll('.tabs [role="tab"]')];

  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', (e) => {
      const map = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in map)) return;
      e.preventDefault();
      select(tabs[(map[e.key] + tabs.length) % tabs.length], true);
    });
  });
}

// Angka dari config.yml DeathHeartLoss: mulai 10 hati, -1 tiap mati, maks 20, eliminasi jadi spectator
function initHearts() {
  const box = document.getElementById('hearts');
  const status = document.getElementById('heart-status');
  const dieBtn = document.getElementById('heart-die');
  const eatBtn = document.getElementById('heart-eat');
  const START = 10;
  const MAX = 20;
  let hearts = START;
  let out = false;

  const draw = (lostIndex) => {
    box.replaceChildren();
    const slots = Math.max(START, hearts + (lostIndex != null ? 1 : 0));
    for (let i = 0; i < slots; i++) {
      const h = document.createElement('span');
      h.className = 'heart';
      if (i >= hearts) h.classList.add('is-empty');
      if (i === lostIndex) { h.classList.remove('is-empty'); h.classList.add('is-lost'); }
      box.appendChild(h);
    }
  };

  const say = (text, isOut) => {
    status.textContent = text;
    status.classList.toggle('is-out', Boolean(isOut));
  };

  dieBtn.addEventListener('click', () => {
    if (out) {
      hearts = START;
      out = false;
      dieBtn.textContent = 'Mati sekali';
      eatBtn.disabled = false;
      draw();
      say('10 hati. Pemain baru mulai dari sini.');
      return;
    }
    if (hearts <= 1) {
      out = true;
      hearts = 0;
      draw(0);
      say('Hati habis. Pemain ini sekarang jadi spectator sampai event selesai.', true);
      dieBtn.textContent = 'Ulang dari awal';
      eatBtn.disabled = true;
      return;
    }
    hearts -= 1;
    draw(hearts);
    say(hearts === 1
      ? 'Sisa 1 hati. Mati sekali lagi, pemain ini keluar dari permainan.'
      : `Kamu kehilangan 1 hati. Sisa: ${hearts} hati.`);
  });

  eatBtn.addEventListener('click', () => {
    if (hearts >= MAX) { say(`Udah maksimal, ${MAX} hati.`); return; }
    hearts += 1;
    draw();
    say(`Hati Kehidupan dipakai. Sekarang ${hearts} hati.`);
  });

  draw();
}

// Demo menu konfirmasi beli: tombol di bawah panel buat sentuhan, slot panel bisa diklik pakai mouse
function initShopDemo() {
  const grid = document.getElementById('gui-grid');
  const countEl = document.getElementById('gui-count');
  const status = document.getElementById('gui-status');
  let qty = 1;

  const ops = {
    set1: () => 1,
    '-10': (q) => q - 10,
    '-1': (q) => q - 1,
    '+1': (q) => q + 1,
    '+10': (q) => q + 10,
    set64: () => 64,
  };

  const press = (op) => {
    const slot = grid.querySelector(`[data-op="${op}"]`);
    if (slot) replay(slot, 'is-pressed');

    if (op === 'ok') {
      status.textContent = `Dibeli: ${qty} diamond. Di server, saldo kepotong dan item masuk inventory kalau masih ada slot.`;
      return;
    }
    if (op === 'back') {
      qty = 1;
      countEl.textContent = '1';
      status.textContent = 'Balik ke halaman kategori. Jumlah direset ke 1.';
      return;
    }
    qty = Math.min(64, Math.max(1, ops[op](qty)));
    countEl.textContent = String(qty);
    status.textContent = `Jumlah: ${qty} diamond`;
  };

  document.querySelectorAll('.gui-controls [data-op], #gui-grid [data-op]').forEach((el) => {
    el.addEventListener('click', () => press(el.dataset.op));
  });
}

function initReveal() {
  const items = document.querySelectorAll('.case, .steps li, .testi-link');
  if (reduceMotion || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach((el) => {
    el.classList.add('reveal');
    io.observe(el);
  });
}
