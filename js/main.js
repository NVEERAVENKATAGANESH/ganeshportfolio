'use strict';

const IS_GALLERY_PAGE = location.pathname.includes('gallery');

const throttle = (fn, ms=50) => { let l=0; return (...a) => { const n=Date.now(); if(n-l>=ms){l=n;fn(...a);} }; };
const debounce = (fn, ms=100) => { let id; return (...a) => { clearTimeout(id); id=setTimeout(()=>fn(...a),ms); }; };

// Cached touch-device check — used in multiple places to skip mouse-only effects
const IS_TOUCH = window.matchMedia('(hover:none)').matches;
// Cached reduced-motion preference — queried once to avoid repeated style recalcs
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let _galaxyCtrl = null; // controlled by initTheme after initGalaxy runs

/* ── 3. TYPED ── */
function initTyped(){
  const el=document.getElementById('typed'); if(!el) return;
  const strings=['Full-Stack Developer','Python & Django Engineer','AI & ML Engineer','React Frontend Engineer','Cloud & DevOps Practitioner'];
  if(reducedMotion){
    el.textContent=strings[0]; return;
  }
  let si=0,ci=0,del=false,wait=80;
  function tick(){
    const s=strings[si];
    el.textContent=del?s.slice(0,--ci):s.slice(0,++ci);
    if(!del&&ci===s.length){del=true;wait=2000;}
    else if(del&&ci===0){del=false;si=(si+1)%strings.length;wait=350;}
    else wait=del?35:55+Math.random()*35;
    setTimeout(tick,wait);
  }
  setTimeout(tick,1000);
}

/* ── 6. PHOTO TILT ── */
function initPhotoTilt(){
  const wrap=document.querySelector('.about-photo-wrap'); if(!wrap) return;
  let _tiltLast=0;
  wrap.addEventListener('mousemove',e=>{
    const now=Date.now(); if(now-_tiltLast<16) return; _tiltLast=now;
    const r=wrap.getBoundingClientRect();
    const x=((e.clientX-r.left)/r.width-0.5)*22;
    const y=((e.clientY-r.top)/r.height-0.5)*-22;
    wrap.style.transform=`perspective(500px) rotateX(${y}deg) rotateY(${x}deg) scale(1.06)`;
  });
  wrap.addEventListener('mouseleave',()=>{ wrap.style.transform=''; });
}

/* ── 7. SCROLL BAR ── */
function initScrollBar(){
  const bar=document.getElementById('scrollBar'); if(!bar) return;
  window.addEventListener('scroll',throttle(()=>{
    const {scrollTop,scrollHeight,clientHeight}=document.documentElement;
    bar.style.width=(scrollTop/(scrollHeight-clientHeight)*100)+'%';
  },16),{passive:true});
}

/* ── 8. BACK TO TOP ── */
function initBackToTop(){
  const btn=document.getElementById('backToTop'); if(!btn) return;
  window.addEventListener('scroll',throttle(()=>{
    btn.style.display=window.scrollY>300?'flex':'none';
  },100),{passive:true});
  btn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
}

/* ── 10. TIMELINE ── */
function initTimeline(){
  const toggle=document.querySelector('.timeline-toggle'); if(!toggle) return;
  const btns=Array.from(toggle.querySelectorAll('.toggle-btn'));
  const secs={education:document.querySelector('.section-education'),experience:document.querySelector('.section-experience')};
  function show(name){
    toggle.dataset.active=name;
    toggle.style.setProperty('--pill-left',name==='education'?'0%':'50%');
    btns.forEach(b=>b.setAttribute('aria-selected',b.dataset.section===name));
    Object.entries(secs).forEach(([k,el])=>{
      if(!el) return;
      el.classList.toggle('d-none',k!==name);
      if(k===name) el.querySelectorAll('.timeline-item').forEach((item,i)=>{
        item.classList.add('tl-anim');
        item.classList.remove('visible');
        setTimeout(()=>item.classList.add('visible'),i*160);
      });
    });
  }
  btns.forEach(b=>b.addEventListener('click',()=>show(b.dataset.section)));
  requestAnimationFrame(()=>requestAnimationFrame(()=>show(toggle.dataset.active||'education')));
}

/* ── 11. SKILLS ── */
function initSkills(){
  const toggle=document.querySelector('.skills-toggle'); if(!toggle) return;
  const btns=Array.from(toggle.querySelectorAll('.toggle-btn'));
  const cards=Array.from(document.querySelectorAll('.skill-card'));
  toggle.style.setProperty('--count',btns.length);
  toggle.style.setProperty('--pill-index',0);
  btns.forEach((btn,idx)=>{
    btn.setAttribute('aria-selected',idx===0);
    btn.addEventListener('click',()=>{
      toggle.style.setProperty('--pill-index',idx);
      btns.forEach(b=>b.setAttribute('aria-selected','false'));
      btn.setAttribute('aria-selected','true');
      const cat=btn.dataset.cat;
      cards.forEach(c=>c.classList.toggle('d-none',cat!=='all'&&c.dataset.cat!==cat));
    });
  });
}
function initSkillCharts(){
  const charts=Array.from(document.querySelectorAll('.skill-chart'));
  if(!charts.length) return;
  charts.forEach(c=>c.style.setProperty('--pct',0));
  if(reducedMotion){
    charts.forEach(c=>{
      const card=c.closest('.skill-card');
      const pct=parseFloat(card?.dataset.value)||0;
      c.style.setProperty('--pct',pct);
      const valEl=card?.querySelector('.skill-value');
      if(valEl) valEl.textContent=Math.round(pct)+'%';
    });
    return;
  }
  // Single shared rAF loop — all visible charts animate in one ticker
  const active=new Map(); // chart → {pct, target, valEl}
  let rafId=null;
  let _animatedCount=0;
  const _totalCharts=charts.length;
  function tick(){
    let running=false;
    active.forEach((state,chart)=>{
      state.pct=Math.min(state.target,state.pct+1.5);
      chart.style.setProperty('--pct',state.pct);
      if(state.valEl) state.valEl.textContent=Math.round(state.pct)+'%';
      if(state.pct<state.target) running=true;
      else { active.delete(chart); _animatedCount++; if(_animatedCount>=_totalCharts && _skillObs) { _skillObs.disconnect(); _skillObs=null; } }
    });
    if(running) rafId=requestAnimationFrame(tick);
    else rafId=null;
  }
  function enqueue(chart){
    if(active.has(chart)) return;
    const card=chart.closest('.skill-card');
    const target=parseFloat(card?.dataset.value)||0;
    const valEl=card?.querySelector('.skill-value');
    active.set(chart,{pct:0,target,valEl});
    if(!rafId) rafId=requestAnimationFrame(tick);
  }
  let _skillObs=null;
  if('IntersectionObserver' in window){
    _skillObs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{ if(e.isIntersecting){enqueue(e.target);_skillObs&&_skillObs.unobserve(e.target);} });
    },{threshold:0.05,rootMargin:'0px 0px -20px 0px'});
    charts.forEach(c=>_skillObs.observe(c));
  } else {
    charts.forEach(c=>enqueue(c));
  }
}

/* ── 12. PROJECT FILTER ── */
function initProjectFilter(){
  const search=document.getElementById('projectSearch');
  const filter=document.getElementById('projectFilter');
  const sort=document.getElementById('projectSort');
  const cont=document.getElementById('projectGallery');
  const noMsg=document.getElementById('noProjectsMsg');
  if(!search||!filter||!sort||!cont||!noMsg) return;
  const cards=Array.from(document.querySelectorAll('.project-card'));
  function apply(){
    const term=search.value.trim().toLowerCase(), cat=filter.value;
    const getTitle=c=>(c.querySelector('.card-title')?.textContent||'');
    // Sort first so DOM order always reflects active sort, then apply filter visibility
    const sorted=[...cards];
    if(sort.value==='az') sorted.sort((a,b)=>getTitle(a).localeCompare(getTitle(b)));
    if(sort.value==='za') sorted.sort((a,b)=>getTitle(b).localeCompare(getTitle(a)));
    const frag=document.createDocumentFragment();
    let vis=0;
    sorted.forEach(c=>{
      const t=(c.querySelector('.card-title')?.textContent??'').toLowerCase();
      const d=(c.querySelector('.card-text')?.textContent??'').toLowerCase();
      const ok=(!term||t.includes(term)||d.includes(term))&&(cat==='all'||c.dataset.category===cat);
      c.style.display=ok?'':'none'; vis+=ok?1:0;
      frag.appendChild(c);
    });
    cont.appendChild(frag);
    noMsg.classList.toggle('d-none',vis>0);
  }
  search.addEventListener('input',debounce(apply,100));
  filter.addEventListener('change',apply);
  sort.addEventListener('change',apply);
  apply();
}

