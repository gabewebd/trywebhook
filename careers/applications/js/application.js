/* ==========================================================================
   Digital GrowthScale — shared application form behaviour
   Ported from the inline script each original role page carried. Role
   differences (file limits, portfolio rule, messages) come from
   ../config/application-roles.js, keyed by <body data-role="…">.

   Submission goes to Netlify Forms exactly as before (multipart POST with
   the hidden form-name field). This script never calls a webhook.
   ========================================================================== */
(function(){
  var form=document.getElementById('appForm'),
      err=document.getElementById('formError'),
      btn=document.getElementById('submitBtn'),
      ok=document.getElementById('success');
  if(!form)return;

  var slug=document.body.getAttribute('data-role'),
      role=(window.DGS_ROLES&&window.DGS_ROLES.bySlug(slug))||null;
  if(!role){
    // Config failed to load: keep the form usable with the original defaults.
    if(window.console)console.warn('[applications] No role config for "'+slug+'". Using defaults.');
    role={fileLimitsMB:{resume:3,portfolio:4},portfolioRequired:false,chipNoneHint:true,messages:{
      portfolioMissing:'Please upload your portfolio or share a portfolio link.',
      linkInvalid:'Please enter a valid link that starts with https://',
      sendFailed:'Something went wrong while sending your application. Please try again, or email your resume to talent@digitalgrowthscale.com.'}};
  }else if(role.netlifyFormName!==form.getAttribute('name')&&window.console){
    console.warn('[applications] Form name "'+form.getAttribute('name')+'" does not match config "'+role.netlifyFormName+'".');
  }
  var LIMITS=role.fileLimitsMB, MSG=role.messages;
  var submitLabel=btn.innerHTML;

  var yr=document.getElementById('yr');
  if(yr)yr.textContent=new Date().getFullYear();

  // show the success state if the page was reloaded after a plain (no-JS) submission
  if(location.search.indexOf('applied=1')>-1){form.style.display='none';ok.classList.add('show');}

  // file pickers: show file name, drag highlight, size check
  document.querySelectorAll('.drop').forEach(function(d){
    var input=d.querySelector('input'),name=document.getElementById(input.id+'-name');
    ['dragenter','dragover'].forEach(function(e){d.addEventListener(e,function(){d.classList.add('over')})});
    ['dragleave','drop'].forEach(function(e){d.addEventListener(e,function(){d.classList.remove('over')})});
    input.addEventListener('change',function(){
      d.classList.remove('err');
      var f=input.files[0];
      if(!f){name.textContent='';return;}
      var mb=f.size/1048576,max=LIMITS[input.id];
      if(max&&mb>max){d.classList.add('err');name.textContent='File is too large ('+mb.toFixed(1)+' MB). Max '+max+' MB.';input.value='';return;}
      name.textContent='✓ '+f.name+' ('+mb.toFixed(1)+' MB)';
    });
  });

  var pf=document.getElementById('portfolio'),pl=document.getElementById('plink');
  if(pl&&pf){pl.addEventListener('input',function(){pf.closest('.drop').classList.remove('err');});}

  // open the privacy notice when the link inside the consent text is clicked
  var op=document.getElementById('openPrivacy');
  if(op)op.addEventListener('click',function(){document.getElementById('privacyBox').open=true;});

  function fail(msg,el){err.textContent=msg;err.classList.add('show');if(el){el.focus({preventScroll:true});el.scrollIntoView({behavior:'smooth',block:'center'});}}

  var sending=false;
  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(sending)return; // block double submits while a request is in flight
    err.classList.remove('show');
    var req=form.querySelectorAll('[required]');
    for(var i=0;i<req.length;i++){
      var el=req[i];
      if(el.type==='checkbox'&&!el.checked){return fail('Please read and accept the Data Privacy Notice to continue.',el);}
      if(el.type==='file'&&!el.files.length){el.closest('.drop').classList.add('err');return fail('Please upload your updated resume.',el);}
      if(el.type!=='checkbox'&&el.type!=='file'&&!el.value.trim()){return fail('Please complete all required fields.',el);}
      if(el.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)){return fail('Please enter a valid email address.',el);}
    }
    var groups=form.querySelectorAll('.chipgroup[data-required]');
    for(var g=0;g<groups.length;g++){
      if(!groups[g].querySelector('input:checked')){
        return fail('Please select at least one option for '+groups[g].getAttribute('data-required')+(role.chipNoneHint?' (choose "None of these" if not applicable).':'.'),groups[g].querySelector('input'));
      }
    }
    if(role.portfolioRequired&&pf&&!pf.files.length&&!(pl&&pl.value.trim())){pf.closest('.drop').classList.add('err');return fail(MSG.portfolioMissing,pl);}
    if(pl&&pl.value.trim()&&!/^https?:\/\/\S+\.\S+/.test(pl.value.trim())){return fail(MSG.linkInvalid,pl);}

    sending=true;btn.disabled=true;btn.textContent='Submitting…';
    // Post to this page's own path. Netlify Forms accepts the POST on any static page;
    // the form is identified by the hidden "form-name" field, not by the URL.
    fetch(location.pathname,{method:'POST',body:new FormData(form)})
      .then(function(r){if(!r.ok)throw new Error(r.status);
        form.style.display='none';ok.classList.add('show');
        ok.scrollIntoView({behavior:'smooth',block:'center'});
      })
      .catch(function(){
        sending=false;btn.disabled=false;btn.innerHTML=submitLabel;
        fail(MSG.sendFailed);
      });
  });

  // hide the floating mobile button while the form is on screen
  var cta=document.getElementById('mobileCta'),sec=document.getElementById('apply');
  if(cta&&sec&&'IntersectionObserver' in window){
    new IntersectionObserver(function(en){cta.classList.toggle('hide',en[0].isIntersecting);},{threshold:.05}).observe(sec);
  }
})();
