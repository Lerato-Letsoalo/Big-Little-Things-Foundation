/* ============================================================
   MAIN — shared header, footer, and content renderers
   ============================================================ */
console.log('[main.js] loaded');

const LOGO_URL = '/assets/img/blt-logo.jpeg';

const SOCIALS = [
  { href: 'https://www.tiktok.com/@bltfoundation?_r=1&_t=ZS-999eoTVYr5z', label: 'TikTok',
    icon: 'M12.5 2h3.1a5 5 0 0 0 4.9 4.2v3.1a8 8 0 0 1-4.7-1.5v6.3a6.3 6.3 0 1 1-6.3-6.3c.35 0 .7.03 1.05.1v3.2a3.15 3.15 0 1 0 2.2 3v-12z' },
  { href: 'https://www.instagram.com/biglittlethings.foundation?igsi=MTYyMGE0NzBtMTRicQ%3D%3D', label: 'Instagram',
    icon: 'M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.42.37 1.06.42 2.23.06 1.25.07 1.63.07 4.8s0 3.55-.07 4.8c-.05 1.17-.25 1.8-.42 2.23a3.7 3.7 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.17-1.06.37-2.23.42-1.25.06-1.63.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.42a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.17-.42-.37-1.06-.42-2.23C2.2 15.55 2.2 15.17 2.2 12s0-3.55.07-4.8c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.17 1.06-.37 2.23-.42C8.4 2.2 8.78 2.2 12 2.2zm0 3.6a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-10.5a1.45 1.45 0 1 1-2.9 0 1.45 1.45 0 0 1 2.9 0z' },
  { href: 'http://www.linkedin.com/in/big-little-things-foundation-ab38b5441', label: 'LinkedIn',
    icon: 'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.55V9h3.57v11.45z' }
];

/* Dispatch when any dynamic content is rendered so i18n re-applies */
function notifyI18n() {
  document.dispatchEvent(new Event('blt:contentLoaded'));
}

/* ---------------- HEADER ---------------- */
function buildHeader() {
  const active = location.pathname.split('/').pop() || 'index.html';
  const nav = [
    { href: '/index.html',    key: 'nav.home',      label: 'Home' },
    { href: '/about.html',    key: 'nav.about',     label: 'About' },
    { href: '/projects.html', key: 'nav.projects',  label: 'Projects' },
    { href: '/volunteer.html',key: 'nav.volunteer', label: 'Volunteer' },
    { href: '/gallery.html',  key: 'nav.gallery',   label: 'Gallery' },
    { href: '/contact.html',  key: 'nav.contact',   label: 'Contact' }
  ];

  return `
  <header class="site-header">
    <div class="container header-inner">
      <a href="/index.html" class="logo">
        <img src="${LOGO_URL}" alt="Big Little Things Foundation logo"
             onerror="this.onerror=null;this.style.display='none'">
        <div class="logo-text">
          Big Little Things
          <small>Foundation</small>
        </div>
      </a>

      <button class="nav-toggle" aria-label="Toggle navigation">☰</button>

      <nav class="main-nav" id="mainNav">
        <ul>
          ${nav.map(l => `
            <li>
              <a href="${l.href}" class="nav-link ${active === l.href.slice(1) ? 'active' : ''}"
                 data-i18n="${l.key}">${l.label}</a>
            </li>
          `).join('')}
        </ul>
      </nav>

      <div class="nav-actions">
        <div class="lang-custom" id="langCustom">
  <button type="button" class="lang-custom-btn" id="langCustomBtn" aria-haspopup="true" aria-expanded="false">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
    <span id="langCustomLabel">English</span>
    <svg class="lang-custom-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  </button>
  <ul class="lang-custom-menu" id="langCustomMenu" role="menu">
    <li><button type="button" data-lang="en"   role="menuitem">English</button></li>
    <li><button type="button" data-lang="af"   role="menuitem">Afrikaans</button></li>
    <li><button type="button" data-lang="zu"   role="menuitem">isiZulu</button></li>
    <li><button type="button" data-lang="xh"   role="menuitem">isiXhosa</button></li>
    <li><button type="button" data-lang="nso"  role="menuitem">Sepedi</button></li>
    <li><button type="button" data-lang="tn"   role="menuitem">Setswana</button></li>
    <li><button type="button" data-lang="st"   role="menuitem">Sesotho</button></li>
    <li><button type="button" data-lang="ts"   role="menuitem">Xitsonga</button></li>
    <li><button type="button" data-lang="ss"   role="menuitem">siSwati</button></li>
    <li><button type="button" data-lang="ve"   role="menuitem">Tshivenda</button></li>
    <li><button type="button" data-lang="nr"   role="menuitem">isiNdebele</button></li>
  </ul>
</div>
        <a href="/login.html" class="btn btn-outline" data-i18n="nav.login">Login</a>
        <a href="/donate.html" class="btn btn-accent" data-i18n="nav.donate">Donate Now</a>
      </div>
    </div>
  </header>`;
}