/* ── 13. CERTIFICATE MODAL ── */
function initCertModal(){
  // Section-local modals keyed by data-cert-modal attribute value
  const MODALS = {
    achievements: {
      modal:     document.getElementById('achievementsCertModal'),
      titleEl:   document.getElementById('achievementsCertModalTitle'),
      subEl:     document.getElementById('achievementsCertModalSubtitle'),
      contentEl: document.getElementById('achievementsCertModalContent'),
      openLink:  document.getElementById('achievementsCertModalOpenLink'),
      dlBtn:     document.getElementById('achievementsCertModalDownload'),
    },
    testimonials: {
      modal:     document.getElementById('testimonialsCertModal'),
      titleEl:   document.getElementById('testimonialsCertModalTitle'),
      subEl:     document.getElementById('testimonialsCertModalSubtitle'),
      contentEl: document.getElementById('testimonialsCertModalContent'),
      openLink:  document.getElementById('testimonialsCertModalOpenLink'),
      dlBtn:     document.getElementById('testimonialsCertModalDownload'),
    }
  };

  let _certOpener = null;
  let _clearTid = null;
  function closeAll(){
    clearTimeout(_clearTid); // cancel any stale content-clear that could wipe a freshly opened modal
    Object.values(MODALS).forEach(m => {
      if (!m.modal) return;
      m.modal.classList.remove('is-open');
      m.modal.setAttribute('aria-hidden', 'true');
    });
    document.body.classList.remove('cert-modal-open');
    const opener = _certOpener;
    _certOpener = null;
    _clearTid = setTimeout(() => {
      Object.values(MODALS).forEach(m => { if (m.contentEl) m.contentEl.innerHTML = ''; });
      opener?.focus(); // return focus to the trigger after animation completes
    }, 250);
  }

  // Close buttons inside modals
  document.querySelectorAll('.section-cert-close').forEach(btn => {
    btn.addEventListener('click', closeAll);
  });

  // Focus trap — keep Tab cycling inside each cert modal while open
  Object.values(MODALS).forEach(m => {
    if (!m.modal) return;
    m.modal.addEventListener('keydown', e => {
      if (e.key !== 'Tab' || !m.modal.classList.contains('is-open')) return;
      const focusable = Array.from(m.modal.querySelectorAll('button,a,input,[tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.disabled && el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
    });
  });

  // Click backdrop to close
  Object.values(MODALS).forEach(m => {
    if (!m.modal) return;
    m.modal.addEventListener('click', e => { if (e.target === m.modal) closeAll(); });
    // Swipe down to close on touch devices
    let touchY = 0;
    const box = m.modal.querySelector('.section-cert-modal-box');
    if (box) {
      box.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
      box.addEventListener('touchend', e => { if (e.changedTouches[0].clientY - touchY > 80) closeAll(); }, { passive: true });
    }
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const anyOpen = Object.values(MODALS).some(m => m.modal?.classList.contains('is-open'));
      if (anyOpen) closeAll();
    }
  });

  // Open modal on [data-cert] button click
  document.querySelectorAll('[data-cert]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const certPath = (btn.dataset.cert || '').trim().replace(/\0/g, '');
      if(!certPath || !/^(https?:\/\/|\/[^/]|images\/)/.test(certPath) || certPath.includes('..')) return;
      const certName = btn.dataset.certName || 'Certificate';
      const modalKey = btn.dataset.certModal || 'achievements';
      const m = MODALS[modalKey];
      if (!m || !m.modal || !m.contentEl) return;

      const isPdf = /\.pdf$/i.test(certPath);

      if (m.titleEl) m.titleEl.textContent = certName;
      if (m.subEl)   m.subEl.textContent   = isPdf ? 'PDF preview' : 'Image preview';
      if (m.openLink){ m.openLink.href = certPath; }
      if (m.dlBtn)   { m.dlBtn.href = certPath; m.dlBtn.setAttribute('download', certName); }

      m.contentEl.innerHTML = '<div class="cert-spinner"><div class="cert-spinner-ring"></div><span>Loading certificate…</span></div>';

      if (isPdf) {
        m.contentEl.innerHTML = '';
        const obj = document.createElement('object');
        obj.data = certPath;
        obj.type = 'application/pdf';
        obj.style.cssText = 'width:100%;height:520px;border:none;border-radius:0.75rem;background:#fff;display:block;';
        obj.setAttribute('aria-label', certName);
        // Build fallback via DOM — no innerHTML with user-derived paths
        const fb = document.createElement('div'); fb.className = 'cert-error';
        const fbI = document.createElement('i'); fbI.className = 'fas fa-file-pdf'; fbI.setAttribute('aria-hidden','true');
        const fbP = document.createElement('p'); fbP.textContent = 'PDF preview not available in this browser.';
        const fbA = document.createElement('a'); fbA.href = certPath; fbA.target = '_blank'; fbA.rel = 'noopener'; fbA.className = 'btn btn-primary btn-sm';
        const fbAI = document.createElement('i'); fbAI.className = 'fas fa-external-link-alt me-1'; fbAI.setAttribute('aria-hidden','true');
        fbA.appendChild(fbAI); fbA.appendChild(document.createTextNode('Open PDF'));
        fb.appendChild(fbI); fb.appendChild(fbP); fb.appendChild(fbA);
        obj.appendChild(fb);
        m.contentEl.appendChild(obj);
      } else {
        const img = new Image();
        img.alt = certName;
        img.style.cssText = 'width:100%;border-radius:0.75rem;display:none;';
        let _certImgTid = null;
        const showCertError = (msg) => {
          clearTimeout(_certImgTid); _certImgTid = null;
          // Build error via DOM — no innerHTML with user-derived paths
          const er = document.createElement('div'); er.className = 'cert-error';
          const erI = document.createElement('i'); erI.className = 'fas fa-exclamation-circle'; erI.setAttribute('aria-hidden','true');
          const erP = document.createElement('p'); erP.textContent = msg || 'Could not load preview.';
          const erA = document.createElement('a'); erA.href = certPath; erA.target = '_blank'; erA.rel = 'noopener'; erA.className = 'btn btn-outline-primary btn-sm';
          const erAI = document.createElement('i'); erAI.className = 'fas fa-external-link-alt me-1'; erAI.setAttribute('aria-hidden','true');
          erA.appendChild(erAI); erA.appendChild(document.createTextNode('Open directly'));
          er.appendChild(erI); er.appendChild(erP); er.appendChild(erA);
          m.contentEl.replaceChildren(er);
        };
        img.onload  = () => { clearTimeout(_certImgTid); _certImgTid = null; m.contentEl.innerHTML = ''; img.style.display = 'block'; m.contentEl.appendChild(img); };
        img.onerror = () => showCertError('Could not load preview.');
        _certImgTid = setTimeout(() => { img.src = ''; showCertError('Certificate took too long to load.'); }, 8000);
        img.src = certPath;
      }

      _certOpener = btn; // track for focus restoration on close
      clearTimeout(_clearTid); // cancel any pending content-clear from a previous close
      m.modal.classList.add('is-open');
      m.modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('cert-modal-open');
      const certBox = m.modal.querySelector('.section-cert-modal-box') || m.modal.querySelector('[tabindex="-1"]');
      if(certBox){ certBox.setAttribute('tabindex','-1'); requestAnimationFrame(()=>certBox.focus({ preventScroll:true })); }
    });
  });
}

/* ── 14. CONTACT ── */
function initContact(){
  const form=document.getElementById('contactForm'); if(!form) return;
  const btn=document.getElementById('contactSubmitBtn');
  const successEl=document.getElementById('contactSuccess');
  const errorEl=document.getElementById('contactError');

  form.addEventListener('submit', async e=>{
    e.preventDefault();
    if(!form.checkValidity()){
      form.classList.add('was-validated');
      form.querySelectorAll('input,textarea,select').forEach(el=>{
        if(el.validity.valid) el.removeAttribute('aria-invalid');
        else el.setAttribute('aria-invalid','true');
      });
      form.querySelector(':invalid')?.focus();
      return;
    }
    form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));

    if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin me-2"></i>Sending…'; }
    successEl?.classList.add('d-none');
    errorEl?.classList.add('d-none');

    try{
      const res=await Promise.race([
        fetch(form.action,{method:'POST',body:new FormData(form),headers:{'Accept':'application/json'}}),
        new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),8000))
      ]);
      if(res.ok){
        form.reset(); form.classList.remove('was-validated');
        form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
        successEl?.classList.remove('d-none');
        successEl?.scrollIntoView({behavior:'smooth',block:'nearest'});
      } else { throw new Error('server '+res.status); }
    } catch(err){
      if(errorEl){
        errorEl.classList.remove('d-none');
        const hint = errorEl.querySelector('.error-hint');
        if(hint) hint.textContent = err.message==='timeout'
          ? 'Request timed out — check your connection and try again.'
          : 'Server error — please email me directly if this persists.';
      }
    } finally{
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-paper-plane me-2"></i>Send Message'; }
    }
  });
}


