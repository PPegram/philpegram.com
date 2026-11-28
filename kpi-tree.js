/* The KPI Tree Workshop. Phil Pegram. Runs entirely in the browser. */
(function () {
  'use strict';
  var KEY = 'pp-kpi-tree-v2';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function track(name, props) { try { if (typeof window.plausible === 'function') window.plausible(name, props ? { props: props } : undefined); } catch (e) {} }

  /* ---------- Content ---------- */
  var CATCHES = [
    { re: /cost per click|\bcpc\b/i, name: 'Cost per click', looks: 'Cheaper traffic.', hides: 'Cheap clicks are often cheap because they rarely buy.', tell: 'Watch conversion from those clicks.', pair: { name: 'Click to order conversion', re: /conver/i } },
    { re: /\broas\b|return on ad/i, name: 'ROAS', looks: 'Efficient spend.', hides: 'You can raise ROAS by spending less and selling less, so profit falls.', tell: 'Put profit or contribution beside it.', pair: { name: 'Contribution after marketing', re: /profit|margin|contribution/i } },
    { re: /average order value|\baov\b|basket size/i, name: 'Average order value', looks: 'Bigger baskets.', hides: 'It rises when small-basket customers give up, so you have fewer orders.', tell: 'Watch the number of orders.', pair: { name: 'Orders', re: /\borders?\b(?!\s*value)|order volume/i } },
    { re: /conversion/i, name: 'Conversion rate', looks: 'Better selling.', hides: 'It rises when the weakest traffic disappears, even if sales are flat.', tell: 'Watch the volume coming in.', pair: { name: 'Sessions', re: /session|visit|traffic|leads?\b/i } },
    { re: /handle time|\baht\b/i, name: 'Average handle time', looks: 'Faster service.', hides: 'Rush calls and customers ring back.', tell: 'Watch repeat contacts.', pair: { name: 'Repeat contacts within 7 days', re: /repeat|re-?contact/i } },
    { re: /first.contact resolution|\bfcr\b|resolved first/i, name: 'First-contact resolution', looks: 'Problems fixed first time.', hides: 'It can be marked "resolved" by closing the call, not fixing the problem.', tell: 'Watch whether the same customer comes back.', pair: { name: 'Repeat contacts within 7 days', re: /repeat|re-?contact/i } },
    { re: /churn|leavers|cancellation/i, name: 'Churn rate', looks: 'Customers staying.', hides: 'Discounts buy retention and quietly cut revenue per customer.', tell: 'Watch discount depth or revenue per customer.', pair: { name: 'Average discount per customer', re: /discount|revenue per|arpu|price/i } },
    { re: /\bnps\b|net promoter|satisfaction|\bcsat\b/i, name: 'NPS or satisfaction', looks: 'Happier customers.', hides: 'A falling response rate can lift the score on its own.', tell: 'Watch who is answering.', pair: { name: 'Survey response rate', re: /response rate/i } },
    { re: /bounce/i, name: 'Bounce rate', looks: 'A stickier site.', hides: 'Pop-ups and extra clicks lower it without anyone getting what they came for.', tell: 'Watch a real outcome from the visit.', pair: { name: 'Visit to order conversion', re: /conver|orders?|enquir/i } },
    { re: /deflection|self.serve|containment/i, name: 'Contact deflection', looks: 'Fewer calls.', hides: 'Customers who give up count as deflected.', tell: 'Watch repeat contacts and complaints.', pair: { name: 'Repeat contacts within 7 days', re: /repeat|complain/i } },
    { re: /open rate|click.through|\bctr\b/i, name: 'Open or click rate', looks: 'An engaged audience.', hides: 'Clickbait wins clicks and loses trust.', tell: 'Watch what those clicks went on to do.', pair: { name: 'Click to order conversion', re: /conver|orders?|revenue/i } },
    { re: /followers|impressions|likes|page views|reach/i, name: 'Reach or followers', looks: 'Awareness.', hides: 'It grows with no change in what anyone buys or asks for.', tell: 'Watch enquiries or sign-ups.', pair: { name: 'Enquiries', re: /enquir|lead|sign.?up|demo/i } },
    { re: /utilisation|utilization|occupancy|productivity/i, name: 'Utilisation', looks: 'People working hard.', hides: 'Push it past about 85% and errors and burnout climb.', tell: 'Watch a quality measure beside it.', pair: { name: 'Errors or complaints per 1,000', re: /error|defect|quality|complain|rework/i } },
    { re: /discount/i, name: 'Discount depth', looks: 'Competitive pricing.', hides: 'Volume rises while margin drains away.', tell: 'Watch margin per order.', pair: { name: 'Margin rate', re: /margin|profit|revenue per|price/i } }
  ];

  var MONDAY = [
    'If it moved 10% tomorrow, would someone change what they do this week?',
    'Does one named person or team own it?',
    'Can that owner change it directly, without waiting on another team?',
    'Does it move fast enough to act on: weeks, not years?',
    'Is it hard to game without the outcome improving too?',
    'Would anyone notice if it stopped being reported?'
  ];
  function band(score) {
    if (score == null) return null;
    if (score <= 1) return { k: 'wall', t: 'Wallpaper', d: 'Nice to look at. Nobody would act on it. Cut it or demote it to context.' };
    if (score <= 3) return { k: 'ctx', t: 'Context', d: 'Worth knowing, not worth a meeting. Report it, don\u2019t review it.' };
    if (score <= 5) return { k: 'use', t: 'Useful', d: 'Close. Fix the "no" answers and it earns a place in the review.' };
    return { k: 'steer', t: 'Steering', d: 'A real lever. Review it at the pace you can act on it.' };
  }

  function N(name, o, kids) { o = o || {}; return { name: name, owner: o.owner || '', decision: o.decision || '', def: o.def || '', value: o.value || '', op: o.op || 'mul', timing: o.timing || 'lag', test: null, kids: kids || [] }; }
  var TEMPLATES = [
    { id: 'subs', title: 'Subscription growth', blurb: 'Broadband, software, gyms, memberships.', decision: '',
      build: function () { return N('Monthly recurring revenue', { op: 'mul' }, [
        N('Paying customers', { op: 'add' }, [
          N('Customers kept from last month', { op: 'inf', value: '47,500' }, [
            N('Monthly churn rate', { value: '2.1%' }),
            N('Faults in first 30 days per 1,000', { value: '38', timing: 'lead' }),
            N('First-contact resolution', { value: '71%', timing: 'lead' })]),
          N('New customers this month', { op: 'mul' }, [
            N('Website visits', { value: '180,000', timing: 'lead' }),
            N('Visit to order conversion', { value: '1.4%' })])]),
        N('Revenue per customer', { op: 'sub' }, [
          N('List price per customer', { value: '£33.50' }),
          N('Average discount per customer', { value: '£4.50' })])]); } },
    { id: 'shop', title: 'Online sales', blurb: 'Ecommerce, retail, direct-to-consumer.', decision: '',
      build: function () { return N('Gross profit after marketing', { op: 'sub' }, [
        N('Margin from sales', { op: 'mul' }, [
          N('Orders', { op: 'mul' }, [
            N('Sessions', { value: '120,000', timing: 'lead' }),
            N('Conversion rate', { value: '2.5%' })]),
          N('Average order value', { value: '£48' }),
          N('Margin rate', { value: '40%' })]),
        N('Marketing spend', { op: 'mul' }, [
          N('Paid clicks', { value: '60,000', timing: 'lead' }),
          N('Cost per click', { value: '£0.55' })])]); } },
    { id: 'service', title: 'Cost to serve', blurb: 'Contact centres, field service, operations.', decision: '',
      build: function () { return N('Cost to serve per customer', { op: 'div' }, [
        N('Total service cost', { op: 'add' }, [
          N('Contact centre cost', { op: 'mul' }, [
            N('Contacts handled', { op: 'inf', value: '90,000' }, [
              N('Repeat contacts within 7 days', { value: '18%', timing: 'lead' }),
              N('Faults per 1,000 customers', { value: '41', timing: 'lead' }),
              N('Bill queries per 1,000 customers', { value: '22', timing: 'lead' })]),
            N('Cost per contact', { op: 'inf', value: '£4.20' }, [
              N('Average handle time', { value: '7.5', timing: 'lead' }),
              N('Agent occupancy', { value: '88%' })])]),
          N('Engineer visit cost', { op: 'mul' }, [
            N('Engineer visits', { value: '6,000' }),
            N('Cost per visit', { value: '£65' })]),
          N('Credits and refunds', { value: '£60,000' })]),
        N('Customers', { value: '250,000' })]); } }
  ];

  /* ---------- State ---------- */
  var S = null, seq = 1, undo = [], skipped = {}, captionDirty = false, firstEdit = false, sel = null, step = 'shape';
  function nid() { return 'n' + (seq++); }
  function assignIds(n) { n.id = nid(); n.kids.forEach(assignIds); return n; }
  function fixIds(n) { var m = /^n(\d+)$/.exec(n.id || ''); if (m) seq = Math.max(seq, +m[1] + 1); else n.id = null; n.kids = n.kids || []; n.kids.forEach(fixIds); }
  function fillIds(n) { if (!n.id) n.id = nid(); n.kids.forEach(fillIds); }
  function walk(n, fn, p, d) { fn(n, p || null, d || 0); n.kids.forEach(function (k) { walk(k, fn, n, (d || 0) + 1); }); }
  function flat() { var a = []; walk(S.tree, function (n, p, d) { a.push({ n: n, p: p, d: d }); }); return a; }
  function find(id) { var r = null; walk(S.tree, function (n, p, d) { if (n.id === id) r = { n: n, p: p, d: d }; }); return r; }
  function parents() { var m = {}; walk(S.tree, function (n, p) { m[n.id] = p; }); return m; }
  function ownerOf(id) { var pm = parents(), n = find(id).n, inh = false; while (n) { if (n.owner) return { o: n.owner, inh: inh }; n = pm[n.id]; inh = true; } return { o: '', inh: false }; }
  function leaves() { return flat().filter(function (x) { return x.d > 0 && !x.n.kids.length; }); }
  function catchFor(n) { if (!n.name) return null; for (var i = 0; i < CATCHES.length; i++) if (CATCHES[i].re.test(n.name)) return CATCHES[i]; return null; }
  function pairPresent(c, self) { return flat().some(function (x) { return x.n !== self && c.pair.re.test(x.n.name) && !c.re.test(x.n.name); }); }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function snapshot() { undo.push(JSON.stringify(S)); if (undo.length > 40) undo.shift(); $('#kt-undo').disabled = false; }
  function load(obj) {
    S = { v: 2, decision: obj.decision || '', tree: obj.tree, tpl: obj.tpl || '' };
    seq = 1; fixIds(S.tree); fillIds(S.tree); walk(S.tree, function (n) { n.op = n.op || 'mul'; n.timing = n.timing || 'lag'; ['name', 'owner', 'decision', 'def', 'value'].forEach(function (k) { n[k] = n[k] || ''; }); });
  }

  /* ---------- Values and what-if ---------- */
  function parseVal(s) {
    if (s == null) return null; s = String(s).trim(); if (!s) return null;
    var cur = /£|\$|€/.test(s), pct = /%$/.test(s), t = s.replace(/[£$€,\s%]/g, '').toLowerCase(), mult = 1;
    var m = /^(-?\d*\.?\d+)(k|m|bn|b)?$/.exec(t); if (!m) return null;
    if (m[2] === 'k') mult = 1e3; else if (m[2] === 'm') mult = 1e6; else if (m[2] === 'bn' || m[2] === 'b') mult = 1e9;
    var v = parseFloat(m[1]) * mult; if (pct) v = v / 100;
    return { v: v, pct: pct, cur: cur };
  }
  function fmt(x) {
    if (!x || !isFinite(x.v)) return '';
    if (x.pct) return (Math.round(x.v * 1000) / 10) + '%';
    var a = Math.abs(x.v), s;
    if (a >= 1e9) s = (x.v / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'bn';
    else if (a >= 1e6) s = (x.v / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'm';
    else if (a >= 1e4) s = Math.round(x.v).toLocaleString('en-GB');
    else if (a >= 100) s = (Math.round(x.v * 10) / 10).toLocaleString('en-GB');
    else s = x.cur && Math.round(x.v * 100) % 100 ? x.v.toFixed(2) : (Math.round(x.v * 100) / 100).toString();
    return (x.cur ? (x.v < 0 ? '−£' + s.replace('-', '') : '£' + s) : s);
  }
  function fk(n) { return n.kids.filter(function (k) { return !k.guard; }); }
  function arith(n) { var k = fk(n).length; return n.op !== 'inf' && (k >= 2 || (k === 1 && (n.op === 'add' || n.op === 'mul'))); }
  function calc(n, ov) {
    ov = ov || {};
    if (arith(n)) {
      var vs = fk(n).map(function (k) { return calc(k, ov); });
      if (vs.every(function (v) { return v; })) {
        var r, cur = vs.some(function (v) { return v.cur; }), pct = false;
        if (n.op === 'mul') { r = vs.reduce(function (a, b) { return a * b.v; }, 1); pct = vs.every(function (v) { return v.pct; }); }
        else if (n.op === 'add') { r = vs.reduce(function (a, b) { return a + b.v; }, 0); pct = vs[0].pct; cur = vs[0].cur; }
        else if (n.op === 'sub') { r = vs.slice(1).reduce(function (a, b) { return a - b.v; }, vs[0].v); pct = vs[0].pct; cur = vs[0].cur; }
        else if (n.op === 'div') { if (!vs[1].v) return null; r = vs[0].v / vs[1].v; cur = vs[0].cur && !vs[1].cur; }
        return { v: r, pct: pct, cur: cur, calc: true };
      }
    }
    var own = parseVal(n.value); if (!own) return null;
    if (ov[n.id] != null) own = { v: ov[n.id], pct: own.pct, cur: own.cur };
    return own;
  }
  function inputs() {
    var out = [];
    (function go(n, ok) {
      if (ok && arith(n)) { var all = fk(n).every(function (k) { return calc(k); }); fk(n).forEach(function (k) { go(k, all); }); return; }
      if (ok && n !== S.tree && parseVal(n.value)) out.push(n);
    })(S.tree, true);
    return out;
  }
  function whatIf() {
    var base = calc(S.tree); if (!base || !base.v) return { base: base, rows: [] };
    var rows = inputs().map(function (n) {
      var o = {}; o[n.id] = parseVal(n.value).v * 1.1; var nv = calc(S.tree, o);
      return { n: n, d: nv ? (nv.v - base.v) / Math.abs(base.v) : 0, nv: nv };
    }).filter(function (r) { return Math.abs(r.d) > 1e-9; });
    rows.sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); });
    return { base: base, rows: rows };
  }
  function pctTxt(d) { var p = Math.round(d * 1000) / 10; return (p > 0 ? '+' : p < 0 ? '−' : '') + Math.abs(p) + '%'; }

  /* ---------- Checks ---------- */
  function checks() {
    var F = flat(), L = leaves(), out = [], need = Math.min(3, L.length);
    function add(id, ok, title, why, fix) { out.push({ id: id, ok: !!ok, title: title, why: why, fix: fix || null }); }
    var unnamed = F.filter(function (x) { return !x.n.name.trim(); })[0];
    add('names', !unnamed, 'Every box has a name', 'A box called nothing can\u2019t be owned or measured.', unnamed && { node: unnamed.n.id, field: 'f-name', text: 'This box has no name yet. Call it something a new starter would understand.' });
    add('decision', (S.decision || '').trim().length >= 15, 'The decision is written down', 'If nobody can finish the sentence, nobody has agreed who decides.', { field: 'kt-decision', text: 'Write the decision this tree serves, in one sentence. "We need to decide whether to\u2026, by\u2026, judged on\u2026"' });
    add('split', S.tree.kids.length >= 2, 'The outcome splits into at least two drivers', 'One branch means the top box is just a renamed version of the one beneath it.', { node: S.tree.id, act: 'child', text: 'Your outcome needs at least two drivers. Add a box below it.' });
    var one = F.filter(function (x) { return x.n.kids.length === 1; })[0];
    add('one', !one, 'No box has a single child', 'A box with one child is the same metric twice. Merge them or add the missing sibling.', one && { node: one.n.id, act: 'child', text: '\u201c' + (one.n.name || 'This box') + '\u201d has only one box below it. Add the missing driver, or merge the two.' });
    var orphan = L.filter(function (x) { return !ownerOf(x.n.id).o; })[0], target = null;
    if (orphan) { var pm = parents(), t = orphan.n; while (pm[t.id] && pm[t.id] !== S.tree) t = pm[t.id]; target = t; }
    add('owner', !orphan, 'Every bottom box has an owner', 'If two teams share a number, neither acts when it moves.', target && { node: target.id, field: 'f-owner', text: 'Who owns \u201c' + (target.name || 'this branch') + '\u201d? Set it once and every box beneath inherits it.' });
    var withDec = L.filter(function (x) { return x.n.decision.trim(); }), noDec = L.filter(function (x) { return !x.n.decision.trim(); })[0];
    add('dec', need > 0 && withDec.length >= need, need + ' levers say what you\u2019d do if they moved', 'A metric nobody would act on is decoration, however accurate it is.', noDec && { node: noDec.n.id, field: 'f-decision', text: 'If \u201c' + (noDec.n.name || 'this box') + '\u201d moved, what would you do? One sentence. If the honest answer is "nothing", delete it.' });
    var cs = F.map(function (x) { var c = catchFor(x.n); return c && !pairPresent(c, x.n) ? { x: x, c: c } : null; }).filter(Boolean);
    add('catch', !cs.length, 'Every metric with a catch has its neighbour', 'Push one number on its own and something else quietly gets worse.', cs[0] && { node: cs[0].x.n.id, act: 'pair', text: '\u201c' + cs[0].x.n.name + '\u201d has a catch: ' + cs[0].c.hides + ' Add \u201c' + cs[0].c.pair.name + '\u201d beside it.' });
    var withDef = L.filter(function (x) { return x.n.def.trim(); }), noDef = L.filter(function (x) { return !x.n.def.trim(); })[0];
    add('def', need > 0 && withDef.length >= need, need + ' levers have a written definition', 'Two teams with two definitions will argue about the number, not the decision.', noDef && { node: noDef.n.id, field: 'f-def', more: true, text: 'Define \u201c' + (noDef.n.name || 'this box') + '\u201d in one line, with its time window. "Orders \u00f7 sessions, calendar month" beats "conversion".' });
    var lead = F.some(function (x) { return x.d > 0 && x.n.timing === 'lead'; });
    add('lead', lead, 'At least one early-warning measure', 'A tree of lagging results only tells you what already happened.', L[0] && { node: L[0].n.id, field: 'f-timing', more: true, text: 'Which box would warn you first? Mark at least one as a leading measure.' });
    var maxD = F.reduce(function (a, x) { return Math.max(a, x.d); }, 0);
    add('depth', maxD >= 2, 'At least three levels deep', 'Two levels usually stops before anyone can act.', L[0] && { node: L[0].n.id, act: 'child', text: 'Your tree stops early. Split one driver again, until a single team can change the bottom box.' });
    var wide = F.filter(function (x) { return x.n.kids.length > 5; })[0];
    add('wide', !wide, 'No box has more than five children', 'Past five, people stop reading and start skimming.', wide && { node: wide.n.id, text: '\u201c' + (wide.n.name || 'This box') + '\u201d has ' + wide.n.kids.length + ' children. Group them under two or three headings.' });
    var seen = {}, dup = null; F.forEach(function (x) { var k = x.n.name.trim().toLowerCase(); if (!k) return; if (seen[k] && !dup) dup = x; seen[k] = 1; });
    add('dup', !dup, 'No metric appears twice', 'The same number in two places gets counted twice and owned by neither.', dup && { node: dup.n.id, field: 'f-name', text: '\u201c' + dup.n.name + '\u201d appears twice. Rename one or delete it.' });
    add('size', F.length <= 25, 'Fewer than 25 boxes', 'A tree nobody can read in a minute won\u2019t get used in a meeting.', { text: 'You have ' + F.length + ' boxes. Delete anything that failed the Monday test.' });
    var tested = L.filter(function (x) { return x.n.test != null; });
    add('monday', tested.length > 0, 'One lever has passed through the Monday test', 'It\u2019s the fastest way to find out if a metric is a lever or wallpaper.', { act: 'monday', text: 'Run the Monday test on your most important lever. Six yes-or-no questions.' });
    var wall = tested.filter(function (x) { return x.n.test <= 1; })[0];
    add('wall', !wall, 'Nothing tested scores as wallpaper', 'Wallpaper on a tree trains people to ignore the whole tree.', wall && { node: wall.n.id, text: '\u201c' + wall.n.name + '\u201d scored as wallpaper. Delete it, or move it to a context report.' });
    return out;
  }

  /* ---------- Layout ---------- */
  var W = 224, H = 84, CG = 52, RG = 12;
  function layout(root, w, h, cg, rg) {
    w = w || W; h = h || H; cg = cg || CG; rg = rg || RG;
    var pos = {}, y = 0, maxD = 0;
    (function go(n, d) {
      maxD = Math.max(maxD, d);
      if (!n.kids.length) { pos[n.id] = { x: d * (w + cg), y: y }; y += h + rg; return; }
      n.kids.forEach(function (k) { go(k, d + 1); });
      var a = pos[n.kids[0].id].y, b = pos[n.kids[n.kids.length - 1].id].y;
      pos[n.id] = { x: d * (w + cg), y: (a + b) / 2 };
    })(root, 0);
    return { pos: pos, w: (maxD + 1) * (w + cg) - cg, h: Math.max(h, y - rg), bw: w, bh: h };
  }
  var OPS = { mul: '×', add: '+', sub: '−', div: '÷', inf: '~' };

  /* ---------- Render ---------- */
  function nodeInner(n, d) {
    var ow = ownerOf(n.id), c = catchFor(n), v = calc(n), b = band(n.test);
    var leaf = d > 0 && !n.kids.length;
    var gtag = n.guard ? '<b class="kt-badge-guard">guardrail</b>' : '';
    var meta = ow.o ? '<span class="kt-own' + (ow.inh ? ' inh' : '') + '">' + esc(ow.o) + '</span>' : (leaf ? '<span class="kt-own none">No owner</span>' : '');
    var tags = gtag + (b ? '<b class="kt-badge-test ' + b.k + '" title="Monday test: ' + b.t + '">' + b.t + '</b>' : '');
    return '<span class="kt-n-name">' + (n.name ? esc(n.name) : '<em>Name this box</em>') + '</span>' +
      (c ? '<b class="kt-badge-catch kt-corner" title="Has a catch">!</b>' : '') +
      '<span class="kt-n-meta">' + meta + '<span class="kt-n-right">' + tags + (v ? '<span class="kt-val' + (v.calc ? ' calc' : '') + '">' + esc(fmt(v)) + '</span>' : '') + '</span></span>';
  }
  function fitSize() {
    var el = $('#kt-canvas'), avail = (el && el.clientWidth ? el.clientWidth : 900) - 64, depth = 0;
    walk(S.tree, function (n, p, d) { depth = Math.max(depth, d); });
    CG = depth >= 4 || avail < 820 ? 40 : 52;
    W = Math.max(140, Math.min(224, Math.floor((avail - depth * CG) / (depth + 1))));
    H = W < 190 ? 90 : 84;
  }
  function renderTree(focusId) {
    fitSize();
    var L = layout(S.tree), html = '', edges = '';
    walk(S.tree, function (n, p, d) {
      var q = L.pos[n.id], leaf = d > 0 && !n.kids.length;
      html += '<button type="button" class="kt-node' + (d === 0 ? ' root' : '') + (leaf ? ' leaf' : '') + (n.guard ? ' guard' : '') + (n.id === sel ? ' sel' : '') + (n.id === focusId ? ' pulse' : '') + '" data-id="' + n.id + '" style="left:' + q.x + 'px;top:' + q.y + 'px;width:' + W + 'px;height:' + H + 'px" aria-label="' + esc((n.name || 'Unnamed box') + (leaf ? ', lever' : '')) + '">' + nodeInner(n, d) + '</button>';
      if (n.kids.length) {
        var x1 = q.x + W, y1 = q.y + H / 2;
        n.kids.forEach(function (k) { var r = L.pos[k.id], x2 = r.x, y2 = r.y + H / 2, mx = x1 + CG / 2; edges += '<path d="M' + x1 + ' ' + y1 + 'C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2 + '"' + (k.guard ? ' class="guard"' : n.op === 'inf' ? ' class="dash"' : '') + '/>'; });
        edges += '<g class="kt-op"><circle cx="' + (x1 + 13) + '" cy="' + y1 + '" r="11"/><text x="' + (x1 + 13) + '" y="' + (y1 + 4.5) + '">' + OPS[n.op] + '</text></g>';
      }
    });
    var outline = '<ul class="kt-outline">' + (function ol(n, d) {
      var s = '<li><button type="button" class="kt-onode' + (n.guard ? ' guard' : '') + (n.id === sel ? ' sel' : '') + (n.id === focusId ? ' pulse' : '') + '" data-id="' + n.id + '">' + (d > 0 ? '<span class="kt-o-op">' + (n.guard ? 'g' : OPS[findParentOp(n)]) + '</span>' : '') + nodeInner(n, d) + '</button>';
      if (n.kids.length) s += '<ul>' + n.kids.map(function (k) { return ol(k, d + 1); }).join('') + '</ul>';
      return s + '</li>';
    })(S.tree, 0) + '</ul>';
    $('#kt-canvas').innerHTML = '<div class="kt-chart" style="width:' + L.w + 'px;height:' + L.h + 'px"><svg class="kt-edges" width="' + L.w + '" height="' + L.h + '" aria-hidden="true">' + edges + '</svg>' + html + '</div>' + outline;
  }
  function findParentOp(n) { var p = parents()[n.id]; return p ? p.op : 'mul'; }

  function renderEditor() {
    var f = $('#kt-editor'), e = $('#kt-editor-empty');
    var x = sel && find(sel);
    if (!x) { f.hidden = true; e.hidden = false; document.body.classList.remove('kt-sheet'); return; }
    f.hidden = false; e.hidden = true;
    var n = x.n, pm = parents(), path = [], t = pm[n.id];
    while (t) { path.unshift(t.name || 'Unnamed'); t = pm[t.id]; }
    $('#kt-crumb').textContent = path.length ? path.join(' › ') : 'The outcome at the top';
    if (document.activeElement !== $('#f-name')) $('#f-name').value = n.name;
    if (document.activeElement !== $('#f-owner')) $('#f-owner').value = n.owner;
    if (document.activeElement !== $('#f-decision')) $('#f-decision').value = n.decision;
    if (document.activeElement !== $('#f-def')) $('#f-def').value = n.def;
    if (document.activeElement !== $('#f-value')) $('#f-value').value = n.value;
    $('#f-op').value = n.op; $('#f-timing').value = n.timing;
    var ow = ownerOf(n.id);
    $('#f-owner-hint').textContent = !n.owner && ow.o ? 'inherits ' + ow.o : '';
    $('#f-owner').placeholder = !n.owner && ow.o ? ow.o + ' (inherited)' : 'One person or one team';
    $('#f-op').disabled = !n.kids.length; $('#f-op').title = n.kids.length ? '' : 'Add boxes below to choose how they combine';
    $('#kt-del').hidden = x.d === 0; $('#kt-add-sib').hidden = x.d === 0;
    var calcd = calc(n); $('#f-value').disabled = !!(calcd && calcd.calc);
    if (calcd && calcd.calc) $('#f-value').value = fmt(calcd) + ' (worked out from the boxes below)';
    var c = catchFor(n), box = $('#kt-catch');
    if (c) {
      var has = pairPresent(c, n);
      box.hidden = false;
      box.innerHTML = '<p class="kt-catch-h"><b>!</b> ' + esc(c.name) + ' has a catch</p><p><span>Looks like:</span> ' + esc(c.looks) + '</p><p><span>Can hide:</span> ' + esc(c.hides) + '</p><p><span>How to tell:</span> ' + esc(c.tell) + '</p>' + (has ? '<p class="kt-ok">Its neighbour is already on your tree.</p>' : '<button type="button" class="kt-btn kt-btn-pink kt-sm" data-pair="' + n.id + '">Add \u201c' + esc(c.pair.name) + '\u201d beside it</button>');
    } else box.hidden = true;
    if (window.matchMedia('(max-width: 900px)').matches && step === 'shape') document.body.classList.add('kt-sheet'); else document.body.classList.remove('kt-sheet');
  }

  function renderChecks() {
    var cs = checks(), ok = cs.filter(function (c) { return c.ok; }).length;
    $('#kt-meter').style.width = Math.round(ok / cs.length * 100) + '%';
    $('#kt-progress-text').textContent = ok + ' of ' + cs.length + ' checks pass';
    $('#kt-checks').innerHTML = cs.map(function (c, i) {
      return '<li class="' + (c.ok ? 'ok' : 'no') + '"><span class="kt-tick" aria-hidden="true">' + (c.ok ? '✓' : (i + 1)) + '</span><div><b>' + esc(c.title) + '</b>' + (c.ok ? '' : '<p>' + esc(c.why) + '</p>' + (c.fix ? '<button type="button" class="kt-mini kt-pri" data-fix="' + c.id + '">Fix it</button>' : '')) + '</div></li>';
    }).join('');
    // coach
    var order = ['names', 'decision', 'split', 'one', 'owner', 'dec', 'catch', 'def', 'lead', 'depth', 'wide', 'dup', 'size', 'monday', 'wall'];
    var open = order.map(function (id) { return cs.filter(function (c) { return c.id === id; })[0]; }).filter(function (c) { return c && !c.ok && c.fix; });
    var next = open.filter(function (c) { return !skipped[c.id]; })[0] || open[0];
    var coach = $('#kt-coach');
    if (next) {
      coach.classList.remove('done'); coach.dataset.fix = next.id;
      $('#kt-coach-text').textContent = next.fix.text;
      $('#kt-coach-do').textContent = 'Do it'; $('#kt-coach-do').hidden = false; $('#kt-coach-skip').hidden = open.length < 2;
    } else {
      coach.classList.add('done'); coach.dataset.fix = '__share';
      $('#kt-coach-text').textContent = ok === cs.length ? 'All ' + cs.length + ' checks pass. That\u2019s a tree a sceptical director would struggle to pick apart. Take it away.' : 'Nothing left the coach can fix for you. Have a look at the open checks, then take it away.';
      $('#kt-coach-do').textContent = 'Go to Share'; $('#kt-coach-skip').hidden = true; $('#kt-coach-do').hidden = step === 'share';
      if (step === 'share') $('#kt-coach-text').textContent = 'Download the picture, post it with the caption, and put the link in the first comment. Or send the brief to whoever owns the top box.';
    }
    return cs;
  }

  function renderWhatIf() {
    var w = whatIf(), el = $('#kt-whatif');
    if (!w.base) { el.innerHTML = '<h3>Which lever matters most?</h3><p class="kt-fine">Add current values to the bottom boxes on any arithmetic branch (solid lines) and this works out which one moves your outcome furthest.</p>'; return; }
    var rows = w.rows.slice(0, 6), max = rows.length ? Math.abs(rows[0].d) : 1;
    var mismatch = '', ownV = parseVal(S.tree.value);
    var html = '<h3>Which lever matters most?</h3><p class="kt-fine">Each lever nudged up 10% on its own. Outcome now: <b>' + esc(fmt(w.base)) + '</b>.' + (S.tpl ? ' The starting values are illustrative. Swap in yours.' : '') + '</p>';
    html += rows.length ? '<ol class="kt-bars">' + rows.map(function (r) { return '<li><button type="button" data-goto="' + r.n.id + '"><span class="kt-bar-l">' + esc(r.n.name || 'Unnamed') + '</span><span class="kt-bar-t"><i class="' + (r.d < 0 ? 'neg' : '') + '" style="width:' + Math.max(4, Math.abs(r.d) / max * 100) + '%"></i></span><span class="kt-bar-v">' + pctTxt(r.d) + '</span></button></li>'; }).join('') + '</ol>' : '<p class="kt-fine">No lever on an arithmetic branch has a value yet.</p>';
    if (rows.length) html += '<p class="kt-insight">' + esc(rows[0].n.name) + ' is your biggest lever: 10% on it moves ' + esc(S.tree.name || 'the outcome') + ' by ' + pctTxt(rows[0].d) + '. ' + (rows.length > 1 && Math.abs(rows[rows.length - 1].d) < Math.abs(rows[0].d) / 3 ? esc(rows[rows.length - 1].n.name) + ' barely moves it, so it shouldn\u2019t get the same airtime.' : 'Several levers move it by similar amounts, so pick the one that\u2019s cheapest to change.') + '</p>';
    el.innerHTML = html + mismatch;
  }

  function renderMonday() {
    var L = leaves(), el = $('#kt-monday');
    if (!L.length) { el.innerHTML = ''; return; }
    var cur = (sel && L.filter(function (x) { return x.n.id === sel; })[0]) || L.filter(function (x) { return x.n.test == null; })[0] || L[0];
    var n = cur.n, ans = n.answers || [];
    var b = band(n.test);
    el.innerHTML = '<h3 id="kt-monday-h">The Monday test</h3><p class="kt-fine">Would anyone do something different on Monday if this moved? Six questions, answered honestly.</p>' +
      '<label for="kt-m-pick">Lever</label><select id="kt-m-pick">' + L.map(function (x) { return '<option value="' + x.n.id + '"' + (x.n === n ? ' selected' : '') + '>' + esc(x.n.name || 'Unnamed box') + (x.n.test != null ? ' (' + band(x.n.test).t + ')' : '') + '</option>'; }).join('') + '</select>' +
      '<ol class="kt-qs">' + MONDAY.map(function (q, i) { return '<li><span>' + esc(q) + '</span><span class="kt-yn" role="group" aria-label="Answer"><button type="button" data-q="' + i + '" data-a="1" aria-pressed="' + (ans[i] === 1) + '">Yes</button><button type="button" data-q="' + i + '" data-a="0" aria-pressed="' + (ans[i] === 0) + '">No</button></span></li>'; }).join('') + '</ol>' +
      (b ? '<div class="kt-verdict ' + b.k + '"><b>' + b.t + ' · ' + n.test + ' of 6</b><p>' + esc(b.d) + '</p></div>' : '<p class="kt-fine">Answer all six to get a verdict.</p>');
    el.dataset.node = n.id;
  }

  function briefData() {
    var L = leaves(), w = whatIf(), cs = checks(), open = cs.filter(function (c) { return !c.ok; });
    var cat = flat().map(function (x) { var c = catchFor(x.n); return c ? { n: x.n, c: c, has: pairPresent(c, x.n) } : null; }).filter(Boolean);
    var acts = L.filter(function (x) { return x.n.decision.trim(); }).slice(0, 4).map(function (x) { return (ownerOf(x.n.id).o || 'Owner to confirm') + ': if ' + x.n.name + ' moves, ' + x.n.decision.replace(/^we would\s*/i, '').replace(/\.$/, '') + '.'; });
    var maxD = flat().reduce(function (a, x) { return Math.max(a, x.d); }, 0);
    return {
      title: S.tree.name || 'Our outcome',
      decision: S.decision.trim() || 'Not written yet. Agree the decision before the next review.',
      problem: 'We judge this on ' + (S.tree.name || 'one outcome') + '. It breaks into ' + (flat().length - 1) + ' measures across ' + (maxD + 1) + ' levels, with ' + L.length + ' levers a team can act on.',
      evidence: (w.rows.length ? 'A 10% move in ' + w.rows[0].n.name + ' shifts ' + (S.tree.name || 'the outcome') + ' by ' + pctTxt(w.rows[0].d) + (w.rows[1] ? '; ' + w.rows[1].n.name + ' by ' + pctTxt(w.rows[1].d) : '') + '.' + (S.tpl ? ' (Illustrative values.)' : '') : 'No values yet, so the tree shows structure, not size.') + (cat.length ? ' ' + cat.length + ' measure' + (cat.length > 1 ? 's carry' : ' carries') + ' a known catch: ' + cat.map(function (c) { return c.n.name; }).join(', ') + '.' : ''),
      implication: open.length ? open.length + ' of ' + cs.length + ' checks are still open: ' + open.slice(0, 4).map(function (c) { return c.title.toLowerCase(); }).join('; ') + (open.length > 4 ? '; and more' : '') + '. Treat the tree as a draft until they close.' : 'All ' + cs.length + ' checks pass. The tree is ready to run a review from.',
      actions: acts.length ? acts : ['Give each lever an owner and a "we would\u2026" sentence before the next review.'],
      cadence: 'Review the levers at the pace you can act on them. Review the structure every quarter.'
    };
  }
  function renderBrief() {
    var b = briefData();
    $('#kt-brief').innerHTML = '<p class="kt-brief-k">One-page brief</p><h3>' + esc(b.title) + '</h3><dl><dt>Decision</dt><dd>' + esc(b.decision) + '</dd><dt>Problem</dt><dd>' + esc(b.problem) + '</dd><dt>Evidence</dt><dd>' + esc(b.evidence) + '</dd><dt>Implication</dt><dd>' + esc(b.implication) + '</dd><dt>Action</dt><dd><ul>' + b.actions.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>' + esc(b.cadence) + '</dd></dl>';
    if (!captionDirty) $('#kt-caption').value = caption();
  }
  function caption() {
    var w = whatIf(), cat = flat().map(function (x) { return catchFor(x.n) ? x.n : null; }).filter(Boolean);
    var lines = ['I mapped ' + (S.tree.name || 'our main outcome') + ' as a KPI tree this week.', ''];
    if (w.rows.length) lines.push('The lever that moves it most: ' + w.rows[0].n.name + '. Not the one we spend most meetings on.');
    if (cat.length) lines.push('The catch I nearly missed: ' + catchFor(cat[0]).hides);
    lines.push('Every box now has an owner and a "we would\u2026" sentence. Anything without one came off.', '', 'Free, private, ten minutes: philpegram.com/kpi-tree');
    return lines.join('\n');
  }

  function render(focusId) {
    renderTree(focusId); renderEditor(); renderChecks();
    if (step === 'challenge') { renderWhatIf(); renderMonday(); }
    if (step === 'share') renderBrief();
    if (document.activeElement !== $('#kt-decision')) $('#kt-decision').value = S.decision;
    save();
  }

  /* ---------- Actions ---------- */
  function select(id, field, more) {
    sel = id; if (step !== 'shape') setStep('shape', true);
    render(id);
    if (more) $('#kt-more').open = true;
    var el = document.querySelector('.kt-node[data-id="' + id + '"]');
    var c = $('#kt-canvas'); if (c.scrollWidth <= c.clientWidth + 2) c.scrollLeft = 0; else if (el && el.offsetParent) { var r = el.getBoundingClientRect(), cr = c.getBoundingClientRect(); if (r.right > cr.right || r.left < cr.left) c.scrollLeft += r.left - cr.left - 40; }
    if (field) setTimeout(function () { var f = document.getElementById(field); if (f) { f.focus({ preventScroll: window.matchMedia('(max-width: 900px)').matches }); if (!window.matchMedia('(max-width: 900px)').matches) f.scrollIntoView({ block: 'nearest' }); } }, 30);
  }
  function addChild(id) {
    var x = find(id); if (!x) return; snapshot();
    var k = N('', { op: 'mul' }); k.id = nid(); x.n.kids.push(k);
    if (x.n.kids.length === 1 && x.n.op === 'inf') x.n.op = 'inf';
    select(k.id, 'f-name'); edited();
  }
  function addSib(id) {
    var x = find(id); if (!x || !x.p) return; snapshot();
    var k = N(''); k.id = nid(); x.p.kids.splice(x.p.kids.indexOf(x.n) + 1, 0, k);
    select(k.id, 'f-name'); edited();
  }
  function addPair(id) {
    var x = find(id), c = x && catchFor(x.n); if (!c) return; snapshot();
    var k = N(c.pair.name, { timing: 'lead', def: '' }); k.id = nid(); k.guard = true;
    if (x.p) x.p.kids.splice(x.p.kids.indexOf(x.n) + 1, 0, k); else x.n.kids.push(k);
    toast('Added \u201c' + c.pair.name + '\u201d as a guardrail. It sits beside the formula, not inside it.');
    select(k.id); edited();
  }
  function del(id) {
    var x = find(id); if (!x || !x.p) return;
    if (x.n.kids.length && !confirm('Delete \u201c' + (x.n.name || 'this box') + '\u201d and the ' + countBelow(x.n) + ' boxes beneath it?')) return;
    snapshot(); x.p.kids.splice(x.p.kids.indexOf(x.n), 1); sel = x.p.id; render(); edited();
  }
  function countBelow(n) { var c = 0; walk(n, function () { c++; }); return c - 1; }
  function edited() { if (!firstEdit) { firstEdit = true; track('KPI tree first edit'); } }
  function doFix(id) {
    var c = checks().filter(function (x) { return x.id === id; })[0]; if (!c || !c.fix) return;
    var f = c.fix;
    if (f.field === 'kt-decision') { var d = $('#kt-decision'); d.focus(); d.scrollIntoView({ block: 'center', behavior: 'smooth' }); d.classList.add('pulse'); setTimeout(function () { d.classList.remove('pulse'); }, 1600); return; }
    if (f.act === 'monday') { setStep('challenge'); setTimeout(function () { var m = $('#kt-monday'); if (m) { m.scrollIntoView({ block: 'start', behavior: 'smooth' }); var b = m.querySelector('button[data-q]'); if (b) b.focus({ preventScroll: true }); } }, 40); return; }
    if (f.act === 'child') { addChild(f.node); return; }
    if (f.act === 'pair') { addPair(f.node); return; }
    if (f.node) select(f.node, f.field, f.more);
    else if (id === 'size') setStep('shape');
  }
  function setStep(s, quiet) {
    step = s;
    $$('.kt-step').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.step === s)); });
    $$('.kt-pane').forEach(function (p) { p.hidden = p.dataset.pane !== s; });
    if (s !== 'shape') document.body.classList.remove('kt-sheet');
    if (s === 'share') track('KPI tree reached share');
    if (!quiet) { render(); if (s !== 'shape' && window.matchMedia('(max-width: 900px)').matches) $('#kt-panel').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }
  function toast(t) { var el = $('#kt-toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('on'); }, 3600); }

  function start(obj, how) {
    load(obj); undo = []; $('#kt-undo').disabled = true; skipped = {}; captionDirty = false; sel = null;
    $('#kt-app').hidden = false; setStep('shape', true); render();
    var c = $('#kt-canvas'), r = c.querySelector('.kt-chart [data-id]'); if (r && r.offsetParent) c.scrollTop = Math.max(0, r.offsetTop + r.offsetHeight / 2 - c.clientHeight / 2);
    track('KPI tree start', { how: how });
    setTimeout(function () { $('#kt-app').scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30);
  }
  function fromTemplate(id) { var t = TEMPLATES.filter(function (x) { return x.id === id; })[0]; var tree = assignIds(t.build()); start({ tree: tree, decision: t.decision, tpl: t.id }, t.id); }
  function fromOutcome(name) {
    var tree = assignIds(N(name, { op: 'inf' }, [N(''), N('')]));
    start({ tree: tree, decision: '', tpl: '' }, 'own');
    sel = tree.kids[0].id; render(sel); setTimeout(function () { $('#f-name').focus({ preventScroll: true }); }, 400);
  }

  /* ---------- Exports ---------- */
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64d(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }
  function slim(n) { var o = { a: n.name }; if (n.guard) o.g = 1; if (n.owner) o.o = n.owner; if (n.decision) o.d = n.decision; if (n.def) o.f = n.def; if (n.value) o.v = n.value; if (n.op !== 'mul') o.p = n.op; if (n.timing === 'lead') o.t = 1; if (n.test != null) o.s = n.test; if (n.kids.length) o.k = n.kids.map(slim); return o; }
  function fat(o) { var n = N(o.a || '', { owner: o.o, decision: o.d, def: o.f, value: o.v, op: o.p || 'mul', timing: o.t ? 'lead' : 'lag' }, (o.k || []).map(fat)); if (o.s != null) n.test = o.s; if (o.g) n.guard = true; return n; }
  function shareLink() { return location.origin + location.pathname + '#t=' + b64e(JSON.stringify({ x: S.decision, r: slim(S.tree) })); }
  function copy(text, msg) {
    function ok() { toast(msg); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fallback); else fallback();
    function fallback() { var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast('Copy failed. Select the text and copy it yourself.'); } document.body.removeChild(t); }
  }
  function download(name, blob) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function slug() { return (S.tree.name || 'kpi-tree').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'kpi-tree'; }
  function briefText() { var b = briefData(); return b.title + '\n\nDecision: ' + b.decision + '\nProblem: ' + b.problem + '\nEvidence: ' + b.evidence + '\nImplication: ' + b.implication + '\nAction:\n' + b.actions.map(function (a) { return '- ' + a; }).join('\n') + '\n' + b.cadence + '\n\nBuilt with the KPI Tree Workshop: philpegram.com/kpi-tree'; }
  function markdown() {
    var b = briefData(), s = '# ' + b.title + '\n\n**Decision:** ' + b.decision + '\n\n**Problem:** ' + b.problem + '\n\n**Evidence:** ' + b.evidence + '\n\n**Implication:** ' + b.implication + '\n\n**Action:**\n' + b.actions.map(function (a) { return '- ' + a; }).join('\n') + '\n\n' + b.cadence + '\n\n## The tree\n\n';
    walk(S.tree, function (n, p, d) { var ow = ownerOf(n.id).o, v = calc(n); s += new Array(d + 1).join('  ') + '- ' + (n.name || 'Unnamed') + (p ? ' (' + OPS[p.op] + ')' : '') + (ow ? ' · owner: ' + ow : '') + (v ? ' · ' + fmt(v) : '') + (n.decision ? ' · we would ' + n.decision.replace(/^we would\s*/i, '') : '') + '\n'; });
    return s + '\nBuilt with the KPI Tree Workshop: https://philpegram.com/kpi-tree\n';
  }
  function csv() {
    var rows = [['id', 'parent', 'level', 'metric', 'owner', 'owner_inherited', 'if_it_moved_we_would', 'definition', 'value', 'children_combine', 'timing', 'catch', 'monday_test']];
    walk(S.tree, function (n, p, d) { var ow = ownerOf(n.id), c = catchFor(n), v = calc(n); rows.push([n.id, p ? p.id : '', d, n.name, ow.o, ow.inh ? 'yes' : 'no', n.decision, n.def, v ? fmt(v) : '', n.kids.length ? n.op : '', n.timing === 'lead' ? 'leading' : 'lagging', c ? c.pair.name : '', n.test != null ? band(n.test).t + ' ' + n.test + '/6' : '']); });
    return rows.map(function (r) { return r.map(function (c) { c = String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
  }
  function wrap(ctx, text, maxW, maxLines) {
    var words = String(text).split(/\s+/), lines = [], line = '';
    words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line);
    if (lines.length > maxLines) { lines = lines.slice(0, maxLines); var l = lines[maxLines - 1]; while (ctx.measureText(l + '…').width > maxW && l.length) l = l.slice(0, -1); lines[maxLines - 1] = l + '…'; }
    return lines;
  }
  function png() {
    var font = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
    var go = function () {
      var bw = 250, bh = 92, L = layout(S.tree, bw, bh, 64, 16), pad = 64, head = 170, foot = 76;
      var cw = Math.max(1080, L.w + pad * 2), ch = head + L.h + foot + pad, ox = (cw - L.w) / 2, oy = head;
      var scale = Math.min(2, 8000 / Math.max(cw, ch));
      var cv = document.createElement('canvas'); cv.width = Math.round(cw * scale); cv.height = Math.round(ch * scale);
      var c = cv.getContext('2d'); c.scale(scale, scale);
      c.fillStyle = '#1c2240'; c.fillRect(0, 0, cw, ch);
      c.fillStyle = '#f49ab8'; c.font = '600 18px ' + font; c.fillText('KPI TREE', pad, 58);
      c.fillStyle = '#f7f4ec'; c.font = '700 38px ' + font; c.fillText(wrap(c, S.tree.name || 'Our outcome', cw - pad * 2, 1)[0], pad, 102);
      c.fillStyle = '#bbc0d0'; c.font = '400 19px ' + font; wrap(c, S.decision ? 'Decision: ' + S.decision : 'Every box has an owner and a decision it informs.', cw - pad * 2, 2).forEach(function (l, i) { c.fillText(l, pad, 134 + i * 25); });
      walk(S.tree, function (n) {
        var q = L.pos[n.id]; if (!n.kids.length) return;
        var x1 = ox + q.x + bw, y1 = oy + q.y + bh / 2;
        n.kids.forEach(function (k) { var r = L.pos[k.id], x2 = ox + r.x, y2 = oy + r.y + bh / 2, mx = x1 + 32; c.beginPath(); c.setLineDash(k.guard ? [2, 5] : n.op === 'inf' ? [6, 6] : []); c.strokeStyle = 'rgba(247,244,236,.45)'; c.lineWidth = 2; c.moveTo(x1, y1); c.bezierCurveTo(mx, y1, mx, y2, x2, y2); c.stroke(); });
        c.setLineDash([]); c.fillStyle = '#f49ab8'; c.beginPath(); c.arc(x1 + 14, y1, 12, 0, Math.PI * 2); c.fill(); c.fillStyle = '#1c2240'; c.font = '700 15px ' + font; c.textAlign = 'center'; c.fillText(OPS[n.op], x1 + 14, y1 + 5); c.textAlign = 'left';
      });
      walk(S.tree, function (n, p, d) {
        var q = L.pos[n.id], x = ox + q.x, y = oy + q.y, leaf = d > 0 && !n.kids.length;
        c.fillStyle = d === 0 ? '#f49ab8' : '#f7f4ec'; roundRect(c, x, y, bw, bh, 12); c.fill();
        if (leaf) { c.fillStyle = '#f49ab8'; c.fillRect(x, y + 12, 5, bh - 24); }
        c.fillStyle = '#1c2240'; c.font = '700 16px ' + font;
        var lines = wrap(c, n.name || 'Unnamed', bw - 36, 2); lines.forEach(function (l, i) { c.fillText(l, x + 16, y + 26 + i * 20); });
        var ow = ownerOf(n.id).o, v = calc(n); c.font = '400 13px ' + font; c.fillStyle = '#444961';
        var meta = [ow, v ? fmt(v) : ''].filter(Boolean).join('  ·  '); if (meta) c.fillText(wrap(c, meta, bw - 30, 1)[0], x + 16, y + bh - 14);
        if (catchFor(n)) { c.fillStyle = '#f49ab8'; c.beginPath(); c.arc(x + bw - 16, y + 16, 10, 0, Math.PI * 2); c.fill(); c.fillStyle = '#1c2240'; c.font = '800 13px ' + font; c.textAlign = 'center'; c.fillText('!', x + bw - 16, y + 21); c.textAlign = 'left'; }
      });
      c.fillStyle = '#bbc0d0'; c.font = '400 15px ' + font; c.fillText('Solid: adds up or multiplies.  Dashed: a belief to test.  Dotted: a guardrail.  ! = has a catch', pad, ch - 40);
      c.fillStyle = '#f49ab8'; c.font = '600 16px ' + font; c.textAlign = 'right'; c.fillText('Built with the KPI Tree Workshop · philpegram.com/kpi-tree', cw - pad, ch - 40); c.textAlign = 'left';
      cv.toBlob(function (b) { if (b) { download(slug() + '-kpi-tree.png', b); toast('Picture downloaded.'); } else toast('Your browser blocked the picture. Try another browser.'); }, 'image/png');
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go, go); else go();
  }
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function doExport(kind) {
    track('KPI tree export', { kind: kind });
    if (kind === 'png') png();
    else if (kind === 'brief') copy(briefText(), 'Brief copied. Paste it into an email or a doc.');
    else if (kind === 'link') copy(shareLink(), 'Link copied. Anyone who opens it gets their own copy of this tree.');
    else if (kind === 'caption') { captionDirty = true; copy($('#kt-caption').value, 'Caption copied. Post the picture with it, and put the link in the first comment.'); }
    else if (kind === 'csv') { download(slug() + '-kpi-tree.csv', new Blob([csv()], { type: 'text/csv' })); toast('CSV downloaded.'); }
    else if (kind === 'md') { download(slug() + '-kpi-tree.md', new Blob([markdown()], { type: 'text/markdown' })); toast('Markdown downloaded.'); }
    else if (kind === 'print') { renderBrief(); window.print(); }
  }

  /* ---------- Hero ---------- */
  function mini(tree) {
    var L = layout(tree, 40, 12, 18, 6), s = '';
    walk(tree, function (n, p, d) { var q = L.pos[n.id]; n.kids.forEach(function (k) { var r = L.pos[k.id]; s += '<path d="M' + (q.x + 40) + ' ' + (q.y + 6) + 'C' + (q.x + 49) + ' ' + (q.y + 6) + ' ' + (r.x - 9) + ' ' + (r.y + 6) + ' ' + r.x + ' ' + (r.y + 6) + '"' + (n.op === 'inf' ? ' stroke-dasharray="3 3"' : '') + '/>'; }); });
    walk(tree, function (n, p, d) { var q = L.pos[n.id]; s += '<rect x="' + q.x + '" y="' + q.y + '" width="40" height="12" rx="3" class="' + (d === 0 ? 'r' : (!n.kids.length ? 'l' : '')) + (catchFor(n) ? ' c' : '') + '"/>'; });
    return '<svg viewBox="-2 -2 ' + (L.w + 4) + ' ' + (L.h + 4) + '" aria-hidden="true">' + s + '</svg>';
  }
  function hero() {
    $('#kt-starts').innerHTML = TEMPLATES.map(function (t) {
      var tree = assignIds(t.build()), cnt = 0, catches = 0; walk(tree, function (n) { cnt++; if (catchFor(n)) catches++; });
      return '<button type="button" class="kt-start" role="listitem" data-tpl="' + t.id + '"><span class="kt-start-mini">' + mini(tree) + '</span><b>' + esc(t.title) + '</b><span>' + esc(t.blurb) + '</span><small>' + cnt + ' boxes · ' + catches + ' hidden catches · starts with ' + esc(tree.name) + '</small><i>Start with this ›</i></button>';
    }).join('');
    seq = 1;
  }

  /* ---------- Catch game ---------- */
  var cgi = Math.floor(Math.random() * CATCHES.length);
  function cg() { var c = CATCHES[cgi % CATCHES.length]; $('#kt-cg').innerHTML = '<p class="kt-cg-k">Spot the catch</p><p class="kt-cg-m">' + esc(c.name) + ' went up.</p><p><span>Looks like</span>' + esc(c.looks) + '</p><p><span>Could mean</span>' + esc(c.hides) + '</p><p><span>Pair it with</span>' + esc(c.pair.name) + '</p>'; }

  /* ---------- Wire up ---------- */
  function init() {
    hero(); cg();
    $('#kt-cg-next').addEventListener('click', function () { cgi++; cg(); track('KPI tree catch card'); });
    $('#kt-starts').addEventListener('click', function (e) { var b = e.target.closest('[data-tpl]'); if (b) fromTemplate(b.dataset.tpl); });
    $('#kt-own').addEventListener('submit', function (e) { e.preventDefault(); var v = $('#kt-own-input').value.trim(); if (!v) { $('#kt-own-input').focus(); return; } fromOutcome(v); });
    $('#kt-resume-btn').addEventListener('click', function () { try { var o = JSON.parse(localStorage.getItem(KEY)); start(o, 'resume'); } catch (e) {} });
    $$('.kt-step').forEach(function (b) { b.addEventListener('click', function () { setStep(b.dataset.step); }); });
    $('.kt-steps').addEventListener('keydown', function (e) { if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; var t = $$('.kt-step'), i = t.indexOf(document.activeElement); if (i < 0) return; var j = (i + (e.key === 'ArrowRight' ? 1 : -1) + t.length) % t.length; t[j].focus(); setStep(t[j].dataset.step); });
    $('#kt-canvas').addEventListener('click', function (e) { var b = e.target.closest('[data-id]'); if (b) select(b.dataset.id); });
    $('#kt-coach-do').addEventListener('click', function () { var f = $('#kt-coach').dataset.fix; if (f === '__share') { setStep('share'); $('#kt-app').scrollIntoView({ behavior: 'smooth' }); } else doFix(f); });
    $('#kt-coach-skip').addEventListener('click', function () { skipped[$('#kt-coach').dataset.fix] = 1; renderChecks(); });
    $('#kt-undo').addEventListener('click', function () { if (!undo.length) return; var o = JSON.parse(undo.pop()); S = o; if (!find(sel || '')) sel = null; $('#kt-undo').disabled = !undo.length; render(); toast('Undone.'); });
    $('#kt-restart').addEventListener('click', function () { if (!confirm('Start again? This clears the tree saved in this browser.')) return; try { localStorage.removeItem(KEY); } catch (e) {} $('#kt-app').hidden = true; $('#kt-resume').hidden = true; document.body.classList.remove('kt-sheet'); history.replaceState(null, '', location.pathname); $('#start').scrollIntoView({ behavior: 'smooth' }); });
    $('#kt-decision').addEventListener('focus', snapshot);
    $('#kt-decision').addEventListener('input', function (e) { S.decision = e.target.value; edited(); renderChecks(); save(); });
    var map = { 'f-name': 'name', 'f-owner': 'owner', 'f-decision': 'decision', 'f-def': 'def', 'f-value': 'value' };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener('focus', function () { if (sel) snapshot(); });
      el.addEventListener('input', function () { var x = sel && find(sel); if (!x) return; x.n[map[id]] = el.value; edited(); renderTree(); renderChecks(); if (id === 'f-name' || id === 'f-owner') { var keep = el.selectionStart; renderEditor(); try { el.setSelectionRange(keep, keep); } catch (e) {} } save(); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); var order = ['f-name', 'f-owner', 'f-decision']; var i = order.indexOf(id); if (i >= 0 && i < 2) document.getElementById(order[i + 1]).focus(); else el.blur(); } });
    });
    ['f-op', 'f-timing'].forEach(function (id) { document.getElementById(id).addEventListener('change', function (e) { var x = sel && find(sel); if (!x) return; snapshot(); x.n[id === 'f-op' ? 'op' : 'timing'] = e.target.value; edited(); render(); }); });
    $('#kt-add-child').addEventListener('click', function () { if (sel) addChild(sel); });
    $('#kt-add-sib').addEventListener('click', function () { if (sel) addSib(sel); });
    $('#kt-del').addEventListener('click', function () { if (sel) del(sel); });
    $('#kt-close').addEventListener('click', function () { sel = null; render(); });
    $('#kt-catch').addEventListener('click', function (e) { var b = e.target.closest('[data-pair]'); if (b) addPair(b.dataset.pair); });
    $('#kt-checks').addEventListener('click', function (e) { var b = e.target.closest('[data-fix]'); if (b) doFix(b.dataset.fix); });
    $('#kt-whatif').addEventListener('click', function (e) { var b = e.target.closest('[data-goto]'); if (b) select(b.dataset.goto, 'f-value', true); });
    $('#kt-monday').addEventListener('change', function (e) { if (e.target.id === 'kt-m-pick') { sel = e.target.value; renderTree(); renderMonday(); } });
    $('#kt-monday').addEventListener('click', function (e) {
      var b = e.target.closest('[data-q]'); if (!b) return; var x = find($('#kt-monday').dataset.node); if (!x) return;
      var a = x.n.answers || []; a[+b.dataset.q] = +b.dataset.a; x.n.answers = a;
      var done = MONDAY.every(function (q, i) { return a[i] === 0 || a[i] === 1; });
      x.n.test = done ? a.reduce(function (s, v) { return s + v; }, 0) : null;
      if (done) track('KPI tree monday test', { band: band(x.n.test).t });
      var y = window.scrollY; renderTree(); renderChecks(); renderMonday(); save(); window.scrollTo(0, y);
      var nb = document.querySelector('#kt-monday [data-q="' + b.dataset.q + '"][data-a="' + b.dataset.a + '"]'); if (nb) nb.focus({ preventScroll: true });
    });
    $$('[data-export]').forEach(function (b) { b.addEventListener('click', function () { doExport(b.dataset.export); }); });
    $('#kt-caption').addEventListener('input', function () { captionDirty = true; });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('kt-sheet')) { sel = null; render(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '') && !$('#kt-app').hidden) { e.preventDefault(); $('#kt-undo').click(); }
    });
    var rz; window.addEventListener('resize', function () { if (!S || $('#kt-app').hidden) return; clearTimeout(rz); rz = setTimeout(function () { renderTree(); renderEditor(); }, 120); });

    // shared link, then saved tree
    var m = /#t=([A-Za-z0-9_-]+)/.exec(location.hash);
    if (m) { try { var o = JSON.parse(b64d(m[1])); var tree = fat(o.r); seq = 1; assignIds(tree); start({ tree: tree, decision: o.x || '' }, 'link'); toast('Opened a shared tree. Your changes stay in your browser.'); history.replaceState(null, '', location.pathname); return; } catch (e) {} }
    try { var saved = localStorage.getItem(KEY); if (saved && JSON.parse(saved).tree) $('#kt-resume').hidden = false; } catch (e) {}
  }
  window.__kpi = { checks: function () { return checks(); }, state: function () { return S; }, whatIf: function () { return whatIf(); }, fix: doFix, csv: function () { return csv(); }, md: function () { return markdown(); }, link: function () { return shareLink(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