/* ---------------- FOOTER ---------------- */
function buildFooter() {
  return `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <h4>Big Little Things <em>Foundation</em></h4>
          <p style="color:rgba(255,255,255,0.65);font-size:0.9rem;max-width:300px;">
            Empowering communities through youth-driven initiatives across South Africa.
          </p>
          <div class="social-links">
            ${SOCIALS.map(s => `
              <a href="${s.href}" target="_blank" rel="noopener noreferrer" aria-label="${s.label}">
                <svg viewBox="0 0 24 24"><path d="${s.icon}"/></svg>
              </a>`).join('')}
          </div>
        </div>

        <div>
          <h4>Quick Links</h4>
          <a href="/index.html">Home</a>
          <a href="/about.html">About Us</a>
          <a href="/projects.html">Projects</a>
          <a href="/gallery.html">Gallery</a>
        </div>

        <div>
          <h4>Get Involved</h4>
          <a href="/volunteer.html">Volunteer</a>
          <a href="/donate.html">Donate</a>
          <a href="/contact.html">Contact</a>
        </div>

        <div>
          <h4>Contact</h4>
          <p style="color:rgba(255,255,255,0.65);font-size:0.9rem;line-height:1.9;">
            Hloni: 081 013 0522<br>
            Iman: 072 516 9605<br>
            Chloe: 078 162 6965<br>
            South Africa
          </p>
        </div>
      </div>

      <div class="footer-bottom">
        &copy; ${new Date().getFullYear()} Big Little Things Foundation. All rights reserved.
      </div>
    </div>
  </footer>`;
}

/* ---------------- MOUNT ON LOAD ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  const headerMount = document.getElementById('header-mount');
  const footerMount = document.getElementById('footer-mount');
  if (headerMount) headerMount.innerHTML = buildHeader();
  if (footerMount) footerMount.innerHTML = buildFooter();

  document.querySelector('.nav-toggle')?.addEventListener('click', () => {
    document.getElementById('mainNav')?.classList.toggle('open');
  });

  // Let i18n know the header/footer are in the DOM now
  notifyI18n();
});

/* ============================================================
   SHARED CONTENT RENDERERS
   ============================================================ */

window.renderTeam = async function renderTeam(selector) {
  const mount = document.querySelector(selector);
  if (!mount) return;
  try {
    const { team } = await api.get('/api/team');
    mount.innerHTML = team.map(m => `
      <div class="team-card">
        <img class="team-photo"
             src="${m.image_path || '/assets/img/placeholder-team.jpg'}"
             alt="${m.image_alt || m.name}"
             onerror="this.onerror=null;this.src='/assets/img/placeholder-team.jpg'">
        <h3>${m.name}</h3>
        <p class="team-role">${m.role}</p>
        <p class="team-bio clamped">${m.bio}</p>
        <button class="bio-toggle">Read more</button>
      </div>`).join('');

    mount.querySelectorAll('.bio-toggle').forEach(btn => {
      btn.addEventListener('click', e => {
        const bio = e.target.previousElementSibling;
        const clamped = bio.classList.toggle('clamped');
        e.target.textContent = clamped ? 'Read more' : 'Read less';
      });
    });

    notifyI18n();
  } catch (err) {
    console.warn('[renderTeam]', err);
  }
};

