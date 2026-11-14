(function () {
  'use strict';

  const TIME = 45;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); const t = b[i]; b[i] = b[j]; b[j] = t; } return b; };
  const uniq = (a) => Array.from(new Set(a));
  const fmt = (n) => Number(n).toLocaleString('en-GB');
  const opt = (label, ok, extra) => Object.assign({ label: label, ok: !!ok }, extra || {});
  const mk = (o) => Object.assign({ stimulusHTML: '', visual: false, scored: true }, o);
  const last = {};
  const draw = (key, arr) => { let i; do { i = rnd(arr.length); } while (arr.length > 1 && i === last[key]); last[key] = i; return arr[i]; };

  /* ---------- SVG helpers ---------- */
  const POS = [[30, 30], [70, 30], [70, 62], [30, 62]];
  const POSNAME = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
  function tileSVG(pos, filled, bars, size) {
    const p = POS[pos];
    const node = filled
      ? `<circle cx='${p[0]}' cy='${p[1]}' r='10' fill='#1c2240'/>`
      : `<circle cx='${p[0]}' cy='${p[1]}' r='9' fill='#fff' stroke='#1c2240' stroke-width='3'/>`;
    let b = '';
    for (let i = 0; i < bars; i++) { const x = 20 + i * 14; b += `<line x1='${x}' y1='80' x2='${x}' y2='91' stroke='#b45309' stroke-width='3.5' stroke-linecap='round'/>`; }
    return `<svg width='${size}' height='${size}' viewBox='0 0 100 100' fill='none' aria-hidden='true' focusable='false'><rect x='4' y='4' width='92' height='92' rx='12' fill='#fff'/><line x1='14' y1='74' x2='86' y2='74' stroke='#dcdfe8' stroke-width='1.5'/><line x1='50' y1='14' x2='50' y2='70' stroke='#dcdfe8' stroke-dasharray='3 3'/><line x1='16' y1='46' x2='84' y2='46' stroke='#dcdfe8' stroke-dasharray='3 3'/>${node}${b}</svg>`;
  }
  const SHAPES = {
    triangle: { sides: 3, svg: `<polygon points='50,14 88,82 12,82' fill='#f7f4ec' stroke='#1c2240' stroke-width='2.8' stroke-linejoin='round'/>` },
    square: { sides: 4, svg: `<rect x='18' y='18' width='64' height='64' fill='#f7f4ec' stroke='#1c2240' stroke-width='2.8' stroke-linejoin='round'/>` },
    pentagon: { sides: 5, svg: `<polygon points='50,14 86,40 72,82 28,82 14,40' fill='#f7f4ec' stroke='#1c2240' stroke-width='2.8' stroke-linejoin='round'/>` },
    hexagon: { sides: 6, svg: `<polygon points='50,12 84,31 84,69 50,88 16,69 16,31' fill='#f7f4ec' stroke='#1c2240' stroke-width='2.8' stroke-linejoin='round'/>` }
  };
  const DOTS = {
    1: [[50, 54]], 2: [[40, 54], [60, 54]], 3: [[50, 44], [38, 64], [62, 64]],
    4: [[39, 44], [61, 44], [39, 64], [61, 64]], 5: [[50, 36], [38, 52], [62, 52], [42, 68], [58, 68]]
  };
  function polySVG(shape, dots, size) {
    const d = (DOTS[dots] || []).map((p) => `<circle cx='${p[0]}' cy='${p[1]}' r='4.8' fill='#4f46e5'/>`).join('');
    return `<svg width='${size}' height='${size}' viewBox='0 0 100 100' fill='none' aria-hidden='true' focusable='false'><rect x='4' y='4' width='92' height='92' rx='12' fill='#fff'/>${SHAPES[shape].svg}${d}</svg>`;
  }
  function trioSVG(items) {
    const slots = [28, 75, 122];
    const m = items.map((it, i) => {
      const cx = slots[i], f = it.f ? '#1c2240' : '#fff';
      if (it.s === 'circle') return `<circle cx='${cx}' cy='26' r='11' fill='${f}' stroke='#1c2240' stroke-width='2.5'/>`;
      if (it.s === 'square') return `<rect x='${cx - 10}' y='16' width='20' height='20' rx='2' fill='${f}' stroke='#1c2240' stroke-width='2.5'/>`;
      return `<polygon points='${cx},14 ${cx + 12},36 ${cx - 12},36' fill='${f}' stroke='#1c2240' stroke-width='2.5' stroke-linejoin='round'/>`;
    }).join('');
    return `<svg width='150' height='52' viewBox='0 0 150 52' fill='none' aria-hidden='true' focusable='false'><rect x='1' y='1' width='148' height='50' rx='10' fill='#fff'/>${m}</svg>`;
  }

  /* ---------- Verbal bank ---------- */
  const PAIRS = [
    { a: ['rigorous', 'tentative', 'partial'], b: ['exacting', 'decisive', 'lavish'], ok: 'rigorous and exacting', bad: ['tentative and decisive', 'partial and lavish', 'rigorous and decisive'], why: '"Rigorous" (strict, thorough) and "exacting" (demanding precision) are near-synonyms. "Tentative" and "decisive" are opposites, and "partial" and "lavish" share no meaning.' },
    { a: ['candid', 'volatile', 'meagre'], b: ['frank', 'serene', 'abundant'], ok: 'candid and frank', bad: ['volatile and serene', 'meagre and abundant', 'candid and abundant'], why: '"Candid" and "frank" both mean open and direct. "Volatile" and "serene" are opposites, as are "meagre" and "abundant".' },
    { a: ['frugal', 'obscure', 'hostile'], b: ['thrifty', 'famous', 'cordial'], ok: 'frugal and thrifty', bad: ['obscure and famous', 'hostile and cordial', 'frugal and cordial'], why: '"Frugal" and "thrifty" both mean careful with money. "Obscure" and "famous" are opposites, as are "hostile" and "cordial".' },
    { a: ['impartial', 'obsolete', 'brittle'], b: ['unbiased', 'modern', 'flexible'], ok: 'impartial and unbiased', bad: ['obsolete and modern', 'brittle and flexible', 'impartial and modern'], why: '"Impartial" and "unbiased" mean the same. "Obsolete" and "modern" are opposites, as are "brittle" and "flexible".' },
    { a: ['lucid', 'tenuous', 'benign'], b: ['clear', 'substantial', 'harmful'], ok: 'lucid and clear', bad: ['tenuous and substantial', 'benign and harmful', 'lucid and harmful'], why: '"Lucid" means clearly expressed, so it matches "clear". "Tenuous" and "substantial" are opposites, as are "benign" and "harmful".' },
    { a: ['meticulous', 'reluctant', 'ephemeral'], b: ['careful', 'eager', 'permanent'], ok: 'meticulous and careful', bad: ['reluctant and eager', 'ephemeral and permanent', 'meticulous and permanent'], why: '"Meticulous" means very careful about detail. "Reluctant" and "eager" are opposites, as are "ephemeral" and "permanent".' }
  ];
  const ANTS = [
    { w: 'TACITURN', ok: 'Forthcoming', bad: ['Reticent', 'Methodical', 'Equivocal'], why: '"Taciturn" means reserved and uncommunicative. "Forthcoming" (willing to share information) is its opposite. "Reticent" is a near-synonym.' },
    { w: 'FRUGAL', ok: 'Extravagant', bad: ['Economical', 'Austere', 'Prudent'], why: '"Frugal" means sparing with money; "extravagant" means spending freely. The other three describe careful or sparing behaviour.' },
    { w: 'AMBIGUOUS', ok: 'Unequivocal', bad: ['Vague', 'Nuanced', 'Tentative'], why: '"Ambiguous" means open to more than one reading; "unequivocal" means having only one possible meaning. "Vague" is close to ambiguous, not opposite.' },
    { w: 'TRANSIENT', ok: 'Permanent', bad: ['Fleeting', 'Gradual', 'Erratic'], why: '"Transient" means lasting only a short time; "permanent" is its opposite. "Fleeting" is a near-synonym.' },
    { w: 'CANDID', ok: 'Evasive', bad: ['Frank', 'Blunt', 'Informal'], why: '"Candid" means open and honest; "evasive" means avoiding a direct answer. "Frank" and "blunt" point the same way as candid.' },
    { w: 'MEAGRE', ok: 'Ample', bad: ['Scant', 'Modest', 'Frugal'], why: '"Meagre" means small in quantity; "ample" means more than enough. "Scant" is a near-synonym of meagre.' }
  ];
  const DEDS = [
    { p: 'Organisations rarely fail because they lack data; they fail because analytical output is divorced from decision ownership. Commissioning additional research when governance is unclear increases reporting volume without improving commercial outcomes.', q: 'Assuming the passage is strictly true, which conclusion necessarily follows?', ok: 'Commissioning new research under unclear governance will increase reporting output without improving commercial results.', bad: ['Increasing data volume automatically improves commercial outcomes when governance is clear.', 'Most organisations need fewer analysts and more senior commercial managers.', 'Commercial outcomes depend entirely on research commissioning budgets.'], why: 'Only the first option restates what the passage supports. The others either assume the reverse of the passage holds or introduce claims it never makes.' },
    { p: 'Every dashboard on the platform is built from the central data model. No dashboard built from the central data model uses unaudited sources.', q: 'Which conclusion must be true?', ok: 'No dashboard on the platform uses unaudited sources.', bad: ['Every audited source feeds a dashboard on the platform.', 'The central data model can only be used by dashboards.', 'Some dashboards on the platform use unaudited sources.'], why: 'Platform dashboards are all built from the central model, and none of those use unaudited sources. The other options reverse the premises or contradict them.' },
    { p: 'If a test is underpowered, its result cannot be trusted. The result of the pricing test can be trusted.', q: 'Which conclusion must be true?', ok: 'The pricing test was not underpowered.', bad: ['The pricing test used a large sample.', 'Any test that is not underpowered can be trusted.', 'The pricing test result must be acted on.'], why: 'If being underpowered rules out trust, a trusted result cannot come from an underpowered test. The second option reverses the rule, and the others add claims the passage does not make.' },
    { p: 'Team A delivers more projects than Team B. Team C delivers fewer projects than Team B. Team D delivers fewer projects than Team B but more than Team C.', q: 'Which statement must be true?', ok: 'Team A delivers more projects than Team D.', bad: ['Team D delivers more projects than Team A.', 'Team C delivers more projects than Team D.', 'Team B delivers fewer projects than Team D.'], why: 'The order is A, then B, then D, then C. Only the first option matches it.' },
    { p: 'Of the 200 customers who contacted support and answered the survey, 80 rated their experience as poor. Customers who did not contact support were not surveyed.', q: 'Which conclusion is supported by the passage?', ok: '40% of surveyed customers who contacted support rated their experience as poor.', bad: ['40% of all customers rated their experience as poor.', 'Contacting support makes customers rate their experience as poor.', 'Most customers who did not contact support had a good experience.'], why: '80 of 200 is 40%, but only for customers who contacted support and responded. The other options generalise to everyone, infer a cause, or speak about people who were never surveyed.' },
    { p: 'No analyst who has completed the audit course has missed a compliance deadline. Priya is an analyst and has missed a compliance deadline.', q: 'Which conclusion must be true?', ok: 'Priya has not completed the audit course.', bad: ['Every analyst who has not completed the course misses deadlines.', 'Priya will complete the audit course next year.', 'Priya is the only analyst to have missed a deadline.'], why: 'If completing the course rules out missing a deadline, then missing one means Priya has not completed it. The first option reverses the rule.' }
  ];
  function genPair() {
    const it = draw('pair', PAIRS);
    return mk({ battery: 'verbal', sub: 'Word meaning', stimulusHTML: `<div class='dp-pair'><div><small>Group A</small><b>(${it.a.join(', ')})</b></div><div><small>Group B</small><b>(${it.b.join(', ')})</b></div></div>`, prompt: 'Choose the pair, one word from each group, that are closest in meaning.', options: [opt(it.ok, 1)].concat(it.bad.map((l) => opt(l, 0))), why: it.why });
  }
  function genAnt() {
    const it = draw('ant', ANTS);
    return mk({ battery: 'verbal', sub: 'Opposites', prompt: `Select the word most nearly OPPOSITE in meaning to: ${it.w}`, options: [opt(it.ok, 1)].concat(it.bad.map((l) => opt(l, 0))), why: it.why });
  }
  function genDed() {
    const it = draw('ded', DEDS);
    return mk({ battery: 'verbal', sub: 'Deductive reasoning', stimulusHTML: `<div class='dp-passage'><small>Passage</small><p>${esc(it.p)}</p></div>`, prompt: it.q, options: [opt(it.ok, 1)].concat(it.bad.map((l) => opt(l, 0))), why: it.why });
  }

  /* ---------- Numerical generators ---------- */
  function numOpts(ok, cands, f) {
    f = f || fmt;
    const w = uniq(cands.filter((n) => Number.isFinite(n) && n > 0 && n !== ok));
    for (let d = 1; w.length < 3; d++) { const c = ok + 10 * d; if (!w.includes(c)) w.push(c); }
    return [opt(f(ok), 1)].concat(w.slice(0, 3).map((n) => opt(f(n), 0)));
  }
  function genSeq() {
    const kind = rnd(3);
    let t = [], next, cands, why;
    if (kind === 0) {
      const k = pick([1, 2, 3, -1]);
      t = [2 + rnd(8)];
      for (let i = 0; i < 4; i++) t.push(2 * t[i] + k);
      next = 2 * t[4] + k;
      cands = [t[4] + (t[4] - t[3]), 2 * t[4], next + 10, next - 10];
      why = `Each term is double the one before ${k > 0 ? 'plus ' + k : 'minus ' + (-k)}, so the next is 2 × ${t[4]} ${k > 0 ? '+' : '−'} ${Math.abs(k)} = ${next}. The gaps also double each time.`;
    } else if (kind === 1) {
      const s = 1 + rnd(8), d0 = 2 + rnd(4), e = 1 + rnd(3);
      t = [s];
      for (let i = 0; i < 4; i++) t.push(t[i] + d0 + i * e);
      const nd = d0 + 4 * e;
      next = t[4] + nd;
      cands = [t[4] + nd - e, t[4] + nd + e, next + 10, next - 10];
      why = `The gaps between terms grow by ${e} each time (${[0, 1, 2, 3].map((i) => d0 + i * e).join(', ')}), so the next gap is ${nd} and the next term is ${t[4]} + ${nd} = ${next}.`;
    } else {
      const s = 4 + rnd(6), k = 1 + rnd(3);
      const t1 = 2 * s, t2 = t1 - k, t3 = 2 * t2, t4 = t3 - k;
      t = [s, t1, t2, t3, t4];
      next = 2 * t4;
      cands = [t4 - k, 2 * t4 - k, 2 * t4 + k, next + 10];
      why = `The pattern alternates: double, then subtract ${k}. The last step was subtract ${k}, so the next is to double: 2 × ${t4} = ${next}.`;
    }
    return mk({
      battery: 'numerical', sub: 'Number sequence',
      stimulusHTML: `<div class='dp-seq' role='img' aria-label='Sequence: ${t.join(', ')}, then a question mark'>${t.map((n) => `<span>${n}</span>`).join('')}<span class='dp-qm'>?</span></div>`,
      prompt: 'Find the next number in the sequence.', options: numOpts(next, cands), why: why
    });
  }
  function genTable() {
    let S1, S2, c1, c2, a1, a2, o1, o2, R1, R2;
    do {
      S1 = pick([6000, 8000, 10000, 12000, 14000, 16000]); S2 = pick([6000, 8000, 10000, 12000, 14000, 16000]);
      c1 = pick([2.5, 3, 3.5, 4, 4.5, 5]); c2 = pick([2.5, 3, 3.5, 4, 4.5, 5]);
      a1 = pick([30, 35, 40, 45, 50, 55, 60]); a2 = pick([30, 35, 40, 45, 50, 55, 60]);
      o1 = Math.round(S1 * c1 / 100); o2 = Math.round(S2 * c2 / 100);
      R1 = o1 * a1; R2 = o2 * a2;
    } while (Math.abs(R1 - R2) < 400);
    const diff = Math.abs(R1 - R2), win = R1 > R2 ? 'Alpha' : 'Beta', lose = R1 > R2 ? 'Beta' : 'Alpha';
    let big = Math.round(diff * 1.5 / 100) * 100;
    if (big === diff) big += 200;
    return mk({
      battery: 'numerical', sub: 'Commercial data interpretation',
      stimulusHTML: `<div class='dp-tablewrap'><table class='dp-table'><thead><tr><th>Channel</th><th>Sessions</th><th>Conversion</th><th>Average order</th></tr></thead><tbody><tr><td>Alpha</td><td>${fmt(S1)}</td><td>${c1}%</td><td>£${a1}</td></tr><tr><td>Beta</td><td>${fmt(S2)}</td><td>${c2}%</td><td>£${a2}</td></tr></tbody></table></div>`,
      prompt: 'What is the difference in total revenue between the two channels?',
      options: [opt(`£${fmt(diff)} more for Channel ${win}`, 1), opt(`£${fmt(diff)} more for Channel ${lose}`, 0), opt(`£${fmt(big)} more for Channel ${win}`, 0), opt('They generate identical revenue', 0)],
      why: `Alpha: ${fmt(S1)} × ${c1}% = ${fmt(o1)} orders × £${a1} = £${fmt(R1)}. Beta: ${fmt(S2)} × ${c2}% = ${fmt(o2)} orders × £${a2} = £${fmt(R2)}. Channel ${win} generates £${fmt(diff)} more.`
    });
  }
  function genDelta() {
    const S = pick([20000, 40000, 50000, 80000]), a = pick([4, 4.5, 5, 5.5, 6]), d = pick([0.5, 1]);
    const ok = Math.round(S * d / 100), b = a - d;
    return mk({
      battery: 'numerical', sub: 'Percentage change',
      prompt: `Conversion falls from ${a}% to ${b}% on ${fmt(S)} sessions. How many fewer orders is that?`,
      options: numOpts(ok, [ok * 2, ok / 2, ok * 5, ok * 10]),
      why: `The fall is ${d} percentage points. ${d}% of ${fmt(S)} sessions is ${fmt(ok)} fewer orders.`
    });
  }
  function genRate() {
    const n1 = pick([2, 3, 4, 5]), m1 = pick([10, 12, 15, 20]), r = pick([5000, 8000, 10000, 12000]);
    let n2, m2;
    do { n2 = pick([2, 3, 4, 5, 6, 8]); m2 = pick([10, 12, 15, 20, 30]); } while (n2 === n1 || m2 === m1);
    const e1 = n1 * m1 * r, ok = n2 * m2 * r;
    return mk({
      battery: 'numerical', sub: 'Rate problem',
      prompt: `A pipeline processes ${fmt(e1)} events in ${m1} minutes using ${n1} worker nodes. At the same rate per node, how many events will ${n2} nodes process in ${m2} minutes?`,
      options: numOpts(ok, [n2 * m1 * r, n1 * m2 * r, ok + r * 10, ok - r * 10]),
      why: `${fmt(e1)} ÷ ${n1} nodes ÷ ${m1} minutes = ${fmt(r)} events per node per minute. Then ${n2} × ${m2} × ${fmt(r)} = ${fmt(ok)}.`
    });
  }
  function genPercent() {
    const p = pick([10, 20, 25, 30, 40]), net = p * p / 100;
    return mk({
      battery: 'numerical', sub: 'Compound change',
      prompt: `Revenue rises ${p}% in one quarter, then falls ${p}% the next. Compared with the start, revenue is now:`,
      options: [opt(`${net}% lower`, 1), opt('Unchanged', 0), opt(`${p}% lower`, 0), opt(`${net}% higher`, 0)],
      why: `A ${p}% rise multiplies revenue by ${(1 + p / 100).toFixed(2)}, and a ${p}% fall multiplies it by ${(1 - p / 100).toFixed(2)}. The product is ${(1 - net / 100).toFixed(4).replace(/0+$/, '')}, so revenue ends ${net}% lower.`
    });
  }

  /* ---------- Abstract generators ---------- */
  function genSeries() {
    const pos0 = rnd(4), dir = pick([1, -1]), f0 = pick([true, false]), alt = pick([true, false]), up = pick([true, false]);
    const step = (i) => ({ pos: ((pos0 + dir * i) % 4 + 4) % 4, f: alt ? (i % 2 === 0 ? f0 : !f0) : f0, bars: up ? 1 + i : 5 - i });
    const s = [0, 1, 2, 3].map(step), ans = step(4);
    const key = (x) => `${x.pos}|${x.f}|${x.bars}`;
    const lab = (x) => `${POSNAME[x.pos][0].toUpperCase()}${POSNAME[x.pos].slice(1)}, ${x.f ? 'filled' : 'hollow'}, ${x.bars} ${x.bars === 1 ? 'bar' : 'bars'}`;
    const wrongs = [{ pos: (ans.pos + 2) % 4, f: ans.f, bars: ans.bars }, { pos: ans.pos, f: !ans.f, bars: ans.bars }, { pos: ans.pos, f: ans.f, bars: up ? ans.bars - 1 : ans.bars + 1 }];
    const options = [opt(lab(ans), 1, { svg: tileSVG(ans.pos, ans.f, ans.bars, 84) })].concat(wrongs.map((x) => opt(lab(x), 0, { svg: tileSVG(x.pos, x.f, x.bars, 84) })));
    return mk({
      battery: 'abstract', sub: 'Visual series', visual: true,
      stimulusHTML: `<div class='dp-series'>${s.map((x, i) => `<div>${tileSVG(x.pos, x.f, x.bars, 76)}<small>Step ${i + 1}</small></div>`).join('')}<div><div class='dp-blank'>?</div><small>Step 5</small></div></div>`,
      prompt: 'Which figure completes Step 5?', options: options,
      why: `Three rules run together. The circle moves a quarter-turn ${dir > 0 ? 'clockwise' : 'anticlockwise'} each step. Its fill ${alt ? 'alternates between filled and hollow' : 'never changes'}. The bars ${up ? 'increase' : 'decrease'} by one each step. Step 5 is therefore: ${lab(ans).toLowerCase()}.`
    });
  }
  function oddOK(tiles, odd) {
    for (let a = -1; a <= 2; a++) for (let b = -5; b <= 6; b++) {
      const fit = tiles.map((t, i) => (t.dots === a * t.sides + b ? i : -1)).filter((i) => i >= 0);
      if (fit.length === 4) return false;
      if (fit.length === 3 && fit.indexOf(odd) !== -1) return false;
    }
    return true;
  }
  function genOdd() {
    for (;;) {
      const k = pick([1, 2]), names = shuffle(Object.keys(SHAPES));
      const tiles = names.map((n) => ({ shape: n, sides: SHAPES[n].sides, dots: SHAPES[n].sides - k }));
      const odd = rnd(4), t = tiles[odd];
      const wrong = pick([1, 2, 3, 4, 5].filter((x) => x !== t.dots && (t.shape !== 'triangle' || x <= 4)));
      const shown = tiles.map((x, i) => (i === odd ? { shape: x.shape, sides: x.sides, dots: wrong } : x));
      if (!oddOK(shown, odd)) continue;
      const lab = (x) => `${x.shape[0].toUpperCase()}${x.shape.slice(1)} with ${x.dots} ${x.dots === 1 ? 'dot' : 'dots'}`;
      return mk({
        battery: 'abstract', sub: 'Odd one out', visual: true,
        prompt: 'Three of these tiles follow the same rule linking the shape to its dots. Which is the odd one out?',
        options: shown.map((x, i) => opt(lab(x), i === odd, { svg: polySVG(x.shape, x.dots, 92) })),
        why: `Three tiles have dots = number of sides − ${k}. The ${t.shape} has ${t.sides} sides, so it should have ${t.dots} ${t.dots === 1 ? 'dot' : 'dots'}, but it has ${wrong}.`
      });
    }
  }
  const GATES = {
    invert: { say: 'inverts the fill of every shape (filled becomes hollow, hollow becomes filled)', fn: (a) => a.map((x) => ({ s: x.s, f: !x.f })) },
    swap: { say: 'swaps the first and third shapes', fn: (a) => [a[2], a[1], a[0]] },
    shift: { say: 'moves the first shape to the end', fn: (a) => [a[1], a[2], a[0]] }
  };
  const words = (a) => a.map((x) => `${x.f ? 'filled' : 'hollow'} ${x.s}`).join(', ');
  const ser = (a) => a.map((x) => x.s + x.f).join('|');
  function genFlow() {
    const input = shuffle(['circle', 'square', 'triangle']).map((s) => ({ s: s, f: Math.random() < 0.5 }));
    const g = shuffle(Object.keys(GATES)).slice(0, 2);
    const s1 = GATES[g[0]].fn(input), out = GATES[g[1]].fn(s1);
    const pool = [s1, GATES[g[1]].fn(input), GATES[g[0]].fn(GATES[g[1]].fn(input)), input];
    let wrong = [], seen = [ser(out)];
    pool.forEach((p) => { if (seen.indexOf(ser(p)) === -1) { seen.push(ser(p)); wrong.push(p); } });
    while (wrong.length < 3) {
      const r = shuffle(input).map((x) => ({ s: x.s, f: Math.random() < 0.5 }));
      if (seen.indexOf(ser(r)) === -1) { seen.push(ser(r)); wrong.push(r); }
    }
    wrong = wrong.slice(0, 3);
    const mkOpt = (a, ok) => opt(words(a), ok, { svg: trioSVG(a) });
    return mk({
      battery: 'abstract', sub: 'Operator flow', visual: true,
      stimulusHTML: `<div class='dp-flow'><div class='dp-flow-in'><small>Input</small>${trioSVG(input)}</div><div class='dp-rules'><p><b>Gate Alpha</b> ${GATES[g[0]].say}.</p><p><b>Gate Beta</b> ${GATES[g[1]].say}.</p></div></div>`,
      prompt: 'Which output results after the input passes through Gate Alpha, then Gate Beta?',
      options: [mkOpt(out, 1)].concat(wrong.map((a) => mkOpt(a, 0))),
      why: `Input: ${words(input)}. After Gate Alpha: ${words(s1)}. After Gate Beta: ${words(out)}.`
    });
  }

  /* ---------- Decision-style scenarios (each option sits in exactly one quadrant) ---------- */
  const SCEN = [
    { slot: 0, t: 'A major product launch is 48 hours away. Telemetry shows a 4% checkout drop-off in a secondary browser, and user testing suggests customers are confused by a pricing tier label. Fixing either issue delays the launch by a week.', o: [
      ['Pause the launch to isolate the root cause and validate both fixes before general release.', 1, 1],
      ['Launch on schedule, gating the affected browser behind a feature flag so you can test the fix live.', 1, 0],
      ['Patch the pricing copy now, launch on time, and fix the browser issue in the first post-launch sprint.', 0, 0],
      ['Launch on time once product and commercial owners sign a written risk acceptance with a revenue trigger.', 0, 1]] },
    { slot: 0, t: 'A pricing change is due to go live on Monday. Early test data from 600 customers favours it, but the sample excludes your largest segment.', o: [
      ['Delay the change until a representative test covering the largest segment is complete and signed off.', 1, 1],
      ['Go live for the tested segments, keep the largest segment as a live holdout and review after two weeks.', 1, 0],
      ['Go live everywhere, watch revenue daily and revert quickly if it dips.', 0, 0],
      ['Go live on schedule after the commercial director signs a written risk acceptance covering the untested segment.', 0, 1]] },
    { slot: 1, t: 'In an executive review, a senior stakeholder cites a strong headline conversion metric to justify doubling spend on a channel. Your cohort analysis shows the lift comes from seasonal repeat buyers, not the channel.', o: [
      ['Raise the cohort analysis in the meeting and recommend freezing the increase until incrementality is proven.', 1, 1],
      ['Propose releasing 20% of the budget as a structured holdout test so the data settles it within fourteen days.', 1, 0],
      ['Support the spend while demand is warm, with automated daily guardrails that claw back spend if CPA slips.', 0, 0],
      ['Brief the stakeholder privately after the meeting, and agree how attribution will be reported from now on.', 0, 1]] },
    { slot: 1, t: 'A senior leader wants a one-page answer by tomorrow on why churn rose. Your analysis points to three plausible causes, and none is proven.', o: [
      ['Say the cause cannot be stated yet, and propose a formal analysis plan with agreed milestones.', 1, 1],
      ['Present the three hypotheses with confidence levels, and suggest cheap tests teams can start straight away.', 1, 0],
      ['Back the most likely cause, recommend action now, and say you will refine it as data arrives.', 0, 0],
      ['Give your best-supported recommendation, and route it through the existing churn steering group for sign-off.', 0, 1]] },
    { slot: 2, t: 'Your analytics team is handed three urgent briefs on Monday morning: a board retention forecast, a root-cause investigation into rising churn, and a new self-serve dashboard for operations.', o: [
      ['Run one intake triage scored by commercial decision value, and have sponsors trade off scope before work starts.', 1, 1],
      ['Put senior capacity on the churn root cause first, because it informs both the forecast and the tooling.', 1, 0],
      ['Ship minimum viable 80/20 outputs for the forecast and churn within 48 hours to buy time for the dashboard.', 0, 0],
      ['Agree a delivery date and a named owner for each brief with its sponsor, and review progress weekly.', 0, 1]] },
    { slot: 2, t: 'Two analysts ask to adopt a new modelling tool you have not assessed. It could cut turnaround time, but it sits outside your approved tool list.', o: [
      ['Run a structured assessment of accuracy, security and cost before anyone uses it.', 1, 1],
      ['Let them trial it on non-sensitive projects for a month and compare its outputs with the current method.', 1, 0],
      ['Let them start using it now and see how it goes.', 0, 0],
      ['Approve it now, provided they follow the usual sign-off route and a named owner accepts the risk.', 0, 1]] }
  ];
  const optTag = (e, g) => `${e ? 'Evidence-first' : 'Speed-first'} · ${g ? 'Governance-led' : 'Autonomy-led'}`;
  function genScenario(sc, n) {
    return mk({
      battery: 'style', sub: ['Deciding under uncertainty', 'Challenging a stakeholder', 'Allocating a team'][sc.slot], scored: false,
      stimulusHTML: `<div class='dp-passage'><small>Scenario ${n}</small><p>${esc(sc.t)}</p></div>`,
      prompt: 'Which response is closest to what you would actually do?',
      options: sc.o.map((o) => opt(o[0], 0, { e: o[1], g: o[2], tag: optTag(o[1], o[2]) })),
      why: 'There is no right answer. Each response sits in one quadrant: evidence-first or speed-first, and governance-led or autonomy-led.'
    });
  }

  const ARCH = {
    architect: { name: 'The Bayesian Architect', quad: 'Evidence-first · Governance-led', tag: 'You verify before committing, and you build the controls that make decisions repeatable.', up: 'You separate real signal from noise and set up governance that prevents costly false positives.', down: 'Under time pressure, waiting for clean evidence can cost you first-mover tempo.' },
    navigator: { name: 'The Systems Navigator', quad: 'Evidence-first · Autonomy-led', tag: 'You test your way to the answer, favouring live experiments over heavy process.', up: 'You turn ambiguous questions into falsifiable experiments and let teams find root causes quickly.', down: 'Stakeholders may need clearer signposts on where your autonomy ends and governance begins.' },
    verifier: { name: 'The Deliberate Controller', quad: 'Speed-first · Governance-led', tag: 'You keep momentum, with clear owners, thresholds and accountability around every bet.', up: 'You keep work moving while every decision has an owner, a trigger and a capped downside.', down: 'Post-launch controls suit reversible decisions. Irreversible choices may deserve deeper checks first.' },
    synthesiser: { name: 'The Rapid Synthesiser', quad: 'Speed-first · Autonomy-led', tag: 'You ship, learn and correct on live data rather than wait for certainty.', up: 'You unblock stalled teams and avoid analysis paralysis when directional signal is enough.', down: 'Quick fixes build analytical debt unless time is set aside to formalise the underlying model.' }
  };
  const BATT = {
    verbal: { idx: '01', name: 'Verbal & deductive logic', tip: 'Practise separating conclusions that must follow from those that only seem plausible, and widen your working vocabulary.' },
    numerical: { idx: '02', name: 'Numerical & data fluency', tip: 'Work multi-step commercial problems by hand (rates, percentage change, revenue tables), and check the gaps in any sequence early.' },
    abstract: { idx: '03', name: 'Abstract & diagrammatic', tip: 'Break each visual into single rules (position, fill, count) and trace each operator one step at a time.' },
    style: { idx: '04', name: 'Decision style', tip: '' }
  };

  function buildQuiz() {
    const q = [genPair(), genAnt(), genDed(), genSeq(), pick([genTable, genDelta])(), pick([genRate, genPercent])(), genSeries(), genOdd(), genFlow()];
    [0, 1, 2].forEach((s) => q.push(genScenario(draw('sc' + s, SCEN.filter((x) => x.slot === s)), s + 1)));
    return q.map((it, i) => { it.n = i + 1; return it; });
  }

  /* ---------- State and flow ---------- */
  const state = { mode: 'timed', name: '', quiz: [], i: 0, sel: null, order: [], res: [], timer: null, deadline: 0, t0: 0, challenger: null, sum: null };
  const show = (v) => ['dpLanding', 'dpQuiz', 'dpResults'].forEach((id) => { $(id).hidden = id !== v; });
  const toTop = () => { const h = $('dpTop'); if (h && h.scrollIntoView) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const fmtTime = (s) => (s >= 60 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`);
  const stopTimer = () => { if (state.timer) { clearInterval(state.timer); state.timer = null; } };

  function start() {
    const el = $('dpName');
    state.name = el && el.value.trim() ? el.value.trim().slice(0, 28) : '';
    state.quiz = buildQuiz(); state.i = 0; state.res = []; state.sel = null;
    show('dpQuiz'); renderQ(); toTop();
  }
  function abort() { stopTimer(); show('dpLanding'); toTop(); }

  function renderQ() {
    stopTimer();
    const q = state.quiz[state.i], b = BATT[q.battery];
    state.sel = null; state.t0 = Date.now(); state.order = shuffle(q.options);
    $('dpNotice').hidden = true;
    $('dpBattery').textContent = `${b.idx} · ${b.name}`;
    $('dpSub').textContent = q.sub;
    $('dpCount').textContent = `${state.i + 1} of ${state.quiz.length}`;
    $('dpDots').innerHTML = state.quiz.map((_, i) => `<span class='${i < state.i ? 'done' : i === state.i ? 'now' : ''}'></span>`).join('');
    $('dpStyleNote').hidden = q.scored;
    const st = $('dpStim');
    st.innerHTML = q.stimulusHTML; st.hidden = !q.stimulusHTML;
    $('dpPrompt').textContent = q.prompt;
    const box = $('dpOpts');
    box.className = 'dp-opts' + (q.visual ? ' visual' : '');
    box.innerHTML = state.order.map((o, i) => `<button type='button' role='radio' aria-checked='false' data-i='${i}' class='dp-opt'><span class='dp-letter'>${String.fromCharCode(65 + i)}</span>${q.visual ? `<span class='dp-vis'>${o.svg}</span><span class='dp-vlabel'>${esc(o.label)}</span>` : `<span class='dp-otext'>${esc(o.label)}</span>`}</button>`).join('');
    $('dpGoText').textContent = state.i === state.quiz.length - 1 ? 'See my results' : 'Confirm';
    timerSetup(q);
  }
  function timerSetup(q) {
    const wrap = $('dpClockWrap'), bar = $('dpBar'), live = $('dpLive'), clock = $('dpClock');
    live.textContent = '';
    if (state.mode === 'timed' && q.scored) {
      wrap.hidden = false; $('dpTrack').hidden = false;
      state.deadline = Date.now() + TIME * 1000;
      let warned = false;
      const tick = () => {
        const rem = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
        clock.textContent = `0:${String(rem).padStart(2, '0')}`;
        bar.style.width = `${rem / TIME * 100}%`;
        bar.className = rem <= 10 ? 'low' : '';
        if (rem <= 10 && !warned) { warned = true; live.textContent = '10 seconds left'; }
        if (rem <= 0) { stopTimer(); record(true); }
      };
      tick(); state.timer = setInterval(tick, 250);
    } else {
      wrap.hidden = true; $('dpTrack').hidden = true;
    }
  }
  function record(timedOut) {
    const q = state.quiz[state.i];
    const o = state.sel;
    state.res.push({ o: o, ok: q.scored ? !!(o && o.ok) : null, sec: timedOut ? TIME : Math.max(1, Math.round((Date.now() - state.t0) / 1000)), out: !!(timedOut && !o) });
    if (state.i < state.quiz.length - 1) { state.i++; renderQ(); toTop(); } else { finish(); }
  }
  function confirmQ() {
    if (!state.sel) { const n = $('dpNotice'); n.textContent = 'Choose an answer to continue.'; n.hidden = false; return; }
    stopTimer(); record(false);
  }

  /* ---------- Scoring ---------- */
  const FR = [0.1, 0.37, 0.63, 0.9];
  function summarise() {
    const sc = { verbal: 0, numerical: 0, abstract: 0 };
    let sec = 0, ev = 0, gv = 0;
    state.quiz.forEach((q, i) => {
      const r = state.res[i];
      if (q.scored) { sec += r.sec; if (r.ok) sc[q.battery]++; }
      else if (r.o) { ev += r.o.e; gv += r.o.g; }
    });
    const code = ev >= 2 ? (gv >= 2 ? 'architect' : 'navigator') : (gv >= 2 ? 'verifier' : 'synthesiser');
    return { name: state.name, mode: state.mode, verbal: sc.verbal, numerical: sc.numerical, abstract: sc.abstract, total: sc.verbal + sc.numerical + sc.abstract, sec: sec, ev: ev, gv: gv, code: code, arch: ARCH[code] };
  }
  const modeWord = (m) => (m === 'timed' ? 'timed' : 'untimed');

  function mapSVG(s) {
    const on = s.code;
    const cell = (code, x, y, l1, l2) => `<rect x='${x}' y='${y}' width='96' height='96' rx='14' class='${on === code ? 'on' : ''}'/><text x='${x + 48}' y='${y + 44}' text-anchor='middle' class='${on === code ? 'on' : ''}'>${l1}</text><text x='${x + 48}' y='${y + 60}' text-anchor='middle' class='${on === code ? 'on' : ''}'>${l2}</text>`;
    const px = 8 + (1 - FR[s.ev]) * 184, py = 8 + (1 - FR[s.gv]) * 184;
    return `<svg viewBox='0 0 208 232' role='img' aria-label='Decision style map. You are in the ${esc(s.arch.quad)} quadrant.'><g transform='translate(0,18)'>${cell('architect', 4, 4, 'Evidence', 'Governance')}${cell('verifier', 108, 4, 'Speed', 'Governance')}${cell('navigator', 4, 108, 'Evidence', 'Autonomy')}${cell('synthesiser', 108, 108, 'Speed', 'Autonomy')}<circle cx='${px + 4}' cy='${py + 4}' r='8' class='pt'/></g><text x='104' y='12' text-anchor='middle' class='ax'>GOVERNANCE</text><text x='104' y='228' text-anchor='middle' class='ax'>AUTONOMY</text></svg>`;
  }

  function finish() {
    const s = summarise(); state.sum = s; show('dpResults');
    $('rScore').textContent = String(s.total);
    $('rTime').textContent = `${modeWord(s.mode)[0].toUpperCase()}${modeWord(s.mode).slice(1)} · reasoning items took ${fmtTime(s.sec)}`;
    const groups = ['verbal', 'numerical', 'abstract'];
    $('rPips').innerHTML = groups.map((g) => `<span class='grp'>${state.quiz.map((q, i) => (q.battery === g ? `<i class='${state.res[i].ok ? 'ok' : 'no'}'></i>` : '')).join('')}</span>`).join('');
    $('rRows').innerHTML = groups.map((g) => `<li><span>${BATT[g].name}</span><b>${s[g]} / 3</b></li>`).join('');
    $('rStyle').textContent = s.arch.name;
    $('rQuad').textContent = s.arch.quad;
    $('rTag').textContent = s.arch.tag;
    $('rMap').innerHTML = mapSVG(s);
    $('rPicks').innerHTML = `<li>Evidence-first in <b>${s.ev} of 3</b> scenarios</li><li>Governance-led in <b>${s.gv} of 3</b> scenarios</li>`;
    s.url = challengeUrl(s);
    s.share = `Reasoning score: ${s.total}/9 (${modeWord(s.mode)}). Decision style: ${s.arch.name} (${s.arch.quad}). Can you beat my score? ${s.url}`;
    $('dpShare').value = s.share;
    compare(s); plan(s); review(); toTop();
  }

  function compare(s) {
    const el = $('dpCompare'), c = state.challenger;
    if (!c) { el.hidden = true; return; }
    const d = s.total - c.total;
    const line1 = d > 0 ? `You beat ${c.user} by ${d} ${d > 1 ? 'points' : 'point'}.` : d === 0 ? `You matched ${c.user} on ${c.total}/9.` : `${c.user} leads by ${-d} ${d < -1 ? 'points' : 'point'}.`;
    const mm = c.mode && c.mode !== s.mode ? ` ${c.user} took it ${modeWord(c.mode)} and you took it ${modeWord(s.mode)}, so treat this loosely.` : '';
    const same = c.code === s.code;
    el.innerHTML = `<p class='dp-lab'>Head to head</p><h3>${esc(line1)}</h3><p>Reasoning score: you ${s.total}/9, ${esc(c.user)} ${c.total}/9.${esc(mm)}</p><p>Decision style: ${same ? 'you share the same style, ' + esc(s.arch.name) + '.' : 'you are ' + esc(s.arch.name) + ' and ' + esc(c.user) + ' is ' + esc(ARCH[c.code].name) + '. Styles are not ranked.'}</p><p class='fine'>Challenge links are self-reported and can be edited by anyone.</p>`;
    el.hidden = false;
  }
  function plan(s) {
    const rows = ['verbal', 'numerical', 'abstract'].map((k) => ({ k: k, n: s[k] })).sort((a, b) => a.n - b.n);
    let h;
    if (s.total === 9) h = `<p><b>All nine correct.</b> ${s.mode === 'timed' ? 'Try to hold that while finishing faster.' : 'Retake it timed to see how the score holds under a clock.'}</p>`;
    else if (rows[0].n === rows[2].n) h = `<p><b>An even spread.</b> No single weak area. The review below shows which items cost you points.</p>`;
    else h = `<p><b>Weakest area: ${esc(BATT[rows[0].k].name)} (${rows[0].n}/3).</b> ${esc(BATT[rows[0].k].tip)}</p>`;
    h += `<p><b>Where your style helps.</b> ${esc(s.arch.up)}</p><p><b>Where it can mislead.</b> ${esc(s.arch.down)}</p>`;
    $('dpPlan').innerHTML = h;
  }
  function review() {
    $('dpReview').innerHTML = state.quiz.map((q, i) => {
      const r = state.res[i], right = q.options.filter((o) => o.ok)[0];
      let tag, body;
      if (q.scored) {
        tag = r.ok ? ['ok', 'Correct'] : r.out ? ['no', 'No answer'] : ['no', 'Incorrect'];
        body = `<p><b>Your answer:</b> ${r.o ? esc(r.o.label) : 'None (time ran out)'}</p><p><b>Correct answer:</b> ${esc(right.label)}</p>`;
      } else {
        tag = ['st', 'Style'];
        body = `<p><b>Your choice:</b> ${r.o ? esc(r.o.label) : 'None'}</p>${r.o ? `<p><b>Quadrant:</b> ${esc(r.o.tag)}</p>` : ''}`;
      }
      return `<details class='dp-item'><summary><span class='n'>${String(q.n).padStart(2, '0')}</span><span class='t'>${esc(q.sub)}</span><span class='s ${tag[0]}'>${tag[1]}</span></summary><div class='b'><p class='q'>${esc(q.prompt)}</p>${body}<p>${esc(q.why)}</p></div></details>`;
    }).join('');
  }

  /* ---------- Challenge links ---------- */
  function challengeUrl(s) {
    const p = new URLSearchParams();
    p.set('v', s.verbal); p.set('n', s.numerical); p.set('a', s.abstract);
    p.set('q', s.code); p.set('t', s.sec); p.set('m', s.mode === 'timed' ? 't' : 'u');
    if (s.name) p.set('u', s.name);
    return window.location.origin + window.location.pathname + '?' + p.toString();
  }
  function readChallenge() {
    const p = new URLSearchParams(window.location.search);
    if (!(p.has('v') && p.has('n') && p.has('a'))) return;
    const cl = (x, lo, hi) => { const n = parseInt(x, 10); return isNaN(n) ? lo : Math.min(hi, Math.max(lo, n)); };
    const code = p.get('q') || p.get('s');
    const c = { user: (p.get('u') || 'A colleague').slice(0, 28), total: cl(p.get('v'), 0, 3) + cl(p.get('n'), 0, 3) + cl(p.get('a'), 0, 3), code: ARCH[code] ? code : 'architect', mode: p.get('m') === 't' ? 'timed' : p.get('m') === 'u' ? 'untimed' : '' };
    state.challenger = c;
    const el = $('dpBannerText');
    el.textContent = '';
    const b = document.createElement('strong'); b.textContent = c.user;
    el.appendChild(b);
    el.appendChild(document.createTextNode(` scored ${c.total}/9${c.mode ? ' (' + c.mode + ')' : ''}. Their decision style is ${ARCH[c.code].name}. Take it and compare.`));
    $('dpBanner').hidden = false;
  }

  /* ---------- Sharing ---------- */
  function copyShare() {
    const s = state.sum; if (!s) return;
    const ta = $('dpShare'), toast = $('dpToast');
    const done = () => { toast.hidden = false; setTimeout(() => { toast.hidden = true; }, 3000); };
    const old = () => { ta.select(); try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s.share).then(done, old); else old();
  }
  const openWin = (u) => window.open(u, '_blank', 'noopener,noreferrer');
  const shareLI = () => { if (state.sum) openWin('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(state.sum.url)); };
  const shareX = () => { const s = state.sum; if (s) openWin('https://twitter.com/intent/tweet?text=' + encodeURIComponent(`Reasoning score ${s.total}/9. Decision style: ${s.arch.name}. Can you beat it?`) + '&url=' + encodeURIComponent(s.url)); };

  function wrapText(ctx, text, x, y, w, lh) {
    let line = '';
    text.split(' ').forEach((word) => {
      const t = line ? line + ' ' + word : word;
      if (ctx.measureText(t).width > w && line) { ctx.fillText(line, x, y); line = word; y += lh; } else line = t;
    });
    if (line) ctx.fillText(line, x, y);
  }
  function png() {
    const s = state.sum; if (!s) return;
    const go = () => {
      const c = $('dpCanvas'), x = c.getContext('2d'), F = 'Switzer, system-ui, -apple-system, Segoe UI, sans-serif';
      const rr = (a, b, w, h, r, f) => { x.fillStyle = f; x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); x.fill(); };
      x.clearRect(0, 0, 1200, 630); x.fillStyle = '#1c2240'; x.fillRect(0, 0, 1200, 630);
      x.textBaseline = 'alphabetic'; x.textAlign = 'left';
      x.fillStyle = '#f49ab8'; x.font = '600 22px ' + F; x.fillText('PHILPEGRAM.COM / REASONING & DECISION-STYLE DIAGNOSTIC', 56, 64);
      x.fillStyle = '#bbc0d0'; x.font = '500 22px ' + F; x.fillText(`${s.name || 'Anonymous'} · ${new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} · ${modeWord(s.mode)}`, 56, 98);
      rr(56, 130, 500, 410, 28, '#151a32');
      x.fillStyle = '#bbc0d0'; x.font = '600 18px ' + F; x.fillText('1 · REASONING SCORE', 88, 178);
      x.fillStyle = '#f49ab8'; x.font = '700 150px ' + F; x.fillText(String(s.total), 88, 330);
      const w = x.measureText(String(s.total)).width;
      x.fillStyle = '#bbc0d0'; x.font = '500 48px ' + F; x.fillText('/ 9', 88 + w + 14, 330);
      x.font = '500 20px ' + F; x.fillText(`Reasoning items took ${fmtTime(s.sec)}`, 88, 366);
      [['Verbal & deductive', s.verbal], ['Numerical & data', s.numerical], ['Abstract & diagrammatic', s.abstract]].forEach((r, i) => {
        const y = 420 + i * 40;
        x.fillStyle = '#f7f4ec'; x.font = '500 19px ' + F; x.fillText(r[0], 88, y);
        rr(300, y - 15, 150, 12, 6, 'rgba(255,255,255,0.12)'); rr(300, y - 15, 150 * r[1] / 3, 12, 6, '#f49ab8');
        x.fillStyle = '#f7f4ec'; x.font = '600 19px ' + F; x.fillText(`${r[1]}/3`, 468, y);
      });
      rr(600, 130, 544, 410, 28, '#151a32');
      x.fillStyle = '#bbc0d0'; x.font = '600 18px ' + F; x.fillText('2 · DECISION STYLE (NOT SCORED)', 632, 178);
      x.fillStyle = '#f7f4ec'; x.font = '700 38px ' + F; x.fillText(s.arch.name, 632, 232);
      x.fillStyle = '#f49ab8'; x.font = '600 20px ' + F; x.fillText(s.arch.quad, 632, 266);
      x.fillStyle = '#bbc0d0'; x.font = '400 20px ' + F; wrapText(x, s.arch.tag, 632, 304, 270, 28);
      const q = { architect: [0, 0], verifier: [1, 0], navigator: [0, 1], synthesiser: [1, 1] };
      Object.keys(q).forEach((k) => { rr(930 + q[k][0] * 98, 190 + q[k][1] * 98, 92, 92, 14, k === s.code ? '#f49ab8' : '#262d52'); });
      const px = 930 + (1 - FR[s.ev]) * 190 + 3, py = 190 + (1 - FR[s.gv]) * 190 + 3;
      x.fillStyle = '#f7f4ec'; x.beginPath(); x.arc(px, py, 9, 0, 7); x.fill();
      x.fillStyle = '#bbc0d0'; x.font = '500 15px ' + F; x.textAlign = 'center';
      x.fillText('GOVERNANCE', 1027, 180); x.fillText('AUTONOMY', 1027, 402);
      x.textAlign = 'left'; x.fillText('EVIDENCE', 930, 424); x.textAlign = 'right'; x.fillText('SPEED', 1124, 424);
      x.textAlign = 'left'; x.fillStyle = '#f7f4ec'; x.font = '500 20px ' + F;
      x.fillText(`Evidence-first in ${s.ev} of 3 · Governance-led in ${s.gv} of 3`, 632, 480);
      x.fillStyle = '#bbc0d0'; x.font = '400 18px ' + F; x.fillText('No quadrant is better than another.', 632, 510);
      x.fillStyle = '#f7f4ec'; x.font = '600 24px ' + F; x.fillText('philpegram.com/decision-profile', 56, 588);
      c.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = 'decision-profile-scorecard.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }, 'image/png');
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go, go); else go();
  }

  /* ---------- Wiring ---------- */
  function setMode(m) {
    state.mode = m;
    [['timed', 'dpModeTimed'], ['untimed', 'dpModeUntimed']].forEach((x) => { const b = $(x[1]); b.classList.toggle('on', x[0] === m); b.setAttribute('aria-checked', x[0] === m ? 'true' : 'false'); });
    $('dpModeHint').textContent = m === 'timed' ? '45 seconds per reasoning question. The three scenarios are never timed.' : 'No clock. Take as long as you like.';
  }
  document.addEventListener('DOMContentLoaded', () => {
    $('dpModeTimed').addEventListener('click', () => setMode('timed'));
    $('dpModeUntimed').addEventListener('click', () => setMode('untimed'));
    $('dpStart').addEventListener('click', start);
    $('dpRestart').addEventListener('click', abort);
    $('dpGo').addEventListener('click', confirmQ);
    $('dpRetake').addEventListener('click', abort);
    $('dpOpen').addEventListener('click', () => document.querySelectorAll('#dpReview details').forEach((d) => { d.open = true; }));
    $('dpShut').addEventListener('click', () => document.querySelectorAll('#dpReview details').forEach((d) => { d.open = false; }));
    ['dpCopy', 'dpCopy2'].forEach((id) => $(id).addEventListener('click', copyShare));
    ['dpPng', 'dpPng2'].forEach((id) => $(id).addEventListener('click', png));
    $('dpLI').addEventListener('click', shareLI);
    $('dpX').addEventListener('click', shareX);
    $('dpAccept').addEventListener('click', () => $('dpStartCard').scrollIntoView({ behavior: 'smooth' }));
    $('dpClose').addEventListener('click', () => { $('dpBanner').hidden = true; });
    $('dpOpts').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-i]');
      if (!btn) return;
      state.sel = state.order[+btn.getAttribute('data-i')];
      $('dpOpts').querySelectorAll('button').forEach((b) => { const on = b === btn; b.classList.toggle('sel', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
      $('dpNotice').hidden = true;
    });
    readChallenge();
  });
  if (typeof window.__dpTest === 'function') window.__dpTest({ buildQuiz: buildQuiz, summarise: summarise, state: state, gens: { genPair, genAnt, genDed, genSeq, genTable, genDelta, genRate, genPercent, genSeries, genOdd, genFlow }, SCEN: SCEN });
})();
