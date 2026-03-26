'use strict';

/* ── 4. GSAP ANIMATIONS ── */
function revealHero(){
  document.querySelectorAll('.hero-anim-badge,.hero-anim-title,.hero-anim-subtitle,.hero-anim-desc,.hero-anim-cta,.hero-anim-socials')
    .forEach(el=>{ el.style.opacity='1'; el.style.transform='none'; });
}

function initAnimations(){
  if(typeof gsap==='undefined'){ revealHero(); return; }
  // Reduced motion: reveal all animated content immediately without transitions
  if(reducedMotion){
    revealHero();
    document.querySelectorAll('[data-gsap-fade],[data-gsap-slide],.gsap-fade-up,.fade-up,.reveal-item').forEach(el=>{
      el.style.opacity='1'; el.style.transform='none';
    });
    return;
  }
  if(typeof ScrollTrigger!=='undefined'){
    gsap.registerPlugin(ScrollTrigger);
  }

  // Set initial hidden state via JS (not CSS) so content is always visible if GSAP fails
  gsap.set('.hero-anim-badge',   {y:16,opacity:0});
  gsap.set('.hero-anim-title',   {y:44,opacity:0});
  gsap.set('.hero-anim-subtitle',{y:28,opacity:0});
  gsap.set('.hero-anim-desc',    {y:22,opacity:0});
  gsap.set('.hero-anim-cta > *', {y:18,opacity:0});
  gsap.set('.hero-anim-socials', {y:14,opacity:0});

  // Hero entrance
  gsap.timeline({defaults:{ease:'power3.out'}})
    .to('.hero-anim-badge',    {y:0,opacity:1,duration:0.6,delay:0.1})
    .to('.hero-anim-title',    {y:0,opacity:1,duration:0.9},'-=0.3')
    .to('.hero-anim-subtitle', {y:0,opacity:1,duration:0.7},'-=0.5')
    .to('.hero-anim-desc',     {y:0,opacity:1,duration:0.7},'-=0.45')
    .to('.hero-anim-cta > *',  {y:0,opacity:1,duration:0.55,stagger:0.12},'-=0.4')
    .to('.hero-anim-socials',  {y:0,opacity:1,duration:0.5},'-=0.3');

  if(typeof ScrollTrigger==='undefined') return;

  // ── Section headings — clip-path slide-reveal with underline drawing in ──
  gsap.utils.toArray('.section-heading').forEach(el=>{
    gsap.fromTo(el,
      {clipPath:'inset(0 100% 0 0)',opacity:0.4},
      {clipPath:'inset(0 0% 0 0)',opacity:1,duration:0.85,ease:'power3.out',
        scrollTrigger:{
          trigger:el,start:'top 88%',toggleActions:'play none none none',
          onStart:()=>{ el.classList.add('heading-visible'); sectionEntryBurst(el); }
        }}
    );
  });

  // ── About ──
  gsap.from('.about-photo-wrap',{scale:0.82,opacity:0,rotate:-8,duration:1,ease:'back.out(1.6)',
    scrollTrigger:{trigger:'#about',start:'top 80%'}});
  gsap.from('.about-name,.about-role',{x:-36,opacity:0,duration:0.75,stagger:0.18,ease:'power3.out',
    scrollTrigger:{trigger:'#about',start:'top 75%'}});
  gsap.from('#about .col-lg-8 > p',{y:20,opacity:0,duration:0.6,stagger:0.12,ease:'power2.out',
    scrollTrigger:{trigger:'#about .col-lg-8',start:'top 78%'}});
  gsap.from('.about-stat-card',{y:32,opacity:0,duration:0.65,stagger:0.1,ease:'back.out(1.4)',
    scrollTrigger:{trigger:'.about-stat-card',start:'top 85%'}});
  gsap.from('.about-cta-row > *',{y:18,opacity:0,duration:0.55,stagger:0.12,ease:'power2.out',
    scrollTrigger:{trigger:'.about-cta-row',start:'top 88%'}});

  // ── Timeline items — alternate left/right slide ──
  gsap.utils.toArray('.timeline-item').forEach((item,i)=>{
    gsap.from(item,{
      x:i%2===0 ? -50 : 50,
      opacity:0,duration:0.75,ease:'power3.out',
      scrollTrigger:{trigger:item,start:'top 85%',toggleActions:'play none none none'}
    });
  });

  // ── Skill cards — wave stagger left-to-right ──
  gsap.utils.toArray('.skill-card').forEach((c,i)=>{
    gsap.from(c,{y:28,opacity:0,scale:0.88,duration:0.5,
      delay:(i%8)*0.045,ease:'back.out(1.5)',
      scrollTrigger:{trigger:c,start:'top 92%',toggleActions:'play none none none'}});
  });

  // ── Achievement cards — scale up from below ──
  gsap.utils.toArray('.achievement-card').forEach((c,i)=>{
    gsap.from(c,{y:36,opacity:0,scale:0.95,duration:0.6,
      delay:(i%4)*0.09,ease:'back.out(1.3)',
      scrollTrigger:{trigger:c,start:'top 90%',toggleActions:'play none none none'}});
  });

  // ── Testimonial cards ──
  gsap.utils.toArray('.testimonial-card').forEach((c,i)=>{
    gsap.from(c,{y:32,opacity:0,duration:0.65,delay:i*0.14,ease:'power3.out',
      scrollTrigger:{trigger:c,start:'top 88%',toggleActions:'play none none none'}});
  });

  // ── Project cards — staggered grid reveal ──
  gsap.utils.toArray('.project-card').forEach((c,i)=>{
    gsap.from(c,{y:36,opacity:0,scale:0.94,duration:0.55,
      delay:(i%4)*0.08,ease:'back.out(1.3)',
      scrollTrigger:{trigger:c,start:'top 92%',toggleActions:'play none none none'}});
  });

  // ── Gallery items — alternating slide ──
  gsap.utils.toArray('.gallery-strip-item').forEach((item,i)=>{
    gsap.from(item,{x:i%2===0?-40:40,opacity:0,scale:0.96,duration:0.65,
      delay:i*0.1,ease:'power3.out',
      scrollTrigger:{trigger:item,start:'top 88%',toggleActions:'play none none none'}});
  });

  // ── Contact — stagger form fields + email row ──
  gsap.from('.contact-email-row',{y:20,opacity:0,duration:0.6,ease:'power2.out',
    scrollTrigger:{trigger:'#contact',start:'top 80%'}});
  gsap.from('#contactForm .mb-4',{y:24,opacity:0,duration:0.55,stagger:0.1,ease:'power2.out',
    scrollTrigger:{trigger:'#contactForm',start:'top 85%'}});
  gsap.from('#contactForm .d-grid',{y:16,opacity:0,duration:0.5,ease:'power2.out',
    scrollTrigger:{trigger:'#contactForm .d-grid',start:'top 90%'}});

  // ── Resume section ──
  gsap.from('.resume-preview',{y:30,opacity:0,scale:0.97,duration:0.8,ease:'power3.out',
    scrollTrigger:{trigger:'.resume-preview',start:'top 82%'}});

}

