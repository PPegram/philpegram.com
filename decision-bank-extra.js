/* Extra question families for the Reasoning & Decision-Style Diagnostic.
   Self-contained: exposes window.DPBankExtra. Each generator returns the same
   question shape as decision-profile.js. The caller shuffles options unless
   q.keepOrder is true. All items are original. */
(function () {
  'use strict';
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); const t = b[i]; b[i] = b[j]; b[j] = t; } return b; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Number(n).toLocaleString('en-GB');
  const gbp = (n) => '£' + fmt(n);
  const opt = (label, ok, extra) => Object.assign({ label: String(label), ok: !!ok }, extra || {});
  const mk = (o) => Object.assign({ stimulusHTML: '', visual: false, scored: true }, o);
  const last = {};
  const draw = (key, arr) => { let i; do { i = rnd(arr.length); } while (arr.length > 1 && i === last[key]); last[key] = i; return arr[i]; };
  const uniq = (a) => Array.from(new Set(a));
  function nums(ok, cands, f) {
    f = f || fmt;
    const w = [];
    cands.forEach((c) => { if (Number.isFinite(c) && c > 0 && c !== ok && w.indexOf(c) < 0) w.push(c); });
    for (let d = 1; w.length < 3; d++) {
      [ok + d, ok - d].forEach((c) => { if (c > 0 && c !== ok && w.indexOf(c) < 0 && w.length < 3) w.push(c); });
    }
    return [opt(f(ok), 1)].concat(w.slice(0, 3).map((n) => opt(f(n), 0)));
  }
  const strOpts = (ok, bad) => [opt(ok, 1)].concat(bad.map((b) => opt(b, 0)));
  const ordinal = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

  /* ---------- Numerical ---------- */
  const NAMES = ['Asha', 'Ben', 'Chloe', 'Dev', 'Elin', 'Femi', 'Gus', 'Hana'];
  function genAges() {
    const n = shuffle(NAMES).slice(0, 3);
    let a, b, c;
    do { a = 4 + rnd(25); b = 4 + rnd(25); c = 4 + rnd(25); } while (a === b || b === c || a === c);
    const oldest = Math.max(a, b, c), total = a + b + c;
    return mk({
      battery: 'numerical', sub: 'Linked totals',
      prompt: `Three analysts are ${n[0]}, ${n[1]} and ${n[2]}. ${n[0]} and ${n[1]} have ${a + b} years of service between them, ${n[1]} and ${n[2]} have ${b + c}, and ${n[0]} and ${n[2]} have ${a + c}. How many years has the longest-serving analyst?`,
      options: nums(oldest, [Math.min(a, b, c), total - oldest, oldest + 2, Math.round(total / 3)]),
      why: `Add the three pair totals: ${a + b} + ${b + c} + ${a + c} = ${2 * total}, so all three together have ${total}. Each person is that total minus the other two combined. The longest-serving has ${total} − ${total - oldest} = ${oldest}.`
    });
  }
  function genRatio() {
    const r = pick([[2, 3], [3, 5], [4, 5], [3, 7], [2, 5], [5, 7]]);
    const u = pick([20, 30, 40, 50, 60, 80]);
    const second = r[1] * u, total = (r[0] + r[1]) * u;
    return mk({
      battery: 'numerical', sub: 'Ratio',
      prompt: `Two regional teams split a bonus pool in the ratio ${r[0]} : ${r[1]}. The second team receives ${gbp(second)}. How large is the whole pool?`,
      options: nums(total, [r[0] * u, second * 2, total + u, total - u], gbp),
      why: `${r[1]} parts equal ${gbp(second)}, so one part is ${gbp(u)}. The pool has ${r[0]} + ${r[1]} = ${r[0] + r[1]} parts, which is ${gbp(total)}.`
    });
  }
  function genPyramid() {
    const b = [0, 0, 0, 0].map(() => 2 + rnd(10));
    const r2 = [b[0] + b[1], b[1] + b[2], b[2] + b[3]];
    const r3 = [r2[0] + r2[1], r2[1] + r2[2]];
    const top = r3[0] + r3[1];
    const row = (cells) => `<div style="display:flex;justify-content:center;gap:.4rem;margin:.25rem 0">${cells.map((c) => `<span style="min-width:3rem;padding:.35rem .5rem;border:1.5px solid #1c2240;border-radius:8px;text-align:center;background:#fff;font-weight:600">${c}</span>`).join('')}</div>`;
    return mk({
      battery: 'numerical', sub: 'Number pyramid',
      stimulusHTML: `<div role="img" aria-label="Number pyramid. Top ${top}. Bottom row ${b[0]}, ${b[1]}, a missing number, ${b[3]}.">${row([top])}${row(['?', '?'])}${row(['?', '?', '?'])}${row([b[0], b[1], '▢', b[3]])}</div>`,
      prompt: 'Each number is the sum of the two numbers directly beneath it. What number belongs in the empty box?',
      options: nums(b[2], [b[2] + 1, b[2] - 1, b[2] + 3, b[1] + b[2]]),
      why: `The top is ${b[0]} + 3×${b[1]} + 3×(box) + ${b[3]} = ${top}. That leaves 3×(box) = ${top - b[0] - 3 * b[1] - b[3]}, so the box is ${b[2]}.`
    });
  }
  function genClock() {
    const m = 8 + rnd(38), d = 180 - 3 * m;
    return mk({
      battery: 'numerical', sub: 'Time logic',
      prompt: `It is now a certain number of minutes before noon. ${d} minutes ago, the time was twice that many minutes after 9:00 am. How many minutes before noon is it now?`,
      options: nums(m, [d / 3, d / 2, m + 10, 180 - d]),
      why: `Call the answer m. Now is 12:00 minus m. ${d} minutes earlier is 9:00 plus 2m, so 180 − m − ${d} = 2m. That gives 3m = ${180 - d}, so m = ${m}.`
    });
  }
  function genAvgSpeed() {
    const p = pick([[6, 3], [60, 40], [30, 20], [12, 6], [60, 30], [45, 90], [50, 75], [40, 24], [20, 30]]);
    const ok = 2 * p[0] * p[1] / (p[0] + p[1]);
    return mk({
      battery: 'numerical', sub: 'Average speed',
      prompt: `A courier drives to a depot at ${p[0]} mph and returns by the same route at ${p[1]} mph. What is the average speed for the whole round trip?`,
      options: nums(ok, [(p[0] + p[1]) / 2, ok + 2, ok - 2, Math.max(p[0], p[1])], (n) => `${fmt(n)} mph`),
      why: `Average speed is total distance over total time, not the mean of the two speeds. For a distance d each way, the time is d/${p[0]} + d/${p[1]}. The result is 2 × ${p[0]} × ${p[1]} ÷ (${p[0]} + ${p[1]}) = ${ok} mph.`
    });
  }
  function genPercentOf() {
    const p = pick([8, 12, 15, 16, 20, 24, 25]);
    const total = 100 * (3 + rnd(30)), part = total * p / 100;
    return mk({
      battery: 'numerical', sub: 'Percentage of a whole',
      prompt: `${fmt(part)} orders in a batch failed validation. That is ${p}% of the batch. How many orders were in the batch?`,
      options: nums(total, [Math.round(part * (100 + p) / 100), part * p, Math.round(part / p), total + 100]),
      why: `${p}% of the batch is ${fmt(part)}, so 1% is ${fmt(part / p)} and the whole batch is ${fmt(part / p)} × 100 = ${fmt(total)}.`
    });
  }
  function genPigeon() {
    const b = 8 + rnd(10), k = 6 + rnd(10), g = 6 + rnd(8);
    return mk({
      battery: 'numerical', sub: 'Worst-case logic',
      prompt: `A box holds ${b} blue, ${k} black and ${g} grey cables. They are identical to the touch and you cannot see in. What is the smallest number you must take out to be certain of holding at least two grey ones?`,
      options: nums(b + k + 2, [b + k + 1, b + k, g, b + k + g]),
      why: `The worst case is that you pull out every blue and every black cable first: ${b} + ${k} = ${b + k}. The next two must both be grey, so the answer is ${b + k + 2}.`
    });
  }
  function genHandshake() {
    const n = 6 + rnd(9);
    return mk({
      battery: 'numerical', sub: 'Counting pairs',
      prompt: `${n} people at a workshop each shake hands once with every other person. How many handshakes take place?`,
      options: nums(n * (n - 1) / 2, [n * (n - 1), n * n, n * (n + 1) / 2, n * (n - 1) / 2 + n]),
      why: `Each person shakes ${n - 1} hands, which counts every handshake twice. So ${n} × ${n - 1} ÷ 2 = ${n * (n - 1) / 2}.`
    });
  }
  function genAwards() {
    const n = 3 + rnd(3), k = 2 + rnd(2), ok = Math.pow(n, k);
    return mk({
      battery: 'numerical', sub: 'Combinations',
      prompt: `${n} regions compete for ${k} separate awards. Each award is decided on its own, and one region can win more than one. How many different sets of winners are possible?`,
      options: nums(ok, [n * k, n * (n - 1), ok - n, ok + n]),
      why: `Each of the ${k} awards has ${n} possible winners, and the choices are independent. That gives ${Array(k).fill(n).join(' × ')} = ${ok}.`
    });
  }
  function genOverlap() {
    let a, b, c;
    do { a = 70 + rnd(23); b = 70 + rnd(23); c = 70 + rnd(23); } while (a + b + c - 200 < 5);
    const ok = a + b + c - 200;
    return mk({
      battery: 'numerical', sub: 'Minimum overlap',
      prompt: `100 customers were surveyed. ${a} use mobile, ${b} use desktop and ${c} use a tablet. What is the smallest number who could use all three?`,
      options: nums(ok, [Math.min(a, b, c) - 50, ok + 10, 100 - ok, ok - 5]),
      why: `The shortfalls are ${100 - a}, ${100 - b} and ${100 - c}, which total ${300 - a - b - c}. At most that many customers lack a device, so at least 100 − ${300 - a - b - c} = ${ok} have all three.`
    });
  }
  function genWork() {
    let n, d, m, P;
    do {
      n = pick([3, 4, 5, 6, 8]); d = pick([10, 12, 15, 18, 20, 24]); P = n * d;
      m = pick([2, 3, 4, 5, 6, 8, 9, 10, 12, 15]);
    } while (m === n || P % m !== 0);
    const ok = P / m;
    return mk({
      battery: 'numerical', sub: 'Work rate',
      prompt: `${n} analysts clear a data backlog in ${d} days, all working at the same rate. How many days would ${m} analysts need?`,
      options: nums(ok, [Math.round(d * m / n), ok + 2, d, ok - 2]),
      why: `The job is ${n} × ${d} = ${P} analyst-days. With ${m} analysts it takes ${P} ÷ ${m} = ${ok} days. More people means fewer days, so direct proportion gives the wrong answer.`
    });
  }
  function genAvg3() {
    let A, B, third;
    do { A = 40 + rnd(21); B = A + 3 + rnd(9); third = 3 * A - 2 * B; } while (third < 5);
    return mk({
      battery: 'numerical', sub: 'Averages',
      prompt: `The mean of three weekly figures is ${A}. The mean of two of them is ${B}. What is the third figure?`,
      options: nums(third, [A - (B - A), 3 * A - B, 2 * B - A, B - A]),
      why: `The three sum to 3 × ${A} = ${3 * A}. The two sum to 2 × ${B} = ${2 * B}. The third is ${3 * A} − ${2 * B} = ${third}.`
    });
  }
  function genAvgUpdate() {
    const n = 4 + rnd(6), M = 1000 + 100 * rnd(10), dl = pick([100, 150, 200, 250, 300]);
    const ok = M + (n + 1) * dl;
    return mk({
      battery: 'numerical', sub: 'Moving average',
      prompt: `A salesperson's average deal size over ${n} deals is ${gbp(M)}. Their next deal lifts the average to ${gbp(M + dl)}. How large was that deal?`,
      options: nums(ok, [M + dl, M + n * dl, M + (n + 2) * dl, M + 2 * dl], gbp),
      why: `After ${n + 1} deals the total is ${n + 1} × ${gbp(M + dl)} = ${gbp((n + 1) * (M + dl))}. Before it was ${n} × ${gbp(M)} = ${gbp(n * M)}. The new deal is the difference: ${gbp(ok)}.`
    });
  }
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  function genCalendar() {
    const start = rnd(7);
    let offs, pos;
    do {
      offs = [1, 2, 3, 4].map(() => (rnd(2) ? 1 : -1) * (1 + rnd(4)));
      pos = start; offs.forEach((o) => { pos = ((pos + o) % 7 + 7) % 7; });
    } while (pos === start);
    const rel = (n) => `${ordinal[Math.abs(n)]} ${Math.abs(n) === 1 ? 'day' : 'days'} ${n < 0 ? 'before' : 'after'}`;
    let text = DAYS[start];
    for (let i = 0; i < offs.length; i++) text = `the day that is ${rel(offs[i])} ${text}`;
    const wrong = shuffle(DAYS.filter((d, i) => i !== pos)).slice(0, 3);
    let run = start; const trail = offs.map((o) => { run = ((run + o) % 7 + 7) % 7; return DAYS[run]; });
    return mk({
      battery: 'numerical', sub: 'Calendar logic',
      prompt: `Which day is ${text}?`,
      options: strOpts(DAYS[pos], wrong),
      why: `Start at ${DAYS[start]} and work from the inside out: ${trail.join(', then ')}. The answer is ${DAYS[pos]}.`
    });
  }

  /* ---------- Abstract and logic ---------- */
  const SW = { A: [0, 1], B: [1, 3], C: [0, 2], D: [2, 3] };
  function lightsSVG(state) {
    const c = state.map((on, i) => {
      const x = 22 + i * 46;
      return `<circle cx='${x}' cy='22' r='13' fill='${on ? '#1c2240' : '#fff'}' stroke='#1c2240' stroke-width='3'/><text x='${x}' y='56' text-anchor='middle' font-size='11' fill='#1c2240'>${i + 1}${on ? ' on' : ' off'}</text>`;
    }).join('');
    return `<svg width='190' height='64' viewBox='0 0 190 64' aria-hidden='true' focusable='false'>${c}</svg>`;
  }
  function genSwitch() {
    const keys = Object.keys(SW);
    for (let guard = 0; guard < 500; guard++) {
      const init = [0, 1, 2, 3].map(() => !!rnd(2));
      const dead = pick(keys), order = shuffle(keys);
      const run = (deadKey) => { const s = init.slice(); order.forEach((k) => { if (k !== deadKey) SW[k].forEach((i) => { s[i] = !s[i]; }); }); return s; };
      const fin = run(dead);
      const same = keys.filter((k) => run(k).join() === fin.join());
      if (same.length !== 1 || init.join() === fin.join()) continue;
      return mk({
        battery: 'abstract', sub: 'Switch logic',
        stimulusHTML: `<div class='dp-passage'><small>Four lights, four switches</small><p>Each switch flips two lights between on and off. Switch A flips lights 1 and 2. Switch B flips 2 and 4. Switch C flips 1 and 3. Switch D flips 3 and 4.</p><p>The switches were thrown once each, in this order: <b>${order.join(', ')}</b>.</p><div style='display:flex;gap:1.5rem;flex-wrap:wrap'><div><small>Before</small>${lightsSVG(init)}</div><div><small>After</small>${lightsSVG(fin)}</div></div></div>`,
        prompt: 'Exactly one switch is broken and flips nothing. Which one?',
        options: keys.map((k) => opt(`Switch ${k}`, k === dead)),
        why: `Treat each switch in turn as the broken one and replay the sequence. Only with Switch ${dead} doing nothing do the lights end up as shown.`
      });
    }
    return genSwitch();
  }
  const LET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const shiftWord = (w, sh) => w.split('').map((ch, i) => LET[((LET.indexOf(ch) + sh[i]) % 26 + 26) % 26]).join('');
  function genCipher() {
    const pool = 'BCDFGHJKLMNPRSTWZ'.split('');
    const word = () => shuffle(pool).slice(0, 3).join('');
    for (;;) {
      const sh = [0, 0, 0].map(() => pick([-3, -2, -1, 1, 2, 3, 4]));
      if (uniq(sh).length < 2) continue;
      const w1 = word(), w2 = word();
      const ok = shiftWord(w2, sh);
      const cands = uniq([
        shiftWord(w2, sh.map((s, i) => (i === 0 ? -s : s))),
        shiftWord(w2, sh.map((s, i) => (i === 2 ? -s : s))),
        shiftWord(w2, [sh[0], sh[0], sh[0]]),
        shiftWord(w2, sh.map((s, i) => (i === 1 ? s + 1 : s)))
      ]).filter((x) => x !== ok);
      if (cands.length < 3) continue;
      return mk({
        battery: 'abstract', sub: 'Code analogy',
        stimulusHTML: `<div class='dp-seq' role='img' aria-label='${w1} becomes ${shiftWord(w1, sh)}. ${w2} becomes a missing code.'><span>${w1}</span><span>→</span><span>${shiftWord(w1, sh)}</span><span>${w2}</span><span>→</span><span class='dp-qm'>?</span></div>`,
        prompt: 'The same coding rule is applied to both words. What does the second word become?',
        options: strOpts(ok, cands.slice(0, 3)),
        why: `Compare ${w1} with ${shiftWord(w1, sh)} letter by letter. The alphabet shifts by ${sh.map((s) => (s > 0 ? '+' + s : '−' + Math.abs(s))).join(', ')} at positions 1, 2 and 3. Apply the same shifts to ${w2} to get ${ok}.`
      });
    }
  }
  function genGridPos() {
    const row = 'ABCDEFGH'.split('');
    for (;;) {
      const s = rnd(8), offs = [0, 0, 0].map(() => (rnd(2) ? 1 : -1) * (1 + rnd(4)));
      let p = s, okRange = true; const trail = [row[s]];
      offs.forEach((o) => { p += o; if (p < 0 || p > 7) okRange = false; trail.push(row[Math.max(0, Math.min(7, p))]); });
      if (!okRange || p === s) continue;
      const rel = (n) => `${Math.abs(n) === 1 ? 'immediately' : ordinal[Math.abs(n)] + ' places'} to the ${n > 0 ? 'right' : 'left'}`;
      const text = `${rel(offs[2])} of the letter ${rel(offs[1])} of the letter ${rel(offs[0])} of ${row[s]}`;
      const wrong = shuffle(row.filter((x, i) => i !== p)).slice(0, 3);
      return mk({
        battery: 'abstract', sub: 'Position logic',
        stimulusHTML: `<div class='dp-seq' role='img' aria-label='Letters A to H in a row'>${row.map((l) => `<span>${l}</span>`).join('')}</div>`,
        prompt: `Which letter is ${text}?`,
        options: strOpts(row[p], wrong),
        why: `Work from the inside out: ${trail.join(' → ')}. The answer is ${row[p]}.`
      });
    }
  }

  /* ---------- Verbal (curated) ---------- */
  const PHRASE = [
    { g: ['bold', 'feat'], ok: 'cold feet', bad: ['bold feet', 'cold feel', 'gold feat'] },
    { g: ['sigh', 'moon'], ok: 'high noon', bad: ['sigh noon', 'high moon', 'low noon'] },
    { g: ['fist', 'fool'], ok: 'fast food', bad: ['fist food', 'fast fool', 'first food'] },
    { g: ['rod', 'tale'], ok: 'red tape', bad: ['rod tape', 'red tale', 'bad tape'] },
    { g: ['gape', 'plat'], ok: 'game plan', bad: ['gape plan', 'game plat', 'tame plan'] },
    { g: ['hat', 'seal'], ok: 'hot seat', bad: ['hat seat', 'hot seal', 'hit sent'] },
    { g: ['lost', 'ward'], ok: 'last word', bad: ['lost word', 'last ward', 'past word'] },
    { g: ['deaf', 'and'], ok: 'dead end', bad: ['deaf end', 'dead and', 'deer end'] },
    { g: ['cast', 'flaw'], ok: 'cash flow', bad: ['cast flow', 'cash flaw', 'cash fall'] },
    { g: ['tree', 'fail'], ok: 'free fall', bad: ['tree fall', 'free fail', 'free tall'] },
    { g: ['nut', 'gait'], ok: 'net gain', bad: ['nut gain', 'net gait', 'new gain'] },
    { g: ['tea', 'lever'], ok: 'sea level', bad: ['tea level', 'sea lever', 'see level'] }
  ];
  function genPhrase() {
    const it = draw('phrase', PHRASE);
    return mk({
      battery: 'verbal', sub: 'One-letter change',
      stimulusHTML: `<div class='dp-pair'><div><small>Change exactly one letter in each word</small><b>${it.g.map((w) => w.toUpperCase()).join('   ')}</b></div></div>`,
      prompt: 'Which familiar phrase can you make?',
      options: strOpts(it.ok, it.bad),
      why: `Changing one letter in each word turns ${it.g.join(' ')} into "${it.ok}". Each of the other options leaves a word unchanged or needs more than one change.`
    });
  }
  const BRACKET = [
    { l: 'SUN', r: 'OUT', ok: 'BURN', bad: ['LIGHT', 'WORK', 'ROOM'], w: 'sunburn and burnout' },
    { l: 'BOOK', r: 'LOAD', ok: 'CASE', bad: ['MARK', 'WORM', 'PAY'], w: 'bookcase and caseload' },
    { l: 'HAND', r: 'PIPE', ok: 'BAG', bad: ['BOOK', 'RAIL', 'WIND'], w: 'handbag and bagpipe' },
    { l: 'FIRE', r: 'SHOP', ok: 'WORK', bad: ['PLACE', 'FLY', 'TALK'], w: 'firework and workshop' },
    { l: 'SKY', r: 'UP', ok: 'LINE', bad: ['DIVE', 'BLUE', 'SET'], w: 'skyline and lineup' },
    { l: 'BLACK', r: 'BOX', ok: 'MAIL', bad: ['BOARD', 'TOP', 'POST'], w: 'blackmail and mailbox' },
    { l: 'OVER', r: 'LINE', ok: 'HEAD', bad: ['COAT', 'TAKE', 'SHOT'], w: 'overhead and headline' },
    { l: 'DOOR', r: 'HOP', ok: 'BELL', bad: ['MAT', 'WAY', 'BUNNY'], w: 'doorbell and bellhop' },
    { l: 'AIR', r: 'HOLE', ok: 'PORT', bad: ['LINE', 'BAG', 'KEY'], w: 'airport and porthole' },
    { l: 'WATER', r: 'OUT', ok: 'FALL', bad: ['MARK', 'MELON', 'LOOK'], w: 'waterfall and fallout' },
    { l: 'BACK', r: 'AGE', ok: 'PACK', bad: ['HAND', 'LOG', 'FIRE'], w: 'backpack and package' },
    { l: 'CROSS', r: 'PLAY', ok: 'WORD', bad: ['BOW', 'ROAD', 'CHECK'], w: 'crossword and wordplay' }
  ];
  function genBracket() {
    const it = draw('bracket', BRACKET);
    return mk({
      battery: 'verbal', sub: 'Bridge word',
      stimulusHTML: `<div class='dp-pair'><div><small>Left word</small><b>${it.l}</b></div><div><small>Right word</small><b>${it.r}</b></div></div>`,
      prompt: 'Which word completes a new word or phrase when added after the left word, and another when placed before the right word?',
      options: strOpts(it.ok, it.bad),
      why: `${it.ok[0] + it.ok.slice(1).toLowerCase()} gives ${it.w}. Each other option works on one side only.`
    });
  }
  const ODD = [
    { w: ['oboe', 'cello', 'bassoon', 'clarinet', 'flute'], odd: 'cello', why: 'The cello is a string instrument. The others are woodwind.' },
    { w: ['Mercator', 'Robinson', 'Peters', 'Mollweide', 'Fahrenheit'], odd: 'Fahrenheit', why: 'Fahrenheit is a temperature scale. The others are map projections.' },
    { w: ['precision', 'recall', 'accuracy', 'regression', 'specificity'], odd: 'regression', why: 'Regression is a modelling method. The others are metrics for judging a classifier.' },
    { w: ['stratified', 'cluster', 'quota', 'snowball', 'median'], odd: 'median', why: 'The median is a statistic. The others are sampling methods.' },
    { w: ['placate', 'appease', 'pacify', 'mollify', 'provoke'], odd: 'provoke', why: 'To provoke is to stir up. The others mean to calm.' },
    { w: ['sonnet', 'haiku', 'limerick', 'ballad', 'sonata'], odd: 'sonata', why: 'A sonata is a piece of music. The others are poetic forms.' },
    { w: ['Ipsos', 'Kantar', 'YouGov', 'Nielsen', 'Oracle'], odd: 'Oracle', why: 'Oracle is an enterprise software company. The others are market research firms.' },
    { w: ['latency', 'throughput', 'bandwidth', 'jitter', 'firmware'], odd: 'firmware', why: 'Firmware is software on a device. The others describe network performance.' }
  ];
  function genOdd() {
    const it = draw('odd', ODD);
    const words = shuffle(it.w.filter((x) => x !== it.odd)).slice(0, 3).concat([it.odd]);
    return mk({
      battery: 'verbal', sub: 'Odd word out',
      prompt: 'Which word does not belong with the other three?',
      options: words.map((x) => opt(x, x === it.odd)),
      why: it.why
    });
  }
  const ANALOGY = [
    { s: 'thermometer is to temperature as barometer is to', ok: 'pressure', bad: ['weather', 'altitude', 'storm'], why: 'A thermometer measures temperature, and a barometer measures air pressure.' },
    { s: 'cartographer is to map as composer is to', ok: 'score', bad: ['orchestra', 'audience', 'conductor'], why: 'A cartographer produces a map. A composer produces a score.' },
    { s: 'fission is to split as fusion is to', ok: 'join', bad: ['burn', 'split', 'explode'], why: 'Fission means splitting a nucleus, and fusion means joining nuclei. "Split" is the opposite.' },
    { s: 'ornithology is to birds as entomology is to', ok: 'insects', bad: ['plants', 'fish', 'rocks'], why: 'Ornithology is the study of birds. Entomology is the study of insects.' },
    { s: 'gram is to kilogram as millimetre is to', ok: 'metre', bad: ['centimetre', 'litre', 'micrometre'], why: 'There are 1,000 grams in a kilogram and 1,000 millimetres in a metre.' },
    { s: 'meticulous is to careless as frugal is to', ok: 'wasteful', bad: ['thrifty', 'poor', 'mean'], why: 'Meticulous and careless are opposites. The opposite of frugal is wasteful. "Thrifty" is a synonym.' },
    { s: 'scalpel is to surgeon as chisel is to', ok: 'sculptor', bad: ['hospital', 'stone', 'patient'], why: 'A surgeon uses a scalpel. A sculptor uses a chisel.' }
  ];
  function genAnalogy() {
    const it = draw('analogy', ANALOGY);
    return mk({ battery: 'verbal', sub: 'Analogy', prompt: `Complete the analogy: ${it.s} …`, options: strOpts(it.ok, it.bad), why: it.why });
  }
  const TFC = [
    { p: 'Every campaign launched this year was tested on a holdout group. Campaigns tested on a holdout group are reported with confidence intervals. The spring campaign launched this year.', s: 'The spring campaign is reported with a confidence interval.', a: 'True', why: 'Launched this year means tested on a holdout group, which means reported with intervals.' },
    { p: 'No survey with fewer than 100 responses is published. Some surveys with more than 100 responses are not published.', s: 'Every survey with more than 100 responses is published.', a: 'False', why: 'The second sentence says some larger surveys are not published.' },
    { p: 'Most customers who churn contacted support in their final month. Priya\'s account churned last month.', s: 'Priya contacted support in her final month.', a: 'Cannot say', why: '"Most" leaves room for exceptions, so Priya may or may not be one.' },
    { p: 'Any discount above 15% needs pricing team approval. The loyalty offer is a 20% discount.', s: 'The loyalty offer needs pricing team approval.', a: 'True', why: '20% is above 15%, so the rule applies.' },
    { p: 'Revenue per customer rose 6% while the number of customers fell 8%.', s: 'Total revenue fell.', a: 'True', why: 'Total revenue is multiplied by 1.06 × 0.92 = 0.975, so it fell by about 2.5%.' },
    { p: 'Teams that adopted the new tool shipped faster than teams that did not. Team Orion shipped faster than Team Vega.', s: 'Team Orion adopted the new tool.', a: 'Cannot say', why: 'Orion could be faster for another reason. The passage gives a pattern, not a rule that identifies adopters.' },
    { p: 'Only people with an audit badge can open the vault. Sam opened the vault.', s: 'Sam holds an audit badge.', a: 'True', why: 'Opening the vault requires the badge.' },
    { p: 'If the sample is biased, the average is unreliable. The average is unreliable.', s: 'The sample is biased.', a: 'Cannot say', why: 'The rule runs one way. An unreliable average can have other causes.' },
    { p: 'Every pilot in the study passed the medical. Sam did not pass the medical.', s: 'Sam is a pilot in the study.', a: 'False', why: 'If Sam were a pilot in the study, Sam would have passed.' }
  ];
  function genTFC() {
    const it = draw('tfc', TFC);
    return mk({
      keepOrder: true, battery: 'verbal', sub: 'True, false or cannot say',
      stimulusHTML: `<div class='dp-passage'><small>Passage</small><p>${esc(it.p)}</p><small>Statement</small><p><b>${esc(it.s)}</b></p></div>`,
      prompt: 'Using only the passage, is the statement true, false, or impossible to say?',
      options: ['True', 'False', 'Cannot say'].map((x) => opt(x, x === it.a)),
      why: it.why
    });
  }
  const CATS = [
    { n: 'European capital cities', w: ['LONDON', 'PARIS', 'MADRID', 'LISBON', 'WARSAW', 'VIENNA', 'DUBLIN', 'PRAGUE', 'ATHENS', 'BERLIN'] },
    { n: 'fruits', w: ['BANANA', 'ORANGE', 'CHERRY', 'MANGO', 'LEMON', 'PEACH', 'GRAPE', 'MELON', 'APPLE'] },
    { n: 'animals', w: ['TIGER', 'ZEBRA', 'BADGER', 'OTTER', 'FALCON', 'RABBIT', 'MONKEY', 'JAGUAR'] },
    { n: 'colours', w: ['SCARLET', 'VIOLET', 'YELLOW', 'PURPLE', 'INDIGO', 'MAGENTA', 'CRIMSON', 'AMBER'] }
  ];
  const scramble = (w) => { let s, n = 0; do { s = shuffle(w.split('')).join(''); n++; } while (s === w && n < 20); return s; };
  function genAnagramCat() {
    const c = pick(CATS), o = pick(CATS.filter((x) => x !== c));
    const good = shuffle(c.w).slice(0, 3), bad = pick(o.w);
    const items = good.map((w) => ({ s: scramble(w), w: w, ok: 0 })).concat([{ s: scramble(bad), w: bad, ok: 1 }]);
    return mk({
      battery: 'verbal', sub: 'Anagram category',
      prompt: `Three of these jumbled words are anagrams of ${c.n}. Which one is not?`,
      options: items.map((x) => opt(x.s, x.ok)),
      why: `The unscrambled words are ${items.map((x) => x.w).join(', ')}. Only ${bad} is not among the ${c.n}.`
    });
  }

  window.DPBankExtra = {
    verbal: [genPhrase, genBracket, genOdd, genAnalogy, genTFC, genAnagramCat],
    numerical: [genAges, genRatio, genPyramid, genClock, genAvgSpeed, genPercentOf, genPigeon, genHandshake, genAwards, genOverlap, genWork, genAvg3, genAvgUpdate, genCalendar],
    abstract: [genSwitch, genCipher, genGridPos],
    _data: { PHRASE: PHRASE, BRACKET: BRACKET, ODD: ODD, ANALOGY: ANALOGY, TFC: TFC }
  };
})();
