(function () {
  'use strict';

  var TIME_LIMIT = 45;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* ---------- SVG helpers ---------- */
  function matrixTile(pos, filled, tally, size) {
    var c = [{ x: 30, y: 30 }, { x: 70, y: 30 }, { x: 70, y: 62 }, { x: 30, y: 62 }][pos % 4];
    var node = filled
      ? '<circle cx="' + c.x + '" cy="' + c.y + '" r="10" fill="#1c2240"/>'
      : '<circle cx="' + c.x + '" cy="' + c.y + '" r="9" fill="#fff" stroke="#1c2240" stroke-width="3"/>';
    var bars = '';
    for (var i = 0; i < tally; i++) {
      var x = 20 + i * 14;
      bars += '<line x1="' + x + '" y1="80" x2="' + x + '" y2="91" stroke="#b45309" stroke-width="3.5" stroke-linecap="round"/>';
    }
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" fill="none" aria-hidden="true" focusable="false">' +
      '<rect x="6" y="6" width="88" height="88" rx="8" fill="#fff" stroke="#1c2240" stroke-width="2.5"/>' +
      '<line x1="14" y1="74" x2="86" y2="74" stroke="#c9ccd6" stroke-width="1.5"/>' +
      '<line x1="50" y1="14" x2="50" y2="70" stroke="#c9ccd6" stroke-width="1" stroke-dasharray="3 3"/>' +
      '<line x1="16" y1="46" x2="84" y2="46" stroke="#c9ccd6" stroke-width="1" stroke-dasharray="3 3"/>' +
      node + bars + '</svg>';
  }

  function polygonDots(shape, dots, size) {
    var poly = {
      pentagon: '<polygon points="50,14 86,40 72,82 28,82 14,40" fill="#f7f4ec" stroke="#1c2240" stroke-width="2.8" stroke-linejoin="round"/>',
      hexagon: '<polygon points="50,12 84,31 84,69 50,88 16,69 16,31" fill="#f7f4ec" stroke="#1c2240" stroke-width="2.8" stroke-linejoin="round"/>',
      triangle: '<polygon points="50,14 88,82 12,82" fill="#f7f4ec" stroke="#1c2240" stroke-width="2.8" stroke-linejoin="round"/>',
      square: '<rect x="18" y="18" width="64" height="64" fill="#f7f4ec" stroke="#1c2240" stroke-width="2.8" stroke-linejoin="round"/>'
    }[shape];
    var pos = {
      2: [[40, 50], [60, 50]],
      3: [[50, 42], [38, 62], [62, 62]],
      4: [[39, 40], [61, 40], [39, 60], [61, 60]]
    }[dots] || [];
    var d = pos.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4.8" fill="#4f46e5"/>'; }).join('');
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" fill="none" aria-hidden="true" focusable="false">' + poly + d + '</svg>';
  }

  function shapeTrio(items) {
    var slots = [28, 75, 122];
    var m = items.map(function (it, i) {
      var cx = slots[i], fill = it.filled ? '#1c2240' : '#fff';
      if (it.shape === 'circle') return '<circle cx="' + cx + '" cy="26" r="11" fill="' + fill + '" stroke="#1c2240" stroke-width="2.5"/>';
      if (it.shape === 'square') return '<rect x="' + (cx - 10) + '" y="16" width="20" height="20" rx="2" fill="' + fill + '" stroke="#1c2240" stroke-width="2.5"/>';
      return '<polygon points="' + cx + ',14 ' + (cx + 12) + ',36 ' + (cx - 12) + ',36" fill="' + fill + '" stroke="#1c2240" stroke-width="2.5" stroke-linejoin="round"/>';
    }).join('');
    return '<svg width="150" height="52" viewBox="0 0 150 52" fill="none" aria-hidden="true" focusable="false">' +
      '<rect x="2" y="2" width="146" height="48" rx="6" fill="#fff" stroke="#c9ccd6" stroke-width="1.5"/>' + m + '</svg>';
  }

  /* ---------- Questions ---------- */
  var QUESTIONS = [
    {
      id: 1, battery: 'verbal', batteryIndex: '01', batteryName: 'Verbal & deductive logic', subType: 'Word meaning', scored: true,
      stimulusHTML:
        '<div class="dp-pair"><div><span class="dp-tag">Group A</span><strong>(rigorous, tentative, partial)</strong></div>' +
        '<div><span class="dp-tag">Group B</span><strong>(exacting, decisive, lavish)</strong></div></div>',
      prompt: 'Choose the pair, one word from each group, that are closest in meaning.',
      options: [
        { key: 'A', label: 'rigorous and exacting' },
        { key: 'B', label: 'tentative and decisive' },
        { key: 'C', label: 'partial and lavish' },
        { key: 'D', label: 'rigorous and decisive' }
      ],
      correctKey: 'A',
      explanation: '"Rigorous" (strict, thorough, careful about detail) and "exacting" (demanding precision) are near-synonyms. "Tentative" and "decisive" are opposites, and "partial" and "lavish" have no shared meaning.'
    },
    {
      id: 2, battery: 'verbal', batteryIndex: '01', batteryName: 'Verbal & deductive logic', subType: 'Deductive reasoning', scored: true,
      stimulusHTML:
        '<div class="dp-passage"><span class="dp-tag">Briefing passage</span><p>"Organisations rarely fail because they lack data; they fail because analytical output is divorced from decision ownership. Commissioning additional research when governance is unclear increases reporting volume without improving commercial outcomes."</p></div>',
      prompt: 'Assuming the passage is strictly true, which conclusion necessarily follows?',
      options: [
        { key: 'A', label: 'Increasing data volume automatically improves commercial outcomes when governance is clear.' },
        { key: 'B', label: 'Commissioning new research under unclear governance will increase reporting output without improving commercial results.' },
        { key: 'C', label: 'Most organisations need fewer analysts and more senior commercial managers.' },
        { key: 'D', label: 'Commercial outcomes depend entirely on research commissioning budgets.' }
      ],
      correctKey: 'B',
      explanation: 'Only the second option restates what the passage supports. The first assumes the reverse of the passage holds (if unclear governance blocks improvement, clear governance does not automatically deliver it). The others introduce claims the passage never makes.'
    },
    {
      id: 3, battery: 'verbal', batteryIndex: '01', batteryName: 'Verbal & deductive logic', subType: 'Opposites', scored: true,
      stimulusHTML: null,
      prompt: 'Select the word that is most nearly OPPOSITE in meaning to: TACITURN',
      options: [
        { key: 'A', label: 'Reticent' },
        { key: 'B', label: 'Forthcoming' },
        { key: 'C', label: 'Methodical' },
        { key: 'D', label: 'Equivocal' }
      ],
      correctKey: 'B',
      explanation: '"Taciturn" means reserved and uncommunicative. "Forthcoming" (willing to share information) is its opposite. "Reticent" is a near-synonym of taciturn.'
    },
    {
      id: 4, battery: 'numerical', batteryIndex: '02', batteryName: 'Numerical & data fluency', subType: 'Number sequence', scored: true,
      stimulusHTML:
        '<div class="dp-seq" role="img" aria-label="Sequence: 4, 9, 19, 39, 79, then a question mark">' +
        [4, 9, 19, 39, 79].map(function (n) { return '<span>' + n + '</span>'; }).join('<i aria-hidden="true">→</i>') +
        '<i aria-hidden="true">→</i><span class="dp-q">?</span></div>',
      prompt: 'Find the next number in the sequence.',
      options: [
        { key: 'A', label: '149' }, { key: 'B', label: '158' }, { key: 'C', label: '159' }, { key: 'D', label: '161' }
      ],
      correctKey: 'C',
      explanation: 'The differences double each time: +5, +10, +20, +40, so the next is +80 and 79 + 80 = 159. Equivalently, each term is double the previous one plus 1.'
    },
    {
      id: 5, battery: 'numerical', batteryIndex: '02', batteryName: 'Numerical & data fluency', subType: 'Commercial data interpretation', scored: true,
      stimulusHTML:
        '<div class="dp-table-wrap"><table class="dp-table"><thead><tr><th>Acquisition channel</th><th>Total sessions</th><th>Conversion rate</th><th>Average order value</th></tr></thead>' +
        '<tbody><tr><td>Channel Alpha</td><td>12,000</td><td>3.5%</td><td>£40</td></tr><tr><td>Channel Beta</td><td>8,000</td><td>4.5%</td><td>£50</td></tr></tbody></table></div>',
      prompt: 'What is the difference in total revenue between Channel Beta and Channel Alpha?',
      options: [
        { key: 'A', label: '£1,200 more for Channel Beta' },
        { key: 'B', label: '£1,200 more for Channel Alpha' },
        { key: 'C', label: '£1,800 more for Channel Beta' },
        { key: 'D', label: 'They generate identical revenue' }
      ],
      correctKey: 'A',
      explanation: 'Alpha: 12,000 × 3.5% = 420 orders × £40 = £16,800. Beta: 8,000 × 4.5% = 360 orders × £50 = £18,000. Beta generates £1,200 more.'
    },
    {
      id: 6, battery: 'numerical', batteryIndex: '02', batteryName: 'Numerical & data fluency', subType: 'Rate problem', scored: true,
      stimulusHTML: null,
      prompt: 'An analytics pipeline processes 450,000 events in 15 minutes using 3 worker nodes. At the same rate per node, how many events will 5 nodes process in 20 minutes?',
      options: [
        { key: 'A', label: '750,000' }, { key: 'B', label: '900,000' }, { key: 'C', label: '1,000,000' }, { key: 'D', label: '1,125,000' }
      ],
      correctKey: 'C',
      explanation: '450,000 ÷ 3 nodes ÷ 15 minutes = 10,000 events per node per minute. Then 5 nodes × 20 minutes × 10,000 = 1,000,000.'
    },
    {
      id: 7, battery: 'abstract', batteryIndex: '03', batteryName: 'Abstract & diagrammatic', subType: 'Visual series', scored: true,
      stimulusHTML:
        '<div class="dp-series"><span class="dp-tag">Series, left to right</span><div class="dp-series-row">' +
        [[0, true, 1], [1, false, 2], [2, true, 3], [3, false, 4]].map(function (t, i) {
          return '<div>' + matrixTile(t[0], t[1], t[2], 80) + '<small>Step ' + (i + 1) + '</small></div>';
        }).join('') +
        '<div><div class="dp-blank">?</div><small>Step 5</small></div></div></div>',
      prompt: 'Which figure completes Step 5?',
      visual: true,
      options: [
        { key: 'A', label: 'Top-left, filled, 5 bars', svg: matrixTile(0, true, 5, 84) },
        { key: 'B', label: 'Top-left, hollow, 5 bars', svg: matrixTile(0, false, 5, 84) },
        { key: 'C', label: 'Top-right, filled, 5 bars', svg: matrixTile(1, true, 5, 84) },
        { key: 'D', label: 'Top-left, filled, 4 bars', svg: matrixTile(0, true, 4, 84) }
      ],
      correctKey: 'A',
      explanation: 'Three rules run together. The circle moves a quarter-turn clockwise each step (top-left, top-right, bottom-right, bottom-left, then back to top-left). Its fill alternates (filled, hollow, filled, hollow, then filled). The tally bars increase by one each step, so Step 5 has five.'
    },
    {
      id: 8, battery: 'abstract', batteryIndex: '03', batteryName: 'Abstract & diagrammatic', subType: 'Odd one out', scored: true,
      stimulusHTML: null,
      prompt: 'Three of these tiles follow the same rule linking the polygon to its internal dots. Which is the odd one out?',
      visual: true,
      options: [
        { key: 'A', label: 'Figure A', svg: polygonDots('pentagon', 3, 92) },
        { key: 'B', label: 'Figure B', svg: polygonDots('hexagon', 4, 92) },
        { key: 'C', label: 'Figure C', svg: polygonDots('triangle', 3, 92) },
        { key: 'D', label: 'Figure D', svg: polygonDots('square', 2, 92) }
      ],
      correctKey: 'C',
      explanation: 'The pentagon (5 sides) has 3 dots, the hexagon (6) has 4 and the square (4) has 2, so dots = sides − 2. The triangle (3 sides) should have 1 dot but has 3.'
    },
    {
      id: 9, battery: 'abstract', batteryIndex: '03', batteryName: 'Abstract & diagrammatic', subType: 'Operator flow', scored: true,
      stimulusHTML:
        '<div class="dp-flow"><div class="dp-flow-row"><div><span class="dp-tag">Input</span>' +
        shapeTrio([{ shape: 'circle', filled: true }, { shape: 'square', filled: false }, { shape: 'triangle', filled: true }]) +
        '</div><div class="dp-gates" aria-hidden="true">→ <b>Gate Alpha</b> → <b class="b">Gate Beta</b> →</div><div><span class="dp-tag">Output</span><div class="dp-blank dp-blank-wide">? ? ?</div></div></div>' +
        '<div class="dp-rules"><p><strong>Gate Alpha:</strong> inverts the fill of every shape (filled becomes hollow, hollow becomes filled).</p>' +
        '<p><strong>Gate Beta:</strong> swaps the first and third shapes.</p></div></div>',
      prompt: 'Which output results after the input passes through Gate Alpha, then Gate Beta?',
      visual: true,
      options: [
        { key: 'A', label: 'Hollow triangle, filled square, hollow circle', svg: shapeTrio([{ shape: 'triangle', filled: false }, { shape: 'square', filled: true }, { shape: 'circle', filled: false }]) },
        { key: 'B', label: 'Filled triangle, filled square, hollow circle', svg: shapeTrio([{ shape: 'triangle', filled: true }, { shape: 'square', filled: true }, { shape: 'circle', filled: false }]) },
        { key: 'C', label: 'Hollow circle, filled square, hollow triangle', svg: shapeTrio([{ shape: 'circle', filled: false }, { shape: 'square', filled: true }, { shape: 'triangle', filled: false }]) },
        { key: 'D', label: 'Hollow triangle, hollow square, filled circle', svg: shapeTrio([{ shape: 'triangle', filled: false }, { shape: 'square', filled: false }, { shape: 'circle', filled: true }]) }
      ],
      correctKey: 'A',
      explanation: 'Input: filled circle, hollow square, filled triangle. Gate Alpha inverts the fills: hollow circle, filled square, hollow triangle. Gate Beta swaps the first and third: hollow triangle, filled square, hollow circle.'
    },
    {
      id: 10, battery: 'style', batteryIndex: '04', batteryName: 'Decision style', subType: 'Deciding under uncertainty', scored: false,
      stimulusHTML:
        '<div class="dp-passage"><span class="dp-tag">Scenario 1</span><p>A major product launch is 48 hours away. Quantitative telemetry shows a 4% checkout drop-off in a secondary browser, while qualitative user testing suggests customers are confused by a pricing tier label. Fixing either issue delays the launch by a full week.</p></div>',
      prompt: 'Which course of action best reflects your natural approach?',
      options: [
        { key: 'A', label: 'Pause the launch to isolate the root cause and validate both fixes cleanly before general release.', e: 2, g: 2, tag: 'High evidence · High governance' },
        { key: 'B', label: 'Launch on schedule to the primary browser segment while gating the affected browser behind a feature flag for live A/B testing.', e: 1, g: -2, tag: 'Iterative evidence · High autonomy' },
        { key: 'C', label: 'Patch the pricing copy immediately without delaying launch, and schedule the browser fix for the first post-launch sprint.', e: -2, g: -1, tag: 'Action velocity · Pragmatic autonomy' },
        { key: 'D', label: 'Convene product and commercial owners to sign off an explicit risk-acceptance log and revenue threshold trigger before launching on time.', e: -1, g: 2, tag: 'Commercial velocity · High governance' }
      ],
      explanation: 'There is no right answer here. The scenario shows how you trade pre-launch certainty against momentum, and whether you reach for formal control or adaptive autonomy.'
    },
    {
      id: 11, battery: 'style', batteryIndex: '04', batteryName: 'Decision style', subType: 'Challenging a stakeholder', scored: false,
      stimulusHTML:
        '<div class="dp-passage"><span class="dp-tag">Scenario 2</span><p>In an executive review, a senior stakeholder cites a strong headline conversion metric to justify doubling spend on a marketing channel. Your cohort analysis shows the lift is driven by seasonal repeat buyers rather than channel incrementality.</p></div>',
      prompt: 'How do you handle the discrepancy?',
      options: [
        { key: 'A', label: 'Raise the cohort decomposition in the meeting and recommend freezing the budget increase until incrementality is proven.', e: 2, g: 2, tag: 'Strict verification · Formal governance' },
        { key: 'B', label: 'Propose releasing 20% of the requested budget as a structured holdout test so the data settles the debate within fourteen days.', e: 2, g: -1, tag: 'Experimental rigour · Adaptive execution' },
        { key: 'C', label: 'Brief the stakeholder privately after the meeting to realign the attribution model without slowing executive momentum in the room.', e: -1, g: 1, tag: 'Diplomatic alignment · Structured control' },
        { key: 'D', label: 'Support the spend while demand is seasonally warm, but attach automated daily efficiency guardrails to claw back spend if CPA degrades.', e: -2, g: -2, tag: 'Commercial velocity · Autonomous guardrails' }
      ],
      explanation: 'There is no right answer here. The scenario shows how you apply analytical scepticism in a decision forum: through formal gatekeeping, controlled experiment, private persuasion or guardrails.'
    },
    {
      id: 12, battery: 'style', batteryIndex: '04', batteryName: 'Decision style', subType: 'Allocating a team', scored: false,
      stimulusHTML:
        '<div class="dp-passage"><span class="dp-tag">Scenario 3</span><p>Your analytics team is handed three urgent briefs on Monday morning with competing deadlines: a board retention forecast, a root-cause investigation into rising churn, and a new self-serve dashboard for operations.</p></div>',
      prompt: 'How do you structure the team response?',
      options: [
        { key: 'A', label: 'Enforce a single intake triage matrix scored by commercial decision value, requiring sponsors to trade off scope before work begins.', e: 1, g: 2, tag: 'Structured governance · High discipline' },
        { key: 'B', label: 'Put senior capacity on the churn root cause first, as understanding the driver informs both the board forecast and the operational tooling.', e: 2, g: -1, tag: 'First-principles evidence · Analytical depth' },
        { key: 'C', label: 'Ship minimum viable 80/20 outputs for the forecast and churn brief within 48 hours to buy time for the self-serve build.', e: -2, g: -2, tag: 'Rapid synthesis · High velocity' },
        { key: 'D', label: 'Freeze ad-hoc dashboard requests and standardise one canonical data model that serves both board reporting and operational self-service.', e: 1, g: 1, tag: 'Architectural permanence · System control' }
      ],
      explanation: 'There is no right answer here. The scenario shows your operating model under competing demand: triage and governance, depth first, speed first, or foundations first.'
    }
  ];

  var ARCHETYPES = {
    architect: {
      code: 'architect', quadrant: 'Evidence + governance', title: 'The Bayesian Architect',
      tagline: 'High analytical verification paired with structured governance. You build resilient decision systems before committing capital.',
      strengths: 'You separate causal signal from seasonal noise and build repeatable governance that prevents costly false positives.',
      blind: 'Under extreme time pressure, waiting for clean evidence can cost first-mover tempo.'
    },
    navigator: {
      code: 'navigator', quadrant: 'Evidence + autonomy', title: 'The Systems Navigator',
      tagline: 'Empirical, hypothesis-driven and adaptive. You favour live experiments and first-principles investigation over bureaucracy.',
      strengths: 'You turn ambiguous commercial questions into falsifiable experiments and let teams find root causes quickly.',
      blind: 'Stakeholders may need clearer signposts on where your autonomy ends and governance begins.'
    },
    verifier: {
      code: 'verifier', quadrant: 'Velocity + governance', title: 'The Deliberate Controller',
      tagline: 'Commercial momentum backed by clear risk ownership, formal guardrails and executive accountability.',
      strengths: 'You keep organisations moving on schedule while every bet has an owner, a trigger and a capped downside.',
      blind: 'Post-launch guardrails suit reversible decisions. Irreversible choices may deserve deeper verification first.'
    },
    synthesiser: {
      code: 'synthesiser', quadrant: 'Velocity + autonomy', title: 'The Rapid Synthesiser',
      tagline: 'Decisive 80/20 execution and high operational velocity. You ship, iterate in production and correct with live data.',
      strengths: 'You unblock stalled teams, focus on immediate traction and avoid analysis paralysis when directional signal is enough.',
      blind: 'Quick patches build analytical debt unless time is set aside to formalise the underlying data model.'
    }
  };

  var BATTERIES = {
    verbal: { name: 'Verbal & deductive logic', advice: 'Practise separating conclusions that must follow from those that merely seem plausible, and widen your working vocabulary of analytical terms.' },
    numerical: { name: 'Numerical & data fluency', advice: 'Work multi-step commercial problems (rates, percentage lift, revenue tables) by hand, and check second-order differences early in any sequence.' },
    abstract: { name: 'Abstract & diagrammatic', advice: 'Break each visual into single rules (rotation, fill toggle, element count) and trace each operator one transformation at a time.' }
  };

  /* ---------- State ---------- */
  var state = {
    mode: 'timed', name: '', index: 0, selected: null, responses: [],
    order: [], timerId: null, deadline: 0, startMs: 0, challenger: null, summary: null
  };

  function show(view) {
    ['dpLanding', 'dpQuiz', 'dpResults'].forEach(function (id) { $(id).hidden = id !== view; });
  }
  function top() { var h = $('dpTop'); if (h && h.scrollIntoView) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function fmtTime(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m > 0 ? m + 'm ' + (s < 10 ? '0' : '') + s + 's' : s + 's';
  }

  /* ---------- Challenge links ---------- */
  function readChallenge() {
    var p = new URLSearchParams(window.location.search);
    if (!(p.has('v') && p.has('n') && p.has('a'))) return;
    var clamp = function (x, lo, hi) { var n = parseInt(x, 10); return isNaN(n) ? lo : Math.min(hi, Math.max(lo, n)); };
    var v = clamp(p.get('v'), 0, 3), n = clamp(p.get('n'), 0, 3), a = clamp(p.get('a'), 0, 3);
    var s = p.get('s');
    state.challenger = {
      user: (p.get('u') || 'A colleague').slice(0, 28),
      total: v + n + a,
      code: ARCHETYPES[s] ? s : 'architect',
      time: clamp(p.get('t'), 0, 9999)
    };
    var c = state.challenger;
    var txt = $('dpBannerText');
    txt.textContent = '';
    var b = document.createElement('strong');
    b.textContent = c.user;
    txt.appendChild(b);
    txt.appendChild(document.createTextNode(' scored ' + c.total + '/9' + (c.time ? ' in ' + fmtTime(c.time) : '') + ' and profiled as ' + ARCHETYPES[c.code].title + '. Take the diagnostic to compare.'));
    $('dpBanner').hidden = false;
  }

  function buildChallengeUrl(s) {
    var p = new URLSearchParams();
    p.set('v', s.verbal); p.set('n', s.numerical); p.set('a', s.abstract);
    p.set('s', s.archetype.code); p.set('t', s.totalTime);
    if (s.name) p.set('u', s.name);
    return window.location.origin + window.location.pathname + '?' + p.toString();
  }

  /* ---------- Quiz engine ---------- */
  function startAssessment() {
    var input = $('dpName');
    state.name = input && input.value.trim() ? input.value.trim().slice(0, 28) : '';
    state.index = 0; state.responses = []; state.selected = null;
    show('dpQuiz');
    renderQuestion();
    top();
  }

  function stopTimer() { if (state.timerId) { clearInterval(state.timerId); state.timerId = null; } }

  function abort() {
    stopTimer();
    show('dpLanding');
    top();
  }

  function renderQuestion() {
    stopTimer();
    var q = QUESTIONS[state.index];
    state.selected = null;
    state.startMs = Date.now();
    state.order = q.scored ? q.options.slice() : shuffled(q.options);

    $('dpNotice').hidden = true;
    $('dpBattery').textContent = q.batteryIndex + '. ' + q.batteryName.toUpperCase();
    $('dpSubtype').textContent = q.subType;
    $('dpCurrent').textContent = String(state.index + 1);
    $('dpProgressText').textContent = 'Item ' + (state.index + 1) + ' of ' + QUESTIONS.length;
    $('dpSegments').innerHTML = QUESTIONS.map(function (_, i) {
      var cls = i < state.index ? 'done' : (i === state.index ? 'now' : '');
      return '<span class="' + cls + '"></span>';
    }).join('');
    $('dpStyleNotice').hidden = q.scored;
    $('dpInstruction').textContent = q.scored ? 'Select one answer' : 'Decision style · no right or wrong answer';

    var stim = $('dpStimulus');
    if (q.stimulusHTML) { stim.innerHTML = q.stimulusHTML; stim.hidden = false; } else { stim.innerHTML = ''; stim.hidden = true; }
    $('dpPrompt').textContent = q.prompt;

    var box = $('dpOptions');
    box.className = 'dp-options' + (q.visual ? ' visual' : '');
    box.innerHTML = state.order.map(function (opt, i) {
      var letter = String.fromCharCode(65 + i);
      if (q.visual) {
        return '<button type="button" role="radio" aria-checked="false" data-key="' + opt.key + '" class="dp-option dp-option-visual">' +
          '<span class="dp-letter">' + letter + '</span><span class="dp-vis">' + opt.svg + '</span><span class="dp-vis-label">' + esc(opt.label) + '</span></button>';
      }
      return '<button type="button" role="radio" aria-checked="false" data-key="' + opt.key + '" class="dp-option">' +
        '<span class="dp-letter">' + letter + '</span><span>' + esc(opt.label) + '</span></button>';
    }).join('');

    $('dpSubmitText').textContent = state.index === QUESTIONS.length - 1 ? 'Finish and see scorecard' : 'Confirm answer';
    setupTimer(q);
  }

  function setupTimer(q) {
    var bar = $('dpTimerBar'), wrap = $('dpTimerWrap'), disp = $('dpTimer'), live = $('dpTimerLive');
    live.textContent = '';
    if (state.mode === 'timed' && q.scored) {
      wrap.hidden = false;
      state.deadline = Date.now() + TIME_LIMIT * 1000;
      disp.textContent = '00:' + TIME_LIMIT;
      bar.style.width = '100%';
      bar.className = 'dp-timer-bar';
      var warned = false;
      state.timerId = setInterval(function () {
        var rem = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
        disp.textContent = '00:' + (rem < 10 ? '0' : '') + rem;
        bar.style.width = (rem / TIME_LIMIT * 100) + '%';
        if (rem <= 10) {
          bar.className = 'dp-timer-bar low';
          if (!warned) { warned = true; live.textContent = '10 seconds left'; }
        }
        if (rem <= 0) { stopTimer(); timeout(); }
      }, 250);
    } else {
      wrap.hidden = true;
      disp.textContent = q.scored ? 'Untimed' : 'Not timed';
    }
  }

  function timeout() {
    var q = QUESTIONS[state.index];
    state.responses.push({
      id: q.id, key: state.selected || 'NONE',
      correct: q.scored && state.selected ? state.selected === q.correctKey : false,
      sec: TIME_LIMIT, timedOut: !state.selected
    });
    next();
  }

  function confirmAnswer() {
    var q = QUESTIONS[state.index];
    if (!state.selected) {
      var n = $('dpNotice');
      n.textContent = 'Select an answer before continuing.';
      n.hidden = false;
      return;
    }
    stopTimer();
    state.responses.push({
      id: q.id, key: state.selected,
      correct: q.scored ? state.selected === q.correctKey : null,
      sec: Math.max(1, Math.round((Date.now() - state.startMs) / 1000)), timedOut: false
    });
    next();
  }

  function next() {
    if (state.index < QUESTIONS.length - 1) {
      state.index++;
      renderQuestion();
      top();
    } else {
      finish();
    }
  }

  /* ---------- Scoring ---------- */
  function summarise() {
    var sc = { verbal: 0, numerical: 0, abstract: 0 }, time = 0, er = 0, gr = 0, firstE = 0, firstG = 0;
    QUESTIONS.forEach(function (q, i) {
      var r = state.responses[i];
      if (!r) return;
      time += r.sec;
      if (q.scored) {
        if (r.correct) sc[q.battery]++;
      } else {
        var o = q.options.filter(function (x) { return x.key === r.key; })[0];
        if (o) {
          er += o.e; gr += o.g;
          if (!firstE) { firstE = o.e; firstG = o.g; }
        }
      }
    });
    var eSign = er !== 0 ? Math.sign(er) : Math.sign(firstE || 1);
    var gSign = gr !== 0 ? Math.sign(gr) : Math.sign(firstG || 1);
    var code = eSign > 0 ? (gSign > 0 ? 'architect' : 'navigator') : (gSign > 0 ? 'verifier' : 'synthesiser');
    var pct = function (raw) { return Math.min(94, Math.max(12, Math.round(50 + (raw / 6) * 42))); };
    return {
      name: state.name, mode: state.mode,
      verbal: sc.verbal, numerical: sc.numerical, abstract: sc.abstract,
      total: sc.verbal + sc.numerical + sc.abstract,
      totalTime: time, evidencePct: pct(er), governancePct: pct(gr),
      archetype: ARCHETYPES[code]
    };
  }

  function finish() {
    var s = summarise();
    state.summary = s;
    show('dpResults');

    var modeLabel = s.mode === 'timed' ? 'Timed' : 'Untimed';
    $('rMode').textContent = modeLabel;
    $('cName').textContent = s.name ? s.name.toUpperCase() : 'ANONYMOUS';
    $('cDate').textContent = new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase();
    $('cBadge').textContent = modeLabel.toUpperCase();
    $('cTitle').textContent = s.archetype.title;
    $('cTagline').textContent = s.archetype.tagline;
    $('cScore').textContent = String(s.total);
    $('cTime').textContent = fmtTime(s.totalTime);

    [['Verbal', s.verbal], ['Numerical', s.numerical], ['Abstract', s.abstract]].forEach(function (b) {
      $('bar' + b[0] + 'Text').textContent = b[1] + ' / 3';
      $('bar' + b[0] + 'Fill').style.width = (b[1] / 3 * 100) + '%';
    });

    var x = Math.round(140 - (s.evidencePct / 100) * 120);
    var y = Math.round(140 - (s.governancePct / 100) * 120);
    ['compassHalo', 'compassPoint'].forEach(function (id) { $(id).setAttribute('cx', x); $(id).setAttribute('cy', y); });
    $('cQuadrant').textContent = s.archetype.quadrant;
    $('cEvidence').textContent = s.evidencePct >= 50 ? 'Evidence ' + s.evidencePct + '%' : 'Velocity ' + (100 - s.evidencePct) + '%';
    $('cGovernance').textContent = s.governancePct >= 50 ? 'Governance ' + s.governancePct + '%' : 'Autonomy ' + (100 - s.governancePct) + '%';

    var url = buildChallengeUrl(s);
    s.url = url;
    s.shareText = 'I scored ' + s.total + '/9 on Phil Pegram\'s free reasoning and decision-style diagnostic and profiled as ' + s.archetype.title +
      '. Verbal ' + s.verbal + '/3, numerical ' + s.numerical + '/3, abstract ' + s.abstract + '/3. Can you beat it? ' + url;
    $('dpShareText').value = s.shareText;

    renderComparison(s);
    renderPlan(s);
    renderReview();
    top();
  }

  function renderComparison(s) {
    var el = $('dpCompare');
    var c = state.challenger;
    if (!c) { el.hidden = true; return; }
    var diff = s.total - c.total, head;
    if (diff > 0) head = 'You beat ' + c.user + ' by ' + diff + ' point' + (diff > 1 ? 's' : '') + '.';
    else if (diff === 0) head = 'You matched ' + c.user + ' on ' + c.total + '/9.';
    else head = c.user + ' leads by ' + Math.abs(diff) + ' point' + (Math.abs(diff) > 1 ? 's' : '') + '.';
    el.textContent = '';
    var h = document.createElement('h3'); h.textContent = head;
    var p = document.createElement('p');
    p.textContent = 'You: ' + s.total + '/9 (' + s.archetype.title + '). ' + c.user + ': ' + c.total + '/9 (' + ARCHETYPES[c.code].title + ').';
    var f = document.createElement('p'); f.className = 'fine';
    f.textContent = 'Challenge links are self-reported and can be edited by anyone, so treat the comparison as friendly rather than verified.';
    el.appendChild(h); el.appendChild(p); el.appendChild(f);
    el.hidden = false;
  }

  function renderPlan(s) {
    var rows = [
      { k: 'verbal', score: s.verbal }, { k: 'numerical', score: s.numerical }, { k: 'abstract', score: s.abstract }
    ].sort(function (a, b) { return a.score - b.score; });
    var html;
    if (s.total === 9) {
      html = '<p><strong>All nine correct.</strong> ' + (s.mode === 'timed' ? 'Try to hold that accuracy while finishing faster.' : 'Retake it in timed mode to see how the score holds under a clock.') + '</p>';
    } else if (rows[0].score === rows[2].score) {
      html = '<p><strong>An even spread.</strong> Your score is level across the three areas, so there is no single weak spot. The review below shows which items cost you points.</p>';
    } else {
      html = '<p><strong>Priority area: ' + esc(BATTERIES[rows[0].k].name) + ' (' + rows[0].score + '/3).</strong> ' + esc(BATTERIES[rows[0].k].advice) + '</p>';
    }
    html += '<p><strong>Where your style helps.</strong> ' + esc(s.archetype.strengths) + '</p>';
    html += '<p><strong>Where it can mislead.</strong> ' + esc(s.archetype.blind) + '</p>';
    $('dpPlan').innerHTML = html;
  }

  function renderReview() {
    $('dpReview').innerHTML = QUESTIONS.map(function (q, i) {
      var r = state.responses[i];
      var chosen = r ? q.options.filter(function (o) { return o.key === r.key; })[0] : null;
      var status, detail;
      if (q.scored) {
        var right = q.options.filter(function (o) { return o.key === q.correctKey; })[0];
        status = r && r.correct ? 'Correct' : (r && r.timedOut ? 'No answer' : 'Incorrect');
        detail = '<p><strong>Your answer:</strong> ' + (chosen ? esc(chosen.label) : 'None (time ran out)') + '</p>' +
          '<p><strong>Correct answer:</strong> ' + esc(right.label) + '</p>';
      } else {
        status = 'Style';
        detail = '<p><strong>Your choice:</strong> ' + (chosen ? esc(chosen.label) + ' <span class="dp-chip">' + esc(chosen.tag) + '</span>' : 'None') + '</p>';
      }
      return '<details class="dp-item"><summary><span class="dp-num">' + String(q.id).padStart(2, '0') + '</span>' +
        '<span class="dp-sum-title">' + esc(q.subType) + '</span><span class="dp-status ' + (r && r.correct ? 'ok' : (q.scored ? 'no' : 'st')) + '">' + status + '</span></summary>' +
        '<div class="dp-item-body"><p class="dp-q-text">' + esc(q.prompt) + '</p>' + detail + '<p>' + esc(q.explanation) + '</p></div></details>';
    }).join('');
  }

  /* ---------- Sharing ---------- */
  function copyShare() {
    var s = state.summary; if (!s) return;
    var ta = $('dpShareText'), toast = $('dpToast');
    var done = function () { toast.hidden = false; setTimeout(function () { toast.hidden = true; }, 3000); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(s.shareText).then(done, function () { ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} });
    } else { ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} }
  }
  function shareLinkedIn() {
    var s = state.summary; if (!s) return;
    window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(s.url), '_blank', 'noopener,noreferrer');
  }
  function shareX() {
    var s = state.summary; if (!s) return;
    var text = 'I scored ' + s.total + '/9 and profiled as ' + s.archetype.title + '. Can you beat it?';
    window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(s.url), '_blank', 'noopener,noreferrer');
  }

  function wrap(ctx, text, x, y, maxW, lh) {
    var words = text.split(' '), line = '';
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); line = w; y += lh; } else { line = t; }
    });
    if (line) ctx.fillText(line, x, y);
  }

  function downloadPNG() {
    var s = state.summary; if (!s) return;
    var go = function () {
      var c = $('dpCanvas'), ctx = c.getContext('2d'), F = 'Switzer, system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.clearRect(0, 0, 1200, 630);
      ctx.fillStyle = '#1c2240'; ctx.fillRect(0, 0, 1200, 630);
      ctx.fillStyle = '#f49ab8'; ctx.fillRect(0, 0, 1200, 10);
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f49ab8'; ctx.font = '600 22px ' + F;
      ctx.fillText('PHILPEGRAM.COM  /  REASONING & DECISION-STYLE DIAGNOSTIC', 60, 72);
      ctx.fillStyle = '#bbc0d0'; ctx.font = '500 22px ' + F;
      ctx.fillText((s.name || 'Anonymous') + '  ·  ' + $('cDate').textContent + '  ·  ' + (s.mode === 'timed' ? 'Timed' : 'Untimed'), 60, 110);
      ctx.fillStyle = '#bbc0d0'; ctx.font = '600 18px ' + F; ctx.fillText('DECISION STYLE', 60, 190);
      ctx.fillStyle = '#f7f4ec'; ctx.font = '700 54px ' + F; ctx.fillText(s.archetype.title, 60, 250);
      ctx.fillStyle = '#bbc0d0'; ctx.font = '400 24px ' + F; wrap(ctx, s.archetype.tagline, 60, 298, 640, 34);
      ctx.fillStyle = '#f49ab8'; ctx.font = '700 110px ' + F; ctx.fillText(String(s.total), 780, 262);
      var nw = ctx.measureText(String(s.total)).width;
      ctx.fillStyle = '#bbc0d0'; ctx.font = '500 44px ' + F; ctx.fillText('/ 9', 780 + nw + 12, 262);
      ctx.font = '500 22px ' + F; ctx.fillText('Reasoning score  ·  ' + fmtTime(s.totalTime), 780, 300);
      var rows = [['Verbal & deductive', s.verbal], ['Numerical & data', s.numerical], ['Abstract & diagrammatic', s.abstract]];
      rows.forEach(function (r, i) {
        var y = 430 + i * 52;
        ctx.fillStyle = '#f7f4ec'; ctx.font = '500 21px ' + F; ctx.fillText(r[0], 60, y);
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(330, y - 18, 330, 16);
        ctx.fillStyle = '#f49ab8'; ctx.fillRect(330, y - 18, 330 * r[1] / 3, 16);
        ctx.fillStyle = '#f7f4ec'; ctx.font = '600 21px ' + F; ctx.fillText(r[1] + ' / 3', 680, y);
      });
      var bx = 880, by = 350, bs = 220;
      ctx.fillStyle = '#151a32'; ctx.fillRect(bx, by, bs, bs);
      ctx.strokeStyle = '#444961'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bs, bs);
      ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(bx + bs / 2, by); ctx.lineTo(bx + bs / 2, by + bs); ctx.moveTo(bx, by + bs / 2); ctx.lineTo(bx + bs, by + bs / 2); ctx.stroke(); ctx.setLineDash([]);
      var px = bx + ((Math.round(140 - (s.evidencePct / 100) * 120) - 20) / 120) * bs;
      var py = by + ((Math.round(140 - (s.governancePct / 100) * 120) - 20) / 120) * bs;
      ctx.fillStyle = 'rgba(244,154,184,0.25)'; ctx.beginPath(); ctx.arc(px, py, 20, 0, 7); ctx.fill();
      ctx.fillStyle = '#f49ab8'; ctx.beginPath(); ctx.arc(px, py, 9, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#bbc0d0'; ctx.font = '500 15px ' + F; ctx.textAlign = 'center';
      ctx.fillText('GOVERNANCE', bx + bs / 2, by - 8); ctx.fillText('AUTONOMY', bx + bs / 2, by + bs + 20);
      ctx.textAlign = 'left'; ctx.fillText('EVIDENCE', bx, by + bs + 42); ctx.textAlign = 'right'; ctx.fillText('VELOCITY', bx + bs, by + bs + 42);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#f7f4ec'; ctx.font = '600 24px ' + F; ctx.fillText('philpegram.com/decision-profile', 60, 596);
      c.toBlob(function (blob) {
        if (!blob) return;
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'decision-profile-scorecard.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      }, 'image/png');
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go, go); else go();
  }

  /* ---------- Wiring ---------- */
  function setMode(mode) {
    state.mode = mode;
    [['timed', 'dpModeTimed'], ['untimed', 'dpModeUntimed']].forEach(function (m) {
      var b = $(m[1]);
      b.classList.toggle('active', m[0] === mode);
      b.setAttribute('aria-checked', m[0] === mode ? 'true' : 'false');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('dpModeTimed').addEventListener('click', function () { setMode('timed'); });
    $('dpModeUntimed').addEventListener('click', function () { setMode('untimed'); });
    $('dpStart').addEventListener('click', startAssessment);
    $('dpRestart').addEventListener('click', abort);
    $('dpSubmit').addEventListener('click', confirmAnswer);
    $('dpRetake').addEventListener('click', abort);
    $('dpExpand').addEventListener('click', function () { document.querySelectorAll('#dpReview details').forEach(function (d) { d.open = true; }); });
    $('dpCollapse').addEventListener('click', function () { document.querySelectorAll('#dpReview details').forEach(function (d) { d.open = false; }); });
    ['dpCopy', 'dpCopy2'].forEach(function (id) { $(id).addEventListener('click', copyShare); });
    ['dpPng', 'dpPng2'].forEach(function (id) { $(id).addEventListener('click', downloadPNG); });
    $('dpLinkedIn').addEventListener('click', shareLinkedIn);
    $('dpX').addEventListener('click', shareX);
    $('dpBannerAccept').addEventListener('click', function () { $('dpStartCard').scrollIntoView({ behavior: 'smooth' }); });
    $('dpBannerClose').addEventListener('click', function () { $('dpBanner').hidden = true; });
    $('dpOptions').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-key]');
      if (!btn) return;
      state.selected = btn.getAttribute('data-key');
      $('dpOptions').querySelectorAll('button').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('selected', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      $('dpNotice').hidden = true;
    });
    readChallenge();
  });
})();