window.renderEvents = async function renderEvents(selector, status) {
  const mount = document.querySelector(selector);
  if (!mount) return;
  try {
    const { events } = await api.get(`/api/events${status ? '?status=' + status : ''}`);
    if (!events.length) {
      mount.innerHTML = '<p style="color:var(--gray-400);grid-column:1/-1;text-align:center;padding:24px;">No drives to show yet.</p>';
      notifyI18n();
      return;
    }
    mount.innerHTML = events.map(ev => {
      const badgeClass = ev.status === 'active' ? 'badge-overlay-active'
                       : ev.status === 'upcoming' ? 'badge-overlay-upcoming'
                       : 'badge-overlay-completed';
      const badgeText = ev.status.charAt(0).toUpperCase() + ev.status.slice(1);
      const dateLine = ev.event_date
        ? new Date(ev.event_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Date to be confirmed';

      return `
        <div class="project-card">
          <div class="project-image-wrap">
            <img src="${ev.safe_image_path || ev.image_path || '/assets/img/placeholder-event.jpg'}"
                 alt="${ev.title}"
                 loading="lazy"
                 onerror="this.onerror=null;this.src='/assets/img/placeholder-event.jpg'">
            <span class="badge-overlay ${badgeClass}">${badgeText}</span>
          </div>
          <div class="project-body">
            <h3>${ev.title}</h3>
            ${ev.category ? `<p class="project-category">${ev.category}</p>` : ''}
            <p class="project-desc">${ev.description || ''}</p>
            <p class="project-date">${dateLine}</p>
          </div>
        </div>`;
    }).join('');

    notifyI18n();
  } catch (err) {
    console.warn('[renderEvents]', err);
  }
};

window.renderGallery = async function renderGallery(selector, limit) {
  const mount = document.querySelector(selector);
  if (!mount) return;
  try {
    const { images } = await api.get('/api/gallery');
    if (!images.length) {
      mount.innerHTML = '<p style="color:var(--gray-400);grid-column:1/-1;text-align:center;padding:24px;">No images yet.</p>';
      notifyI18n();
      return;
    }
    const list = limit ? images.slice(0, limit) : images;
    mount.innerHTML = list.map(img => `
      <div class="gallery-item">
        <img src="${img.safe_path || encodeURI(img.image_path)}"
             alt="${img.alt_text || img.title || 'Gallery image'}"
             loading="lazy"
             onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22><rect width=%22300%22 height=%22300%22 fill=%22%23eee%22/></svg>'">
        <div class="gallery-overlay">
          ${img.title ? `<strong>${img.title}</strong>` : ''}
          ${img.year ? `<span style="font-size:0.72rem;opacity:0.75;margin-top:4px;display:block;letter-spacing:0.1em;text-transform:uppercase;">${img.year}</span>` : ''}
        </div>
      </div>`).join('');

    notifyI18n();
  } catch (err) {
    console.warn('[renderGallery]', err);
  }
};

window.renderTestimonials = async function renderTestimonials(selector) {
  const mount = document.querySelector(selector);
  if (!mount) return;
  try {
    const { testimonials } = await api.get('/api/testimonials');
    if (!testimonials.length) { mount.innerHTML = ''; return; }

    mount.innerHTML = `
      <div class="testimonial-carousel" id="testimonialCarousel">
        ${testimonials.map((t, i) => `
          <div class="testimonial-slide ${i === 0 ? 'active' : ''}">
            <blockquote>"${t.content}"</blockquote>
            <div class="testimonial-author">— ${t.author_name}</div>
            ${t.event_label ? `<div class="testimonial-label">${t.event_label}</div>` : ''}
          </div>`).join('')}
        <div class="carousel-controls">
          <button class="carousel-btn" id="prevTestimonial" aria-label="Previous">‹</button>
          <button class="carousel-btn" id="pauseTestimonial" aria-label="Pause">❚❚</button>
          <button class="carousel-btn" id="nextTestimonial" aria-label="Next">›</button>
        </div>
      </div>`;

    const slides = mount.querySelectorAll('.testimonial-slide');
    let idx = 0, playing = true, timer;

    const show = i => {
      slides.forEach(s => s.classList.remove('active'));
      slides[(i + slides.length) % slides.length].classList.add('active');
      idx = (i + slides.length) % slides.length;
    };
    const next = () => show(idx + 1);
    const prev = () => show(idx - 1);
    const start = () => { clearInterval(timer); timer = setInterval(next, 7000); };
    const stop = () => clearInterval(timer);

    document.getElementById('nextTestimonial').onclick = () => { next(); start(); };
    document.getElementById('prevTestimonial').onclick = () => { prev(); start(); };
    document.getElementById('pauseTestimonial').onclick = e => {
      playing = !playing;
      e.target.textContent = playing ? '❚❚' : '▶';
      playing ? start() : stop();
    };
    mount.addEventListener('mouseenter', () => playing && stop());
    mount.addEventListener('mouseleave', () => playing && start());
    start();

    notifyI18n();
  } catch (err) {
    console.warn('[renderTestimonials]', err);
  }
};

window.blt = {
  renderTeam: window.renderTeam,
  renderEvents: window.renderEvents,
  renderGallery: window.renderGallery,
  renderTestimonials: window.renderTestimonials
};