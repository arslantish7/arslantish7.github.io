/*
 * Arslan Ghani — Portfolio interactions
 * Plain script (no modules, no build step), so it also works when a page is
 * opened directly from disk. Every feature is optional: if one fails the rest
 * still run and the page stays fully readable. Motion effects are skipped for
 * visitors who ask for reduced motion, and pointer effects are skipped on touch.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var THEME_COLORS = { light: '#f8fafb', dark: '#0b1120' };
  var CONTACT_EMAIL = 'arslanmunn5@gmail.com';

  function onMediaChange(query, handler) {
    if (query.addEventListener) query.addEventListener('change', handler);
    else if (query.addListener) query.addListener(handler);
  }

  function onScrollFrame(handler) {
    var queued = false;
    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () {
        queued = false;
        handler();
      });
    }, { passive: true });
    handler();
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function activeTheme() {
    return root.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light');
  }

  /* ---------- Theme toggle ---------- */
  function initTheme() {
    var toggle = document.querySelector('[data-theme-toggle]');
    var themeMetas = document.querySelectorAll('meta[name="theme-color"]');

    function savedTheme() {
      try {
        var value = localStorage.getItem('theme');
        return value === 'light' || value === 'dark' ? value : null;
      } catch (e) {
        return null;
      }
    }

    function sync() {
      var theme = activeTheme();
      if (toggle) {
        toggle.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' theme');
      }
      if (root.hasAttribute('data-theme')) {
        themeMetas.forEach(function (meta) { meta.setAttribute('content', THEME_COLORS[theme]); });
      }
    }

    if (toggle) {
      toggle.addEventListener('click', function () {
        var next = activeTheme() === 'dark' ? 'light' : 'dark';
        root.classList.add('theme-transition');
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) { /* private mode: theme just won't persist */ }
        sync();
        window.setTimeout(function () { root.classList.remove('theme-transition'); }, 350);
      });
    }

    onMediaChange(systemDark, function () {
      if (!savedTheme()) sync();
    });
    sync();
  }

  /* ---------- Mobile navigation ---------- */
  function initNav() {
    var header = document.querySelector('[data-header]');
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.getElementById('primary-nav');
    if (!header || !toggle || !nav) return;

    var desktop = window.matchMedia('(min-width: 961px)');

    function isOpen() {
      return header.classList.contains('nav-open');
    }

    function setOpen(open, restoreFocus) {
      header.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (!open && restoreFocus) toggle.focus();
    }

    toggle.addEventListener('click', function () {
      setOpen(!isOpen());
    });

    nav.addEventListener('click', function (event) {
      if (isOpen() && event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) setOpen(false, true);
    });

    document.addEventListener('click', function (event) {
      if (isOpen() && !header.contains(event.target)) setOpen(false);
    });

    header.addEventListener('focusout', function (event) {
      if (isOpen() && event.relatedTarget && !header.contains(event.relatedTarget)) setOpen(false);
    });

    onMediaChange(desktop, function () {
      if (desktop.matches && isOpen()) setOpen(false);
    });
  }

  /* ---------- Header shadow, reading progress, back-to-top ---------- */
  function initScrollState() {
    var header = document.querySelector('[data-header]');
    var backToTop = document.querySelector('[data-back-to-top]');
    var progress = document.querySelector('[data-scroll-progress]');

    onScrollFrame(function () {
      var y = window.scrollY || window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (header) header.classList.toggle('is-scrolled', y > 8);
      if (backToTop) backToTop.classList.toggle('is-visible', y > 640);
      if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
    });
  }

  /* ---------- Highlight the nav link for the section in view ---------- */
  function initScrollSpy() {
    if (!('IntersectionObserver' in window)) return;

    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-link[href^="#"]'));
    var sections = [];
    var linkFor = {};

    links.forEach(function (link) {
      var section = document.getElementById(link.getAttribute('href').slice(1));
      if (section) {
        sections.push(section);
        linkFor[section.id] = link;
      }
    });
    if (!sections.length) return;

    var current;
    function setCurrent(id) {
      if (id === current) return;
      current = id;
      links.forEach(function (link) {
        if (linkFor[id] === link) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setCurrent(linkFor[entry.target.id] ? entry.target.id : null);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (section) { observer.observe(section); });
    var hero = document.getElementById('top');
    if (hero) observer.observe(hero);

    // The last section can be too short to reach the middle of tall screens.
    onScrollFrame(function () {
      var atBottom = window.innerHeight + (window.scrollY || window.pageYOffset) >= document.documentElement.scrollHeight - 2;
      if (atBottom) setCurrent(sections[sections.length - 1].id);
    });
  }

  /* ---------- Fade content in as it scrolls into view ---------- */
  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (!items.length || reducedMotion.matches || !('IntersectionObserver' in window)) return;

    // Stagger cards that share a parent (e.g. grid items).
    items.forEach(function (item) {
      var siblings = Array.prototype.filter.call(item.parentElement.children, function (el) {
        return el.classList.contains('reveal');
      });
      var index = siblings.indexOf(item);
      if (index > 0) item.style.setProperty('--reveal-delay', Math.min(index * 80, 320) + 'ms');
    });

    function finish(el) {
      el.classList.remove('reveal', 'is-visible');
      el.style.removeProperty('--reveal-delay');
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        observer.unobserve(el);
        el.classList.add('is-visible');

        // Hand control back to the element's own hover transitions afterwards.
        var fallback = window.setTimeout(function () { finish(el); }, 1400);
        el.addEventListener('transitionend', function done(event) {
          if (event.target !== el || event.propertyName !== 'opacity') return;
          el.removeEventListener('transitionend', done);
          window.clearTimeout(fallback);
          finish(el);
        });
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    root.classList.add('reveal-on');
    items.forEach(function (item) { observer.observe(item); });
  }

  /* ---------- Typing tagline in the hero ---------- */
  function initTyping() {
    var el = document.querySelector('[data-typed]');
    if (!el || reducedMotion.matches) return;

    var phrases;
    try { phrases = JSON.parse(el.getAttribute('data-typed')); } catch (e) { return; }
    if (!Array.isArray(phrases) || phrases.length < 2) return;

    var index = 0;
    var length = phrases[0].length;
    var deleting = false;

    function tick() {
      var phrase = phrases[index];
      var delay;

      if (!deleting && length < phrase.length) {
        length += 1;
        delay = 45 + Math.random() * 50;
      } else if (!deleting) {
        deleting = true;
        delay = 2200;
      } else if (length > 0) {
        length -= 1;
        delay = 26;
      } else {
        deleting = false;
        index = (index + 1) % phrases.length;
        delay = 380;
      }

      el.textContent = phrases[index].slice(0, length);
      window.setTimeout(tick, delay);
    }

    window.setTimeout(tick, 600);
  }

  /* ---------- Interactive particle network behind the hero ---------- */
  function initHeroCanvas() {
    var canvas = document.querySelector('[data-hero-canvas]');
    if (!canvas || !canvas.getContext || reducedMotion.matches) return;

    var ctx = canvas.getContext('2d');
    var area = canvas.closest('section') || canvas.parentElement;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0;
    var height = 0;
    var particles = [];
    var rgb = '13, 148, 136';
    var pointer = { x: 0, y: 0, active: false };
    var running = false;
    var inView = true;
    var frame = 0;
    var LINK = 130;
    var POINTER_RADIUS = 160;

    function readColor() {
      var value = getComputedStyle(root).getPropertyValue('--particles').trim();
      if (value) rgb = value;
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.round(clamp((width * height) / 15000, 24, 90));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 1.4 + 0.8
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      var linkSq = LINK * LINK;

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];

        // Gently push particles away from the cursor.
        if (pointer.active) {
          var dx = p.x - pointer.x;
          var dy = p.y - pointer.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < POINTER_RADIUS && dist > 0) {
            var force = (1 - dist / POINTER_RADIUS) * 1.2;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        p.x = clamp(p.x, 0, width);
        p.y = clamp(p.y, 0, height);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgb + ', 0.55)';
        ctx.fill();

        for (var j = i + 1; j < particles.length; j++) {
          var q = particles[j];
          var lx = p.x - q.x;
          var ly = p.y - q.y;
          var lineSq = lx * lx + ly * ly;
          if (lineSq < linkSq) {
            ctx.strokeStyle = 'rgba(' + rgb + ', ' + (0.2 * (1 - lineSq / linkSq)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        if (pointer.active) {
          var px = p.x - pointer.x;
          var py = p.y - pointer.y;
          var pSq = px * px + py * py;
          var reach = POINTER_RADIUS * 1.3;
          if (pSq < reach * reach) {
            ctx.strokeStyle = 'rgba(' + rgb + ', ' + (0.35 * (1 - Math.sqrt(pSq) / reach)).toFixed(3) + ')';
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      }
    }

    function loop() {
      if (!running) return;
      draw();
      frame = window.requestAnimationFrame(loop);
    }

    function updateRunning() {
      var shouldRun = inView && !document.hidden;
      if (shouldRun && !running) {
        running = true;
        frame = window.requestAnimationFrame(loop);
      } else if (!shouldRun && running) {
        running = false;
        window.cancelAnimationFrame(frame);
      }
    }

    readColor();
    resize();

    var resizeTimer;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        updateRunning();
      }).observe(area);
    }
    document.addEventListener('visibilitychange', updateRunning);

    area.addEventListener('pointermove', function (event) {
      if (event.pointerType !== 'mouse') return;
      var rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    });
    area.addEventListener('pointerleave', function () { pointer.active = false; });

    // Re-read the colour when the theme changes.
    new MutationObserver(readColor).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    onMediaChange(systemDark, readColor);

    updateRunning();
  }

  /* ---------- 3D tilt on the hero code window ---------- */
  function initTilt() {
    var card = document.querySelector('[data-tilt]');
    if (!card || reducedMotion.matches || !finePointer.matches) return;

    var area = card.closest('section') || card.parentElement;
    var wide = window.matchMedia('(min-width: 961px)');

    area.addEventListener('pointermove', function (event) {
      if (event.pointerType !== 'mouse' || !wide.matches) return;
      var rect = card.getBoundingClientRect();
      var x = (event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
      var y = (event.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2);
      card.classList.add('is-tilting');
      card.style.setProperty('--tilt-y', clamp(x * 14, -12, 12).toFixed(2) + 'deg');
      card.style.setProperty('--tilt-x', clamp(-y * 10, -8, 8).toFixed(2) + 'deg');
    });

    area.addEventListener('pointerleave', function () {
      card.classList.remove('is-tilting');
      card.style.removeProperty('--tilt-y');
      card.style.removeProperty('--tilt-x');
    });
  }

  /* ---------- Buttons that lean toward the cursor ---------- */
  function initMagnetic() {
    if (reducedMotion.matches || !finePointer.matches) return;

    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (event) {
        var rect = el.getBoundingClientRect();
        var x = clamp((event.clientX - rect.left - rect.width / 2) * 0.2, -8, 8);
        var y = clamp((event.clientY - rect.top - rect.height / 2) * 0.35, -6, 6);
        el.style.transform = 'translate(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  }

  /* ---------- Soft light that follows the cursor on cards ---------- */
  function initSpotlight() {
    if (!finePointer.matches) return;

    document.querySelectorAll('.spotlight').forEach(function (card) {
      card.addEventListener('pointermove', function (event) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (event.clientX - rect.left).toFixed(0) + 'px');
        card.style.setProperty('--my', (event.clientY - rect.top).toFixed(0) + 'px');
      });
    });
  }

  /* ---------- Count numbers up when they come into view ---------- */
  function initCounters() {
    var items = document.querySelectorAll('[data-count]');
    if (!items.length || reducedMotion.matches || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);

        var el = entry.target;
        var end = parseInt(el.getAttribute('data-count'), 10) || 0;
        var start = null;
        var duration = 1300;

        function step(time) {
          if (start === null) start = time;
          var progress = Math.min((time - start) / duration, 1);
          el.textContent = String(Math.round(end * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });

    items.forEach(function (el) {
      el.textContent = '0';
      observer.observe(el);
    });
  }

  /* ---------- Copy email address ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var previousFocus = document.activeElement;
      var field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(field);
      if (previousFocus && previousFocus.focus) previousFocus.focus();
      if (ok) resolve(); else reject(new Error('Copy command failed'));
    });
  }

  function initCopy() {
    var status = document.querySelector('[data-copy-status]');

    document.querySelectorAll('[data-copy]').forEach(function (button) {
      var label = button.getAttribute('aria-label');
      var resetTimer;

      button.addEventListener('click', function () {
        var text = button.getAttribute('data-copy');
        copyText(text).then(function () {
          button.classList.add('is-copied');
          button.setAttribute('aria-label', 'Copied');
          if (status) status.textContent = 'Email address copied to clipboard.';
          window.clearTimeout(resetTimer);
          resetTimer = window.setTimeout(function () {
            button.classList.remove('is-copied');
            button.setAttribute('aria-label', label);
            if (status) status.textContent = '';
          }, 2000);
        }).catch(function () {
          if (status) status.textContent = 'Could not copy automatically. The email address is ' + text + '.';
        });
      });
    });
  }

  /* ---------- Contact form (Web3Forms) ---------- */
  function initContactForm() {
    var form = document.querySelector('[data-contact-form]');
    if (!form) return;

    var status = form.querySelector('[data-form-status]');
    var submitButton = form.querySelector('[type="submit"]');
    var submitLabel = form.querySelector('[data-submit-label]');
    var field = function (name) { return form.querySelector('[name="' + name + '"]'); };

    var rules = {
      name: function (value) {
        return value.length < 2 ? 'Please enter your name.' : '';
      },
      email: function (value) {
        if (!value) return 'Please enter your email address.';
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ? '' : 'Please enter a valid email address, like name@example.com.';
      },
      message: function (value) {
        return value.length < 10 ? 'Please write a message of at least 10 characters.' : '';
      }
    };

    function validate(name) {
      var input = field(name);
      var message = rules[name](input.value.trim());
      var error = form.querySelector('[data-error-for="' + name + '"]');
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
      if (error) error.textContent = message;
      return !message;
    }

    function setStatus(type, text) {
      status.className = 'form-status' + (type ? ' is-' + type : '');
      status.textContent = text;
    }

    function setSending(sending) {
      form.classList.toggle('is-sending', sending);
      submitButton.setAttribute('aria-disabled', String(sending));
      if (submitLabel) submitLabel.textContent = sending ? 'Sending…' : 'Send message';
    }

    Object.keys(rules).forEach(function (name) {
      var input = field(name);
      input.addEventListener('blur', function () {
        if (input.value.trim()) validate(name);
      });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') validate(name);
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (form.classList.contains('is-sending')) return;

      var invalid = Object.keys(rules).filter(function (name) { return !validate(name); });
      if (invalid.length) {
        setStatus('error', invalid.length > 1 ? 'Please fix the highlighted fields.' : 'Please fix the highlighted field.');
        field(invalid[0]).focus();
        return;
      }

      // Honeypot: real visitors never see or tick this box.
      var trap = field('botcheck');
      if (trap && trap.checked) return;

      var name = field('name').value.trim();
      var email = field('email').value.trim();
      var topic = field('topic') ? field('topic').value.trim() : '';
      var message = field('message').value.trim();
      var subject = 'Portfolio message' + (topic ? ': ' + topic : ' from ' + name);
      var accessKey = field('access_key').value.trim();

      // No access key yet: hand the message to the visitor's email app instead.
      if (!accessKey || accessKey.indexOf('YOUR_') === 0) {
        var body = message + '\n\n— ' + name + ' (' + email + ')';
        setStatus('info', 'Opening your email app with the message ready to send. If nothing happens, email me at ' + CONTACT_EMAIL + '.');
        window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        return;
      }

      setSending(true);
      setStatus('', '');

      var controller = 'AbortController' in window ? new AbortController() : null;
      var timeout = window.setTimeout(function () { if (controller) controller.abort(); }, 15000);

      fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          subject: subject,
          from_name: 'Arslan Ghani Portfolio',
          replyto: email,
          name: name,
          email: email,
          topic: topic,
          message: message
        }),
        signal: controller ? controller.signal : undefined
      })
        .then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (data) {
            if (!response.ok || data.success === false) throw new Error(data.message || 'Request failed');
            return data;
          });
        })
        .then(function () {
          form.reset();
          setStatus('success', 'Thanks, ' + name + '! Your message has been sent. I’ll get back to you soon.');
        })
        .catch(function () {
          setStatus('error', 'Sorry, your message couldn’t be sent. Please try again, or email me directly at ' + CONTACT_EMAIL + '.');
        })
        .then(function () {
          window.clearTimeout(timeout);
          setSending(false);
        });
    });
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    var year = String(new Date().getFullYear());
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = year; });
  }

  [
    initTheme, initNav, initScrollState, initScrollSpy, initReveal,
    initTyping, initHeroCanvas, initTilt, initMagnetic, initSpotlight, initCounters,
    initCopy, initContactForm, initYear
  ].forEach(function (init) {
    try {
      init();
    } catch (error) {
      if (window.console) console.error('[portfolio] ' + init.name + ' failed:', error);
    }
  });
})();
