(function(){
  var out=document.getElementById('route-readout');
  if(!out)return;
  var stops=document.querySelectorAll('.route-svg .stop');
  function show(el){
    out.innerHTML='';
    var s=document.createElement('strong');s.textContent=el.getAttribute('data-title');
    var p=document.createElement('span');p.textContent=el.getAttribute('data-blurb');
    out.appendChild(s);out.appendChild(p);
    stops.forEach(function(n){n.classList.toggle('on',n===el)});
  }
  stops.forEach(function(el){
    ['mouseenter','focus'].forEach(function(ev){el.addEventListener(ev,function(){show(el)})});
  });
})();
