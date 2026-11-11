/* akhbaar newsletter signup. no backend: posts to a google form, responses land in a sheet. */
(function(){
  var FORM='https://docs.google.com/forms/d/e/1FAIpQLSfyJ1fQq_VnGNiUUQ2Ux72DjxMyZMtScax5JiWBAW9ASJw4Zw/formResponse';
  var F_EMAIL='entry.1460316060', F_ACTION='entry.1937615804';
  var RE=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function send(email,action){
    var b=new URLSearchParams();b.append(F_EMAIL,email);b.append(F_ACTION,action);
    return fetch(FORM,{method:'POST',mode:'no-cors',body:b});
  }
  var qs=new URLSearchParams(location.search);
  document.querySelectorAll('form.nl-form').forEach(function(f){
    var inp=f.querySelector('input[type=email]'),btn=f.querySelector('button'),msg=f.parentNode.querySelector('.nl-msg');
    var action=f.getAttribute('data-action')||'subscribe';
    if(qs.get('e')&&inp)inp.value=qs.get('e');
    if(action==='subscribe'&&localStorage.getItem('akh_nl')&&msg){msg.textContent="you're already on the list. see you tuesday.";}
    f.addEventListener('submit',function(ev){
      ev.preventDefault();
      var email=(inp.value||'').trim().toLowerCase();
      if(!RE.test(email)){msg.textContent="that doesn't look like an email. try again?";inp.focus();return;}
      btn.disabled=true;var old=btn.textContent;btn.textContent=action==='subscribe'?'adding you…':'removing you…';
      send(email,action).then(function(){
        if(action==='subscribe'){localStorage.setItem('akh_nl','1');f.classList.add('done');msg.textContent="you're in. first one lands this "+next()+". check spam once, then mark us safe.";}
        else{localStorage.removeItem('akh_nl');f.classList.add('done');msg.textContent="done. you won't hear from us again. no hard feelings.";}
      }).catch(function(){btn.disabled=false;btn.textContent=old;msg.textContent='something broke. try again in a sec.';});
    });
  });
  function next(){var d=new Date().getDay();return (d===6||d===0||d===1||d===5)?'tuesday':'friday';}
})();