/* ── 14b. PROJECT DETAIL MODAL ── */
function initProjectModal(){
  const modal     = document.getElementById('projectModal');
  const closeBtn  = document.getElementById('projModalClose');
  if(!modal) return;

  const titleEl   = document.getElementById('projModalTitle');
  const tagEl     = document.getElementById('projModalTag');
  const descEl    = document.getElementById('projModalDesc');
  const actionsEl = document.getElementById('projModalActions');

  let _projOpener = null;
  function openModal(card){
    const title   = card.querySelector('.card-title')?.textContent?.trim() || '';
    const tag     = card.querySelector('.project-tag')?.textContent?.trim() || '';
    const desc    = card.querySelector('.card-text')?.textContent?.trim() || '';
    const actions = card.querySelector('.project-actions');

    if(titleEl) titleEl.textContent = title;
    if(tagEl)   tagEl.textContent   = tag;
    if(descEl)  descEl.textContent  = desc;
    // Clone DOM nodes instead of copying innerHTML to avoid any XSS risk
    if(actionsEl && actions) actionsEl.replaceChildren(...Array.from(actions.cloneNode(true).childNodes));

    _projOpener = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    closeBtn?.focus({ preventScroll: true });
  }
  function closeModal(){
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    _projOpener?.focus();
    _projOpener = null;
  }

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', e=>{ if(e.target===modal) closeModal(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape'&&modal.classList.contains('is-open')) closeModal(); });

  // Make entire project card clickable — skip if clicking a link/button inside project-actions
  document.querySelectorAll('.project-card').forEach(card=>{
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.setAttribute('aria-label', card.querySelector('.card-title')?.textContent?.trim() || 'Project details');
    card.style.cursor='pointer';
    card.addEventListener('click', e=>{
      if(e.target.closest('.project-actions')) return;
      openModal(card);
    });
    card.addEventListener('keydown', e=>{
      if((e.key==='Enter'||e.key===' ') && !e.target.closest('.project-actions')) openModal(card);
    });
  });
}

/* ── 15. HIRE BANNER ── */
function initHireBanner(){
  const banner = document.getElementById('hireBanner');
  const closeBtn = document.getElementById('hireBannerClose');
  if(!banner || !closeBtn) return;
  // Respect previous dismissal in session
  if(sessionStorage.getItem('hireBannerDismissed')) banner.classList.add('dismissed');
  closeBtn.addEventListener('click', ()=>{
    banner.classList.add('dismissed');
    sessionStorage.setItem('hireBannerDismissed','1');
  });
}

/* ── TOAST ── */
function showToast(msg, icon='check-circle', color='#6ee7b7'){
  let t=document.getElementById('_toast')||document.getElementById('toast');
  if(!t){ t=document.createElement('div'); t.id='_toast'; document.body.appendChild(t); }
  // Build DOM safely — no innerHTML with msg to prevent XSS
  t.textContent='';
  const ic=document.createElement('i');
  ic.className=`fas fa-${icon}`; ic.style.cssText=`color:${color};flex-shrink:0`; ic.setAttribute('aria-hidden','true');
  t.appendChild(ic);
  t.appendChild(document.createTextNode('\u00A0'+msg));
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid=setTimeout(()=>t.classList.remove('show'),2600);
}

/* ── 16. COPY EMAIL ── */
function initCopyEmail(){
  const btn=document.getElementById('copyEmailBtn');
  const emailSpan=document.querySelector('.contact-email-address');
  if(!btn) return;
  const doCopy=async()=>{
    try{
      const email = (emailSpan?.textContent || 'nveeravenkataganesh@gmail.com').trim();
      await navigator.clipboard.writeText(email);
      showToast('Email copied to clipboard!');
      btn.classList.add('copied');
      btn.innerHTML='<i class="fas fa-check" aria-hidden="true"></i> Copied!';
      setTimeout(()=>{ btn.classList.remove('copied'); btn.innerHTML='<i class="fas fa-copy" aria-hidden="true"></i> Copy'; },2000);
    } catch{
      btn.textContent='nveeravenkataganesh@gmail.com';
    }
  };
  btn.addEventListener('click',doCopy);
  emailSpan?.addEventListener('click',doCopy);
}

/* ── 17. TESTIMONIALS PAGINATOR + LEAVE A TESTIMONIAL ── */
function initTestimonialsCarousel(){
  const grid   = document.getElementById('tpGrid');
  const navEl  = document.getElementById('tpNav');
  const prevBtn= document.getElementById('tpPrev');
  const nextBtn= document.getElementById('tpNext');
  const pageInfo= document.getElementById('tpPageInfo');
  if(!grid) return;

  const PER_PAGE = 3;
  let cards = Array.from(grid.querySelectorAll('.tp-card'));
  let page  = 0;

  function totalPages(){ return Math.ceil(cards.length / PER_PAGE); }

  function render(){
    const tp = totalPages();
    cards.forEach((c,i)=>{
      const onPage = Math.floor(i / PER_PAGE) === page;
      c.classList.toggle('visible', onPage);
    });
    if(tp > 1){
      navEl.classList.add('visible');
      if(pageInfo) pageInfo.textContent = `Page ${page+1} of ${tp}`;
      if(prevBtn)  prevBtn.disabled = page === 0;
      if(nextBtn)  nextBtn.disabled = page === tp - 1;
    } else {
      navEl.classList.remove('visible');
    }
  }

  prevBtn?.addEventListener('click',()=>{ if(page>0){ page--; render(); } });
  nextBtn?.addEventListener('click',()=>{ if(page<totalPages()-1){ page++; render(); } });

  render();

  // Leave a Testimonial modal
  const openBtn  = document.getElementById('leaveTestimonialBtn');
  const modal    = document.getElementById('leaveTestimonialModal');
  const closeBtn = document.getElementById('ltmClose');
  const cancelBtn= document.getElementById('ltmCancel');
  const form     = document.getElementById('leaveTestimonialForm');
  const feedback = document.getElementById('ltmFeedback');

  function openModal(){
    modal?.classList.add('is-open');
    modal?.setAttribute('aria-hidden','false');
    document.getElementById('ltmName')?.focus({ preventScroll: true });
  }
  function closeModal(){
    modal?.classList.remove('is-open');
    modal?.setAttribute('aria-hidden','true');
    form?.reset();
    if(feedback){ feedback.textContent=''; feedback.className='mb-2 ltm-feedback-hidden'; }
    openBtn?.focus();
  }

  // Focus trap — keep Tab cycling inside the modal while open
  modal?.addEventListener('keydown', e=>{
    if(e.key!=='Tab' || !modal.classList.contains('is-open')) return;
    const focusable = Array.from(modal.querySelectorAll('input,textarea,button,select,[tabindex]:not([tabindex="-1"])'))
      .filter(el=>!el.disabled && el.offsetParent!==null);
    if(!focusable.length) return;
    const first=focusable[0], last=focusable[focusable.length-1];
    if(e.shiftKey){ if(document.activeElement===first){ e.preventDefault(); last.focus(); } }
    else { if(document.activeElement===last){ e.preventDefault(); first.focus(); } }
  });

  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  modal?.addEventListener('click', e=>{ if(e.target===modal) closeModal(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && modal?.classList.contains('is-open')) closeModal(); });

  form?.addEventListener('submit', e=>{
    e.preventDefault();
    const name = document.getElementById('ltmName')?.value.trim();
    const msg  = document.getElementById('ltmMessage')?.value.trim();
    if(!name || !msg){
      if(feedback){
        feedback.textContent = 'Please fill in your name and testimonial.';
        feedback.className = 'mb-2 alert alert-warning py-2';
      }
      return;
    }
    // Show thank-you message (submissions reviewed before going live)
    if(feedback){
      feedback.textContent = 'Thank you! Your testimonial has been submitted for review.';
      feedback.className = 'mb-2 alert alert-success py-2';
    }
    form.querySelectorAll('input,textarea,button[type="submit"]').forEach(el=>el.disabled=true);
    setTimeout(closeModal, 2800);
  });
}

