'use strict';

/* ── 2. THEME ── */
function initTheme(){
  const t = document.getElementById('theme-toggle');
  if(!t) return;
  const sb = document.getElementById('sidebarThemeToggle');
  const sbIcon = document.getElementById('sidebarThemeIcon');
  const saved = localStorage.getItem('theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (systemDark ? 'dark' : 'light');
  document.body.setAttribute('data-theme', theme);
  t.checked = (theme === 'dark');
  if(sbIcon) sbIcon.className = (theme === 'dark') ? 'fas fa-sun' : 'fas fa-moon';
  // Sync galaxy with initial theme
  theme === 'dark' ? _galaxyCtrl?.start() : _galaxyCtrl?.stop();

  function applyTheme(dark){
    const th = dark ? 'dark' : 'light';
    document.body.setAttribute('data-theme', th);
    localStorage.setItem('theme', th);
    t.checked = dark;
    if(sbIcon) sbIcon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
    dark ? _galaxyCtrl?.start() : _galaxyCtrl?.stop();
  }
  t.addEventListener('change', ()=>applyTheme(t.checked));
  if(sb) sb.addEventListener('click', ()=>applyTheme(document.body.getAttribute('data-theme') !== 'dark'));

  // React to OS-level colour scheme changes (only when user hasn't set a manual preference)
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const onSchemeChange = e => {
    if(localStorage.getItem('theme')) return; // manual preference takes priority
    applyTheme(e.matches);
  };
  mql.addEventListener('change', onSchemeChange);
  window.addEventListener('beforeunload', () => { mql.removeEventListener('change', onSchemeChange); });
}
