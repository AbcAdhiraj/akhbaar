/* akhbaar newsletter signup. no backend: posts to a google form, responses land in a sheet. */
(function(){
  var FORM='https://docs.google.com/forms/d/e/1FAIpQLSfyJ1fQq_VnGNiUUQ2Ux72DjxMyZMtScax5JiWBAW9ASJw4Zw/formResponse';
  var F_EMAIL='entry.1460316060', F_ACTION='entry.1937615804';
  var RE=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var qs=new URLSearchParams(location.search);
  function send(email,action){
    var b=new URLSearchParams();b.append(F_EMAIL,email);b.append(F_ACTION,action);
    return fetch(FORM,{method:'POST',mode:'no-cors',body:b});
  }
  function next(){var d=new Date().getDay();return (d===6||d===0||d===1||d===5)?'tuesday':'friday';}
  function bind(f,onDone){
    var inp=f.querySelector('input[type=email]'),btn=f.querySelector('button'),msg=f.parentNode.querySelector('.nl-msg');
    var action=f.getAttribute('data-action')||'subscribe';
    if(qs.get('e')&&inp)inp.value=qs.get('e');
    if(action==='subscribe'&&localStorage.getItem('akh_nl')&&msg&&!f.closest('.np-pop')){msg.textContent="you're already on the list. see you "+next()+".";}
    f.addEventListener('submit',function(ev){
      ev.preventDefault();
      var email=(inp.value||'').trim().toLowerCase();
      if(!RE.test(email)){msg.textContent="that doesn't look like an email. try again?";inp.focus();return;}
      btn.disabled=true;var old=btn.textContent;btn.textContent=action==='subscribe'?'adding you…':'removing you…';
      send(email,action).then(function(){
        if(action==='subscribe'){localStorage.setItem('akh_nl','1');f.classList.add('done');msg.textContent="you're in. first one lands this "+next()+". check spam once, then mark us safe.";}
        else{localStorage.removeItem('akh_nl');f.classList.add('done');msg.textContent="done. you won't hear from us again. no hard feelings.";}
        if(onDone)onDone(action);
      }).catch(function(){btn.disabled=false;btn.textContent=old;msg.textContent='something broke. try again in a sec.';});
    });
  }
  document.querySelectorAll('form.nl-form').forEach(function(f){bind(f);});

  /* ---- the spinning newspaper popup (homepage only, once per visitor, then quiet for 7 days) ---- */
  var home=!!document.getElementById('newsletter');
  var snooze=+localStorage.getItem('akh_pop')||0;
  var force=qs.has('paper');
  if(!home||(!force&&(localStorage.getItem('akh_nl')||Date.now()<snooze)))return;
  var d=new Date(),dn=d.getDate(),sfx=(dn%10==1&&dn!=11)?'st':(dn%10==2&&dn!=12)?'nd':(dn%10==3&&dn!=13)?'rd':'th';
  var dateStr=d.toLocaleDateString('en-US',{weekday:'long'})+', '+d.toLocaleDateString('en-US',{month:'long'})+' '+dn+sfx+', '+d.getFullYear();
  var wrap=document.createElement('div');
  wrap.className='np-ov';wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');wrap.setAttribute('aria-label','subscribe to the akhbaar dispatch');
  wrap.innerHTML=
   '<div class="np-pop">'+
    '<button class="np-x" aria-label="close">&times;</button>'+
    '<div class="np-mast"><span>late edition</span><b>akhbaar</b><span>price: 0 paise</span></div>'+
    '<div class="np-date"><span>vol. i</span><span>'+dateStr+'</span><span>special bulletin</span></div>'+
    '<div class="np-kick">extra! extra! read all about it</div>'+
    '<h2 class="np-h">your inbox to get a newspaper. <em>twice a week.</em></h2>'+
    '<div class="np-deck">local reader, 400 unread bookmarks deep, finally rescued. officials confirm: "zero larp."</div>'+
    '<div class="np-cols">'+
      '<div><p class="np-dc">every friday, the five most saved x articles of the week land in your inbox. ranked by saves, not vibes. read them, or forward them and look smart.</p></div>'+
      '<div class="np-pic"><div class="np-ph"><span>tue + fri</span></div><small>fig. 1: you, finally reading.</small></div>'+
      '<div><p>every tuesday, a bunch of random, actually useful trivia pulled from inside the articles. stats, tactics, one-liners. three minute read. sources linked, in case someone asks.</p></div>'+
    '</div>'+
    '<div class="np-sign">'+
      '<form class="nl-form" data-action="subscribe" novalidate><input type="email" name="email" placeholder="you@company.com" aria-label="your email" autocomplete="email" required><button type="submit">subscribe (free)</button></form>'+
      '<p class="nl-msg" aria-live="polite">no spam. no "quick favour". unsubscribe whenever.</p>'+
    '</div>'+
    '<button class="np-no">no thanks, i\'ll keep ghosting my bookmarks</button>'+
   '</div>';
  var shown=false,used=false;
  function close(){
    if(!shown)return;shown=false;
    localStorage.setItem('akh_pop',String(Date.now()+7*864e5));
    wrap.classList.add('out');
    setTimeout(function(){wrap.remove();document.documentElement.classList.remove('np-lock');},450);
    document.removeEventListener('keydown',onKey);
  }
  function onKey(e){if(e.key==='Escape')close();}
  function open(){
    if(used||document.hidden)return;used=shown=true;clearTimeout(t);
    document.body.appendChild(wrap);
    document.documentElement.classList.add('np-lock');
    bind(wrap.querySelector('form'),function(a){if(a==='subscribe')setTimeout(close,2600);});
    wrap.querySelector('.np-x').onclick=close;wrap.querySelector('.np-no').onclick=close;
    wrap.addEventListener('click',function(e){if(e.target===wrap)close();});
    document.addEventListener('keydown',onKey);
    requestAnimationFrame(function(){wrap.classList.add('in');});
    setTimeout(function(){var i=wrap.querySelector('input');if(i&&matchMedia('(pointer:fine)').matches)i.focus({preventScroll:true});},1700);
  }
  var t=setTimeout(open,force?600:3500);
  window.addEventListener('scroll',function s(){if(scrollY>window.innerHeight*.6){clearTimeout(t);open();window.removeEventListener('scroll',s);}},{passive:true});
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&!used){clearTimeout(t);t=setTimeout(open,1500);}});
})();
