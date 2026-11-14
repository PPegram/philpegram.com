document.documentElement.classList.add('js');
const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('#main-nav');
(function addPlaybookLinks(){
 const here=location.pathname.replace(/\/$/,'').replace(/\.html$/,'');
 const onPlaybook=here==='/playbook';
 if(nav&&!nav.querySelector('a[href="/playbook"]')){
  const a=document.createElement('a');a.href='/playbook';a.textContent='Playbook';
  if(onPlaybook)a.setAttribute('aria-current','page');
  nav.insertBefore(a,nav.querySelector('.nav-contact'));
 }
 const fm=document.querySelector('.footer-menu');
 if(fm&&!fm.querySelector('a[href="/playbook"]')){
  const contact=fm.querySelector('a[href="/contact"]');
  const a=document.createElement('a');a.href='/playbook';
  const n=document.createElement('span');n.textContent='05';
  a.append(n,'Data Playbook');
  fm.insertBefore(a,contact);
  const cn=contact?.querySelector('span');if(cn)cn.textContent='06';
 }
})();
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));nav.classList.toggle('open',!open);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){menu.setAttribute('aria-expanded','false');nav.classList.remove('open');menu.focus();}});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu?.setAttribute('aria-expanded','false');nav.classList.remove('open');}));
document.querySelectorAll('[data-copy]').forEach(btn=>btn.addEventListener('click',async()=>{
 const source=document.getElementById(btn.dataset.copy), status=btn.closest('.bio-panel,.message-box').querySelector('.copy-status');
 try{await navigator.clipboard.writeText(source.innerText);status.textContent='Copied. Paste and edit it where you need it.';}
 catch{const range=document.createRange();range.selectNodeContents(source);const s=window.getSelection();s.removeAllRanges();s.addRange(range);status.textContent='Automatic copying is unavailable. The text is selected so you can copy it manually.';}
}));
const briefs={
speaking:"Hi Phil, I'd like to discuss an event or podcast. The audience is… The proposed topic is… The date and format are…",
research:"Hi Phil, I'm working on… Your research on… is relevant because… I'd like to compare notes about…",
leadership:"Hi Phil, I'd like to discuss an insight-leadership opportunity or challenge. The organisation and context are… The decision or remit is… The next step I'm proposing is…"
};
function choose(topic){if(!briefs[topic])return;document.querySelectorAll('[data-topic]').forEach(b=>{const active=b.dataset.topic===topic;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});const target=document.getElementById('brief-text');if(target)target.textContent=briefs[topic];document.querySelectorAll('.copy-status').forEach(p=>p.textContent='');}
document.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.topic)));
choose(new URLSearchParams(location.search).get('topic')||location.hash.slice(1));
