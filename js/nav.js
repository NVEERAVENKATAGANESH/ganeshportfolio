'use strict';

/* ── NAV BUILDER — single source of truth for header + sidebar on all pages ──
   Edit NAV_LINKS or the HTML template here to update every page at once.       */
function buildNav() {
  const isGallery = IS_GALLERY_PAGE;
  const h         = s => isGallery ? `index.html#${s}` : `#${s}`;
  const brandHref = isGallery ? 'index.html' : '#home';
  const brandAriaLabel = isGallery ? 'Back to portfolio' : 'Go to top';

  const NAV_LINKS = [
    { href: h('home'),         icon: 'fa-home',        label: 'Home'         },
    { href: h('about'),        icon: 'fa-user',         label: 'About'        },
    { href: h('timeline'),     icon: 'fa-route',        label: 'Journey'      },
    { href: h('skills'),       icon: 'fa-code',         label: 'Skills'       },
    { href: h('projects'),     icon: 'fa-folder-open',  label: 'Projects'     },
    { href: h('achievements'), icon: 'fa-award',        label: 'Achievements' },
    { href: h('testimonials'), icon: 'fa-quote-left',   label: 'Testimonials' },
    { href: isGallery ? 'gallery.html' : '#gallery', icon: 'fa-images', label: 'Gallery', active: isGallery },
    { href: h('contact'),      icon: 'fa-envelope',     label: 'Contact'      },
    { href: h('resume'),       icon: 'fa-file-alt',     label: 'Resume'       },
  ];

  const headerLinks = NAV_LINKS.map(l =>
    `<a href="${l.href}" class="header-link${l.active ? ' active-link' : ''}" aria-label="${l.label}">` +
    `<i class="fas ${l.icon}" aria-hidden="true"></i><span>${l.label}</span></a>`
  ).join('');

  const sidebarLinks = NAV_LINKS.map(l =>
    `<a href="${l.href}" class="sidebar-link${l.active ? ' active-link' : ''}">` +
    `<i class="fas ${l.icon}" aria-hidden="true"></i><span>${l.label}</span></a>`
  ).join('');

  const html =
    `<a href="#main-content" class="skip-link">Skip to main content</a>` +
    `<header id="site-header" role="banner">` +
      `<div class="header-inner">` +
        `<a href="${brandHref}" class="header-brand" aria-label="${brandAriaLabel}">` +
          `<span class="header-name">Ganesh</span><span class="header-dot" aria-hidden="true">.</span>` +
        `</a>` +
        `<nav class="header-nav" aria-label="Primary navigation">${headerLinks}</nav>` +
        `<div class="header-controls">` +
          `<a href="https://www.linkedin.com/in/veera-venkata-ganesh-nurukurthi-437195226/" target="_blank" rel="noopener noreferrer" class="header-icon-btn" aria-label="LinkedIn"><i class="fab fa-linkedin" aria-hidden="true"></i></a>` +
          `<a href="https://github.com/NVEERAVENKATAGANESH" target="_blank" rel="noopener noreferrer" class="header-icon-btn" aria-label="GitHub"><i class="fab fa-github" aria-hidden="true"></i></a>` +
          `<a href="https://22nd.aaruush.org" target="_blank" rel="noopener noreferrer" class="header-icon-btn header-icon-btn--aaruush" aria-label="Aaruush"><img src="images/Aaruush-logo.png" alt="Aaruush" width="22" height="22"/></a>` +
          `<label class="header-theme-switch" aria-label="Toggle dark/light theme">` +
            `<input type="checkbox" id="theme-toggle"/>` +
            `<span class="header-slider"><span class="header-slider-thumb"></span></span>` +
          `</label>` +
          `<button class="header-menu-btn" id="mobileMenuBtn" aria-label="Toggle menu" aria-expanded="false" aria-controls="mobileSidebar">` +
            `<span class="hb-bar hb-top" aria-hidden="true"></span>` +
            `<span class="hb-bar hb-mid" aria-hidden="true"></span>` +
            `<span class="hb-bar hb-bot" aria-hidden="true"></span>` +
          `</button>` +
        `</div>` +
      `</div>` +
    `</header>` +
    `<div id="sidebarBackdrop" class="sidebar-backdrop" aria-hidden="true"></div>` +
    `<aside id="mobileSidebar" class="mobile-sidebar" aria-label="Mobile navigation" aria-hidden="true">` +
      `<div class="sidebar-header">` +
        `<a href="${brandHref}" class="sidebar-brand" aria-label="${brandAriaLabel}">` +
          `<span class="sidebar-brand-name">Ganesh</span><span class="sidebar-brand-dot" aria-hidden="true">.</span>` +
        `</a>` +
        `<button type="button" id="sidebarThemeToggle" class="sidebar-theme-btn" aria-label="Toggle theme">` +
          `<i class="fas fa-moon" id="sidebarThemeIcon" aria-hidden="true"></i>` +
        `</button>` +
        `<button type="button" id="sidebarCloseBtn" class="sidebar-close-btn" aria-label="Close menu">` +
          `<i class="fas fa-times" aria-hidden="true"></i>` +
        `</button>` +
      `</div>` +
      `<nav class="sidebar-nav" aria-label="Sidebar navigation">` +
        sidebarLinks +
        `<div class="sidebar-divider" aria-hidden="true"></div>` +
        `<div class="sidebar-socials">` +
          `<a href="https://www.linkedin.com/in/veera-venkata-ganesh-nurukurthi-437195226/" target="_blank" rel="noopener noreferrer" class="sidebar-social-link" aria-label="LinkedIn"><i class="fab fa-linkedin" aria-hidden="true"></i><span>LinkedIn</span></a>` +
          `<a href="https://github.com/NVEERAVENKATAGANESH" target="_blank" rel="noopener noreferrer" class="sidebar-social-link" aria-label="GitHub"><i class="fab fa-github" aria-hidden="true"></i><span>GitHub</span></a>` +
          `<a href="mailto:nveeravenkataganesh@gmail.com" class="sidebar-social-link" aria-label="Email"><i class="fas fa-envelope" aria-hidden="true"></i><span>Email</span></a>` +
          `<a href="https://22nd.aaruush.org" target="_blank" rel="noopener noreferrer" class="sidebar-social-link" aria-label="Aaruush"><img src="images/Aaruush-logo.png" alt="" aria-hidden="true" width="30" height="30"/><span>Aaruush</span></a>` +
        `</div>` +
      `</nav>` +
    `</aside>`;

  const root = document.getElementById('nav-root');
  if (root) root.outerHTML = html;
}

