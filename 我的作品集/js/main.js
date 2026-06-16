// Intro loading video
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

const introLoader = document.getElementById('introLoader');
const introVideo = document.getElementById('introVideo');
const entrySound = document.getElementById('entrySound');
const introSoundToggle = document.getElementById('introSoundToggle');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const returnFromCaseKey = 'portfolio:returning-from-case';
let shouldSkipIntro = document.referrer.includes('/cases/') && window.location.hash.length > 0;
let hasPlayedEntrySound = false;

try {
  shouldSkipIntro = shouldSkipIntro || (
    window.location.hash.length > 0 &&
    window.sessionStorage.getItem(returnFromCaseKey) === '1'
  );
  window.sessionStorage.removeItem(returnFromCaseKey);
} catch {
  // Storage is optional; referrer-based detection still covers normal case-page returns.
}

document.querySelectorAll('a[href^="cases/"]').forEach(link => {
  link.addEventListener('click', () => {
    try {
      window.sessionStorage.setItem(returnFromCaseKey, '1');
    } catch {
      // Ignore storage failures and keep navigation working.
    }
  });
});

function playEntrySoundOnce() {
  if (!entrySound || hasPlayedEntrySound) return;
  hasPlayedEntrySound = true;
  entrySound.muted = false;
  entrySound.defaultMuted = false;
  entrySound.volume = 1;
  entrySound.currentTime = 0;

  // 尝试自动播放欢迎声音
  entrySound.play().catch(() => {
    // 如果自动播放失败，在用户首次交互时播放
    hasPlayedEntrySound = false;
    const retryEntrySound = () => {
      if (!hasPlayedEntrySound && entrySound) {
        hasPlayedEntrySound = true;
        entrySound.currentTime = 0;
        entrySound.play().catch(() => {});
      }
    };
    ['pointerdown', 'keydown', 'touchstart', 'click', 'scroll'].forEach(eventName => {
      window.addEventListener(eventName, retryEntrySound, { once: true, passive: true });
    });
  });
}

function primeEntrySound() {
  if (!entrySound) return;
  entrySound.muted = true;
  entrySound.defaultMuted = true;
  entrySound.volume = 0;
  entrySound.currentTime = 0;
  const primePromise = entrySound.play();
  if (!primePromise || typeof primePromise.then !== 'function') return;
  primePromise.then(() => {
    entrySound.pause();
    entrySound.currentTime = 0;
  }).catch(() => {});
}

