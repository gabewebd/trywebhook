(function(){
  document.getElementById('yr').textContent=new Date().getFullYear();
  var btns=document.querySelectorAll('.filters button'),cards=document.querySelectorAll('.card');
  btns.forEach(function(b){b.addEventListener('click',function(){
    btns.forEach(function(x){x.classList.remove('on');x.setAttribute('aria-selected','false')});
    b.classList.add('on');b.setAttribute('aria-selected','true');
    var f=b.getAttribute('data-f');
    cards.forEach(function(c){c.style.display=(f==='all'||c.getAttribute('data-cat')===f)?'':'none'});
  })});
})();