/* ── 9. HEADER ── */
function initHeader(){
  const header   = document.getElementById('site-header');
  const menuBtn  = document.getElementById('mobileMenuBtn');
  const sidebar  = document.getElementById('mobileSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const closeBtn = document.getElementById('sidebarCloseBtn');
  if(!header) return;

  // Scroll shadow
  window.addEventListener('scroll',throttle(()=>{
    header.classList.toggle('scrolled',window.scrollY>10);
  },100),{passive:true});

  // ── Sidebar open/close ──
  let _sidebarScroll = 0;
  function openSidebar(){
    _sidebarScroll = window.scrollY;
    sidebar?.classList.add('open');
    backdrop?.classList.add('open');
    sidebar?.setAttribute('aria-hidden','false');
    menuBtn?.setAttribute('aria-expanded','true');
    document.body.classList.add('sidebar-open');
    sidebar?.querySelector('.sidebar-link')?.focus();
  }

  // Focus trap inside sidebar while open
  function trapFocus(e){
    if(!sidebar?.classList.contains('open')) return;
    const focusable = Array.from(sidebar.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]')).filter(el=>el.offsetParent!==null);
    if(!focusable.length){ sidebar.setAttribute('tabindex','-1'); sidebar.focus(); return; }
    const first=focusable[0], last=focusable[focusable.length-1];
    if(e.key==='Tab'){
      if(e.shiftKey){ if(document.activeElement===first){e.preventDefault();last.focus();} }
      else { if(document.activeElement===last){e.preventDefault();first.focus();} }
    }
  }
  sidebar?.addEventListener('keydown',trapFocus);
  function closeSidebar(){
    sidebar?.classList.remove('open');
    backdrop?.classList.remove('open');
    sidebar?.setAttribute('aria-hidden','true');
    menuBtn?.setAttribute('aria-expanded','false');
    document.body.classList.remove('sidebar-open');
    window.scrollTo(0, _sidebarScroll);
    menuBtn?.focus();
  }

  menuBtn?.addEventListener('click', openSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  backdrop?.addEventListener('click', closeSidebar);

  // Close on nav-link click — guard prevents duplicate listeners if header re-inits
  sidebar?.querySelectorAll('.sidebar-link').forEach(a=>{
    if(a.dataset.sidebarListenerAdded) return;
    a.dataset.sidebarListenerAdded='1';
    a.addEventListener('click', closeSidebar);
  });

  // Escape key
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && sidebar?.classList.contains('open')) closeSidebar();
  });

  // ── Active link highlighting (desktop nav + sidebar) ──
  const allLinks=[
    ...document.querySelectorAll('.header-link[href^="#"]'),
    ...document.querySelectorAll('.sidebar-link[href^="#"]')
  ];
  const hl=()=>{
    const y=window.scrollY+80;
    allLinks.forEach(a=>{
      const s=document.querySelector(a.getAttribute('href'));
      a.classList.toggle('active-link',s&&s.offsetTop<=y&&s.offsetTop+s.offsetHeight>y);
    });
  };
  window.addEventListener('scroll',throttle(hl,100),{passive:true}); hl();
}
