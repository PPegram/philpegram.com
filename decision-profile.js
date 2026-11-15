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

  /* ---------- Legacy verbal bank ---------- */
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
    { w: 'EXTRAVAGANT', ok: 'Economical', bad: ['Lavish', 'Austere', 'Flamboyant'], why: '"Extravagant" means spending freely; "economical" means careful with money. "Lavish" is a near-synonym.' },
    { w: 'AMBIGUOUS', ok: 'Unequivocal', bad: ['Vague', 'Nuanced', 'Tentative'], why: '"Ambiguous" means open to more than one reading; "unequivocal" means having only one possible meaning. "Vague" is close to ambiguous, not opposite.' },
    { w: 'TRANSIENT', ok: 'Permanent', bad: ['Fleeting', 'Gradual', 'Erratic'], why: '"Transient" means lasting only a short time; "permanent" is its opposite. "Fleeting" is a near-synonym.' },
    { w: 'FORTHRIGHT', ok: 'Evasive', bad: ['Frank', 'Blunt', 'Informal'], why: '"Forthright" means direct and honest; "evasive" means avoiding a direct answer. "Frank" and "blunt" point the same way as forthright.' },
    { w: 'SCANT', ok: 'Ample', bad: ['Slight', 'Modest', 'Sparing'], why: '"Scant" means barely enough; "ample" means more than enough. "Slight" points the same way as scant.' }
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

  /* ---------- Legacy numerical generators ---------- */
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

  /* ---------- Legacy abstract generators ---------- */
  function genSeries() {
    const pos0 = rnd(4), dir = pick([1, -1]), f0 = pick([true, false]), alt = pick([true, false]), up = pick([true, false]);
    const step = (i) => ({ pos: ((pos0 + dir * i) % 4 + 4) % 4, f: alt ? (i % 2 === 0 ? f0 : !f0) : f0, bars: up ? 1 + i : 5 - i });
    const s = [0, 1, 2, 3].map(step), ans = step(4);
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

  /* ---------- Archetypes ---------- */
  const ARCH = {
    architect: { name: 'The Bayesian Architect', quad: 'Evidence-first · Governance-led', e: 1, g: 1, tag: 'You verify before committing, and you build the controls that make decisions repeatable.', up: 'You separate real signal from noise, and your decisions survive scrutiny.', down: 'Watch the cost of delay. Ask what a wrong answer costs against a late one, and set a deadline for certainty.' },
    experimenter: { name: 'The Field Experimenter', quad: 'Evidence-first · Autonomy-led', e: 1, g: 0, tag: 'You want proof, but you would rather generate it quickly through small live tests than wait for sign-off.', up: 'You turn disagreements into tests, and you learn faster than committees do.', down: 'Tests without owners drift. Agree who decides, and what result would change their mind, before you start.' },
    operator: { name: 'The Fast Operator', quad: 'Speed-first · Autonomy-led', e: 0, g: 0, tag: 'You act on the best read available, keep options open and correct course as you go.', up: 'You keep momentum when others stall, and you are comfortable owning the call.', down: 'Speed hides unrecorded assumptions. Write down the one fact that would make you reverse, and check it on a date.' },
    steward: { name: 'The Accountable Steward', quad: 'Speed-first · Governance-led', e: 0, g: 1, tag: 'You move quickly, and you make sure someone named has accepted the risk.', up: 'You get decisions made and keep them traceable, so nobody is surprised later.', down: 'Sign-off can stand in for evidence. Ask what the signatory actually saw before they accepted the risk.' }
  };
  const archOf = (e, g) => (e >= 2 ? (g >= 2 ? 'architect' : 'experimenter') : (g >= 2 ? 'steward' : 'operator'));
  const BAT = { verbal: 'Verbal', numerical: 'Numerical', abstract: 'Abstract', style: 'Decision style' };
  const LEGACY = { verbal: [genPair, genAnt, genDed], numerical: [genSeq, genTable, genDelta, genRate, genPercent], abstract: [genSeries, genOdd, genFlow] };
  const TIPS = {
    verbal: 'Verbal: under the clock, restate the passage in your own words before you read the options, and treat "cannot say" as a real answer.',
    numerical: 'Numerical: write the quantity you need before you calculate, and sanity-check the answer against the size of the inputs.',
    abstract: 'Abstract: name each rule on its own (position, fill, count) and test options against one rule at a time.'
  };

  function gensFor(b) {
    const extra = (window.DPBankExtra && window.DPBankExtra[b]) || [];
    return LEGACY[b].concat(extra);
  }
  function buildSet() {
    const qs = [];
    ['verbal', 'numerical', 'abstract'].forEach((b) => {
      shuffle(gensFor(b)).slice(0, 3).forEach((f) => qs.push(f()));
    });
    [0, 1, 2].forEach((slot) => qs.push(genScenario(draw('scen' + slot, SCEN.filter((s) => s.slot === slot)), slot + 1)));
    qs.forEach((q) => { if (!q.keepOrder) q.options = shuffle(q.options); });
    return qs;
  }

  /* ---------- State ---------- */
  let S = null;
  const LET4 = ['A', 'B', 'C', 'D', 'E'];
  const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  const show = (id, on) => { $(id).hidden = !on; };

  function start() {
    S = { mode: $('dpModeTimed').getAttribute('aria-checked') === 'true' ? 'timed' : 'untimed', name: $('dpName').value.trim().slice(0, 28), qs: buildSet(), i: 0, ans: [], sel: -1, left: TIME, t0: 0, took: 0, timer: null };
    show('dpLanding', false); show('dpResults', false); show('dpQuiz', true);
    S.t0 = Date.now();
    render();
    window.scrollTo({ top: $('dpTop').offsetTop, behavior: 'smooth' });
  }

  function render() {
    const q = S.qs[S.i], n = S.qs.length, timed = S.mode === 'timed' && q.scored;
    S.sel = -1;
    $('dpBattery').textContent = BAT[q.battery];
    $('dpSub').textContent = q.sub;
    $('dpCount').textContent = `${S.i + 1} / ${n}`;
    $('dpDots').innerHTML = S.qs.map((x, i) => `<span class='${i < S.i ? 'done' : i === S.i ? 'now' : ''}'></span>`).join('');
    show('dpStyleNote', !q.scored && S.i === 9);
    $('dpStim').innerHTML = q.stimulusHTML; show('dpStim', !!q.stimulusHTML);
    $('dpPrompt').textContent = q.prompt;
    const vis = q.options.some((o) => o.svg);
    $('dpOpts').className = 'dp-opts' + (vis ? ' visual' : '');
    $('dpOpts').innerHTML = q.options.map((o, i) => `<button type='button' class='dp-opt' role='radio' aria-checked='false' data-i='${i}'><span class='dp-letter' aria-hidden='true'>${LET4[i]}</span>${o.svg ? `<span class='dp-vis'>${o.svg}</span><span class='dp-vlabel'>${esc(o.label)}</span>` : `<span>${esc(o.label)}</span>`}</button>`).join('');
    $('dpGoText').textContent = S.i === n - 1 ? 'See results' : 'Confirm';
    show('dpNotice', false);
    $('dpClockWrap').hidden = !timed; $('dpTrack').hidden = !timed;
    clearInterval(S.timer);
    if (timed) {
      S.left = TIME; tick();
      const end = Date.now() + TIME * 1000;
      S.timer = setInterval(() => { S.left = Math.max(0, (end - Date.now()) / 1000); tick(); if (S.left <= 0) { clearInterval(S.timer); commit(true); } }, 200);
    }
    $('dpLive').textContent = `Question ${S.i + 1} of ${n}. ${q.prompt}`;
  }
  function tick() {
    $('dpClock').textContent = fmtT(Math.ceil(S.left));
    $('dpBar').style.width = (S.left / TIME * 100) + '%';
    $('dpBar').classList.toggle('low', S.left <= 10);
  }
  function choose(i) {
    S.sel = i;
    Array.prototype.forEach.call($('dpOpts').children, (b, k) => { b.classList.toggle('sel', k === i); b.setAttribute('aria-checked', k === i ? 'true' : 'false'); });
    show('dpNotice', false);
  }
  function commit(timedOut) {
    const q = S.qs[S.i];
    if (S.sel < 0 && !timedOut) { $('dpNotice').textContent = 'Pick an answer first.'; show('dpNotice', true); return; }
    clearInterval(S.timer);
    S.ans.push({ sel: timedOut && S.sel < 0 ? -1 : S.sel, out: !!timedOut && S.sel < 0 });
    if (S.i < S.qs.length - 1) { S.i++; render(); } else { S.took = (Date.now() - S.t0) / 1000; finish(); }
  }

  /* ---------- Results ---------- */
  function finish() {
    show('dpQuiz', false); show('dpResults', true);
    const per = { verbal: 0, numerical: 0, abstract: 0 }; let score = 0, e = 0, g = 0;
    S.qs.forEach((q, i) => {
      const a = S.ans[i], o = a.sel >= 0 ? q.options[a.sel] : null;
      if (q.scored) { if (o && o.ok) { score++; per[q.battery]++; } } else if (o) { e += o.e; g += o.g; }
    });
    const key = archOf(e, g), A = ARCH[key];
    S.result = { score: score, per: per, key: key, e: e, g: g };
    $('rScore').textContent = score;
    $('rTime').textContent = S.mode === 'timed' ? `Timed mode. Total time ${fmtT(S.took)}.` : `Untimed mode. Total time ${fmtT(S.took)}.`;
    $('rPips').innerHTML = ['verbal', 'numerical', 'abstract'].map((b) => `<span class='grp'>${[0, 1, 2].map((k) => `<i class='${k < per[b] ? 'ok' : ''}'></i>`).join('')}</span>`).join('');
    $('rRows').innerHTML = ['verbal', 'numerical', 'abstract'].map((b) => `<li><span>${BAT[b]}</span><b>${per[b]} / 3</b></li>`).join('');
    $('rStyle').textContent = A.name; $('rQuad').textContent = A.quad; $('rTag').textContent = A.tag;
    $('rMap').innerHTML = mapSVG(e, g, key);
    $('rPicks').innerHTML = S.qs.filter((q) => !q.scored).map((q, i) => { const a = S.ans[9 + i]; return `<li>Scenario ${i + 1}: <b>${esc(q.options[a.sel].tag)}</b></li>`; }).join('');
    const weakest = ['verbal', 'numerical', 'abstract'].sort((a, b) => per[a] - per[b])[0];
    $('dpPlan').innerHTML = `<p><b>Reasoning.</b> ${score >= 7 ? 'A strong practice score.' : score >= 4 ? 'A solid base with room to move.' : 'A tough set, and the explanations below are the useful part.'} ${per[weakest] < 3 ? TIPS[weakest] : 'You dropped nothing in any battery, so try the timed mode if you have not.'}</p><p><b>Decision style.</b> ${esc(A.up)} ${esc(A.down)}</p><p>This is a practice tool, not a normed test. Treat a single attempt as a prompt for reflection.</p>`;
    buildReview();
    const url = challengeURL();
    $('dpShare').value = shareText(url);
    renderCompare();
    window.scrollTo({ top: $('dpTop').offsetTop, behavior: 'smooth' });
  }
  function mapSVG(e, g, key) {
    const q = { experimenter: [10, 10], architect: [150, 10], operator: [10, 115], steward: [150, 115] };
    const label = { experimenter: ['Evidence-first', 'Autonomy-led'], architect: ['Evidence-first', 'Governance-led'], operator: ['Speed-first', 'Autonomy-led'], steward: ['Speed-first', 'Governance-led'] };
    const rects = Object.keys(q).map((k) => `<rect x='${q[k][0]}' y='${q[k][1]}' width='130' height='95' rx='14' class='${k === key ? 'on' : ''}'/><text x='${q[k][0] + 65}' y='${q[k][1] + 44}' text-anchor='middle' class='${k === key ? 'on' : ''}'>${label[k][0]}</text><text x='${q[k][0] + 65}' y='${q[k][1] + 60}' text-anchor='middle' class='${k === key ? 'on' : ''}'>${label[k][1]}</text>`).join('');
    const cx = 30 + (g / 3) * 220, cy = 195 - (e / 3) * 160;
    return `<svg viewBox='0 0 290 220' role='img' aria-label='Decision style map. Evidence score ${e} of 3, governance score ${g} of 3.'>${rects}<circle class='pt' cx='${cx}' cy='${cy}' r='9'/></svg>`;
  }
  function buildReview() {
    $('dpReview').innerHTML = S.qs.map((q, i) => {
      const a = S.ans[i], chosen = a.sel >= 0 ? q.options[a.sel] : null, right = q.options.find((o) => o.ok);
      let st = '<span class="s">Style</span>';
      if (q.scored) st = a.out ? '<span class="s no">Timed out</span>' : (chosen && chosen.ok ? '<span class="s ok">Correct</span>' : '<span class="s no">Missed</span>');
      const you = chosen ? esc(chosen.label) + (chosen.tag ? ` <i>(${esc(chosen.tag)})</i>` : '') : 'No answer';
      return `<details class='dp-item'><summary><span class='n'>${i + 1}</span><span class='t'>${esc(BAT[q.battery])} · ${esc(q.sub)}</span>${st}</summary><div class='b'><p class='q'>${esc(q.prompt)}</p><p><b>Your answer:</b> ${you}</p>${q.scored ? `<p><b>Correct answer:</b> ${esc(right.label)}</p>` : ''}<p>${esc(q.why)}</p></div></details>`;
    }).join('');
  }

  /* ---------- Share, challenge links, scorecard ---------- */
  function challengeURL() {
    const p = new URLSearchParams({ s: S.result.score, a: S.result.key });
    if (S.name) p.set('n', S.name);
    return `${location.origin}${location.pathname}?${p.toString()}`;
  }
  function shareText(url) {
    const A = ARCH[S.result.key];
    return `I scored ${S.result.score}/9 on Phil Pegram's reasoning diagnostic, and my decision style is ${A.name}. Think you can beat it?\n${url}`;
  }
  function renderCompare() {
    const p = new URLSearchParams(location.search), s = parseInt(p.get('s'), 10), a = p.get('a');
    if (!(s >= 0 && s <= 9) || !ARCH[a]) { show('dpCompare', false); return; }
    const who = (p.get('n') || 'Your challenger').slice(0, 28), d = S.result.score - s;
    $('dpCompare').innerHTML = `<h3>${esc(who)} scored ${s}/9</h3><p>You scored ${S.result.score}/9. ${d > 0 ? `You are ${d} ahead.` : d < 0 ? `They are ${-d} ahead.` : 'It is a tie.'}</p><p>${esc(who)}'s style: ${esc(ARCH[a].name)}. Yours: ${esc(ARCH[S.result.key].name)}. Neither is better.</p>`;
    show('dpCompare', true);
  }
  function toast(msg) { const t = $('dpToast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, 2500); }
  function copyText(txt, msg) {
    const done = () => toast(msg);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, () => { $('dpShare').select(); document.execCommand('copy'); done(); });
    else { $('dpShare').select(); document.execCommand('copy'); done(); }
  }
  function openShare(base) { window.open(base, '_blank', 'noopener'); }
  function drawCard() {
    const c = $('dpCanvas'), x = c.getContext('2d'), A = ARCH[S.result.key];
    x.fillStyle = '#1c2240'; x.fillRect(0, 0, 1200, 630);
    x.fillStyle = '#f49ab8'; x.font = '600 30px system-ui, sans-serif'; x.fillText('Reasoning & Decision-Style Diagnostic', 70, 90);
    x.fillStyle = '#f7f4ec'; x.font = '600 34px system-ui, sans-serif'; x.fillText(S.name || 'My scorecard', 70, 150);
    x.fillStyle = '#f49ab8'; x.font = '700 240px system-ui, sans-serif'; x.fillText(String(S.result.score), 70, 390);
    x.fillStyle = '#a9aecb'; x.font = '500 70px system-ui, sans-serif'; x.fillText('/ 9', S.result.score > 9 ? 330 : 200, 390);
    x.fillStyle = '#f7f4ec'; x.font = '600 28px system-ui, sans-serif';
    ['verbal', 'numerical', 'abstract'].forEach((b, i) => x.fillText(`${BAT[b]}  ${S.result.per[b]}/3`, 70 + i * 230, 450));
    x.font = '700 46px system-ui, sans-serif'; x.fillText(A.name, 70, 540);
    x.fillStyle = '#a9aecb'; x.font = '500 26px system-ui, sans-serif'; x.fillText(A.quad + '   ·   philpegram.com/decision-profile', 70, 585);
  }
  function download() {
    drawCard();
    $('dpCanvas').toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'reasoning-scorecard.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
  }

  /* ---------- Wiring ---------- */
  function setMode(timed) {
    $('dpModeTimed').classList.toggle('on', timed); $('dpModeUntimed').classList.toggle('on', !timed);
    $('dpModeTimed').setAttribute('aria-checked', timed); $('dpModeUntimed').setAttribute('aria-checked', !timed);
    $('dpModeHint').textContent = timed ? `${TIME} seconds per reasoning question. The three scenarios are never timed. Allow about seven minutes.` : 'No clock. Take as long as you need. The three scenarios are never timed.';
  }
  function init() {
    $('dpModeTimed').addEventListener('click', () => setMode(true));
    $('dpModeUntimed').addEventListener('click', () => setMode(false));
    $('dpStart').addEventListener('click', start);
    $('dpOpts').addEventListener('click', (ev) => { const b = ev.target.closest('.dp-opt'); if (b) choose(+b.dataset.i); });
    $('dpGo').addEventListener('click', () => commit(false));
    $('dpRestart').addEventListener('click', () => { clearInterval(S && S.timer); show('dpQuiz', false); show('dpLanding', true); });
    $('dpRetake').addEventListener('click', () => { show('dpResults', false); show('dpLanding', true); window.scrollTo({ top: $('dpTop').offsetTop, behavior: 'smooth' }); });
    $('dpCopy').addEventListener('click', () => copyText(challengeURL(), 'Challenge link copied.'));
    $('dpCopy2').addEventListener('click', () => copyText($('dpShare').value, 'Copied to clipboard.'));
    $('dpLI').addEventListener('click', () => openShare('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(challengeURL())));
    $('dpX').addEventListener('click', () => openShare('https://twitter.com/intent/tweet?text=' + encodeURIComponent($('dpShare').value)));
    $('dpPng').addEventListener('click', download); $('dpPng2').addEventListener('click', download);
    $('dpOpen').addEventListener('click', () => $('dpReview').querySelectorAll('details').forEach((d) => { d.open = true; }));
    $('dpShut').addEventListener('click', () => $('dpReview').querySelectorAll('details').forEach((d) => { d.open = false; }));
    $('dpAccept').addEventListener('click', () => show('dpBanner', false)); $('dpClose').addEventListener('click', () => show('dpBanner', false));
    document.addEventListener('keydown', (ev) => {
      if ($('dpQuiz').hidden || !S) return;
      if (ev.target && /INPUT|TEXTAREA/.test(ev.target.tagName)) return;
      const q = S.qs[S.i], k = parseInt(ev.key, 10);
      if (k >= 1 && k <= q.options.length) choose(k - 1);
      else if (ev.key === 'Enter' && !(ev.target && ev.target.tagName === 'BUTTON')) commit(false);
    });
    setMode(true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
