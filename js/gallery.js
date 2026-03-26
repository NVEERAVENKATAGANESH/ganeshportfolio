document.addEventListener('DOMContentLoaded', () => {

    // Nav, theme, header, sidebar, footer handled by app.js

    // ── GALLERY DATA ──
    const items = [
      { type:'photo', src:'images/Aaruush.jpg',               alt:'Core Team of Aaruush 22' },
      { type:'photo', src:'images/Ganesh.jpg',                 alt:'Admiration Day' },
      { type:'photo', src:'images/IMG20220805181152.jpg',       alt:'August 15 Event' },
      { type:'photo', src:'images/IMG_3351.JPG',               alt:'IMG_3351' },
      { type:'youtube', ytId:'gNVA7PGJWEg', alt:'Hack Summit 3.0 Teaser' },
      { type:'youtube', ytId:'9JQ1v5sp870', alt:'Hack Summit 3.0 After Movie' }
    ];

    // ── STATE ──
    let filterType        = 'all';
    let currentIndex      = 0;       // index within filtered list
    let viewMode          = 'split'; // 'split' | 'grid'
    let slideshowOn       = false;
    let slideshowInterval = 4000;    // ms per slide
    let slideshowTick     = null;

    // ── HELPERS ──
    const filtered = () => items.filter(i => {
      if (filterType === 'all') return true;
      if (filterType === 'video') return i.type === 'video' || i.type === 'youtube';
      return i.type === filterType;
    });
    const clamp    = (idx, list) => ((idx % list.length) + list.length) % list.length;

    const showToast = (msg, dur) => typeof window.showToast === 'function' ? window.showToast(msg) : undefined;

    // ── COUNTER ELEMENTS ──
    const visibleCountEl = document.getElementById('visibleCount');
    const totalCountEl   = document.getElementById('totalCount');
    const currentCaptionEl = document.getElementById('currentCaption');

    function updateCounters() {
      const list = filtered();
      visibleCountEl.textContent = list.length;
      totalCountEl.textContent   = items.length;
    }

    // ── RENDER THUMBNAILS ──
    const thumbsEl = document.getElementById('thumbsContainer');

    function renderThumbnails() {
      thumbsEl.innerHTML = '';
      const list = filtered();
      list.forEach((item, idx) => {
          const div = document.createElement('div');
          div.className = 'thumb';
          div.dataset.idx = idx;
          div.setAttribute('role', 'button');
          div.setAttribute('tabindex', '0');
          div.setAttribute('aria-label', item.alt);

          const ring = document.createElement('div');
          ring.className = 'autoplay-ring';
          div.appendChild(ring);

          const img = document.createElement('img');
          img.loading = 'lazy';
          img.alt = item.alt;
          img.src = item.type === 'photo'
            ? item.src
            : item.type === 'youtube'
              ? `https://img.youtube.com/vi/${item.ytId}/hqdefault.jpg`
              : (item.poster || '');

          if (item.type === 'video' || item.type === 'youtube') {
            const overlay = document.createElement('div');
            overlay.className = 'play-icon';
            overlay.setAttribute('aria-label', `Play video: ${item.alt}`);
            overlay.innerHTML = '<i class="fas fa-play-circle" aria-hidden="true"></i>';
            div.appendChild(overlay);
          }

          // Label
          const label = document.createElement('div');
          label.className = 'thumb-label';
          label.textContent = item.alt;
          div.appendChild(img);
          div.appendChild(label);

          // Error fallback
          img.onerror = () => {
            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect fill="%23334155" width="200" height="120"/><text fill="%2394a3b8" font-size="12" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>';
          };

          div.addEventListener('click', () => { currentIndex = idx; showPreview(); });
          div.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); currentIndex = idx; showPreview(); } });

          thumbsEl.appendChild(div);
        });
        highlightThumb();
    }

    function highlightThumb() {
      thumbsEl.querySelectorAll('.thumb').forEach(t => t.classList.remove('active', 'autoplay-active'));
      const active = thumbsEl.querySelector(`.thumb[data-idx="${currentIndex}"]`);
      if (active) {
        active.classList.add('active');
        if (slideshowOn) active.classList.add('autoplay-active');
        active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    // ── SHOW PREVIEW ──
    const previewMedia   = document.getElementById('previewMedia');
    const captionCounter = document.getElementById('captionCounter');
    const captionText    = document.getElementById('captionText');
    const captionType    = document.getElementById('captionType');
    const mobileCounter  = document.getElementById('mobileCounter');

    function showPreview(skipFade = false) {
      const list = filtered();
      if (!list.length) {
        previewMedia.innerHTML = '<div class="empty-state"><i class="fas fa-photo-video"></i><span>No items to display</span></div>';
        captionText.textContent = 'No items';
        return;
      }

      currentIndex = clamp(currentIndex, list);
      const item = list[currentIndex];

      // Pause/stop any playing media first
      const oldVid = previewMedia.querySelector('video');
      if (oldVid) oldVid.pause();
      const oldFrame = previewMedia.querySelector('iframe');
      if (oldFrame) oldFrame.src = '';  // stops YouTube

      const doRender = () => {
        previewMedia.innerHTML = '';
        if (item.type === 'photo') {
          const img = document.createElement('img');
          img.alt = item.alt;
          img.src = item.src;
          img.style.cursor = 'zoom-in';
          img.onerror = () => {
            previewMedia.innerHTML = '<div class="preview-error"><i class="fas fa-exclamation-triangle"></i><span>Image failed to load</span></div>';
          };
          img.addEventListener('click', () => openLightbox(currentIndex));
          previewMedia.appendChild(img);
        } else if (item.type === 'youtube') {
          const iframe = document.createElement('iframe');
          iframe.src = `https://www.youtube.com/embed/${item.ytId}?rel=0`;
          iframe.title = item.alt;
          iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
          iframe.allowFullscreen = true;
          iframe.style.cssText = 'width:100%;height:100%;min-height:320px;border:none;border-radius:var(--radius-sm);';
          previewMedia.appendChild(iframe);
        } else {
          const vid = document.createElement('video');
          vid.src = item.src;
          vid.controls = true;
          vid.poster = item.poster || '';
          vid.preload = 'metadata';
          vid.onerror = () => {
            previewMedia.innerHTML = '<div class="preview-error"><i class="fas fa-exclamation-triangle"></i><span>Video failed to load</span></div>';
          };
          previewMedia.appendChild(vid);
        }
        previewMedia.classList.remove('fading');
        previewMedia.classList.add('visible');
      };

      if (!skipFade) {
        previewMedia.classList.remove('visible');
        previewMedia.classList.add('fading');
        setTimeout(doRender, 180);
      } else {
        doRender();
      }

      // Update captions
      const total = list.length;
      captionCounter.textContent = `${currentIndex + 1} / ${total}`;
      captionText.textContent    = item.alt || '';
      captionType.textContent    = item.type === 'photo' ? 'Photo' : 'YouTube';
      mobileCounter.textContent  = `${currentIndex + 1} / ${total}`;
      currentCaptionEl.textContent = item.alt;

      highlightThumb();

      // Update grid active (only when grid visible to avoid unnecessary DOM queries)
      if (viewMode === 'grid') {
        document.querySelectorAll('.grid-item').forEach(g => g.classList.remove('active'));
        const gActive = document.querySelector(`.grid-item[data-idx="${currentIndex}"]`);
        if (gActive) gActive.classList.add('active');
      }
    }

    // ── GRID RENDER ──
    const gridMasonry = document.getElementById('gridMasonry');

    function renderGrid() {
      gridMasonry.innerHTML = '';
      filtered().forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'grid-item';
        div.dataset.idx = idx;
        div.setAttribute('role', 'button');
        div.setAttribute('tabindex', '0');
        div.setAttribute('aria-label', `Open ${item.alt}`);

        const img = document.createElement('img');
        img.alt = item.alt;
        img.loading = 'lazy';
        if (item.type === 'photo') {
          img.src = item.src;
          img.onerror = () => { img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect fill="%23334155" width="200" height="120"/></svg>'; };
        } else if (item.type === 'youtube') {
          img.src = `https://img.youtube.com/vi/${item.ytId}/hqdefault.jpg`;
        } else {
          img.src = item.poster || '';
        }
        div.appendChild(img);

        const overlay = document.createElement('div');
        overlay.className = 'grid-overlay';
        const oi = document.createElement('i');
        oi.className = `fas fa-${item.type === 'video' ? 'play-circle' : 'expand'}`;
        oi.setAttribute('aria-hidden', 'true');
        const os = document.createElement('span');
        os.textContent = item.alt; // textContent prevents XSS
        overlay.appendChild(oi);
        overlay.appendChild(os);
        div.appendChild(overlay);

        div.addEventListener('click', () => { if (viewMode === 'grid') openLightbox(idx); });
        div.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(idx); }
        });

        gridMasonry.appendChild(div);
      });
    }

    // ── LIGHTBOX ──
    const lightbox  = document.getElementById('lightbox');
    const lbContent = document.getElementById('lbContent');
    const lbCaption = document.getElementById('lbCaption');
    const lbCounter = document.getElementById('lbCounter');
    let lbIndex = 0;

    let _lbOpener = null;
    let _lbFocusables = [];
    function openLightbox(idx) {
      _lbOpener = document.activeElement;
      lbIndex = idx;
      renderLightbox();
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      document.getElementById('lbClose')?.focus({ preventScroll: true });
      _lbFocusables = Array.from(lightbox.querySelectorAll('button:not([disabled]),a[href],[tabindex="0"]')).filter(el => el.offsetParent !== null);
    }

    function closeLightbox() {
      // Stop video/iframe on close
      const v = lbContent.querySelector('video');
      if (v) v.pause();
      const fr = lbContent.querySelector('iframe');
      if (fr) fr.src = '';   // stops YouTube playback
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      _lbOpener?.focus();
      _lbOpener = null;
    }

    function renderLightbox() {
      const list = filtered();
      if (!list.length) return;
      lbIndex = clamp(lbIndex, list);
      const item = list[lbIndex];

      // Pause existing video
      const oldVid = lbContent.querySelector('video');
      if (oldVid) oldVid.pause();
      lbContent.innerHTML = '';

      if (item.type === 'photo') {
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt;
        lbContent.appendChild(img);
      } else if (item.type === 'youtube') {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${item.ytId}?autoplay=1&rel=0`;
        iframe.title = item.alt;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.cssText = 'width:min(90vw,960px);height:min(54vw,540px);border:none;border-radius:.75rem;';
        lbContent.appendChild(iframe);
      } else {
        const vid = document.createElement('video');
        vid.src = item.src;
        vid.poster = item.poster || '';
        vid.controls = true;
        vid.autoplay = true;
        lbContent.appendChild(vid);
      }

      lbCaption.textContent = item.alt;
      lbCounter.textContent = `${lbIndex + 1} / ${list.length}`;
    }

    document.getElementById('lbClose').addEventListener('click', closeLightbox);
    document.getElementById('lbPrev').addEventListener('click', () => { const _lbList=filtered(); lbIndex=((lbIndex-1)+_lbList.length)%_lbList.length; renderLightbox(); currentIndex=lbIndex; showPreview(true); });
    document.getElementById('lbNext').addEventListener('click', () => { const _lbList=filtered(); lbIndex=(lbIndex+1)%_lbList.length; renderLightbox(); currentIndex=lbIndex; showPreview(true); });
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    // Focus trap — keep keyboard focus inside lightbox while open
    lightbox.addEventListener('keydown', e => {
      if (e.key !== 'Tab' || !lightbox.classList.contains('open')) return;
      if (!_lbFocusables.length) return;
      const first = _lbFocusables[0], last = _lbFocusables[_lbFocusables.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
    });

    // ── FULLSCREEN ──
    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        const el = document.getElementById('previewContainer');
        if (el.requestFullscreen) {
          el.requestFullscreen().catch(() => showToast('Fullscreen not available'));
          showToast('Press Esc to exit fullscreen');
        } else {
          showToast('Fullscreen not available');
        }
      } else {
        document.exitFullscreen?.();
      }
    }
    document.getElementById('mobileFullscreen').addEventListener('click', toggleFullscreen);

    // ── PREV / NEXT ──
    function navigate(dir) {
      const list = filtered();
      currentIndex = clamp(currentIndex + dir, list);
      showPreview();
      if (slideshowOn) resetSlideshowTimer();
    }

    document.getElementById('prevBtn').addEventListener('click', () => navigate(-1));
    document.getElementById('nextBtn').addEventListener('click', () => navigate(1));
    document.getElementById('mobilePrev').addEventListener('click', () => navigate(-1));
    document.getElementById('mobileNext').addEventListener('click', () => navigate(1));

    // ── SWIPE SUPPORT ──
    let touchStartX = 0, touchStartY = 0, _touchStartTime = 0;
    previewMedia.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      _touchStartTime = e.timeStamp;
    }, { passive: true });
    previewMedia.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const dt = e.timeStamp - _touchStartTime;
      const velocity = dt > 0 ? Math.abs(dx) / dt : 0;
      if (Math.abs(dx) > Math.abs(dy) && (Math.abs(dx) > 40 || velocity > 0.4)) {
        navigate(dx < 0 ? 1 : -1);
      }
    }, { passive: true });

    // ── KEYBOARD ──
    document.addEventListener('keydown', e => {
      // Don't fire if user is typing in an input
      const tag = (document.activeElement||{}).tagName||''; if(['INPUT','TEXTAREA'].includes(tag)) return;

      if (e.key === 'ArrowLeft')  { e.preventDefault(); navigate(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); navigate(1);  }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();

      if (e.key === ' ') {
        e.preventDefault();
        const vid = previewMedia.querySelector('video');
        if (vid) {
          vid.paused ? vid.play() : vid.pause();
          showToast(vid.paused ? 'Paused' : 'Playing');
        } else {
          toggleSlideshow();
        }
      }
    });

    // ── SLIDESHOW ──
    const slideshowBtn      = document.getElementById('slideshowBtn');
    const slideshowProgress = document.getElementById('slideshowProgress');

    function startSlideshowTimer() {
      stopSlideshowTimer();
      let _ssStart = null;
      function tick(ts) {
        if (!_ssStart) _ssStart = ts;
        const elapsed = ts - _ssStart;
        const pct = Math.min(100, (elapsed / slideshowInterval) * 100);
        slideshowProgress.style.width = pct + '%';
        if (elapsed >= slideshowInterval) { navigate(1); return; }
        slideshowTick = requestAnimationFrame(tick);
      }
      slideshowTick = requestAnimationFrame(tick);
    }

    function stopSlideshowTimer() {
      if (slideshowTick) { cancelAnimationFrame(slideshowTick); slideshowTick = null; }
      slideshowProgress.style.width = '0%';
    }

    function resetSlideshowTimer() {
      stopSlideshowTimer();
      if (slideshowOn) startSlideshowTimer();
    }

    function toggleSlideshow() {
      slideshowOn = !slideshowOn;
      if (slideshowOn) {
        slideshowBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
        slideshowBtn.classList.add('active');
        startSlideshowTimer();
        showToast('Slideshow started — Space to stop');
      } else {
        slideshowBtn.innerHTML = '<i class="fas fa-play"></i> Slideshow';
        slideshowBtn.classList.remove('active');
        stopSlideshowTimer();
        showToast('Slideshow stopped');
      }
      highlightThumb();
    }

    slideshowBtn.addEventListener('click', toggleSlideshow);

    // ── FILTER ──
    document.querySelectorAll('.view-pill').forEach(pill => {
      pill.setAttribute('aria-pressed', pill.classList.contains('active') ? 'true' : 'false');
      pill.addEventListener('click', () => {
        document.querySelectorAll('.view-pill').forEach(p => { p.classList.remove('active'); p.setAttribute('aria-pressed', 'false'); });
        pill.classList.add('active');
        pill.setAttribute('aria-pressed', 'true');
        filterType = pill.dataset.filter;
        currentIndex = 0;
        updateCounters();
        renderThumbnails();
        renderGrid();
        showPreview();
        if (slideshowOn) resetSlideshowTimer();
      });
    });

    // ── VIEW MODE TOGGLE ──
    const splitView = document.getElementById('splitView');
    const gridView  = document.getElementById('gridView');
    const splitBtn  = document.getElementById('splitBtn');
    const gridBtn   = document.getElementById('gridBtn');

    function setViewMode(mode) {
      viewMode = mode;
      if (mode === 'split') {
        splitView.style.display = '';
        gridView.classList.remove('active');
        splitBtn.classList.add('active');
        gridBtn.classList.remove('active');
      } else {
        splitView.style.display = 'none';
        gridView.classList.add('active');
        splitBtn.classList.remove('active');
        gridBtn.classList.add('active');
        renderGrid();
      }
    }

    splitBtn.addEventListener('click', () => setViewMode('split'));
    gridBtn.addEventListener('click',  () => setViewMode('grid'));

    // ── INIT ──
    const _fyEl = document.getElementById('footerYear');
    if (_fyEl) _fyEl.textContent = new Date().getFullYear();
    updateCounters();
    renderThumbnails();
    showPreview(true);

  }); // end DOMContentLoaded