/* ── SECTION ENTRY BURST (GSAP onStart) ── */
function sectionEntryBurst(triggerEl) {
  if(document.querySelector('.burst-canvas')) return;
  const rect = triggerEl.getBoundingClientRect();
  const cvs  = document.createElement('canvas');
  cvs.className = 'burst-canvas';
  cvs.width  = rect.width;
  cvs.height = rect.height;
  Object.assign(cvs.style, {
    position: 'fixed',
    top: rect.top + 'px',
    left: rect.left + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px',
    pointerEvents: 'none',
    zIndex: '9998',
  });
  document.body.appendChild(cvs);
  const onHidden = () => { if(document.hidden){ cvs.remove(); document.removeEventListener('visibilitychange', onHidden); } };
  document.addEventListener('visibilitychange', onHidden);
  const ctx  = cvs.getContext('2d');
  const cx   = rect.width / 2, cy = rect.height / 2;
  const COLS = ['rgba(99,102,241,', 'rgba(6,182,212,', 'rgba(139,92,246,'];

  const particles = Array.from({ length: 60 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 3;
    return {
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 2 + Math.random() * 2,
      a: 0.9,
      col: COLS[Math.floor(Math.random() * 3)],
    };
  });

  const start = performance.now();
  function draw(ts) {
    const elapsed = ts - start;
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    let anyAlive = false;
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.96; p.vy *= 0.96;
      p.a = Math.max(0, 0.9 - elapsed / 800);
      if (p.a > 0) {
        anyAlive = true;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.col + p.a + ')'; ctx.fill();
      }
    });
    if (anyAlive && elapsed < 900) requestAnimationFrame(draw);
    else { document.removeEventListener('visibilitychange', onHidden); cvs.remove(); }
  }
  requestAnimationFrame(draw);
}

/* ── 18. STAT COUNTERS ── */
function initStatCounters(){
  const counters = document.querySelectorAll('.stat-counter');
  if(!counters.length) return;
  if(reducedMotion){
    counters.forEach(el=>{ el.textContent = el.dataset.target + (el.dataset.suffix||''); });
    return;
  }
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      obs.unobserve(e.target);
      const el = e.target;
      const target = parseInt(el.dataset.target,10);
      const suffix = el.dataset.suffix||'';
      const duration = 1200;
      const start = performance.now();
      function step(now){
        const p = Math.min((now-start)/duration,1);
        const ease = 1-Math.pow(1-p,3); // cubic ease-out
        el.textContent = Math.round(ease*target) + suffix;
        if(p<1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  },{threshold:0.6});
  counters.forEach(c=>obs.observe(c));
}
