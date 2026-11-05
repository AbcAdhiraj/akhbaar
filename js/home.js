// Home page: weekly boards, canon, hidden gems, full list, sponsored slots, read tracking.
(async () => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k' : String(n ?? 0);
  // Broken cover image -> drop the photo, the story runs as text only.
  document.addEventListener('error', e => {
    const img = e.target;
    if (img.tagName !== 'IMG') return;
    const cv = img.closest('.cv');
    if (cv) { cv.closest('article')?.classList.add('noimg'); cv.remove(); } else img.style.visibility = 'hidden';
  }, true);
  const CATS = {
    tech: { name: 'tech', c: 'var(--tech)', v: 'a', label: 'section a · engineering & ai', blurb: 'ai engineering, agents, evals, infra. how real teams ship with coding agents instead of tweeting about it.' },
    gtm: { name: 'gtm', c: 'var(--gtm)', v: 'b', label: 'section b · sales & money', blurb: 'outbound, sales, positioning, pricing, pitching. the stuff that makes money, not the stuff that makes threads.' },
    growth: { name: 'growth', c: 'var(--growth)', v: 'c', label: 'section c · distribution & attention', blurb: 'distribution, content, seo/aeo, ugc, virality. playbooks with receipts, not vibes.' },
  };
  // story-card layouts per desk, so the three desks don't look the same
  const PATTERN = {
    a: ['big', 'side', 'brief', 'brief', 'brief', 'strip'],
    b: ['side', 'big', 'mid', 'mid', 'wbrief', 'wbrief'],
    c: ['mid', 'mid', 'brief', 'brief', 'brief', 'strip'],
  };
  const LKEY = 'signalnoise_read_v1';
  const local = {
    get() { try { return JSON.parse(localStorage.getItem(LKEY) || '[]'); } catch { return []; } },
    set(v) { try { localStorage.setItem(LKEY, JSON.stringify(v)); } catch {} },
  };

  // Articles live in data/articles.json. Paid highlights go in data/sponsored.json (same fields + "tier": "frontpage" or "spotlight").
  const [articles, sponsored] = await Promise.all([
    fetch('data/articles.json').then(r => r.json()),
    fetch('data/sponsored.json').then(r => r.json()).catch(() => []),
  ]);
  const latest = articles.reduce((m, r) => (r.at > m ? r.at : m), '1970-01-01');
  const payload = { articles, sponsored, weekEnd: latest, weekStart: new Date(Date.parse(latest) - 7 * 864e5).toISOString().slice(0, 10), scraped: 330 };
  const DATA = payload.articles;
  const SPONS = payload.sponsored || [];
  const WEEK_START = payload.weekStart;
  const readSet = new Set(local.get());

  const state = { cat: 'all', q: '' };
  const listState = {};
  const url = d => `https://x.com/${d.a}/status/${d.id}`;
  const dstr = s => new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const isWeek = d => d.at >= WEEK_START;
  const rc = d => (readSet.has(d.id) ? ' isread' : '');
  const link = (d, inner, cls = '', slot = '') => `<a class="${cls}" href="${url(d)}" target="_blank" rel="noopener" data-out="${d.id}" data-cat="${d.cat}" data-slot="${slot}">${inner}</a>`;

  // Hero labels
  const wk = `${dstr(WEEK_START).toLowerCase()} – ${dstr(payload.weekEnd).toLowerCase()}`;
  document.getElementById('weeklabel').textContent = `week of ${wk}`;

  // count-up stats
  const countUp = (el, to, suffix = '') => {
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = to + suffix; return; }
    const t0 = performance.now(), dur = 1100;
    const step = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e) + suffix; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  countUp(document.getElementById('sScraped'), payload.scraped);
  countUp(document.getElementById('sKept'), DATA.length);

  // news ticker: this week's stories, newest first
  const tick = document.getElementById('ticker');
  if (tick) {
    const items = DATA.filter(isWeek).sort((a, b) => b.at.localeCompare(a.at) || b.bm - a.bm).slice(0, 14);
    const one = items.map(d => link(d, `<b>${esc(d.cat)}</b> ${esc(d.title)} <i>— @${esc(d.a)}</i>`, 'tk', 'ticker')).join('<span class="tk-sep">✦</span>');
    tick.innerHTML = `<div class="tk-run">${one}<span class="tk-sep">✦</span></div><div class="tk-run" aria-hidden="true">${one}<span class="tk-sep">✦</span></div>`;
    tick.style.setProperty('--dur', Math.max(40, items.length * 6) + 's');
  }

  const cover = (d, cap = false) => d.cover
    ? `<figure class="cv"><img loading="lazy" src="${esc(d.cover)}" alt="">${cap ? `<figcaption>${d.mins} min read · via @${esc(d.a)} on x</figcaption>` : ''}</figure>`
    : '';
  const by = d => `<div class="by">${d.avatar ? `<img loading="lazy" src="${esc(d.avatar)}" alt="">` : ''}<span><b>${esc(d.name)}</b> @${esc(d.a)}</span></div>`;
  const nums = d => `<div class="nums"><span><b>${fmt(d.bm)}</b> saves</span><span><b>${fmt(d.views)}</b> views</span><span><b>${d.mins}</b> min</span><span>${dstr(d.at)}</span></div>`;
  function actions(d, slot) {
    const r = readSet.has(d.id);
    return `<div class="actions">${link(d, 'read on x ↗', 'read', slot)}<button class="chk ${r ? 'done' : ''}" data-id="${d.id}">${r ? '✓ actually read' : 'i read it (fr)'}</button></div>`;
  }
  const noimg = d => (d.cover ? '' : ' noimg');

  const podCard = (d, lead) => `<article class="pod${lead ? ' lead' : ''}${noimg(d)}${rc(d)}" style="--c:${CATS[d.cat].c}"><span class="crown">no. 1 in ${d.cat}</span>${cover(d, lead)}<div class="bd"><h3>${link(d, esc(d.title), '', 'podium')}</h3>${lead && d.preview ? `<p class="dek">${esc(d.preview)}…</p>` : ''}${by(d)}${nums(d)}${actions(d, 'podium')}</div></article>`;

  function featCard(d, v) {
    if (!d) return '<div class="feat"><div class="bd"><p>nothing new this week. the timeline is cooked. check back monday.</p></div></div>';
    const h = `<h3>${link(d, esc(d.title), '', 'best')}</h3>`;
    const body = `<p>${esc(d.preview)}…</p>${by(d)}${nums(d)}${actions(d, 'best')}`;
    if (v === 'b') return `<article class="feat feat-b${noimg(d)}${rc(d)}"><span class="crown">best this week</span>${h}<div class="split">${cover(d, true)}<div class="bd">${body}</div></div></article>`;
    if (v === 'c') return `<article class="feat feat-c${noimg(d)}${rc(d)}">${cover(d, true)}<div class="bd"><span class="crown">best this week</span>${h}${body}</div></article>`;
    return `<article class="feat feat-a${noimg(d)}${rc(d)}"><span class="crown">best this week</span>${cover(d, true)}<div class="bd">${h}${body}</div></article>`;
  }

  function storyCard(d, type, slot) {
    const withImg = !['brief', 'wbrief'].includes(type) && d.cover;
    return `<article class="st st-${type}${withImg ? '' : ' noimg'}${rc(d)}">${withImg ? cover(d, type === 'big') : ''}<div class="bd">${withImg ? '' : `<span class="lane">${fmt(d.bm)} saves · ${d.mins} min</span>`}<h3>${link(d, esc(d.title), '', slot)}</h3><p>${esc(d.preview)}…</p>${by(d)}${withImg ? nums(d) : ''}${actions(d, slot)}</div></article>`;
  }

  const TILT = [-1.4, 0.9, -0.6];
  const gemCard = (d, i) => `<article class="gemcard${rc(d)}" style="--r:${TILT[i % 3]}deg"><span class="pin"></span>
    <div class="gtop">${d.avatar ? `<img class="port" loading="lazy" src="${esc(d.avatar)}" alt="">` : `<span class="port">${esc(d.name[0])}</span>`}<div><b>${esc(d.name)}</b><span>@${esc(d.a)} · ${fmt(d.fol)} followers</span></div></div>
    <span class="gem">${(d.bm / Math.max(1, d.fol)).toFixed(2)} saves per follower</span>
    <h3>${link(d, esc(d.title), '', 'gem')}</h3><p>${esc(d.preview)}…</p>${nums(d)}${actions(d, 'gem')}</article>`;

  const sponsCard = d => `<article class="card spons" style="--c:${CATS[d.cat].c}"><span class="spons-tag">sponsored</span>${cover(d)}<div class="bd"><span class="lane" style="color:${CATS[d.cat].c}">${d.cat}</span><h3>${link(d, esc(d.title), '', 'sponsored')}</h3><p>${esc(d.preview)}</p>${by(d)}<div class="actions">${link(d, 'read on x ↗', 'read', 'sponsored')}</div></div></article>`;
  function boardRows(arr) {
    const max = arr[0]?.bm || 1;
    return arr.map((d, i) => link(d, `<span class="rk">${String(i + 1).padStart(2, '0')}</span><div><div class="tt">${esc(d.title)}</div><div class="mt">@${esc(d.a)} · ${d.mins} min · ${dstr(d.at)}</div></div><div class="sv">${fmt(d.bm)}<small>saves</small></div><span class="meter" style="width:${Math.max(4, d.bm / max * 100)}%"></span>`, 'row' + rc(d), 'board')).join('');
  }
  const BOARD_TITLE = { a: "this week's leaderboard", b: 'the market report', c: 'the charts' };
  const board = (rows, v) => `<div class="board board-${v}"><div class="bh"><span>${BOARD_TITLE[v]}</span><span>${wk}</span></div><div class="rows">${boardRows(rows)}</div></div>`;
  const matches = d => !state.q || (d.title + ' ' + d.a + ' ' + d.name + ' ' + d.preview).toLowerCase().includes(state.q.toLowerCase());

  function section(cat) {
    const C = CATS[cat], v = C.v;
    const all = DATA.filter(d => d.cat === cat);
    const week = all.filter(isWeek).sort((a, b) => b.bm - a.bm);
    const best = week[0];
    const brd = week.slice(0, 8);
    const shown = new Set(brd.map(d => d.id));
    const canon = all.filter(d => !shown.has(d.id)).sort((a, b) => b.bm - a.bm).slice(0, 6);
    canon.forEach(d => shown.add(d.id));
    const gems = all.filter(d => d.fol < 15000 && !shown.has(d.id)).sort((a, b) => b.bm / b.fol - a.bm / a.fol).slice(0, 3);
    const spons = SPONS.filter(s => s.cat === cat);
    const readN = all.filter(d => readSet.has(d.id)).length;
    const ls = listState[cat] || (listState[cat] = { sort: 'saves', n: 12 });
    const full = all.filter(matches);
    const sorters = { saves: (a, b) => b.bm - a.bm, newest: (a, b) => b.at.localeCompare(a.at), quick: (a, b) => a.mins - b.mins, unread: (a, b) => (readSet.has(a.id) - readSet.has(b.id)) || b.bm - a.bm };
    full.sort(sorters[ls.sort]);
    const q = !!state.q;
    const fullShown = q ? full : full.slice(0, ls.n);
    const top = v === 'b' ? `${board(brd, v)}${featCard(best, v)}` : v === 'c' ? `${featCard(best, v)}${board(brd, v)}` : `${featCard(best, v)}${board(brd, v)}`;
    return `<section class="sec v-${v}" id="sec-${cat}" style="--c:${C.c}">
      <div class="sechead"><div><span class="seclabel">${C.label}</span><h2>the ${C.name} desk</h2><p>${C.blurb}</p></div>
        <div class="prog">${readN}/${all.length} read<div class="bar"><i style="width:${readN / all.length * 100}%"></i></div></div></div>
      ${q ? '' : `
      ${spons.length ? `<div class="h4" style="margin-top:0"><b>sponsored</b> · they paid, we still read it first · <a href="highlight.html" style="color:var(--gold)">get yours</a></div><div class="sponsrow" style="margin-bottom:22px">${spons.map(sponsCard).join('')}</div>` : ''}
      <div class="grid1 g-${v}">${top}</div>
      <div class="h4"><b>not to miss</b> · the canon. read these or stay mid</div>
      <div class="mosaic">${canon.map((d, i) => storyCard(d, PATTERN[v][i] || 'brief', 'canon')).join('')}</div>
      ${gems.length ? `<div class="h4"><b>hidden gems</b> · small accounts, big brain</div>
      <div class="gems">${gems.map(gemCard).join('')}</div>` : ''}`}
      <div class="h4"><b>${q ? `results for "${esc(state.q)}"` : 'the full stack'}</b> · ${full.length} articles${q ? '' : ' (you won\'t, but you could)'}</div>
      ${q ? '' : `<div class="ctrl">${['saves', 'newest', 'quick', 'unread'].map(s => `<button class="pill ${ls.sort === s ? 'on' : ''}" data-sort="${s}" data-cat="${cat}">${s === 'saves' ? 'most saved' : s === 'quick' ? 'shortest (we see you)' : s === 'unread' ? 'the shame pile' : 'newest'}</button>`).join('')}</div>`}
      <div class="list">${fullShown.length ? fullShown.map(d => `<div class="li${rc(d)}">${link(d, `${esc(d.title)}${isWeek(d) ? '<span class="new">NEW</span>' : ''}<small>@${esc(d.a)} · ${fmt(d.fol)} followers</small>`, 't', 'list')}<span class="m hm"><b>${fmt(d.bm)}</b> saves · <b>${fmt(d.views)}</b></span><span class="m hm">${d.mins} min</span><button class="chk ${readSet.has(d.id) ? 'done' : ''}" data-id="${d.id}">${readSet.has(d.id) ? '✓ actually read' : 'i read it (fr)'}</button></div>`).join('') : '<div class="empty">zero results. even we couldn\'t find it. try another word?</div>'}</div>
      ${!q && full.length > ls.n ? `<button class="more" data-more="${cat}">show all ${full.length} (brave) →</button>` : ''}
    </section>`;
  }

  // scroll-in animation, only on first paint so re-renders don't flicker
  let firstPaint = true;
  const io = 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches
    ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' })
    : null;

  function render() {
    const cats = state.cat === 'all' ? ['tech', 'gtm', 'growth'] : [state.cat];
    document.getElementById('sections').innerHTML = cats.map(section).join('');
    const pod = ['tech', 'gtm', 'growth'].map(c => DATA.filter(d => d.cat === c && isWeek(d)).sort((a, b) => b.bm - a.bm)[0]).filter(Boolean);
    const ps = [...pod].sort((a, b) => b.bm - a.bm);
    const order = ps.length === 3 ? [ps[1], ps[0], ps[2]] : ps;
    document.getElementById('podium').innerHTML = order.map(d => podCard(d, d === ps[0])).join('');
    const front = SPONS.filter(s => s.tier === 'frontpage');
    document.getElementById('frontspons').innerHTML = front.length ? `<div class="h4"><b>sponsored</b> · <a href="highlight.html" style="color:var(--gold)">get your article here</a></div><div class="sponsrow">${front.map(sponsCard).join('')}</div>` : '';
    document.getElementById('hero').classList.toggle('hide', state.cat !== 'all' || !!state.q);
    document.getElementById('sReadTot').textContent = `${[...readSet].filter(id => DATA.some(d => d.id === id)).length}/${DATA.length}`;
    document.getElementById('sHours').textContent = Math.round(DATA.reduce((s, d) => s + d.mins, 0) / 60) + 'h';
    if (io && firstPaint) document.querySelectorAll('.pod, .feat, .board, .st, .gemcard, .sechead').forEach(el => { el.classList.add('rv'); io.observe(el); });
    firstPaint = false;
  }

  async function toggleRead(id) {
    const on = !readSet.has(id);
    on ? readSet.add(id) : readSet.delete(id);
    render();
    local.set([...readSet]);
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-out]');
    if (a) return;
    const t = e.target.closest('button'); if (!t) return;
    if (t.classList.contains('tab')) {
      document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t));
      state.cat = t.dataset.c; render(); window.scrollTo({ top: 0 });
      history.replaceState(null, '', state.cat === 'all' ? location.pathname : '?c=' + state.cat);
    } else if (t.dataset.id) toggleRead(t.dataset.id);
    else if (t.dataset.sort) { listState[t.dataset.cat].sort = t.dataset.sort; render(); }
    else if (t.dataset.more) { listState[t.dataset.more].n = 999; render(); }
  });

  let qt;
  document.getElementById('q').addEventListener('input', e => {
    clearTimeout(qt);
    qt = setTimeout(() => { state.q = e.target.value.trim(); render(); }, 250);
  });

  const startCat = new URLSearchParams(location.search).get('c');
  if (CATS[startCat]) { state.cat = startCat; document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x.dataset.c === startCat)); }
  render();
})();
