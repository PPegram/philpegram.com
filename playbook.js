(function(){
const groups=[...document.querySelectorAll('.pb-group')];
const items=[...document.querySelectorAll('.pb-item')];
document.querySelector('[data-expand]')?.addEventListener('click',()=>{groups.forEach(g=>g.open=true);items.forEach(i=>i.open=true);});
document.querySelector('[data-collapse]')?.addEventListener('click',()=>{items.forEach(i=>i.open=false);groups.forEach(g=>g.open=g.classList.contains('start'));});
function openHash(){const id=location.hash.slice(1);if(!id)return;const el=document.getElementById(id);if(!el)return;let p=el;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}el.scrollIntoView({behavior:'smooth',block:'start'});}
openHash();window.addEventListener('hashchange',openHash);
const advice={
compare:['Bar chart, sorted by value','Use horizontal bars when labels are long. Start the axis at zero. Colour one bar if the story is about one bar.'],
time:['Line chart','Use it when the order of time matters and you have more than a handful of points. Label the line directly. With five points or fewer, columns are fine.'],
part:['One stacked bar, or a plain bar','Pies work for two or three slices when the point is "about half". Beyond that, the eye cannot rank angles. Sort the bars instead.'],
relate:['Scatter plot','Show whether two measures move together. Add a trend line only if you can defend it. Say plainly that a pattern is not a cause.'],
dist:['Histogram or box plot','Use it when the spread matters more than the average. Show the median and the range. Averages hide the awkward customers.'],
change:['Waterfall or bridge','Use it to explain how you get from A to B, such as last year\'s revenue to this year\'s. Keep the steps few and name each driver.'],
many:['Small multiples','Repeat one simple chart per segment, with the same axes. It beats a spaghetti line chart every time.'],
exact:['Table','If people need to look up exact values, give them a table. Right-align numbers and keep the gridlines faint.']
};
const sel=document.getElementById('pb-pick');const out=document.getElementById('pb-out');
function show(){const a=advice[sel.value];out.innerHTML='<strong></strong><p></p>';out.querySelector('strong').textContent=a[0];out.querySelector('p').textContent=a[1];}
sel?.addEventListener('change',show);if(sel)show();
document.querySelectorAll('[data-hex]').forEach(b=>b.addEventListener('click',async()=>{const h=b.dataset.hex;const s=b.querySelector('span');const old=s.dataset.label||s.textContent;s.dataset.label=old;try{await navigator.clipboard.writeText(h);s.textContent='Copied '+h;}catch{s.textContent=h+' (copy manually)';}setTimeout(()=>{s.textContent=old;},1600);}));
const boxes=[...document.querySelectorAll('.pb-check input')];const bar=document.querySelector('.pb-progress div');const count=document.getElementById('pb-count');
const key='pb-checklist-v1';let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}');}catch(e){}
function update(){const done=boxes.filter(b=>b.checked).length;if(bar)bar.style.width=(boxes.length?done/boxes.length*100:0)+'%';if(count)count.textContent=done+' of '+boxes.length+' checked';}
boxes.forEach((b,i)=>{b.checked=!!saved[i];b.addEventListener('change',()=>{saved[i]=b.checked;try{localStorage.setItem(key,JSON.stringify(saved));}catch(e){}update();});});
document.getElementById('pb-reset')?.addEventListener('click',()=>{boxes.forEach(b=>b.checked=false);saved={};try{localStorage.removeItem(key);}catch(e){}update();});
update();
})();
