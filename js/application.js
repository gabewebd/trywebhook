/* ==========================================================================
   Digital GrowthScale — shared application form behaviour
   Ported from the inline script each original role page carried. Role
   differences (file limits, portfolio rule, messages) come from
   config/application-roles.js, keyed by <body data-role="…">.

   Submission goes to Netlify Forms exactly as before (multipart POST with
   the hidden form-name field). If the role has `webhook.endpoint` in the
   config, a JSON copy of the answers is then posted to that webhook.
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
    // Step 1: Netlify Forms stores the application and the uploaded files.
    // Step 2: if the role has a webhook, send a JSON copy of the same answers.
    // Success shows only when every step succeeds. If only the webhook failed,
    // a retry resends just the webhook (the saved payload), not a second Netlify entry.
    var step=netlifyDone?Promise.resolve():postNetlify();
    step.then(function(){return webhookPayload?postWebhook(webhookPayload):null;})
      .then(function(){
        form.style.display='none';ok.classList.add('show');
        ok.scrollIntoView({behavior:'smooth',block:'center'});
      })
      .catch(function(){
        sending=false;btn.disabled=false;btn.innerHTML=submitLabel;
        fail(netlifyDone?MSG.webhookFailed:MSG.sendFailed);
      });
  });

  var netlifyDone=false,webhookPayload=null,
      webhookUrl=role.webhook&&role.webhook.endpoint;

  function postNetlify(){
    var sid=document.getElementById('submissionId');
    if(sid&&!sid.value)sid.value=newId();
    // Post to the site root, as in Netlify's AJAX example. "/" is a static page (index.html),
    // so no redirect or clean-URL rule can intercept the POST. Netlify identifies the form
    // by the hidden "form-name" field, not by the URL.
    return fetch('/',{method:'POST',body:new FormData(form)})
      .then(function(r){
        if(!r.ok)throw new Error(r.status);
        netlifyDone=true;
        // Netlify quietly accepts honeypot (spam) entries; never forward those.
        var bot=form.querySelector('[name="bot-field"]');
        if(webhookUrl&&!(bot&&bot.value))webhookPayload=buildPayload();
      });
  }

  function postWebhook(payload){
    var ctrl='AbortController' in window?new AbortController():null,
        t=ctrl&&setTimeout(function(){ctrl.abort();},15000);
    return fetch(webhookUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:ctrl&&ctrl.signal})
      .then(function(r){clearTimeout(t);if(!r.ok)throw new Error(r.status);},function(e){clearTimeout(t);throw e;});
  }

  // Flat JSON of every named field in this form, so each role's own questions come through.
  // Keys keep the form's field names; checkbox groups drop the trailing "[]" and join the
  // ticked values with ", ". Unticked or empty fields are sent as "" so the keys stay the same
  // on every submission. File inputs send the file's name, type and size only: the file itself
  // is stored by Netlify Forms, and this browser request cannot include or link to it.
  //
  // Two extra keys hold everything as readable text, for an AI screening step that needs
  // only two merge fields, whatever the role's questions are:
  //   applicant-answers  "Question: answer" per line, labels taken from the form
  //   role-requirements  the role summary and job description cards from this page
  function buildPayload(){
    var p={},groups={},labels={};
    Array.prototype.forEach.call(form.elements,function(el){
      var n=el.name;
      if(!n||n==='bot-field'||el.type==='submit'||el.type==='button')return;
      var key=n.replace(/\[\]$/,'');
      if(!(key in labels))labels[key]=el.type==='hidden'?null:questionFor(el,key);
      if(el.type==='file'){
        var f=el.files[0];
        p[key]=f?f.name:'';p[key+'-type']=f?(f.type||''):'';p[key+'-size-kb']=f?Math.round(f.size/1024):'';
      }else if(el.type==='checkbox'&&key!==n){
        if(!(key in p))p[key]=''; // placeholder keeps the field's place in form order
        (groups[key]=groups[key]||[]);if(el.checked)groups[key].push(el.value);
      }else if(el.type==='checkbox'||el.type==='radio'){
        if(!(key in p))p[key]='';if(el.checked)p[key]=el.value;
      }else{
        p[key]=(el.value||'').trim();
      }
    });
    for(var g in groups)p[g]=groups[g].join(', ');

    var lines=['Position: '+(p.position||'')];
    for(var k in labels){
      if(!labels[k])continue;
      var v=p[k]===''?'(no answer)':p[k];
      if(k in groups||!form.querySelector('[name="'+k+'"][type="file"]')){lines.push(labels[k]+': '+v);}
      else{lines.push(labels[k]+': '+(p[k]?v+' (file stored in Netlify Forms; contents not included)':'(not provided)'));}
    }
    p['applicant-answers']=lines.join('\n');
    p['role-requirements']=roleRequirements();
    p['role-slug']=slug;
    p['submitted-at']=new Date().toISOString();
    p['page-url']=location.origin+location.pathname;
    return p;
  }

  // Short names for the two consent boxes, whose labels are full sentences.
  var QUESTION_NAMES={'privacy-consent':'Data privacy consent','talent-pool-consent':'Keep application on file for future openings'};

  // The question text shown to the applicant, without the "*" and "(optional)" markers.
  function questionFor(el,key){
    if(QUESTION_NAMES[key])return QUESTION_NAMES[key];
    var chips=el.closest('.chips'),lbl=null;
    if(chips)lbl=chips.parentElement.querySelector(':scope > label');
    else if(el.id)lbl=form.querySelector('label[for="'+el.id+'"]');
    if(!lbl)lbl=el.closest('label');
    return lbl?cleanText(lbl):key;
  }
  function cleanText(node){
    var c=node.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('.req,.opt,input,select,textarea'),function(x){x.remove();});
    return c.textContent.replace(/\s+/g,' ').trim().replace(/:$/,'');
  }

  // The role summary and job description cards ("Key responsibilities", "What we're looking for", ...).
  var requirementsText=null;
  function roleRequirements(){
    if(requirementsText!==null)return requirementsText;
    var jd=document.querySelector('.jd'),out=[];
    if(jd){
      var lead=jd.parentElement.querySelector('.lead');
      if(lead)out.push('Role summary: '+cleanText(lead));
      Array.prototype.forEach.call(jd.querySelectorAll('.card'),function(card){
        var h=card.querySelector('h3');
        if(h)out.push('',cleanText(h));
        Array.prototype.forEach.call(card.querySelectorAll('li'),function(li){out.push('- '+cleanText(li));});
      });
    }
    return (requirementsText=out.join('\n').trim());
  }

  function newId(){
    if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();
    return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
  }

  // hide the floating mobile button while the form is on screen
  var cta=document.getElementById('mobileCta'),sec=document.getElementById('apply');
  if(cta&&sec&&'IntersectionObserver' in window){
    new IntersectionObserver(function(en){cta.classList.toggle('hide',en[0].isIntersecting);},{threshold:.05}).observe(sec);
  }
})();