function hideIntroLoader() {
  if (!introLoader || introLoader.classList.contains('is-hidden')) return;
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  introLoader.classList.add('is-hidden');
  document.body.classList.remove('intro-loading');
  playEntrySoundOnce();
  setTimeout(() => {
    introLoader.remove();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, 600);
}

function skipIntroLoader() {
  document.body.classList.remove('intro-loading');
  if (introLoader) introLoader.remove();
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

if (introSoundToggle && introVideo) {
  introSoundToggle.addEventListener('click', () => {
    introVideo.muted = false;
    introVideo.defaultMuted = false;
    introVideo.volume = 1;
    introVideo.removeAttribute('muted');
    introVideo.play().catch(() => {});
    introSoundToggle.classList.add('is-hidden');
  });
}

if (reduceMotion || shouldSkipIntro) {
  skipIntroLoader();
} else if (introLoader && introVideo) {
  if (introSoundToggle) introSoundToggle.classList.remove('is-hidden');
  primeEntrySound();
  let fallbackTimer = null;
  const introFallbackBuffer = 800;
  const introErrorFallback = 2500;

  function clearIntroFallback() {
    if (!fallbackTimer) return;
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }

  function prepareMutedIntro() {
    introVideo.muted = true;
    introVideo.defaultMuted = true;
    introVideo.volume = 0;
    introVideo.setAttribute('muted', '');
  }

  function scheduleFullIntroFallback() {
    clearIntroFallback();
    if (Number.isFinite(introVideo.duration) && introVideo.duration > 0) {
      const remaining = Math.max(introVideo.duration - introVideo.currentTime, 0);
      fallbackTimer = setTimeout(hideIntroLoader, remaining * 1000 + introFallbackBuffer);
      return;
    }
    fallbackTimer = setTimeout(hideIntroLoader, 12000);
  }

  function scheduleIntroFailureFallback() {
    clearIntroFallback();
    fallbackTimer = setTimeout(hideIntroLoader, introErrorFallback);
  }

  prepareMutedIntro();

  introVideo.addEventListener('loadedmetadata', () => {
    if (introVideo.paused) return;
    scheduleFullIntroFallback();
  }, { once: true });
  introVideo.addEventListener('play', scheduleFullIntroFallback);
  introVideo.addEventListener('ended', () => {
    clearIntroFallback();
    hideIntroLoader();
  }, { once: true });
  introVideo.addEventListener('error', () => {
    clearIntroFallback();
    hideIntroLoader();
  }, { once: true });
  introVideo.addEventListener('canplay', () => {
    if (introVideo.paused) playIntro();
  }, { once: true });

  function playIntro() {
    // 先尝试带声音播放
    introVideo.muted = false;
    introVideo.defaultMuted = false;
    introVideo.volume = 1;
    introVideo.removeAttribute('muted');

    const playPromise = introVideo.play();
    if (!playPromise || typeof playPromise.then !== 'function') {
      scheduleFullIntroFallback();
      return;
    }
    playPromise.then(() => {
      // 成功播放有声音，隐藏按钮
      if (introSoundToggle) introSoundToggle.classList.add('is-hidden');
      scheduleFullIntroFallback();
    }).catch(() => {
      // 有声音播放失败，改为静音播放并显示按钮
      prepareMutedIntro();
      if (introSoundToggle) introSoundToggle.classList.remove('is-hidden');
      introVideo.play().then(() => {
        scheduleFullIntroFallback();
      }).catch(scheduleIntroFailureFallback);
    });
  }

  playIntro();
} else {
  hideIntroLoader();
}

// Cursor Glow
const cursorGlow = document.getElementById('cursorGlow');
let mouseX = 0, mouseY = 0;
let glowX = 0, glowY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function animateGlow() {
  glowX += (mouseX - glowX) * 0.1;
  glowY += (mouseY - glowY) * 0.1;
  if (cursorGlow) {
    cursorGlow.style.left = glowX + 'px';
    cursorGlow.style.top = glowY + 'px';
  }
  requestAnimationFrame(animateGlow);
}
animateGlow();

// Contact outro text animation setup
const contactDesc = document.querySelector('.contact-hero-desc');
if (contactDesc && !contactDesc.dataset.charAnimated) {
  const descText = contactDesc.textContent.trim();
  contactDesc.dataset.charAnimated = 'true';
  contactDesc.textContent = '';

  Array.from(descText).forEach((char, index) => {
    const span = document.createElement('span');
    span.className = 'contact-desc-char';
    span.textContent = char;
    span.style.setProperty('--char-index', index);
    span.style.setProperty('--char-delay', `${1360 + index * 34}ms`);
    contactDesc.appendChild(span);
  });
}

// Nav scroll effect
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 30) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

// Reveal on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('in'), i * 60);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// WeChat QR click popover
const wechatCard = document.querySelector('.wechat-card');
const wechatPopover = document.querySelector('.wechat-popover');
if (wechatCard && wechatPopover) {
  function setWechatOpen(isOpen) {
    wechatCard.classList.toggle('is-open', isOpen);
    wechatCard.setAttribute('aria-expanded', String(isOpen));
    wechatPopover.setAttribute('aria-hidden', String(!isOpen));
  }

  wechatCard.addEventListener('click', () => {
    setWechatOpen(!wechatCard.classList.contains('is-open'));
  });

  wechatCard.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setWechatOpen(!wechatCard.classList.contains('is-open'));
    }
    if (event.key === 'Escape') setWechatOpen(false);
  });

  document.addEventListener('click', (event) => {
    if (!wechatCard.contains(event.target)) setWechatOpen(false);
  });
}

// Smooth scroll offset for fixed nav
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
