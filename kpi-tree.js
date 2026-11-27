(function(){
'use strict';
var KEY='pp-kpi-tree-v1',uid=0,state,selId=null,collapsed={},rIdx=-1,brief={dec:'',when:'',out:''},flowI=0;
var OPS={mul:' × ',add:' + ',sub:' − ',div:' ÷ ',none:' · '};
var OPNAME={mul:'multiply',add:'add up',sub:'subtract',div:'divide',none:'influences'};
function N(name,op,timing,ctrl,kids){return {id:'n'+(++uid),name:name,def:'',op:op||'none',owner:'',decision:'',timing:timing||'lagging',control:ctrl||'no',test:[0,0,0,0,0,0],tested:false,children:kids||[]};}
function ensure(n){if(typeof n.def!=='string')n.def='';if(!Array.isArray(n.test)||n.test.length!==6)n.test=[0,0,0,0,0,0];n.tested=!!n.tested;n.children=n.children||[];n.children.forEach(ensure);}
var TEMPLATES={
 sub:{label:'Subscription growth',build:function(){return N('Recurring revenue','mul','lagging','no',[
  N('Paying customers','add','lagging','no',[
   N('Retained customers','mul','lagging','no',[N('Customers at start of period','none','lagging','no'),N('Retention rate','none','lagging','no',[N('Activated within 30 days','none','leading','yes'),N('Faults per customer','none','leading','yes'),N('Repeat contacts within 7 days','none','leading','yes')])]),
   N('New customers','mul','lagging','no',[N('Qualified leads','none','leading','yes'),N('Lead to sale conversion','none','leading','yes')])]),
  N('Revenue per customer','add','lagging','no',[N('Average monthly price','none','lagging','yes'),N('Add-on revenue per customer','none','leading','yes')])]);}},
 shop:{label:'Online sales',build:function(){return N('Online revenue','mul','lagging','no',[
  N('Visitors','add','lagging','no',[N('Paid visitors','none','leading','yes'),N('Organic visitors','none','leading','yes'),N('Email and direct visitors','none','leading','yes')]),
  N('Visit to order conversion','none','lagging','no',[N('Product page clarity','none','leading','yes'),N('Checkout completion rate','none','leading','yes'),N('Delivery promise shown before basket','none','leading','yes')]),
  N('Average order value','mul','lagging','no',[N('Items per order','none','leading','yes'),N('Average item price','none','lagging','yes')])]);}},
 serve:{label:'Cost to serve',build:function(){return N('Cost to serve per customer','mul','lagging','no',[
  N('Contacts per customer','add','lagging','no',[
   N('Avoidable contacts','none','lagging','no',[N('Bill queries','none','leading','yes'),N('Failed self-serve journeys','none','leading','yes'),N('Repeat contacts within 7 days','none','leading','yes')]),
   N('Unavoidable contacts','none','lagging','no')]),
  N('Cost per contact','mul','lagging','no',[N('Average handling time','none','leading','yes'),N('Cost per agent minute','none','lagging','yes')])]);}},
 blank:{label:'Blank page',build:function(){return N('Your outcome','none','lagging','no');}}
};
var TIPS={
 name:'Name things so a new starter would understand them. "Conversion" is not a metric. "Lead to sale conversion, 30 days" is.',
 def:'Write the sentence you would hand a new analyst. Include the time window and what is excluded. Two people should build the same number from it.',
 op:'Be honest. Multiply and add mean the children really compute the parent. Pick "influences" when they shape it without summing to it. Both are fine. Pretending one is the other isn\'t.',
 owner:'One name or one team. "Marketing" is a department, not an owner. If two people share it, ask who gets the call at 5pm on a bad day.',
 decision:'Finish the sentence: "If this moved, we would…". If the honest answer is "nothing", it belongs in a report, not on the tree.',
 timing:'Leading measures move before the outcome does. Lagging measures confirm it. You want both, and you want to know which is which.',
 control:'If nobody can change it directly, it needs children. A leaf you can\'t act on is a scoreboard, not a lever.'
};
var VANITY=/\b(followers?|likes?|impressions?|page ?views?|reach|downloads?|sessions?|visits?|clicks?|mentions?|engagement)\b/i;
var CONV=/conversion|\bcr\b/i;
var TRAPS=[
 {name:'Cost per click',re:/cost per click|\bcpc\b/i,arrow:'▼',surface:'Advertising is getting cheaper.',maybe:'You\'re buying clicks from people who were never going to buy.',tell:'Check conversion after the click, by source.',gets:'Conversion rate',trade:'Cheap traffic often converts worse.',guardLabel:'a conversion measure',guardRe:CONV},
 {name:'Average order value',re:/order value|\baov\b/i,arrow:'▲',surface:'Customers are buying more.',maybe:'Cheaper products stopped selling, so there are fewer orders.',tell:'Look at order count, item mix and price spread.',gets:'Conversion rate',trade:'Higher prices or basket thresholds can put people off.',guardLabel:'a conversion measure',guardRe:CONV},
 {name:'Return on ad spend',re:/roas|return on ad spend/i,arrow:'▲',surface:'The ads are working harder.',maybe:'You cut spend until the ratio flattered you, and total sales shrank.',tell:'Compare total profit and total sales, not the ratio.',gets:'Total sales and profit',trade:'Chasing the ratio can starve scale.',guardLabel:'total profit or total sales',guardRe:/profit|margin|total sales|revenue/i},
 {name:'Retention rate',re:/retention/i,arrow:'▲',surface:'Customers are staying.',maybe:'You bought loyalty with discounts that ate the margin.',tell:'Compare margin per retained customer, by segment.',gets:'Profit margin',trade:'Discounts to keep people can cost more than they save.',guardLabel:'a margin or profit measure',guardRe:/margin|profit/i},
 {name:'Conversion rate',re:/conversion|\bcr\b/i,arrow:'▲',surface:'The offer is working.',maybe:'Low-intent traffic was filtered out, or heavy discounts pulled in buyers who send things back.',tell:'Compare traffic, source and conversion by segment, then returns.',gets:'Returns and margin',trade:'Aggressive offers attract low-intent buyers.',guardLabel:'returns or net profit',guardRe:/return|profit|margin/i},
 {name:'Delivery speed',re:/delivery/i,arrow:'▲',surface:'Customers get orders faster.',maybe:'You\'re paying a premium the extra sales don\'t cover.',tell:'Compare cost per order with sales uplift by delivery option.',gets:'Logistics cost',trade:'Speed is expensive.',guardLabel:'a logistics cost measure',guardRe:/cost|logistics/i},
 {name:'Bounce rate',re:/bounce/i,arrow:'▲',surface:'We brought the wrong traffic.',maybe:'A single-page visit did exactly its job, as with a contact or FAQ page.',tell:'Check time on page and interactions such as scrolls and clicks.'},
 {name:'Time on site',re:/time on (site|page)|dwell/i,arrow:'▲',surface:'People are engaged.',maybe:'People are lost or confused.',tell:'Look at page flow, scroll depth and exit rate.'},
 {name:'Churn',re:/churn/i,arrow:'▼',surface:'Retention is improving.',maybe:'Only your most loyal customers are left to leave.',tell:'Check repeat rate by cohort and the drop between first and second order.'},
 {name:'Cart abandonment',re:/abandon/i,arrow:'▼',surface:'Checkout is smoother.',maybe:'The cart page is broken or hard to reach, so fewer people start.',tell:'Compare traffic to checkout with traffic to the cart.'},
 {name:'Sessions',re:/\bsessions?\b|\bvisitors\b/i,arrow:'▲',surface:'More people are coming.',maybe:'It\'s low-quality traffic.',tell:'Slice by source and device, then compare conversion.'},
 {name:'Blended CAC',re:/\bcac\b|acquisition cost/i,arrow:'▼',surface:'Acquiring customers is getting cheaper.',maybe:'The average hides one channel carrying the rest.',tell:'Split by channel and compare with lifetime value.',gets:'Customer quality',trade:'The cheapest channel often brings the least valuable customers.',guardLabel:'a channel split or lifetime value',guardRe:/channel|ltv|lifetime/i},
 {name:'Email open rate',re:/open rate/i,arrow:'▲',surface:'Subject lines are working.',maybe:'Privacy features inflate opens, so it no longer signals intent.',tell:'Use click-to-open and downstream conversion instead.'}
];
var QS=[
 'Decision: can you finish "If this moved, we would…" without waffling?',
 'Owner: is there one person who\'d be asked to explain it on Monday morning?',
 'Outcome: can you trace it to revenue, cost, risk or customer value in one sentence?',
 'Definition: could two analysts build the same number from what\'s written down?',
 'Noise: do you know how much it normally moves, so you can tell signal from wobble?',
 'Catch: do you know what gets worse if this improves?'
];
var BANDS=[[1,'Wallpaper','Cut it, or tie it to a driver that someone owns.'],[3,'Context','Fine as background. Don\'t steer by it.'],[5,'Useful','Keep it, and close the gap you left unticked.'],[6,'Steering','Earns a place on the front page.']];
var CNV='conversion|\\bcr\\b',AOVR='order value|aov',REP='repeat|retention',CHK='checkout';
var IDEAS=[
 {n:'Make the mobile experience faster and clearer',m:[['Conversion',CNV],['Order value',AOVR],['Bounce rate','bounce']]},
 {n:'Cut page load time',m:[['Conversion',CNV],['Organic traffic','organic|seo']]},
 {n:'Launch a loyalty programme',m:[['Repeat or retention',REP],['Lifetime value','ltv|lifetime'],['Time to second purchase','second']]},
 {n:'Test free-shipping thresholds',m:[['Conversion',CNV],['Order value',AOVR],['Repeat or retention',REP]]},
 {n:'Offer flexible returns',m:[['Conversion',CNV],['Repeat or retention',REP],['Satisfaction','nps|satisf']]},
 {n:'Bundle products sensibly',m:[['Order value',AOVR],['Items per order','items per order|units'],['Margin','margin']]},
 {n:'Simplify checkout',m:[['Checkout completion',CHK],['Conversion',CNV],['Cart abandonment','abandon']]},
 {n:'Personalise recommendations',m:[['Order value',AOVR],['Repeat or retention',REP],['Lifetime value','ltv|lifetime']]},
 {n:'Add reviews and trust signals',m:[['Conversion',CNV],['Cart abandonment','abandon'],['Satisfaction','nps|satisf']]},
 {n:'Fix triggered emails and flows',m:[['Repeat or retention',REP],['Time to second purchase','second'],['Email revenue','email']]},
 {n:'Fix the top three causes of repeat contacts',m:[['Repeat contacts','repeat contact'],['Cost per contact','cost per contact|contacts per customer'],['Retention or satisfaction','retention|satisf']]},
 {n:'Tell customers about faults before they ring',m:[['Contacts','contact'],['Faults','fault'],['Retention or churn','retention|churn']]},
 {n:'Rewrite bills in plain English',m:[['Bill queries','bill'],['Contacts','contact'],['Complaints or satisfaction','complaint|satisf']]},
 {n:'Repair self-serve journeys that fail',m:[['Self-serve','self-serve'],['Contacts','contact'],['Handling time','handling']]}
];

function find(n,id,par){if(n.id===id)return {node:n,parent:par};for(var i=0;i<n.children.length;i++){var r=find(n.children[i],id,n);if(r)return r;}return null;}
function walk(n,fn,depth,par){depth=depth||1;fn(n,depth,par);n.children.forEach(function(c){walk(c,fn,depth+1,n);});}
function maxId(n){var m=0;walk(n,function(x){var v=parseInt(String(x.id).slice(1),10);if(v>m)m=v;});return m;}
function save(){try{localStorage.setItem(KEY,JSON.stringify({tree:state,sel:selId,brief:brief}));}catch(e){}}
function load(){try{var d=JSON.parse(localStorage.getItem(KEY));if(d&&d.tree&&d.tree.id){ensure(d.tree);uid=maxId(d.tree);state=d.tree;selId=find(state,d.sel)?d.sel:d.tree.id;if(d.brief)brief=d.brief;return true;}}catch(e){}return false;}
function $(id){return document.getElementById(id);}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;}
function label(n){return (n.name||'').trim()||'Unnamed metric';}
function formula(n){if(!n.children.length)return '';return label(n)+' = '+n.children.map(label).join(OPS[n.op]||' · ');}
function trapOf(n){for(var i=0;i<TRAPS.length;i++){if(TRAPS[i].re.test(n.name||''))return TRAPS[i];}return null;}
function score(n){return n.test.reduce(function(a,b){return a+(b?1:0);},0);}
function band(s){for(var i=0;i<BANDS.length;i++){if(s<=BANDS[i][0])return BANDS[i];}return BANDS[3];}

function renderTree(){var root=$('kt-tree');root.textContent='';var ul=el('ul');ul.appendChild(item(state));root.appendChild(ul);}
function item(n){
 var li=el('li');var w=el('div','kt-nodewrap');
 var t=el('button','kt-toggle');t.type='button';
 if(n.children.length){var c=!!collapsed[n.id];t.textContent=c?'+':'−';t.setAttribute('aria-expanded',String(!c));t.setAttribute('aria-label',(c?'Expand ':'Collapse ')+label(n));t.addEventListener('click',function(){collapsed[n.id]=!collapsed[n.id];renderTree();});}else{t.classList.add('ph');t.tabIndex=-1;t.setAttribute('aria-hidden','true');}
 var b=el('button','kt-node'+(n.id===selId?' sel':''));b.type='button';b.setAttribute('aria-pressed',String(n.id===selId));
 b.appendChild(el('span','nm',label(n)));
 var f=formula(n);if(f)b.appendChild(el('span','fm',f));
 var bd=el('div','kt-badges');
 bd.appendChild(el('span','kt-b'+(n.timing==='leading'?' lead':''),n.timing));
 if(!n.children.length&&n.control==='yes')bd.appendChild(el('span','kt-b','lever'));
 if(trapOf(n))bd.appendChild(el('span','kt-b warn','⚠ catch'));
 if(n.tested)bd.appendChild(el('span','kt-b',band(score(n))[1]+' '+score(n)+'/6'));
 bd.appendChild(el('span','kt-b'+(n.owner.trim()?'':' gap'),n.owner.trim()?n.owner.trim():'no owner'));
 bd.appendChild(el('span','kt-b'+(n.decision.trim()?'':' gap'),n.decision.trim()?'decision set':'no decision'));
 b.appendChild(bd);
 b.addEventListener('click',function(){selId=n.id;save();renderTree();renderEditor(false);});
 w.appendChild(t);w.appendChild(b);li.appendChild(w);
 if(n.children.length&&!collapsed[n.id]){var u=el('ul');n.children.forEach(function(ch){u.appendChild(item(ch));});li.appendChild(u);}
 return li;
}
function renderWatch(n){
 var w=$('kt-watch');var t=trapOf(n);w.textContent='';
 if(!t){w.hidden=true;return;}
 w.hidden=false;w.appendChild(el('strong','','⚠ The catch with '+t.name+' '+t.arrow));
 function row(k,v){var p=el('p');p.appendChild(el('b','',k));p.appendChild(document.createTextNode(v));w.appendChild(p);}
 row('Looks like: ',t.surface);row('Could really be: ',t.maybe);
 if(t.gets)row('Put beside it: ',t.guardLabel+'. '+t.trade);
 row('How to tell: ',t.tell);
}
function renderTest(n){
 document.querySelectorAll('#kt-qbox input').forEach(function(c){c.checked=!!n.test[+c.getAttribute('data-i')];});
 var s=score(n),b=band(s);
 $('kt-score').textContent=n.tested?(b[1]+' · '+s+'/6'):'not run';
 $('kt-band').textContent=n.tested?(b[1]+'. '+b[2]):'Tick what you can honestly say yes to. Be harsh. Most metrics score lower than their owners expect.';
}
function renderEditor(focus){
 var r=find(state,selId);var ed=document.querySelector('.kt-editor');
 if(!r){ed.classList.add('off');$('kt-ed-title').textContent='Select a box';return;}
 ed.classList.remove('off');var n=r.node;
 $('kt-ed-title').textContent=label(n);
 $('f-name').value=n.name;$('f-def').value=n.def;$('f-op').value=n.op;$('f-owner').value=n.owner;$('f-decision').value=n.decision;$('f-timing').value=n.timing;$('f-control').value=n.control;
 $('f-op').disabled=!n.children.length;
 $('kt-del').disabled=!r.parent;$('kt-up').disabled=!r.parent||r.parent.children[0]===n;$('kt-down').disabled=!r.parent||r.parent.children[r.parent.children.length-1]===n;
 renderWatch(n);renderTest(n);
 if(focus)$('f-name').focus();
}
function refresh(){save();renderTree();renderResults();}
function bind(id,key,tip){
 var f=$(id);
 function upd(){var r=find(state,selId);if(!r)return;r.node[key]=f.value;if(key==='name'){$('kt-ed-title').textContent=label(r.node);renderWatch(r.node);}refresh();}
 f.addEventListener('input',upd);f.addEventListener('change',upd);
 f.addEventListener('focus',function(){$('kt-tip-text').textContent=TIPS[tip];});
}

function analyse(){
 var issues=[],nodes=[],leaves=[],maxD=0,names={};
 walk(state,function(n,d){nodes.push(n);maxD=Math.max(maxD,d);if(!n.children.length)leaves.push(n);var k=label(n).toLowerCase();names[k]=(names[k]||0)+1;});
 var total=0,pass=0;
 function chk(ok,sev,text){total++;if(ok)pass++;else issues.push({sev:sev,text:text});}
 function first(a){return label(a[0]||{name:''});}
 var levers=leaves.filter(function(n){return n.control==='yes';});
 var noName=nodes.filter(function(n){return !n.name.trim();});
 chk(noName.length===0,1,noName.length+' metric'+(noName.length===1?' has':'s have')+' no name. Name them first.');
 var noOwner=nodes.filter(function(n){return !n.owner.trim();});
 chk(noOwner.length===0,2,noOwner.length+' of '+nodes.length+' metrics have no owner, starting with "'+first(noOwner)+'". One person or team each. A metric everyone shares is a metric nobody owns.');
 var noDec=nodes.filter(function(n){return !n.decision.trim();});
 chk(noDec.length===0,2,noDec.length+' of '+nodes.length+' metrics have no decision attached, starting with "'+first(noDec)+'". Finish "if this moved, we would…" or cut it.');
 var noDef=levers.filter(function(n){return !n.def.trim();});
 chk(noDef.length===0,2,noDef.length+' of '+levers.length+' levers have no written definition, starting with "'+first(noDef)+'". If two people can build different numbers from the name, it isn\'t a metric yet.');
 var stuck=leaves.filter(function(n){return n.control!=='yes';});
 chk(stuck.length===0,3,stuck.length+' bottom-level metric'+(stuck.length===1?'':'s')+' can\'t be changed directly, such as "'+first(stuck)+'". Go one level deeper, or accept it\'s an outcome and not a lever.');
 chk(leaves.some(function(n){return n.timing==='leading';}),3,'No leading measures. The tree tells you what happened, not what\'s about to. Add an early signal to each major branch.');
 chk(maxD>=3,3,'The tree is only '+maxD+' level'+(maxD===1?'':'s')+' deep. That rarely points at anything a team can act on.');
 chk(maxD<=5,2,'The tree is '+maxD+' levels deep. Past five, few people read it. Prune what never changes a decision.');
 var wide=nodes.filter(function(n){return n.children.length>5;});
 chk(wide.length===0,2,'"'+first(wide)+'" has more than five children. That usually means a missing level.');
 var one=nodes.filter(function(n){return n.children.length===1;});
 chk(one.length===0,2,'"'+first(one)+'" has a single child. Either it\'s the same metric renamed, or a sibling is missing.');
 var vain=nodes.filter(function(n){return VANITY.test(n.name);});
 chk(vain.length===0,2,'"'+first(vain)+'" looks like a vanity metric. Keep it only if you can show it moves the branch above it.');
 var dup=Object.keys(names).filter(function(k){return names[k]>1&&k!=='unnamed metric';});
 chk(dup.length===0,1,'Duplicate metric name "'+dup[0]+'". One name needs one definition and one owner, or the branches overlap.');
 var heavy=nodes.filter(function(n){return (n.op==='mul'||n.op==='div')&&n.children.length>3;});
 chk(heavy.length===0,1,'"'+first(heavy)+'" multiplies or divides more than three things. Check the formula holds, or switch to "influences".');
 var guards=[];nodes.forEach(function(n){var t=trapOf(n);if(t&&t.guardRe){guards.push({node:n,trap:t,have:nodes.some(function(o){return o!==n&&t.guardRe.test(o.name||'');})});}});
 var ung=guards.filter(function(g){return !g.have;});
 chk(ung.length===0,2,ung.length+' metric'+(ung.length===1?'':'s')+' can improve while something else gets worse, such as "'+(ung[0]?label(ung[0].node):'')+'". Put '+(ung[0]?ung[0].trap.guardLabel:'a guardrail')+' beside it.');
 var low=nodes.filter(function(n){return n.tested&&score(n)<=1;});
 chk(low.length===0,2,'"'+first(low)+'" scored as wallpaper on the Monday test. Cut it or tie it to a driver.');
 issues.sort(function(a,b){return a.sev-b.sev;});
 return {nodes:nodes,leaves:leaves,depth:maxD,issues:issues,pass:pass,total:total,levers:levers,guards:guards};
}

function renderResults(){
 var a=analyse();
 var done=a.nodes.filter(function(n){return n.owner.trim()&&n.decision.trim();}).length;
 var tested=a.nodes.filter(function(n){return n.tested;}).length;
 var hd=$('kt-headline');hd.textContent='';
 hd.appendChild(el('b','',a.nodes.length<4?'Add a few boxes to start.':a.pass+' of '+a.total+' checks passed'));
 $('kt-sub').textContent=a.nodes.length<4?'Three or four levels is where a tree starts to earn its keep.':done+' of '+a.nodes.length+' metrics have an owner and a decision. '+tested+' have faced the Monday test. Prompts for challenge, not a grade.';
 var ring=$('kt-ring');ring.setAttribute('stroke-dasharray','213.6');ring.setAttribute('stroke-dashoffset',String(213.6*(1-(a.total?a.pass/a.total:0))));
 var fx=$('kt-fixes');fx.textContent='';
 if(!a.issues.length)fx.appendChild(el('li','kt-ok','Nothing flagged. Now try it on last quarter\'s biggest surprise and see whether the tree would have explained it.'));
 a.issues.slice(0,5).forEach(function(i){fx.appendChild(el('li','',i.text));});
 if(a.issues.length>5)fx.appendChild(el('li','kt-ok','Plus '+(a.issues.length-5)+' more flagged.'));
 var lv=$('kt-levers');lv.textContent='';
 if(!a.levers.length)lv.appendChild(el('p','kt-ok','No levers yet. Mark bottom-level metrics as changeable by a team.'));
 a.levers.forEach(function(n){var d=el('div','kt-lever');d.appendChild(el('strong','',label(n)));d.appendChild(el('span','kt-b'+(n.timing==='leading'?' lead':''),n.timing));d.appendChild(el('small','',(n.owner.trim()||'No owner')+' · '+(n.decision.trim()||'No decision yet')));lv.appendChild(d);});
 var gd=$('kt-guards');gd.textContent='';
 if(!a.guards.length)gd.appendChild(el('p','kt-ok','None of your metrics match the common traps. Check by hand anyway: for each lever, ask what gets worse if it improves.'));
 a.guards.forEach(function(g){var d=el('div','kt-guard');var h4=el('h4','',label(g.node)+' '+g.trap.arrow);h4.appendChild(el('span',g.have?'have':'miss',g.have?'neighbour in tree':'needs a neighbour'));d.appendChild(h4);
  var p1=el('p');p1.appendChild(el('b','','Can get worse: '));p1.appendChild(document.createTextNode(g.trap.gets+'. '+g.trap.trade));d.appendChild(p1);
  var p2=el('p');p2.appendChild(el('b','','Put beside it: '));p2.appendChild(document.createTextNode(g.trap.guardLabel+'.'));d.appendChild(p2);gd.appendChild(d);});
 var pb=$('kt-plan');pb.textContent='';
 a.nodes.forEach(function(n){var tr=el('tr');tr.appendChild(el('td','',label(n)));
  tr.appendChild(el('td',n.def.trim()?'':'miss',n.def.trim()||'Not set'));
  var f=formula(n);tr.appendChild(el('td',f?'':'miss',f||'Leaf'));
  tr.appendChild(el('td',n.owner.trim()?'':'miss',n.owner.trim()||'Not set'));
  tr.appendChild(el('td',n.decision.trim()?'':'miss',n.decision.trim()||'Not set'));
  tr.appendChild(el('td','',n.timing));pb.appendChild(tr);});
 var q=[];var fl=a.levers.filter(function(n){return n.timing==='leading';})[0];
 q.push('If the top metric dropped 10% next month, which branch would you check first, and why that one?');
 q.push('Which metric here could rise while the outcome falls? That is your most dangerous number.');
 if(fl)q.push('"'+label(fl)+'" is a leading measure. What evidence do you have that it moves the outcome, and how long is the lag?');
 if(a.guards[0])q.push('If "'+label(a.guards[0].node)+'" improved by a fifth tomorrow, what would you check before calling it good news?');
 q.push('Which metric would you stop reporting tomorrow without anyone noticing?');
 q.push('Where do two owners both think a metric is theirs, or neither does?');
 var ul=$('kt-questions');ul.textContent='';q.forEach(function(t){ul.appendChild(el('li','',t));});
 renderFlow(a);renderSeasonSelect(a);renderVerdict();renderIdeas(a);
}

function briefData(a){
 var root=label(state),out=[];
 var dec=brief.dec&&brief.dec.trim()?brief.dec.trim():'[state the decision]',when=brief.when&&brief.when.trim()?brief.when.trim():'[date]';
 out.push({t:'Problem',lines:['We need to decide whether to '+dec+' by '+when+'.','We\'ll judge it on '+((brief.out&&brief.out.trim())||root)+'.']});
 var ev=[];if(state.children.length)ev.push(formula(state)+'.');
 var lead=a.levers.filter(function(n){return n.timing==='leading';}).slice(0,5);
 ev.push(lead.length?'Leading levers to watch: '+lead.map(function(n){return label(n)+' ('+(n.owner.trim()||'no owner')+')';}).join('; ')+'.':'No leading levers yet. Add early signals before you rely on this tree.');
 out.push({t:'Evidence',lines:ev});
 var im=[];a.guards.filter(function(g){return !g.have;}).forEach(function(g){im.push(label(g.node)+' can improve while '+g.trap.gets.toLowerCase()+' worsens. Add '+g.trap.guardLabel+'.');});
 var ud=a.nodes.filter(function(n){return !n.def.trim();}).length;
 if(ud)im.push(ud+' of '+a.nodes.length+' metrics have no written definition, so the numbers may not reconcile.');
 if(!im.length)im.push('No known traps or definition gaps flagged. Still test one lever as an experiment before committing.');
 out.push({t:'Implication',lines:im});
 out.push({t:'Decision',lines:a.levers.length?a.levers.slice(0,6).map(function(n){return label(n)+': if it moved, we would '+(n.decision.trim()||'[not set]')+'.';}):['No levers yet. Decisions attach to levers.']});
 var no=a.nodes.filter(function(n){return !n.owner.trim();});
 out.push({t:'Action',lines:[no.length?'Name owners by Monday for: '+no.slice(0,5).map(label).join(', ')+(no.length>5?' and '+(no.length-5)+' more':'')+'.':'Owners are named. Confirm they know.','Review leading levers weekly and the outcome monthly. Write down what you expect before you look.']});
 return out;
}
function renderFlow(a){
 var data=briefData(a),bx=$('kt-flow');bx.textContent='';
 data.forEach(function(d,i){var b=el('button',i===flowI?'on':'');b.type='button';b.appendChild(el('small','',String(i+1)));b.appendChild(document.createTextNode(d.t));b.addEventListener('click',function(){flowI=i;renderFlow(a);});bx.appendChild(b);});
 var p=$('kt-flow-panel');p.textContent='';var cur=data[flowI];p.appendChild(el('strong','',cur.t));cur.lines.forEach(function(l){p.appendChild(el('p','',l));});
 var cp=el('button','pb-btn','Copy the whole brief');cp.type='button';cp.style.marginTop='14px';cp.addEventListener('click',function(){copy(briefText(data),'Brief copied.');});p.appendChild(cp);
}
function briefText(data){return data.map(function(d){return d.t.toUpperCase()+'\n'+d.lines.join('\n');}).join('\n\n');}

function renderSeasonSelect(a){var sel=$('s-metric');var cur=sel.value;sel.textContent='';a.nodes.forEach(function(n){var o=el('option','',label(n));o.value=n.id;sel.appendChild(o);});if(cur&&find(state,cur))sel.value=cur;}
function renderVerdict(){
 var box=$('kt-verdict');box.textContent='';
 var r=find(state,$('s-metric').value);if(!r){box.appendChild(el('p','','Add a metric to your tree first.'));return;}
 var n=r.node,dir=$('s-dir').value,last=$('s-last').value,cause=$('s-cause').value,rel=$('s-rel').value;var t,p;
 if(last==='yes'&&cause!=='us'){t='Probably seasonal.';p='It moved this way last year too and nothing on our side explains it. Compare year on year before touching anything, then build the pattern into forecasts and targets so it stops surprising you.';}
 else if(last==='yes'){t='Seasonal, plus a possible extra effect.';p='The calendar explains part of it. Your change may be adding to it or masking it. Compare the size of this year\'s move with last year\'s to isolate what\'s yours.';}
 else if(last==='no'&&cause==='us'){t='Probably real, and probably us.';p='It breaks the usual pattern and you changed something. Line up the date of the change with the date of the move. If the case is strong, roll back or run a test.';}
 else if(last==='no'&&cause==='ext'){t='Probably real, and external.';p='Not the usual pattern, and something outside moved. Check competitor and market data, then decide whether it\'s temporary or a new baseline.';}
 else if(last==='no'){t='Probably real, and unexplained.';p='Treat it as an investigation. Slice by source, segment, device and date. Rule out tracking or definition changes before chasing causes.';}
 else{t='Can\'t tell yet.';p='Without history you can\'t separate seasonal from real. Use sector benchmarks for now and start keeping two years of data for this metric.'+(cause==='us'?' You changed something, so start there.':'');}
 box.appendChild(el('strong','',t+' '+label(n)+' '+(dir==='down'?'▼':'▲')));
 box.appendChild(el('p','',p));
 box.appendChild(el('p','',rel==='yes'?'Several related metrics moved together. That points to demand or traffic mix rather than one broken step.':'Only this one moved. That points to a break in that step, or a tracking or definition change. Check instrumentation first.'));
 var tr=trapOf(n);if(tr)box.appendChild(el('p','','Also remember the catch: '+tr.maybe+' How to tell: '+tr.tell));
}
function renderIdeas(a){
 var box=$('kt-ideas');box.textContent='';
 var sc=IDEAS.map(function(it){var ids={},groups=0;var chips=it.m.map(function(g){var re=new RegExp(g[1],'i');var hit=false;a.nodes.forEach(function(n){if(re.test(n.name||'')){ids[n.id]=1;hit=true;}});if(hit)groups++;return {label:g[0],hit:hit};});return {it:it,nodes:Object.keys(ids).length,groups:groups,chips:chips};});
 sc.sort(function(x,y){return y.groups-x.groups||y.nodes-x.nodes;});
 var shown=sc.filter(function(s){return s.groups>0;}).slice(0,6);var fb=!shown.length;if(fb)shown=sc.slice(0,6);
 shown.forEach(function(s){var d=el('div','kt-idea');d.appendChild(el('h3','',s.it.n));d.appendChild(el('span','hits',fb?'No match in your tree yet':'Touches '+s.nodes+' metric'+(s.nodes===1?'':'s')+' in your tree'));var c=el('div','kt-lifts');s.chips.forEach(function(x){c.appendChild(el('span',x.hit?'hit':'',x.label));});d.appendChild(c);box.appendChild(d);});
}
function renderRoulette(){
 var i=Math.floor(Math.random()*TRAPS.length);if(i===rIdx)i=(i+1)%TRAPS.length;rIdx=i;var t=TRAPS[i];var c=$('kt-rcard');c.textContent='';
 c.appendChild(el('h3','',t.name+' '+t.arrow));c.appendChild(el('span','kt-chip','Looks like: '+t.surface));
 function row(k,v){var p=el('p');p.appendChild(el('b','',k));p.appendChild(document.createTextNode(v));c.appendChild(p);}
 row('Could really be: ',t.maybe);if(t.gets)row('Can get worse: ',t.gets+'. '+t.trade);row('How to tell: ',t.tell);
}
function renderSentence(){
 var o=$('d-out');o.textContent='';
 function part(v,ph){var s=el('span',v.trim()?'':'ph',v.trim()||ph);if(v.trim())s.style.fontWeight='600';return s;}
 o.appendChild(document.createTextNode('We need to decide whether to '));o.appendChild(part(brief.dec||'','[the decision]'));o.appendChild(document.createTextNode(' by '));o.appendChild(part(brief.when||'','[a date]'));o.appendChild(document.createTextNode('. We\'ll judge it on '));o.appendChild(part(brief.out||'','[one outcome]'));o.appendChild(document.createTextNode('.'));
}

function toMarkdown(){
 var a=analyse();var out=['# KPI tree','','Built with the KPI Tree Workshop, philpegram.com/kpi-tree','','## Monday brief',''];
 briefData(a).forEach(function(d){out.push('**'+d.t+'**');d.lines.forEach(function(l){out.push('- '+l);});out.push('');});
 out.push('## Outline','');
 walk(state,function(n,d){out.push(new Array(d).join('  ')+'- **'+label(n)+'** ('+n.timing+(n.control==='yes'&&!n.children.length?', lever':'')+(n.tested?', Monday test '+score(n)+'/6':'')+')'+(n.children.length?' – children '+OPNAME[n.op]:''));});
 out.push('','## Measurement plan','','| Metric | Definition | Formula | Owner | If it moved, we would | Timing |','|---|---|---|---|---|---|');
 walk(state,function(n){out.push('| '+[label(n),n.def.trim()||'Not set',formula(n)||'Leaf',n.owner.trim()||'Not set',n.decision.trim()||'Not set',n.timing].map(function(x){return String(x).replace(/\|/g,'/');}).join(' | ')+' |');});
 out.push('','## Flagged','');if(!a.issues.length)out.push('- Nothing flagged.');a.issues.forEach(function(i){out.push('- '+i.text);});
 return out.join('\n');
}
function toCsv(){
 var rows=[['Level','Metric','Parent','Definition','Formula','Owner','If it moved we would','Timing','Lever','Monday test']];
 walk(state,function(n,d,p){rows.push([d,label(n),p?label(p):'',n.def,formula(n),n.owner,n.decision,n.timing,(!n.children.length&&n.control==='yes')?'yes':'no',n.tested?score(n)+'/6':'']);});
 return rows.map(function(r){return r.map(function(c){c=String(c);if(/^[=+\-@]/.test(c))c="'"+c;return '"'+c.replace(/"/g,'""')+'"';}).join(',');}).join('\r\n');
}
function status(t){var s=$('kt-status');s.textContent=t;setTimeout(function(){s.textContent='';},4000);}
function copy(t,msg){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){status(msg);},function(){status('Copy was blocked by your browser. Try the CSV instead.');});}else{status('Copy isn\'t supported here. Try the CSV instead.');}}
function hasWork(){var w=false;walk(state,function(n){if(n.owner.trim()||n.decision.trim()||n.def.trim()||n.tested)w=true;});return w;}
function setTemplate(key){
 uid=0;state=TEMPLATES[key].build();selId=state.id;collapsed={};
 document.querySelectorAll('#kt-templates .choice').forEach(function(b){var on=b.getAttribute('data-k')===key;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
 save();renderTree();renderEditor(false);renderResults();
}
function init(){
 var tp=$('kt-templates');
 Object.keys(TEMPLATES).forEach(function(k){var b=el('button','choice',TEMPLATES[k].label);b.type='button';b.setAttribute('data-k',k);b.setAttribute('aria-pressed','false');b.addEventListener('click',function(){if(!hasWork()||confirm('Replace your current tree with this template?'))setTemplate(k);});tp.appendChild(b);});
 var qb=$('kt-qbox');
 QS.forEach(function(q,i){var l=el('label','kt-q');var c=document.createElement('input');c.type='checkbox';c.setAttribute('data-i',String(i));c.addEventListener('change',function(){var r=find(state,selId);if(!r)return;r.node.test[i]=c.checked?1:0;r.node.tested=true;renderTest(r.node);refresh();});l.appendChild(c);l.appendChild(el('span','',q));qb.appendChild(l);});
 if(!load()){setTemplate('sub');}else{renderTree();renderEditor(false);renderResults();}
 bind('f-name','name','name');bind('f-def','def','def');bind('f-op','op','op');bind('f-owner','owner','owner');bind('f-decision','decision','decision');bind('f-timing','timing','timing');bind('f-control','control','control');
 $('kt-add').addEventListener('click',function(){var r=find(state,selId);if(!r)return;var c=N('','none','leading','yes');r.node.children.push(c);collapsed[r.node.id]=false;selId=c.id;save();renderTree();renderEditor(true);renderResults();});
 $('kt-del').addEventListener('click',function(){var r=find(state,selId);if(!r||!r.parent)return;if(r.node.children.length&&!confirm('Delete this metric and everything beneath it?'))return;r.parent.children.splice(r.parent.children.indexOf(r.node),1);selId=r.parent.id;save();renderTree();renderEditor(false);renderResults();});
 function move(dir){var r=find(state,selId);if(!r||!r.parent)return;var arr=r.parent.children,i=arr.indexOf(r.node),j=i+dir;if(j<0||j>=arr.length)return;arr.splice(i,1);arr.splice(j,0,r.node);save();renderTree();renderEditor(false);renderResults();}
 $('kt-up').addEventListener('click',function(){move(-1);});$('kt-down').addEventListener('click',function(){move(1);});
 $('kt-reset').addEventListener('click',function(){if(confirm('Clear your tree and start again?'))setTemplate('blank');});
 var exp=$('kt-expand');exp.addEventListener('click',function(){var open=false;walk(state,function(n){if(n.children.length&&!collapsed[n.id]&&n!==state)open=true;});walk(state,function(n){collapsed[n.id]=open&&n!==state&&n.children.length>0;});exp.textContent=open?'Expand all':'Collapse all';renderTree();});
 $('kt-md').addEventListener('click',function(){copy(toMarkdown(),'Copied. Paste it into a doc, Notion or an email.');});
 $('kt-csv').addEventListener('click',function(){var blob=new Blob(['\ufeff'+toCsv()],{type:'text/csv;charset=utf-8'});var u=URL.createObjectURL(blob);var a=document.createElement('a');a.href=u;a.download='kpi-tree.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},500);status('CSV downloaded.');});
 $('kt-print').addEventListener('click',function(){document.querySelectorAll('details').forEach(function(d){d.open=true;});window.print();});
 ['s-metric','s-dir','s-last','s-cause','s-rel'].forEach(function(id){$(id).addEventListener('change',renderVerdict);});
 $('kt-rspin').addEventListener('click',renderRoulette);renderRoulette();
 [['d1','dec'],['d2','when'],['d3','out']].forEach(function(p){var f=$(p[0]);f.value=brief[p[1]]||'';f.addEventListener('input',function(){brief[p[1]]=f.value;save();renderSentence();renderResults();});});
 renderSentence();
 $('d-use').addEventListener('click',function(){if(brief.out&&brief.out.trim()){state.name=brief.out.trim();save();renderTree();renderEditor(false);renderResults();var b=$('build');if(b&&b.scrollIntoView)b.scrollIntoView({behavior:'smooth'});}else{$('d3').focus();}});
 document.querySelectorAll('[data-expand]').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('details.pb-group,details.pb-item').forEach(function(d){d.open=true;});});});
 document.querySelectorAll('[data-collapse]').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('details.pb-group,details.pb-item').forEach(function(d){d.open=false;});});});
 if(location.hash){var t=document.querySelector(location.hash);if(t&&t.tagName==='DETAILS')t.open=true;}
 window.addEventListener('hashchange',function(){var t=document.querySelector(location.hash);if(t&&t.tagName==='DETAILS')t.open=true;});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
