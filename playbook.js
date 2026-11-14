(function(){
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const P='#f49ab8',G='#6b7190',L='#444961',OK=['#E69F00','#56B4E9','#009E73','#F0E442','#0072B2','#D55E00','#CC79A7'];
const groups=$$('.pb-group'),items=$$('.pb-item');
$('[data-expand]')?.addEventListener('click',()=>{groups.forEach(g=>g.open=true);items.forEach(i=>i.open=true);});
$('[data-collapse]')?.addEventListener('click',()=>{items.forEach(i=>i.open=false);groups.forEach(g=>g.open=g.classList.contains('start'));});
function openHash(){const id=location.hash.slice(1);if(!id)return;const el=document.getElementById(id);if(!el)return;let p=el;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}el.scrollIntoView({behavior:'smooth',block:'start'});}
openHash();window.addEventListener('hashchange',openHash);
function seg(root,cb){if(!root)return;$$('button',root).forEach(b=>b.addEventListener('click',()=>{$$('button',root).forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',String(x===b));});cb(b);}));}
function line(a,w,h,mn,mx,pad){pad=pad||4;return a.map((v,i)=>(pad+i*(w-2*pad)/(a.length-1)).toFixed(1)+','+(h-pad-(v-mn)/(mx-mn)*(h-2*pad)).toFixed(1)).join(' ');}
function el(tag,txt,cls){const e=document.createElement(tag);if(txt)e.textContent=txt;if(cls)e.className=cls;return e;}

const adv={
compare:['Bar chart, sorted by value','Use horizontal bars when labels are long. Start the axis at zero. Colour one bar if the story is about one bar.'],
time:['Line chart','Use it when the order of time matters and you have more than a handful of points. Label the line directly. With five points or fewer, columns are fine.'],
part:['One stacked bar, or a plain bar','Pies work for two or three slices when the point is "about half". Beyond that, the eye cannot rank angles. Sort the bars instead.'],
relate:['Scatter plot','Show whether two measures move together. Add a trend line only if you can defend it. Say plainly that a pattern is not a cause.'],
dist:['Histogram or box plot','Use it when the spread matters more than the average. Show the median and the range. Averages hide the awkward customers.'],
change:['Waterfall or bridge','Use it to explain how you get from A to B, such as last year\'s revenue to this year\'s. Keep the steps few and name each driver.'],
many:['Small multiples','Repeat one simple chart per segment, with the same axes. It beats a spaghetti line chart every time.'],
exact:['Table','If people need to look up exact values, give them a table. Right-align numbers and keep the gridlines faint.']};
const viz={
compare:()=>[200,165,130,95,60].map((w,i)=>'<rect x="10" y="'+(10+i*22)+'" width="'+w+'" height="14" rx="3" fill="'+(i?G:P)+'"/>').join(''),
time:()=>'<polyline points="10,95 45,82 80,88 115,62 150,68 185,42 230,24" fill="none" stroke="'+P+'" stroke-width="3" stroke-linejoin="round"/><circle cx="230" cy="24" r="5" fill="'+P+'"/><line x1="10" y1="108" x2="235" y2="108" stroke="'+L+'"/>',
part:()=>'<rect x="10" y="45" width="130" height="30" fill="'+P+'"/><rect x="140" y="45" width="60" height="30" fill="'+G+'"/><rect x="200" y="45" width="30" height="30" fill="#8b90a6"/>',
relate:()=>[[20,95],[45,80],[60,86],[85,60],[100,66],[125,48],[150,40],[175,52],[200,28],[220,22]].map(p=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="'+G+'"/>').join('')+'<line x1="14" y1="100" x2="226" y2="22" stroke="'+P+'" stroke-width="2.5" stroke-dasharray="5 4"/>',
dist:()=>[10,25,50,80,60,35,15].map((h,i)=>'<rect x="'+(14+i*31)+'" y="'+(108-h)+'" width="27" height="'+h+'" fill="'+(i==3?P:G)+'"/>').join('')+'<line x1="10" y1="108" x2="235" y2="108" stroke="'+L+'"/>',
change:()=>[[14,30,28,80,G],[54,30,28,25,P],[94,40,28,15,P],[134,40,28,22,P],[174,62,28,48,G]].map(r=>'<rect x="'+r[0]+'" y="'+r[1]+'" width="'+r[2]+'" height="'+r[3]+'" rx="3" fill="'+r[4]+'"/>').join('')+'<line x1="10" y1="110" x2="235" y2="110" stroke="'+L+'"/>',
many:()=>{let s='';for(let i=0;i<6;i++){const x=10+(i%3)*76,y=8+Math.floor(i/3)*56,d=[[2,3,4,6,7],[5,5,6,5,6],[8,7,5,4,2],[2,4,3,5,6],[6,7,6,8,9],[4,3,4,2,3]][i];s+='<rect x="'+x+'" y="'+y+'" width="68" height="46" rx="4" fill="none" stroke="'+L+'"/><polyline points="'+line(d,60,38,0,10,4).split(' ').map(p=>{const q=p.split(',');return (+q[0]+x+4)+','+(+q[1]+y+4);}).join(' ')+'" fill="none" stroke="'+(i==3?P:G)+'" stroke-width="2.5"/>';}return s;},
exact:()=>{let s='<rect x="10" y="10" width="220" height="16" fill="'+P+'" opacity=".25"/>';for(let i=0;i<5;i++){s+='<rect x="16" y="'+(36+i*16)+'" width="60" height="6" rx="3" fill="'+G+'"/><rect x="180" y="'+(36+i*16)+'" width="44" height="6" rx="3" fill="'+(i==2?P:G)+'"/><line x1="10" y1="'+(46+i*16)+'" x2="230" y2="'+(46+i*16)+'" stroke="'+L+'"/>';}return s;}};
const sel=$('#pb-pick'),out=$('#pb-out'),box=$('#pb-viz');
function showPick(){const a=adv[sel.value];out.innerHTML='<strong></strong><p></p>';out.querySelector('strong').textContent=a[0];out.querySelector('p').textContent=a[1];box.innerHTML='<svg viewBox="0 0 240 120" role="img" aria-label="'+a[0]+', illustration">'+viz[sel.value]()+'</svg>';}
if(sel){sel.addEventListener('change',showPick);showPick();}

const sb=['#sb1','#sb2','#sb3'].map(s=>$(s)),sbo=$('#sb-out');
function sbUpdate(){if(!sbo)return;const parts=['We need to decide whether to ',' by ','. This analysis will change the answer if ','.'];sbo.textContent='';sb.forEach((inp,i)=>{sbo.append(parts[i]);const v=inp.value.trim();const b=el('b',v||'...',v?'':'ph');sbo.append(b);});sbo.append(parts[3]);}
sb.forEach(i=>i&&i.addEventListener('input',sbUpdate));sbUpdate();

$$('.pb-tree button.node').forEach(b=>{const ul=b.nextElementSibling;b.addEventListener('click',()=>{const o=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!o));ul.hidden=o;});});

const nz=$('#pb-noise'),nzc=$('#pb-noise-cap');let ch=[];
const gz=()=>Math.random()+Math.random()+Math.random()-1.5;
function drawNoise(){if(!nz)return;const base=ch.slice(0,10),sd=Math.sqrt(base.reduce((a,v)=>a+v*v,0)/base.length),lim=2*sd,m=Math.max(8,lim,...ch.map(Math.abs)),sc=62/m,y0=80;let s='<rect x="8" y="'+(y0-lim*sc)+'" width="344" height="'+(2*lim*sc)+'" fill="'+P+'" opacity=".16"/><line x1="8" y1="'+y0+'" x2="352" y2="'+y0+'" stroke="'+L+'"/>';
ch.forEach((v,i)=>{const h=Math.max(Math.abs(v)*sc,1),x=14+i*31;s+='<rect x="'+x+'" y="'+(v>=0?y0-h:y0)+'" width="22" height="'+h+'" rx="3" fill="'+(i==10?P:G)+'"/>';});nz.innerHTML=s;
const last=ch[10],out2=Math.abs(last)>lim;nzc.textContent='';nzc.append('Latest month: ');nzc.append(el('b',(last>0?'+':'')+last.toFixed(1)+'%'));nzc.append('. The usual monthly swing is about \u00b1'+lim.toFixed(1)+'% (the shaded band). ');nzc.append(el('b',out2?'That is outside the usual range, so it is worth explaining.':'That sits inside the usual wobble, so do not build a story on it.'));}
function rollNoise(shock){ch=[];for(let i=0;i<11;i++)ch.push(gz()*3.2);if(shock)ch[10]=(Math.random()<.5?-1:1)*(10+Math.random()*3);drawNoise();}
$('#pb-roll')?.addEventListener('click',()=>rollNoise(false));$('#pb-shift')?.addEventListener('click',()=>rollNoise(true));if(nz)rollNoise(false);

const ax=$('#pb-axis'),axc=$('#pb-axis-cap'),av=[96,100];
function drawAx(min){if(!ax)return;$$('i',ax).forEach((i,k)=>i.style.height=((av[k]-min)/(100-min)*100)+'%');axc.textContent=min?'Same two numbers, 96 and 100. With the axis starting at '+min+', the first bar looks 40% shorter. It is 4% shorter.':'Starting at zero, the bars show what the numbers say: 96 against 100.';}
seg($('#pb-axseg'),b=>drawAx(+b.dataset.axis));drawAx(0);

const eye=$('#pb-eye'),eyc=$('#pb-eye-cap'),ev=[62,48,75,40,55,68],lab=['A','B','C','D','E','F'];let em='quiet',es=2;
function drawEye(){if(!eye)return;eye.innerHTML=ev.map((v,i)=>'<div data-i="'+i+'"><i style="height:'+v+'%;background:'+(em==='loud'?OK[i]:(i===es?P:G))+'"></i><span>'+lab[i]+'</span></div>').join('');eye.classList.toggle('click',em==='quiet');eyc.textContent=em==='loud'?'Six colours, six competing messages. Where do you look first?':'One loud bar, five quiet ones. Tap a bar to move the spotlight: bar '+lab[es]+' is the story.';}
eye?.addEventListener('click',e=>{const d=e.target.closest('[data-i]');if(d&&em==='quiet'){es=+d.dataset.i;drawEye();}});
seg($('#pb-eyeseg'),b=>{em=b.dataset.mode;drawEye();});drawEye();

const sm=$('#pb-sm'),sr=[[3,4,5,5,6,7,8,9],[5,5,6,5,6,6,5,6],[9,8,8,6,5,4,3,2],[2,3,2,4,3,5,4,6],[6,7,6,8,7,9,8,9],[4,3,4,3,2,3,2,3]];
function drawSm(mode){if(!sm)return;if(mode==='one'){sm.className='pb-chart';sm.innerHTML='<svg viewBox="0 0 320 140" role="img" aria-label="Six lines on one chart">'+sr.map((d,i)=>'<polyline points="'+line(d,320,140,0,10,8)+'" fill="none" stroke="'+OK[i]+'" stroke-width="2.5"/>').join('')+'</svg><p class="pb-cap">Six lines, one chart, and a legend to decode. Which one is the story?</p>';}else{sm.className='';sm.innerHTML='<div class="pb-mini">'+sr.map((d,i)=>'<div><svg viewBox="0 0 100 56" role="img" aria-label="Segment '+(i+1)+'"><polyline points="'+line(d,100,56,0,10,5)+'" fill="none" stroke="'+(i===3?P:G)+'" stroke-width="2.5"/></svg>Segment '+(i+1)+'</div>').join('')+'</div><p class="pb-cap">Same scale in every panel. The shapes compare themselves, and one panel carries the highlight.</p>';}}
seg($('#pb-smseg'),b=>drawSm(b.dataset.sm));drawSm('one');

seg($('#pb-simseg'),b=>{const f={normal:'none',deut:'url(#f-deut)',prot:'url(#f-prot)',grey:'url(#f-grey)'}[b.dataset.sim];const w=$('#pb-sim');if(w)w.style.filter=f;});

function stepper(root,panel,data){if(!root)return;const btns=$$('button',root);function set(i){btns.forEach((b,k)=>{b.classList.toggle('on',k===i);b.setAttribute('aria-pressed',String(k===i));});panel.textContent='';panel.append(el('strong',data[i][0]),el('p',data[i][1]),el('p',data[i][2],'fine'));}btns.forEach((b,k)=>b.addEventListener('click',()=>set(k)));set(0);}
stepper($('#pb-claims'),$('#pb-claim-panel'),[
['"These move together."','Observational data can support this. Show the pattern, and say plainly that it is a pattern.','Example: customers who use the app churn less.'],
['"This probably drives that."','You need a plausible mechanism and a reason to rule out the obvious alternatives.','Example: the app makes billing easier, and engaged customers did not simply choose to use it.'],
['"This caused that."','You generally need a test, a good natural experiment or a very strong design.','Example: a staggered rollout, with a comparison group, cut churn.']]);
stepper($('#pb-flow'),$('#pb-flow-panel'),[
['Problem','What is at stake, in one sentence the audience already agrees with.','Example: we lose too many customers in their first quarter.'],
['Evidence','The two or three findings that matter, each with its chart.','Example: half of our churn happens in the first 90 days.'],
['Implication','What it means for customers, cost or revenue. Make the consequence explicit.','Example: early churn is our biggest avoidable revenue loss.'],
['Decision','The choice you are asking for, with your recommendation.','Example: fund a redesigned onboarding flow for the first quarter.'],
['Action','Who does what by when.','Example: product owns the design, insight tracks 90-day churn monthly.']]);

document.addEventListener('click',e=>{const f=e.target.closest('.pb-flipbtn');if(f){const to=f.parentElement.querySelector('.to');const show=to.hidden;to.hidden=!show;f.textContent=show?'Show the topic title':'Make it say so what';}
const c=e.target.closest('[data-copytext]');if(c){const old=c.textContent;(navigator.clipboard?navigator.clipboard.writeText(c.dataset.copytext):Promise.reject()).then(()=>{c.textContent='Copied';},()=>{c.textContent='Copy it manually';}).finally(()=>setTimeout(()=>{c.textContent=old;},1600));}});

$$('[data-hex]').forEach(b=>b.addEventListener('click',async()=>{const h=b.dataset.hex,s=b.querySelector('span'),old=s.dataset.label||s.textContent;s.dataset.label=old;try{await navigator.clipboard.writeText(h);s.textContent='Copied '+h;}catch(e){s.textContent=h+' (copy manually)';}setTimeout(()=>{s.textContent=old;},1600);}));

const boxes=$$('.pb-check input'),ring=$('#pb-ring'),count=$('#pb-count'),key='pb-checklist-v1',C=2*Math.PI*34;let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}');}catch(e){}
function update(){const d=boxes.filter(b=>b.checked).length;if(ring){ring.style.strokeDasharray=C;ring.style.strokeDashoffset=C*(1-(boxes.length?d/boxes.length:0));}if(count)count.textContent=d+' of '+boxes.length+' checked'+(d===boxes.length&&d?'. Ready to send.':'');}
boxes.forEach((b,i)=>{b.checked=!!saved[i];b.addEventListener('change',()=>{saved[i]=b.checked;try{localStorage.setItem(key,JSON.stringify(saved));}catch(e){}update();});});
$('#pb-reset')?.addEventListener('click',()=>{boxes.forEach(b=>b.checked=false);saved={};try{localStorage.removeItem(key);}catch(e){}update();});
update();
})();