/* ── 19. URL HASH SYNC ── */
function initHashSync(){
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  if(!sections.length) return;
  const obs = new IntersectionObserver(entries=>{
    // Pick the entry with the highest intersectionRatio when multiple fire at once
    const visible = entries.filter(e=>e.isIntersecting);
    if(!visible.length) return;
    const best = visible.reduce((a,b)=>b.intersectionRatio>a.intersectionRatio?b:a);
    if(best.intersectionRatio >= 0.35) history.replaceState(null,'','#'+best.target.id);
  },{threshold:[0.35,0.5,0.7]});
  sections.forEach(s=>obs.observe(s));
}

/* ── 21. FOOTER ── */
function initFooter(){
  const yr=document.getElementById('footerYear'); if(yr) yr.textContent=new Date().getFullYear();
}

/* ── PROJECT THUMBNAILS ── */
function initProjectThumbs(){
  const S={
    cv:`<svg viewBox="0 0 300 152" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="pt-cv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#050d1a"/><stop offset="100%" stop-color="#0c2340"/></linearGradient></defs><rect width="300" height="152" fill="url(#pt-cv)"/><polygon points="95,152 205,152 240,68 60,68" fill="#111"/><line x1="95" y1="152" x2="60" y2="68" stroke="#444" stroke-width="1.5"/><line x1="205" y1="152" x2="240" y2="68" stroke="#444" stroke-width="1.5"/><line x1="150" y1="150" x2="150" y2="136" stroke="#f59e0b" stroke-width="2" stroke-dasharray="10,7"/><line x1="150" y1="124" x2="150" y2="110" stroke="#f59e0b" stroke-width="2" stroke-dasharray="10,7"/><line x1="150" y1="99" x2="150" y2="85" stroke="#f59e0b" stroke-width="2" stroke-dasharray="10,7"/><polygon points="100,152 150,152 153,78 88,72" fill="rgba(0,200,140,.17)" stroke="#00c88c" stroke-width="1.5" stroke-dasharray="4,3"/><polygon points="150,152 200,152 212,72 147,78" fill="rgba(0,180,255,.17)" stroke="#00b4ff" stroke-width="1.5" stroke-dasharray="4,3"/><rect x="248" y="10" width="36" height="27" rx="4" fill="none" stroke="#6ee7b7" stroke-width="1.5"/><circle cx="266" cy="23" r="7" fill="none" stroke="#6ee7b7" stroke-width="1.5"/><circle cx="266" cy="23" r="3" fill="#6ee7b7" opacity=".5"/><rect x="258" y="6" width="14" height="5" rx="2" fill="#6ee7b7" opacity=".7"/><circle cx="18" cy="16" r="1.2" fill="white" opacity=".45"/><circle cx="40" cy="8" r=".8" fill="white" opacity=".3"/><circle cx="55" cy="22" r="1" fill="white" opacity=".4"/><text x="8" y="144" font-size="7.5" fill="#00c88c" opacity=".7" font-family="monospace">LANE DETECT</text><text x="8" y="152" font-size="6.5" fill="#6ee7b7" opacity=".5" font-family="monospace">OpenCV · Hough · Canny</text></svg>`,

    health:`<svg viewBox="0 0 300 152" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="pt-h" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#06111f"/><stop offset="100%" stop-color="#0d2038"/></linearGradient></defs><rect width="300" height="152" fill="url(#pt-h)"/><line x1="0" y1="76" x2="300" y2="76" stroke="rgba(6,182,212,.1)" stroke-width="1"/><line x1="0" y1="50" x2="300" y2="50" stroke="rgba(6,182,212,.06)" stroke-width="1"/><line x1="0" y1="102" x2="300" y2="102" stroke="rgba(6,182,212,.06)" stroke-width="1"/><polyline points="0,76 35,76 50,76 62,28 74,116 86,76 105,76 117,76 129,38 141,110 152,76 300,76" fill="none" stroke="rgba(6,182,212,.3)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="0,76 35,76 50,76 62,28 74,116 86,76 105,76 117,76 129,38 141,110 152,76 300,76" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="240" y="16" width="44" height="44" rx="9" fill="rgba(239,68,68,.13)" stroke="rgba(239,68,68,.4)" stroke-width="1.5"/><rect x="257" y="24" width="10" height="28" rx="2" fill="#ef4444" opacity=".85"/><rect x="248" y="33" width="28" height="10" rx="2" fill="#ef4444" opacity=".85"/><circle cx="152" cy="76" r="5" fill="#06b6d4"/><circle cx="152" cy="76" r="10" fill="rgba(6,182,212,.2)"/><circle cx="14" cy="14" r="2" fill="rgba(6,182,212,.3)"/><circle cx="28" cy="26" r="1.5" fill="rgba(99,102,241,.3)"/><text x="8" y="144" font-size="7.5" fill="#06b6d4" opacity=".65" font-family="monospace">HEALTHCARE PORTAL</text><text x="8" y="152" font-size="6.5" fill="rgba(6,182,212,.4)" font-family="monospace">HTML · CSS · JavaScript</text></svg>`,

    ml:`<svg viewBox="0 0 300 152" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="pt-ml" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0d0620"/><stop offset="100%" stop-color="#1a0a38"/></linearGradient></defs><rect width="300" height="152" fill="url(#pt-ml)"/><line x1="30" y1="120" x2="270" y2="120" stroke="rgba(139,92,246,.25)" stroke-width="1"/><line x1="30" y1="20" x2="30" y2="120" stroke="rgba(139,92,246,.25)" stroke-width="1"/><line x1="30" y1="40" x2="270" y2="40" stroke="rgba(139,92,246,.08)" stroke-width="1"/><line x1="30" y1="70" x2="270" y2="70" stroke="rgba(139,92,246,.08)" stroke-width="1"/><line x1="30" y1="100" x2="270" y2="100" stroke="rgba(139,92,246,.08)" stroke-width="1"/><circle cx="55" cy="45" r="4" fill="#8b5cf6" opacity=".7"/><circle cx="78" cy="38" r="3.5" fill="#8b5cf6" opacity=".7"/><circle cx="90" cy="55" r="4" fill="#8b5cf6" opacity=".7"/><circle cx="110" cy="42" r="3" fill="#a78bfa" opacity=".7"/><circle cx="68" cy="62" r="3.5" fill="#8b5cf6" opacity=".6"/><circle cx="130" cy="90" r="4" fill="#f472b6" opacity=".7"/><circle cx="155" cy="100" r="3.5" fill="#f472b6" opacity=".7"/><circle cx="170" cy="85" r="4" fill="#f472b6" opacity=".7"/><circle cx="195" cy="95" r="3" fill="#f472b6" opacity=".65"/><circle cx="210" cy="105" r="4" fill="#f472b6" opacity=".7"/><circle cx="220" cy="80" r="3.5" fill="#f472b6" opacity=".6"/><line x1="30" y1="125" x2="265" y2="35" stroke="#6ee7b7" stroke-width="1.8" stroke-dasharray="6,4" opacity=".7"/><text x="200" y="35" font-size="8" fill="#6ee7b7" opacity=".7" font-family="monospace">boundary</text><text x="8" y="144" font-size="7.5" fill="#a78bfa" opacity=".7" font-family="monospace">DIABETES PREDICTION</text><text x="8" y="152" font-size="6.5" fill="rgba(167,139,250,.45)" font-family="monospace">Python · Scikit-learn · Pima</text></svg>`,

    dl:`<svg viewBox="0 0 300 152" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="pt-dl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#040e1e"/><stop offset="100%" stop-color="#081830"/></linearGradient></defs><rect width="300" height="152" fill="url(#pt-dl)"/><line x1="20" y1="76" x2="280" y2="76" stroke="rgba(99,102,241,.15)" stroke-width="1"/><path d="M20,76 C50,76 55,32 80,32 C105,32 110,118 135,118 C160,118 165,50 190,50 C215,50 220,105 245,105 C260,105 265,76 280,76" fill="none" stroke="#4f46e5" stroke-width="2" opacity=".85"/><path d="M20,80 C45,80 50,42 72,42 C94,42 99,110 121,110 C143,110 148,55 170,55 C192,55 197,100 219,100 C241,100 246,80 280,80" fill="none" stroke="#06b6d4" stroke-width="2" opacity=".75"/><path d="M20,72 C40,72 46,22 65,22 C84,22 89,128 108,128 C127,128 132,42 154,42 C176,42 181,112 203,112 C225,112 230,72 280,72" fill="none" stroke="#8b5cf6" stroke-width="1.5" opacity=".6"/><text x="230" y="30" font-size="7.5" fill="#4f46e5" opacity=".7" font-family="monospace">LSTM</text><text x="230" y="42" font-size="7.5" fill="#06b6d4" opacity=".7" font-family="monospace">GRU</text><text x="230" y="54" font-size="7.5" fill="#8b5cf6" opacity=".7" font-family="monospace">CNN</text><text x="8" y="144" font-size="7.5" fill="#06b6d4" opacity=".65" font-family="monospace">TRAFFIC PREDICTION</text><text x="8" y="152" font-size="6.5" fill="rgba(6,182,212,.4)" font-family="monospace">LSTM · GRU · CNN · Python</text></svg>`,

    db:`<svg viewBox="0 0 300 152" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="pt-db" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#03080f"/><stop offset="100%" stop-color="#071524"/></linearGradient></defs><rect width="300" height="152" fill="url(#pt-db)"/><ellipse cx="150" cy="38" rx="48" ry="13" fill="rgba(6,182,212,.12)" stroke="#06b6d4" stroke-width="1.5"/><path d="M102,38 L102,70" stroke="#06b6d4" stroke-width="1.5" opacity=".5"/><path d="M198,38 L198,70" stroke="#06b6d4" stroke-width="1.5" opacity=".5"/><ellipse cx="150" cy="70" rx="48" ry="13" fill="rgba(6,182,212,.12)" stroke="#06b6d4" stroke-width="1.5"/><path d="M102,70 L102,102" stroke="#4f46e5" stroke-width="1.5" opacity=".5"/><path d="M198,70 L198,102" stroke="#4f46e5" stroke-width="1.5" opacity=".5"/><ellipse cx="150" cy="102" rx="48" ry="13" fill="rgba(79,70,229,.12)" stroke="#4f46e5" stroke-width="1.5"/><path d="M102,102 L102,122" stroke="#8b5cf6" stroke-width="1.5" opacity=".5"/><path d="M198,102 L198,122" stroke="#8b5cf6" stroke-width="1.5" opacity=".5"/><ellipse cx="150" cy="122" rx="48" ry="13" fill="rgba(139,92,246,.12)" stroke="#8b5cf6" stroke-width="1.5"/><circle cx="245" cy="45" r="4" fill="#06b6d4" opacity=".5"/><circle cx="258" cy="38" r="3" fill="#4f46e5" opacity=".4"/><circle cx="240" cy="60" r="2.5" fill="#8b5cf6" opacity=".4"/><text x="8" y="144" font-size="7.5" fill="#06b6d4" opacity=".65" font-family="monospace">STUDENT DATABASE</text><text x="8" y="152" font-size="6.5" fill="rgba(6,182,212,.4)" font-family="monospace">Bootstrap · JavaScript · MySQL</text></svg>`,

    shop:`<svg viewBox="0 0 300 152" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="pt-sh" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#061418"/><stop offset="100%" stop-color="#091e20"/></linearGradient></defs><rect width="300" height="152" fill="url(#pt-sh)"/><rect x="20" y="20" width="56" height="44" rx="5" fill="rgba(6,182,212,.1)" stroke="#06b6d4" stroke-width="1.2"/><rect x="84" y="20" width="56" height="44" rx="5" fill="rgba(16,185,129,.1)" stroke="#10b981" stroke-width="1.2"/><rect x="148" y="20" width="56" height="44" rx="5" fill="rgba(245,158,11,.1)" stroke="#f59e0b" stroke-width="1.2"/><rect x="20" y="72" width="56" height="44" rx="5" fill="rgba(139,92,246,.1)" stroke="#8b5cf6" stroke-width="1.2"/><rect x="84" y="72" width="56" height="44" rx="5" fill="rgba(239,68,68,.1)" stroke="#ef4444" stroke-width="1.2"/><rect x="148" y="72" width="56" height="44" rx="5" fill="rgba(236,72,153,.1)" stroke="#ec4899" stroke-width="1.2"/><circle cx="48" cy="42" r="10" fill="rgba(6,182,212,.2)"/><circle cx="112" cy="42" r="10" fill="rgba(16,185,129,.2)"/><circle cx="176" cy="42" r="10" fill="rgba(245,158,11,.2)"/><path d="M228,50 l8,0 l6,24 l28,0" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/><circle cx="241" cy="82" r="4" fill="#f59e0b" opacity=".8"/><circle cx="261" cy="82" r="4" fill="#f59e0b" opacity=".8"/><path d="M234,50 l2,-8 l30,0" fill="none" stroke="#f59e0b" stroke-width="1.5"/><text x="8" y="144" font-size="7.5" fill="#10b981" opacity=".65" font-family="monospace">INSTANT MARKET</text><text x="8" y="152" font-size="6.5" fill="rgba(16,185,129,.4)" font-family="monospace">HTML · Bootstrap · HCI</text></svg>`,

    access:`<svg viewBox="0 0 300 152" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="pt-ac" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#07091e"/><stop offset="100%" stop-color="#0e1230"/></linearGradient></defs><rect width="300" height="152" fill="url(#pt-ac)"/><circle cx="150" cy="28" r="10" fill="rgba(79,70,229,.2)" stroke="#4f46e5" stroke-width="1.8"/><line x1="150" y1="38" x2="100" y2="62" stroke="rgba(99,102,241,.4)" stroke-width="1.5"/><line x1="150" y1="38" x2="200" y2="62" stroke="rgba(99,102,241,.4)" stroke-width="1.5"/><circle cx="100" cy="70" r="9" fill="rgba(99,102,241,.18)" stroke="#818cf8" stroke-width="1.5"/><circle cx="200" cy="70" r="9" fill="rgba(99,102,241,.18)" stroke="#818cf8" stroke-width="1.5"/><line x1="100" y1="79" x2="68" y2="103" stroke="rgba(99,102,241,.3)" stroke-width="1.2"/><line x1="100" y1="79" x2="130" y2="103" stroke="rgba(99,102,241,.3)" stroke-width="1.2"/><line x1="200" y1="79" x2="172" y2="103" stroke="rgba(99,102,241,.3)" stroke-width="1.2"/><line x1="200" y1="79" x2="230" y2="103" stroke="rgba(99,102,241,.3)" stroke-width="1.2"/><circle cx="68" cy="110" r="7" fill="rgba(139,92,246,.15)" stroke="#a78bfa" stroke-width="1.2"/><circle cx="130" cy="110" r="7" fill="rgba(139,92,246,.15)" stroke="#a78bfa" stroke-width="1.2"/><circle cx="172" cy="110" r="7" fill="rgba(139,92,246,.15)" stroke="#a78bfa" stroke-width="1.2"/><circle cx="230" cy="110" r="7" fill="rgba(139,92,246,.15)" stroke="#a78bfa" stroke-width="1.2"/><text x="8" y="144" font-size="7.5" fill="#818cf8" opacity=".65" font-family="monospace">ACADEMIC ADVISOR</text><text x="8" y="152" font-size="6.5" fill="rgba(129,140,248,.4)" font-family="monospace">HTML · ARIA · WCAG</text></svg>`,

    ai:`<svg viewBox="0 0 300 152" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="pt-ai" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#060b14"/><stop offset="100%" stop-color="#0b1520"/></linearGradient></defs><rect width="300" height="152" fill="url(#pt-ai)"/><rect x="20" y="18" width="180" height="105" rx="6" fill="rgba(99,102,241,.08)" stroke="rgba(99,102,241,.3)" stroke-width="1.2"/><rect x="20" y="18" width="180" height="16" rx="6" fill="rgba(99,102,241,.15)"/><circle cx="30" cy="26" r="3" fill="#ef4444" opacity=".7"/><circle cx="41" cy="26" r="3" fill="#f59e0b" opacity=".7"/><circle cx="52" cy="26" r="3" fill="#10b981" opacity=".7"/><rect x="32" y="42" width="90" height="5" rx="2" fill="#4f46e5" opacity=".5"/><rect x="32" y="54" width="60" height="5" rx="2" fill="#06b6d4" opacity=".45"/><rect x="40" y="54" width="4" height="5" rx="1" fill="#f59e0b" opacity=".7"/><rect x="32" y="66" width="110" height="5" rx="2" fill="#4f46e5" opacity=".4"/><rect x="32" y="78" width="76" height="5" rx="2" fill="#8b5cf6" opacity=".4"/><rect x="32" y="90" width="88" height="5" rx="2" fill="#06b6d4" opacity=".35"/><rect x="32" y="102" width="52" height="5" rx="2" fill="#4f46e5" opacity=".4"/><circle cx="238" cy="50" r="14" fill="rgba(245,158,11,.1)" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,3"/><path d="M231,50 L238,44 L245,50 L238,56 Z" fill="#f59e0b" opacity=".8"/><line x1="220" y1="38" x2="205" y2="78" stroke="rgba(245,158,11,.25)" stroke-width="1.2"/><line x1="255" y1="40" x2="265" y2="80" stroke="rgba(245,158,11,.2)" stroke-width="1.2"/><circle cx="205" cy="82" r="4" fill="rgba(245,158,11,.4)"/><circle cx="266" cy="84" r="4" fill="rgba(245,158,11,.4)"/><text x="8" y="144" font-size="7.5" fill="#f59e0b" opacity=".65" font-family="monospace">UI CODE ASSISTANT</text><text x="8" y="152" font-size="6.5" fill="rgba(245,158,11,.4)" font-family="monospace">AI · HCI · MVC · Fitts' Law</text></svg>`,

    edu:`<svg viewBox="0 0 300 152" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="pt-ed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#041410"/><stop offset="100%" stop-color="#082018"/></linearGradient></defs><rect width="300" height="152" fill="url(#pt-ed)"/><line x1="30" y1="20" x2="30" y2="118" stroke="rgba(16,185,129,.2)" stroke-width="1"/><line x1="30" y1="118" x2="260" y2="118" stroke="rgba(16,185,129,.2)" stroke-width="1"/><rect x="45" y="68" width="24" height="50" rx="3" fill="rgba(16,185,129,.2)" stroke="#10b981" stroke-width="1.2"/><rect x="85" y="48" width="24" height="70" rx="3" fill="rgba(6,182,212,.2)" stroke="#06b6d4" stroke-width="1.2"/><rect x="125" y="38" width="24" height="80" rx="3" fill="rgba(16,185,129,.25)" stroke="#10b981" stroke-width="1.2"/><rect x="165" y="55" width="24" height="63" rx="3" fill="rgba(6,182,212,.2)" stroke="#06b6d4" stroke-width="1.2"/><rect x="205" y="30" width="24" height="88" rx="3" fill="rgba(16,185,129,.28)" stroke="#10b981" stroke-width="1.2"/><circle cx="232" cy="22" r="12" fill="rgba(16,185,129,.15)" stroke="#10b981" stroke-width="1.5"/><path d="M227,22 L230,26 L238,17" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="57" cy="58" r="5" fill="#10b981" opacity=".6"/><circle cx="97" cy="38" r="5" fill="#06b6d4" opacity=".6"/><circle cx="137" cy="28" r="5" fill="#10b981" opacity=".6"/><circle cx="177" cy="45" r="5" fill="#06b6d4" opacity=".6"/><circle cx="217" cy="20" r="5" fill="#10b981" opacity=".6"/><text x="8" y="144" font-size="7.5" fill="#10b981" opacity=".65" font-family="monospace">AUTO GRADING</text><text x="8" y="152" font-size="6.5" fill="rgba(16,185,129,.4)" font-family="monospace">Analytics · Nielsen Heuristics</text></svg>`,

    portfolio:`<svg viewBox="0 0 300 152" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="pt-pf" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0a0618"/><stop offset="100%" stop-color="#120826"/></linearGradient></defs><rect width="300" height="152" fill="url(#pt-pf)"/><rect x="30" y="20" width="200" height="110" rx="8" fill="rgba(139,92,246,.08)" stroke="rgba(139,92,246,.3)" stroke-width="1.5"/><rect x="30" y="20" width="200" height="20" rx="8" fill="rgba(139,92,246,.15)"/><circle cx="44" cy="30" r="3.5" fill="#ef4444" opacity=".6"/><circle cx="56" cy="30" r="3.5" fill="#f59e0b" opacity=".6"/><circle cx="68" cy="30" r="3.5" fill="#10b981" opacity=".6"/><rect x="45" y="48" width="80" height="6" rx="2" fill="rgba(245,158,11,.4)"/><rect x="45" y="60" width="55" height="4" rx="2" fill="rgba(139,92,246,.3)"/><rect x="45" y="72" width="65" height="4" rx="2" fill="rgba(99,102,241,.3)"/><rect x="45" y="84" width="48" height="4" rx="2" fill="rgba(139,92,246,.25)"/><rect x="155" y="48" width="60" height="65" rx="4" fill="rgba(99,102,241,.1)" stroke="rgba(99,102,241,.2)" stroke-width="1"/><path d="M158,68 L185,52 L212,68" fill="rgba(245,158,11,.15)" stroke="#f59e0b" stroke-width="1.2"/><circle cx="185" cy="52" r="6" fill="rgba(245,158,11,.2)" stroke="#f59e0b" stroke-width="1.2"/><path d="M258,15 L260,21 L266,21 L261,25 L263,31 L258,27 L253,31 L255,25 L250,21 L256,21 Z" fill="#f59e0b" opacity=".6"/><path d="M275,35 L276,39 L280,39 L277,41 L278,45 L275,43 L272,45 L273,41 L270,39 L274,39 Z" fill="#a78bfa" opacity=".5"/><path d="M245,40 L246,43 L249,43 L247,44 L248,47 L245,46 L242,47 L243,44 L241,43 L244,43 Z" fill="#67e8f9" opacity=".45"/><text x="8" y="144" font-size="7.5" fill="#a78bfa" opacity=".65" font-family="monospace">PERSONAL PORTFOLIO</text><text x="8" y="152" font-size="6.5" fill="rgba(167,139,250,.4)" font-family="monospace">GSAP · Three.js · PWA</text></svg>`,

    gl3d:`<svg viewBox="0 0 300 152" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="pt-gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#110508"/><stop offset="100%" stop-color="#1e0a10"/></linearGradient></defs><rect width="300" height="152" fill="url(#pt-gl)"/><polygon points="150,22 218,55 218,115 150,130 82,115 82,55" fill="rgba(239,68,68,.06)" stroke="#ef4444" stroke-width="1.5" opacity=".7"/><line x1="150" y1="22" x2="150" y2="78" stroke="#ef4444" stroke-width="1.2" opacity=".5"/><line x1="218" y1="55" x2="150" y2="78" stroke="#ef4444" stroke-width="1.2" opacity=".5"/><line x1="82" y1="55" x2="150" y2="78" stroke="#ef4444" stroke-width="1.2" opacity=".5"/><line x1="218" y1="115" x2="150" y2="78" stroke="#f59e0b" stroke-width="1.2" opacity=".35"/><line x1="82" y1="115" x2="150" y2="78" stroke="#f59e0b" stroke-width="1.2" opacity=".35"/><line x1="150" y1="130" x2="150" y2="78" stroke="#f59e0b" stroke-width="1.2" opacity=".35"/><circle cx="150" cy="78" r="4" fill="#ef4444" opacity=".6"/><circle cx="150" cy="22" r="3" fill="#f97316" opacity=".5"/><circle cx="218" cy="55" r="3" fill="#f97316" opacity=".5"/><circle cx="218" cy="115" r="3" fill="#fbbf24" opacity=".4"/><circle cx="82" cy="55" r="3" fill="#f97316" opacity=".5"/><circle cx="82" cy="115" r="3" fill="#fbbf24" opacity=".4"/><circle cx="150" cy="130" r="3" fill="#fbbf24" opacity=".4"/><text x="8" y="144" font-size="7.5" fill="#ef4444" opacity=".65" font-family="monospace">3D MODEL BUILDER</text><text x="8" y="152" font-size="6.5" fill="rgba(239,68,68,.4)" font-family="monospace">OpenGL · FLTK · PLY Mesh</text></svg>`,

    proc:`<svg viewBox="0 0 300 152" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="pt-pr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#020e06"/><stop offset="100%" stop-color="#061a0c"/></linearGradient></defs><rect width="300" height="152" fill="url(#pt-pr)"/><line x1="150" y1="130" x2="150" y2="95" stroke="#16a34a" stroke-width="2"/><line x1="150" y1="95" x2="120" y2="70" stroke="#16a34a" stroke-width="1.8"/><line x1="150" y1="95" x2="180" y2="70" stroke="#16a34a" stroke-width="1.8"/><line x1="120" y1="70" x2="98" y2="48" stroke="#16a34a" stroke-width="1.5"/><line x1="120" y1="70" x2="135" y2="45" stroke="#16a34a" stroke-width="1.5"/><line x1="180" y1="70" x2="165" y2="45" stroke="#16a34a" stroke-width="1.5"/><line x1="180" y1="70" x2="202" y2="48" stroke="#16a34a" stroke-width="1.5"/><line x1="98" y1="48" x2="82" y2="30" stroke="#22c55e" stroke-width="1.2"/><line x1="98" y1="48" x2="108" y2="28" stroke="#22c55e" stroke-width="1.2"/><line x1="135" y1="45" x2="125" y2="26" stroke="#22c55e" stroke-width="1.2"/><line x1="135" y1="45" x2="144" y2="26" stroke="#22c55e" stroke-width="1.2"/><line x1="165" y1="45" x2="156" y2="26" stroke="#22c55e" stroke-width="1.2"/><line x1="165" y1="45" x2="175" y2="26" stroke="#22c55e" stroke-width="1.2"/><line x1="202" y1="48" x2="192" y2="28" stroke="#22c55e" stroke-width="1.2"/><line x1="202" y1="48" x2="218" y2="30" stroke="#22c55e" stroke-width="1.2"/><polygon points="240,70 248,62 256,70" fill="#22c55e" opacity=".5"/><polygon points="258,55 264,49 270,55" fill="#22c55e" opacity=".4"/><polygon points="268,75 275,67 282,75" fill="#16a34a" opacity=".4"/><polygon points="255,88 261,82 267,88" fill="#22c55e" opacity=".35"/><text x="8" y="144" font-size="7.5" fill="#22c55e" opacity=".65" font-family="monospace">PROCEDURAL MODELING</text><text x="8" y="152" font-size="6.5" fill="rgba(34,197,94,.4)" font-family="monospace">L-System · Boids · OpenGL</text></svg>`,

    research:`<svg viewBox="0 0 300 152" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="pt-rs" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0e0514"/><stop offset="100%" stop-color="#180820"/></linearGradient></defs><rect width="300" height="152" fill="url(#pt-rs)"/><line x1="30" y1="20" x2="30" y2="115" stroke="rgba(236,72,153,.2)" stroke-width="1"/><line x1="30" y1="115" x2="265" y2="115" stroke="rgba(236,72,153,.2)" stroke-width="1"/><rect x="50" y="50" width="20" height="65" rx="3" fill="rgba(236,72,153,.22)" stroke="#ec4899" stroke-width="1.2"/><rect x="80" y="65" width="20" height="50" rx="3" fill="rgba(139,92,246,.22)" stroke="#8b5cf6" stroke-width="1.2"/><rect x="130" y="42" width="20" height="73" rx="3" fill="rgba(236,72,153,.25)" stroke="#ec4899" stroke-width="1.2"/><rect x="160" y="58" width="20" height="57" rx="3" fill="rgba(139,92,246,.22)" stroke="#8b5cf6" stroke-width="1.2"/><rect x="210" y="35" width="20" height="80" rx="3" fill="rgba(236,72,153,.28)" stroke="#ec4899" stroke-width="1.2"/><rect x="240" y="50" width="20" height="65" rx="3" fill="rgba(139,92,246,.22)" stroke="#8b5cf6" stroke-width="1.2"/><text x="42" y="44" font-size="7" fill="#ec4899" opacity=".55" font-family="monospace">VR</text><text x="72" y="60" font-size="7" fill="#8b5cf6" opacity=".55" font-family="monospace">CO</text><text x="122" y="36" font-size="7" fill="#ec4899" opacity=".55" font-family="monospace">VI</text><text x="8" y="144" font-size="7.5" fill="#ec4899" opacity=".65" font-family="monospace">USER EVALUATION</text><text x="8" y="152" font-size="6.5" fill="rgba(236,72,153,.4)" font-family="monospace">ANOVA · Chi-squared · HCI</text></svg>`,

    home:`<svg viewBox="0 0 300 152" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="pt-hm" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0e0900"/><stop offset="100%" stop-color="#1a1000"/></linearGradient></defs><rect width="300" height="152" fill="url(#pt-hm)"/><rect x="30" y="18" width="200" height="110" rx="4" fill="rgba(245,158,11,.05)" stroke="rgba(245,158,11,.3)" stroke-width="1.2"/><line x1="30" y1="78" x2="230" y2="78" stroke="rgba(245,158,11,.2)" stroke-width="1"/><line x1="120" y1="18" x2="120" y2="128" stroke="rgba(245,158,11,.2)" stroke-width="1"/><rect x="38" y="26" width="48" height="38" rx="3" fill="rgba(245,158,11,.12)" stroke="#f59e0b" stroke-width="1.2"/><rect x="130" y="26" width="38" height="28" rx="3" fill="rgba(251,191,36,.1)" stroke="#fbbf24" stroke-width="1.2"/><rect x="175" y="26" width="45" height="18" rx="3" fill="rgba(245,158,11,.08)" stroke="#f59e0b" stroke-width="1.2"/><rect x="38" y="86" width="34" height="32" rx="3" fill="rgba(16,185,129,.1)" stroke="#10b981" stroke-width="1.2"/><rect x="80" y="86" width="30" height="32" rx="3" fill="rgba(6,182,212,.1)" stroke="#06b6d4" stroke-width="1.2"/><rect x="130" y="88" width="90" height="30" rx="3" fill="rgba(245,158,11,.08)" stroke="#f59e0b" stroke-width="1.2"/><text x="44" y="47" font-size="7" fill="#f59e0b" opacity=".45" font-family="monospace">Sofa</text><text x="132" y="38" font-size="7" fill="#fbbf24" opacity=".45" font-family="monospace">Desk</text><text x="42" y="104" font-size="7" fill="#10b981" opacity=".45" font-family="monospace">Bed</text><circle cx="250" cy="60" r="20" fill="rgba(245,158,11,.06)" stroke="rgba(245,158,11,.3)" stroke-width="1.2" stroke-dasharray="5,3"/><path d="M240,55 C242,48 258,48 260,55 L256,72 L244,72 Z" fill="rgba(245,158,11,.2)"/><text x="8" y="144" font-size="7.5" fill="#f59e0b" opacity=".65" font-family="monospace">MAKE-IT-HOME</text><text x="8" y="152" font-size="6.5" fill="rgba(245,158,11,.4)" font-family="monospace">Simulated Annealing · Cost Fn</text></svg>`,

    gov:`<svg viewBox="0 0 300 152" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="pt-gv" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#020a14"/><stop offset="100%" stop-color="#051520"/></linearGradient></defs><rect width="300" height="152" fill="url(#pt-gv)"/><rect x="20" y="14" width="260" height="16" rx="4" fill="rgba(14,165,233,.12)" stroke="rgba(14,165,233,.3)" stroke-width="1.2"/><rect x="24" y="18" width="60" height="8" rx="2" fill="rgba(14,165,233,.3)"/><rect x="90" y="20" width="40" height="4" rx="1" fill="rgba(14,165,233,.2)"/><rect x="20" y="38" width="80" height="50" rx="4" fill="rgba(14,165,233,.08)" stroke="rgba(14,165,233,.25)" stroke-width="1.2"/><rect x="26" y="44" width="40" height="4" rx="1" fill="rgba(14,165,233,.3)"/><rect x="26" y="52" width="60" height="28" rx="2" fill="rgba(14,165,233,.08)"/><polyline points="30,76 40,64 50,70 60,58 68,65 78,55" fill="none" stroke="#0ea5e9" stroke-width="1.5"/><rect x="108" y="38" width="80" height="50" rx="4" fill="rgba(16,185,129,.07)" stroke="rgba(16,185,129,.22)" stroke-width="1.2"/><rect x="114" y="44" width="40" height="4" rx="1" fill="rgba(16,185,129,.3)"/><rect x="114" y="54" width="28" height="26" rx="2" fill="rgba(16,185,129,.15)" stroke="#10b981" stroke-width="1"/><text x="118" y="67" font-size="9" fill="#10b981" opacity=".6" font-family="monospace">142</text><text x="118" y="79" font-size="7" fill="rgba(16,185,129,.4)" font-family="monospace">assets</text><rect x="196" y="38" width="80" height="50" rx="4" fill="rgba(139,92,246,.07)" stroke="rgba(139,92,246,.22)" stroke-width="1.2"/><rect x="202" y="44" width="40" height="4" rx="1" fill="rgba(139,92,246,.3)"/><rect x="202" y="54" width="62" height="8" rx="2" fill="rgba(139,92,246,.15)"/><rect x="202" y="66" width="50" height="8" rx="2" fill="rgba(139,92,246,.12)"/><rect x="202" y="78" width="56" height="8" rx="2" fill="rgba(139,92,246,.1)"/><rect x="20" y="96" width="256" height="20" rx="4" fill="rgba(14,165,233,.06)" stroke="rgba(14,165,233,.15)" stroke-width="1"/><text x="8" y="144" font-size="7.5" fill="#0ea5e9" opacity=".65" font-family="monospace">COUNTY INVENTORY (UIMS)</text><text x="8" y="152" font-size="6.5" fill="rgba(14,165,233,.4)" font-family="monospace">Django REST · React · Role-based</text></svg>`,

    civic:`<svg viewBox="0 0 300 152" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="pt-cv2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#020c16"/><stop offset="100%" stop-color="#04152a"/></linearGradient></defs><rect width="300" height="152" fill="url(#pt-cv2)"/><circle cx="150" cy="60" r="16" fill="rgba(14,165,233,.15)" stroke="#0ea5e9" stroke-width="1.8"/><circle cx="80" cy="40" r="11" fill="rgba(14,165,233,.12)" stroke="#0ea5e9" stroke-width="1.4"/><circle cx="220" cy="40" r="11" fill="rgba(14,165,233,.12)" stroke="#0ea5e9" stroke-width="1.4"/><circle cx="60" cy="95" r="10" fill="rgba(16,185,129,.12)" stroke="#10b981" stroke-width="1.4"/><circle cx="240" cy="95" r="10" fill="rgba(16,185,129,.12)" stroke="#10b981" stroke-width="1.4"/><circle cx="150" cy="110" r="11" fill="rgba(99,102,241,.12)" stroke="#818cf8" stroke-width="1.4"/><circle cx="110" cy="105" r="9" fill="rgba(14,165,233,.1)" stroke="#0ea5e9" stroke-width="1.2"/><circle cx="190" cy="105" r="9" fill="rgba(14,165,233,.1)" stroke="#0ea5e9" stroke-width="1.2"/><line x1="150" y1="76" x2="80" y2="51" stroke="rgba(14,165,233,.3)" stroke-width="1.2"/><line x1="150" y1="76" x2="220" y2="51" stroke="rgba(14,165,233,.3)" stroke-width="1.2"/><line x1="80" y1="51" x2="60" y2="85" stroke="rgba(14,165,233,.2)" stroke-width="1"/><line x1="220" y1="51" x2="240" y2="85" stroke="rgba(14,165,233,.2)" stroke-width="1"/><line x1="150" y1="76" x2="150" y2="99" stroke="rgba(99,102,241,.3)" stroke-width="1.2"/><line x1="150" y1="76" x2="110" y2="96" stroke="rgba(14,165,233,.2)" stroke-width="1"/><line x1="150" y1="76" x2="190" y2="96" stroke="rgba(14,165,233,.2)" stroke-width="1"/><path d="M143,54 L157,54 L156,61 L150,65 L144,61 Z" fill="rgba(14,165,233,.3)"/><text x="8" y="144" font-size="7.5" fill="#0ea5e9" opacity=".65" font-family="monospace">BENEFITSCONNECT</text><text x="8" y="152" font-size="6.5" fill="rgba(14,165,233,.4)" font-family="monospace">Benefits Wizard · Analytics</text></svg>`
  };
  document.querySelectorAll('.project-thumb[data-type]').forEach(el=>{
    const svg=S[el.dataset.type];
    if(!svg) return;
    el.innerHTML=svg;
    // Make SVG fill container like object-fit:cover (no letterboxing on mobile)
    const svgEl=el.querySelector('svg');
    if(svgEl) svgEl.setAttribute('preserveAspectRatio','xMidYMid slice');
  });
}

