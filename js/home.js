// Home page: weekly boards, canon, hidden gems, full list, sponsored slots, read tracking.
(async () => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k' : String(n ?? 0);
  // Broken cover images -> letter placeholder.
  document.addEventListener('error', e => { const img = e.target; if (img.tagName === 'IMG' && img.dataset.fallback) { const d = document.createElement('div'); d.className = 'ph'; d.textContent = img.dataset.fallback; img.replaceWith(d); } else if (img.tagName === 'IMG') img.style.visibility = 'hidden'; }, true);
  const CATS = {
    tech: { name: 'tech', c: 'var(--tech)', blurb: 'ai engineering, agents, evals, infra. how real teams ship with coding agents instead of tweeting about it.' },
    gtm: { name: 'gtm', c: 'var(--gtm)', blurb: 'outbound, sales, positioning, pricing, pitching. the stuff that makes money, not the stuff that makes threads.' },
    growth: { name: 'growth', c: 'var(--growth)', blurb: 'distribution, content, seo/aeo, ugc, virality. playbooks with receipts, not vibes.' },
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
  let readSet;

  readSet = new Set(local.get());

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
  document.getElementById('sScraped').textContent = payload.scraped;
  document.getElementById('sKept').textContent = DATA.length;

  function cover(d) {
    return `<div class="cv" style="--c:${CATS[d.cat].c}">${d.cover ? `<img loading="lazy" src="${esc(d.cover)}" alt="" data-fallback="${esc(d.title[0])}">` : `<div class="ph">${esc(d.title[0])}</div>`}</div>`;
  }
  const by = d => `<div class="by">${d.avatar ? `<img loading="lazy" src="${esc(d.avatar)}" alt="">` : ''}<span><b>${esc(d.name)}</b> @${esc(d.a)}</span></div>`;
  const nums = d => `<div class="nums"><span><b>${fmt(d.bm)}</b> saves</span><span><b>${fmt(d.views)}</b> views</span><span><b>${d.mins}</b> min</span><span>${dstr(d.at)}</span></div>`;
  function actions(d, slot) {
    const r = readSet.has(d.id);
    return `<div class="actions">${link(d, 'read on x ↗', 'read', slot)}<button class="chk ${r ? 'done' : ''}" data-id="${d.id}">${r ? '✓ actually read' : 'i read it (fr)'}</button></div>`;
  }
  const podCard = d => `<article class="pod${rc(d)}" style="--c:${CATS[d.cat].c}"><span class="crown">#1 ${d.cat} · this week</span>${cover(d)}<div class="bd"><span class="lane">${d.cat}</span><h3>${link(d, esc(d.title), '', 'podium')}</h3>${by(d)}${nums(d)}${actions(d, 'podium')}</div></article>`;
  const featCard = d => `<article class="feat${rc(d)}"><span class="crown">best this week</span>${cover(d)}<div class="bd"><h3>${link(d, esc(d.title), '', 'best')}</h3><p>${esc(d.preview)}…</p>${by(d)}${nums(d)}${actions(d, 'best')}</div></article>`;
  const card = (d, gem, slot = 'card') => `<article class="card${rc(d)}">${cover(d)}<div class="bd">${gem ? `<span class="gem">${(d.bm / Math.max(1, d.fol)).toFixed(2)} saves per follower</span>` : ''}<h3>${link(d, esc(d.title), '', slot)}</h3><p>${esc(d.preview)}</p>${by(d)}${nums(d)}${actions(d, slot)}</div></article>`;
  const sponsCard = d => `<article class="card spons" style="--c:${CATS[d.cat].c}"><span class="spons-tag">sponsored</span>${cover(d)}<div class="bd"><span class="lane" style="color:${CATS[d.cat].c}">${d.cat}</span><h3>${link(d, esc(d.title), '', 'sponsored')}</h3><p>${esc(d.preview)}</p>${by(d)}<div class="actions">${link(d, 'read on x ↗', 'read', 'sponsored')}</div></div></article>`;
  function boardRows(arr) {
    const max = arr[0]?.bm || 1;
    return arr.map((d, i) => link(d, `<span class="rk">${String(i + 1).padStart(2, '0')}</span><div><div class="tt">${esc(d.title)}</div><div class="mt">@${esc(d.a)} · ${d.mins} min · ${dstr(d.at)}</div></div><div class="sv">${fmt(d.bm)}<small>saves</small></div><span class="meter" style="width:${Math.max(4, d.bm / max * 100)}%"></span>`, 'row' + rc(d), 'board')).join('');
  }
  const matches = d => !state.q || (d.title + ' ' + d.a + ' ' + d.name + ' ' + d.preview).toLowerCase().includes(state.q.toLowerCase());

  function section(cat) {
    const C = CATS[cat];
    const all = DATA.filter(d => d.cat === cat);
    const week = all.filter(isWeek).sort((a, b) => b.bm - a.bm);
    const best = week[0];
    const board = week.slice(0, 8);
    const shown = new Set(board.map(d => d.id));
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
    return `<section class="sec" id="sec-${cat}" style="--c:${C.c}">
      <div class="sechead"><div><h2>${C.name}<span>.</span></h2><p>${C.blurb}</p></div>
        <div class="prog">${readN}/${all.length} read<div class="bar"><i style="width:${readN / all.length * 100}%"></i></div></div></div>
      ${q ? '' : `
      ${spons.length ? `<div class="h4" style="margin-top:0"><b>sponsored</b> · they paid, we still read it first · <a href="highlight.html" style="color:var(--gold)">get yours</a></div><div class="sponsrow" style="margin-bottom:22px">${spons.map(sponsCard).join('')}</div>` : ''}
      <div class="grid1">${best ? featCard(best) : '<div class="feat"><div class="bd"><p>nothing new this week. the timeline is cooked. check back monday.</p></div></div>'}
        <div class="board"><div class="bh"><span>this week's leaderboard</span><span>${wk}</span></div>${boardRows(board)}</div>
      </div>
      <div class="h4"><b>not to miss</b> · the canon. read these or stay mid</div>
      <div class="cards">${canon.map(d => card(d, false, 'canon')).join('')}</div>
      <div class="h4"><b>hidden gems</b> · small accounts, big brain</div>
      <div class="cards">${gems.map(d => card(d, true, 'gem')).join('')}</div>`}
      <div class="h4"><b>${q ? `results for "${esc(state.q)}"` : 'the full stack'}</b> · ${full.length} articles${q ? '' : ' (you won\'t, but you could)'}</div>
      ${q ? '' : `<div class="ctrl">${['saves', 'newest', 'quick', 'unread'].map(s => `<button class="pill ${ls.sort === s ? 'on' : ''}" data-sort="${s}" data-cat="${cat}">${s === 'saves' ? 'most saved' : s === 'quick' ? 'shortest (we see you)' : s === 'unread' ? 'the shame pile' : 'newest'}</button>`).join('')}</div>`}
      <div class="list">${fullShown.length ? fullShown.map(d => `<div class="li${rc(d)}">${link(d, `${esc(d.title)}${isWeek(d) ? '<span class="new">NEW</span>' : ''}<small>@${esc(d.a)} · ${fmt(d.fol)} followers</small>`, 't', 'list')}<span class="m hm"><b>${fmt(d.bm)}</b> saves · <b>${fmt(d.views)}</b></span><span class="m hm">${d.mins} min</span><button class="chk ${readSet.has(d.id) ? 'done' : ''}" data-id="${d.id}">${readSet.has(d.id) ? '✓ actually read' : 'i read it (fr)'}</button></div>`).join('') : '<div class="empty">zero results. even we couldn\'t find it. try another word?</div>'}</div>
      ${!q && full.length > ls.n ? `<button class="more" data-more="${cat}">show all ${full.length} (brave) →</button>` : ''}
    </section>`;
  }

  function render() {
    const cats = state.cat === 'all' ? ['tech', 'gtm', 'growth'] : [state.cat];
    document.getElementById('sections').innerHTML = cats.map(section).join('');
    const pod = ['tech', 'gtm', 'growth'].map(c => DATA.filter(d => d.cat === c && isWeek(d)).sort((a, b) => b.bm - a.bm)[0]).filter(Boolean);
    document.getElementById('podium').innerHTML = pod.map(podCard).join('');
    const front = SPONS.filter(s => s.tier === 'frontpage');
    document.getElementById('frontspons').innerHTML = front.length ? `<div class="h4"><b>sponsored</b> · <a href="highlight.html" style="color:var(--gold)">get your article here</a></div><div class="sponsrow">${front.map(sponsCard).join('')}</div>` : '';
    document.getElementById('hero').classList.toggle('hide', state.cat !== 'all' || !!state.q);
    document.getElementById('sReadTot').textContent = `${[...readSet].filter(id => DATA.some(d => d.id === id)).length}/${DATA.length}`;
    document.getElementById('sHours').textContent = Math.round(DATA.reduce((s, d) => s + d.mins, 0) / 60) + 'h';
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

  let qt, lastQ = '';
  document.getElementById('q').addEventListener('input', e => {
    clearTimeout(qt);
    qt = setTimeout(() => {
      state.q = e.target.value.trim(); render();
    }, 250);
  });

  const startCat = new URLSearchParams(location.search).get('c');
  if (CATS[startCat]) { state.cat = startCat; document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x.dataset.c === startCat)); }
  render();
})();