/* ── MAGNETIC ICONS ── */
function initMagneticIcons(){
  if(IS_TOUCH) return;
  document.querySelectorAll('.hero-socials a,.about-social-link,.footer-social a').forEach(el=>{
    el.style.transition='transform 0.4s cubic-bezier(.34,1.56,.64,1)';
    el.addEventListener('mousemove',e=>{
      const r=el.getBoundingClientRect();
      const x=(e.clientX-r.left-r.width/2)*0.4;
      const y=(e.clientY-r.top-r.height/2)*0.4;
      el.style.transition='transform 0.1s ease';
      el.style.transform=`translate(${x}px,${y}px) scale(1.2)`;
    });
    el.addEventListener('mouseleave',()=>{
      el.style.transition='transform 0.4s cubic-bezier(.34,1.56,.64,1)';
      el.style.transform='';
    });
  });
}

/* ── CURSOR GLOW ── */
function initCursorGlow(){
  if(IS_TOUCH) return;
  if(document.getElementById('cursorGlow')) return; // guard against duplicate init
  const glow=document.createElement('div');
  glow.id='cursorGlow';
  // Static styles set once; position driven via CSS vars --gx/--gy to avoid per-frame style recalc
  Object.assign(glow.style,{
    position:'fixed',width:'300px',height:'300px',
    borderRadius:'50%',
    background:'radial-gradient(circle,rgba(99,102,241,.12) 0%,transparent 70%)',
    pointerEvents:'none',zIndex:'1',
    transform:'translate(calc(var(--gx,0px) - 50%), calc(var(--gy,0px) - 50%))',
    transition:'opacity 0.3s ease',
    willChange:'transform',left:'0px',top:'0px',
  });
  document.body.appendChild(glow);
  let gx=0,gy=0,cx=0,cy=0;
  window.addEventListener('mousemove',e=>{cx=e.clientX;cy=e.clientY;},{passive:true});
  let _glowRaf=null;
  function animate(){
    gx+=(cx-gx)*.08; gy+=(cy-gy)*.08;
    glow.style.setProperty('--gx',gx+'px');
    glow.style.setProperty('--gy',gy+'px');
    if(Math.abs(cx-gx)>.3||Math.abs(cy-gy)>.3) _glowRaf=requestAnimationFrame(animate);
    else _glowRaf=null;
  }
  document.addEventListener('mousemove',()=>{ if(!_glowRaf) _glowRaf=requestAnimationFrame(animate); },{passive:true});
  _glowRaf=requestAnimationFrame(animate);
  document.addEventListener('mouseleave',()=>{ glow.style.opacity='0'; if(_glowRaf){ cancelAnimationFrame(_glowRaf); _glowRaf=null; } });
  document.addEventListener('mouseenter',()=>{glow.style.opacity='1';});
}

/* ── BROKEN LINK HANDLER ── */
function initBrokenLinkHandler(){
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    // Skip: external, anchors, mailto/tel, blank targets, javascript:
    if (!href || href.startsWith('#') || href.startsWith('http') ||
        href.startsWith('mailto') || href.startsWith('tel') ||
        href.startsWith('javascript') || a.target === '_blank') return;
    // Only intercept relative .html page links
    if (!href.match(/\.html(\?|#|$)|^\/[^.]*$/)) return;
    e.preventDefault();
    if (window.location.protocol === 'file:') { window.location.href = href; return; }
    fetch(href, { method: 'HEAD' })
      .then(res => { window.location.href = res.ok ? href : '404.html'; })
      .catch(() => { window.location.href = '404.html'; });
  });
}

/* ── BOOT ── */
document.addEventListener('DOMContentLoaded', () => {
  buildNav();           // inject nav first — all other inits depend on it
  initScrollBar();
  initBackToTop();
  initHeader();
  initTheme();          // shared — runs on all pages now that nav is injected
  initFooter();
  initBrokenLinkHandler();
  initMagneticIcons();
  initCursorGlow();

  if(IS_GALLERY_PAGE) return; // gallery-specific JS is in js/gallery.js

  // Index-only inits
  initHeroSphere();
  init3DBackground();
  initTyped();
  initTimeline();
  initSkills();
  initSkillCharts();
  initProjectFilter();
  initCertModal();
  initProjectModal();
  initContact();
  initPhotoTilt();
  initHireBanner();
  initCopyEmail();
  initTestimonialsCarousel();
  initStatCounters();
  initHashSync();
  initProjectThumbs();
});

// GSAP loads via defer — guaranteed available on window.load
window.addEventListener('load', () => {
  initAnimations();
});

// Three.js renderer cleanup on navigate/close to prevent battery drain
window.addEventListener('beforeunload', () => {
  window._heroSphereCleanup?.();
  window._galaxyCleanup?.();
});
