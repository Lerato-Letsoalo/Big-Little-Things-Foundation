/* ============================================================
   VOLUNTEER DASHBOARD
   ============================================================ */
console.log('[volunteer.js] loaded');

let CURRENT_USER = null;
let CACHED_SUMMARY = null;

/* ---------------- NAV ---------------- */
const SECTIONS = ['overview','log','events','certificates','upcoming','profile'];

document.querySelectorAll('.dashboard-sidebar a[data-section]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.dashboard-sidebar a').forEach(a => a.classList.remove('active'));
    link.classList.add('active');
    const sec = link.dataset.section;
    SECTIONS.forEach(s => {
      const el = document.getElementById(s + 'Section');
      if (el) el.classList.toggle('hidden', s !== sec);
    });
    if (sec === 'overview') loadOverview();
    if (sec === 'events') loadMyEvents();
    if (sec === 'certificates') loadCertificates();
    if (sec === 'upcoming') loadUpcoming();
    if (sec === 'profile') loadProfile();
  });
});

/* ---------------- LOGOUT ---------------- */
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/index.html';
});

/* ---------------- QUICK LOG BUTTON ---------------- */
document.getElementById('quickLogBtn')?.addEventListener('click', () => {
  document.querySelectorAll('.dashboard-sidebar a').forEach(a => a.classList.remove('active'));
  document.querySelector('.dashboard-sidebar a[data-section="log"]').classList.add('active');
  SECTIONS.forEach(s => {
    const el = document.getElementById(s + 'Section');
    if (el) el.classList.toggle('hidden', s !== 'log');
  });
});

/* ---------------- INIT ---------------- */
(async function init() {
  try {
    const { user } = await api.get('/api/auth/me');
    if (user.role !== 'volunteer') {
      window.location.href = '/dashboards/admin.html';
      return;
    }
    CURRENT_USER = user;
    document.getElementById('volName').textContent = user.full_name.split(' ')[0];
    await loadOverview();
  } catch {
    window.location.href = '/login.html';
  }
})();

/* ============================================================
   OVERVIEW
   ============================================================ */
async function loadOverview() {
  try {
    const { summary } = await api.get('/api/volunteers/me/summary');
    CACHED_SUMMARY = summary;

    document.getElementById('statTotalLogged').textContent = summary.totalLogged;
    document.getElementById('statAttended').textContent = summary.attended;
    document.getElementById('statCerts').textContent = summary.certificates;

    const recent = document.getElementById('recentHoursList');
    if (!summary.recentHours.length) {
      recent.innerHTML = '<p style="color:var(--gray-400);">No hours logged yet. Click "+ Log Your Volunteer Event" to add one.</p>';
    } else {
      recent.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Event</th><th>Date</th><th>Hours</th><th>Status</th></tr></thead>
          <tbody>
            ${summary.recentHours.map(r => `
              <tr>
                <td>${r.session_title}</td>
                <td>${new Date(r.session_date).toLocaleDateString('en-ZA')}</td>
                <td>${parseFloat(r.hours).toFixed(1)}</td>
                <td><span class="badge badge-${r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : 'orange'}">${r.status}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>`;
    }

    const upcoming = document.getElementById('overviewUpcomingList');
    try {
      const { events } = await api.get('/api/events?status=upcoming');
      if (!events.length) {
        upcoming.innerHTML = '<p style="color:var(--gray-400);">No upcoming events.</p>';
      } else {
        upcoming.innerHTML = `
          <table class="data-table">
            <thead><tr><th>Event</th><th>Date</th><th>Description</th></tr></thead>
            <tbody>
              ${events.map(ev => `
                <tr>
                  <td><strong>${ev.title}</strong></td>
                  <td>${ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-ZA') : 'TBC'}</td>
                  <td style="font-size:0.85rem;color:var(--gray-500);">${ev.description || ''}</td>
                </tr>`).join('')}
            </tbody>
          </table>`;
      }
    } catch {
      upcoming.innerHTML = '<p style="color:var(--gray-400);">No upcoming events.</p>';
    }
  } catch (err) {
    console.warn('Overview load failed:', err);
  }
}

/* ============================================================
   LOG EVENT
   ============================================================ */
document.getElementById('logEventForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertBox = document.getElementById('logAlert');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  const payload = {
    event_name: document.getElementById('eventName').value.trim(),
    event_date: document.getElementById('eventDate').value,
    hours_worked: parseFloat(document.getElementById('hoursWorked').value),
    location: document.getElementById('eventLocation').value.trim(),
    notes: document.getElementById('eventNotes').value.trim()
  };

  if (!payload.event_name) return showLogAlert(alertBox, 'Event name is required.', 'error');
  if (!payload.event_date) return showLogAlert(alertBox, 'Event date is required.', 'error');
  if (!payload.hours_worked || payload.hours_worked <= 0) {
    return showLogAlert(alertBox, 'Please enter valid hours worked.', 'error');
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    const res = await api.post('/api/volunteers/me/log', payload);
    showLogAlert(alertBox, res.message || 'Event submitted for approval!', 'success');
    e.target.reset();
    setTimeout(() => { alertBox.classList.add('hidden'); }, 4000);
  } catch (err) {
    showLogAlert(alertBox, err.message || 'Submission failed.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

function showLogAlert(box, message, type) {
  box.className = `alert alert-${type}`;
  box.textContent = message;
  box.classList.remove('hidden');
}

/* ============================================================
   MY EVENTS
   ============================================================ */
async function loadMyEvents() {
  const tbody = document.querySelector('#myEventsTable tbody');
  try {
    const { events } = await api.get('/api/volunteers/me/events');
    if (!events.length) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--gray-400);padding:32px;">You haven\'t logged any events yet.</td></tr>';
      return;
    }
    tbody.innerHTML = events.map(ev => `
      <tr>
        <td><strong>${ev.session_title}</strong></td>
        <td>${new Date(ev.session_date).toLocaleDateString('en-ZA')}</td>
        <td><span class="badge badge-${ev.status === 'approved' ? 'green' : ev.status === 'rejected' ? 'red' : 'orange'}">${ev.status}</span></td>
      </tr>`).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--gray-400);padding:32px;">Could not load events.</td></tr>';
  }
}

/* ============================================================
   CERTIFICATES
   ============================================================ */
async function loadCertificates() {
  const mount = document.getElementById('certsList');
  try {
    const { certificates } = await api.get('/api/certificates/mine');
    if (!certificates.length) {
      mount.innerHTML = '<div class="panel"><p style="color:var(--gray-400);text-align:center;padding:32px;">No certificates yet. Once an admin approves your hours, your certificate will appear here.</p></div>';
      return;
    }
    mount.innerHTML = certificates.map(c => `
      <div class="panel" style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
        <div>
          <h3 style="font-family:var(--font-display);color:var(--black);font-size:1.15rem;margin:0 0 4px;">${c.session_title}</h3>
          <p style="color:var(--gray-500);font-size:0.85rem;margin:0;">
            ${new Date(c.session_date).toLocaleDateString('en-ZA')} · ${parseFloat(c.hours).toFixed(1)} hours
            · <code style="background:var(--gray-100);padding:2px 6px;border-radius:3px;font-size:0.78rem;">${c.certificate_code}</code>
          </p>
        </div>
        <div style="display:flex;gap:8px;">
          <a href="/api/certificates/${c.id}/download" class="btn btn-primary btn-sm" download>Download PDF</a>
          <button class="btn btn-outline btn-sm download-png" data-id="${c.id}">Download Image</button>
        </div>
      </div>`).join('');

    if (typeof html2canvas === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      document.head.appendChild(script);
    }

    document.querySelectorAll('.download-png').forEach(btn => {
      btn.onclick = async () => {
        const certId = btn.dataset.id;
        const cert = certificates.find(x => String(x.id) === String(certId));
        if (!cert) return;

        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = '-9999px';
        div.style.width = '1200px';
        div.style.height = '850px';
        div.style.padding = '60px';
        div.style.background = 'white';
        div.style.fontFamily = "'Playfair Display', Georgia, serif";
        div.style.textAlign = 'center';
        div.style.border = '8px solid #D0021B';
        div.innerHTML = `
          <div style="border:2px solid #0D0D0D;padding:40px;height:100%;box-sizing:border-box;">
            <h1 style="font-size:3rem;color:#0D0D0D;margin:20px 0;">Big Little Things Foundation</h1>
            <p style="font-size:1.4rem;color:#D0021B;letter-spacing:0.2em;text-transform:uppercase;margin:10px 0 40px;">Certificate of Appreciation</p>
            <p style="font-size:1.2rem;color:#555;">This is proudly presented to</p>
            <h2 style="font-size:2.8rem;color:#D0021B;font-style:italic;margin:30px 0;">${CURRENT_USER.full_name}</h2>
            <p style="font-size:1.1rem;color:#555;margin:30px 0;">for volunteering</p>
            <h3 style="font-size:2rem;color:#0D0D0D;margin:10px 0 30px;">${parseFloat(cert.hours).toFixed(1)} hours</h3>
            <p style="font-size:1.1rem;color:#555;">at <strong style="color:#0D0D0D;">${cert.session_title}</strong> on ${new Date(cert.session_date).toLocaleDateString('en-ZA', {day:'numeric',month:'long',year:'numeric'})}</p>
            <p style="font-size:1rem;color:#555;font-style:italic;margin-top:60px;">Thank you for making a difference.</p>
            <p style="font-size:0.75rem;color:#999;margin-top:30px;">Certificate ID: ${cert.certificate_code}</p>
          </div>`;
        document.body.appendChild(div);

        try {
          await new Promise(r => setTimeout(r, 400));
          const canvas = await html2canvas(div, { scale: 2, backgroundColor: '#fff' });
          const link = document.createElement('a');
          link.download = `BLT-Certificate-${cert.certificate_code}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        } catch (err) {
          alert('Could not generate image: ' + err.message);
        }
        document.body.removeChild(div);
      };
    });
  } catch {
    mount.innerHTML = '<div class="panel"><p style="color:var(--gray-400);text-align:center;padding:32px;">Could not load certificates.</p></div>';
  }
}

/* ============================================================
   UPCOMING
   ============================================================ */
async function loadUpcoming() {
  const mount = document.getElementById('upcomingFullList');
  try {
    const { events } = await api.get('/api/events?status=upcoming');
    if (!events.length) {
      mount.innerHTML = '<div class="panel"><p style="color:var(--gray-400);text-align:center;padding:32px;">No upcoming events right now.</p></div>';
      return;
    }
    mount.innerHTML = events.map(ev => `
      <div class="panel" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;">
        ${ev.image_path ? `<img src="${ev.image_path}" style="width:120px;height:80px;object-fit:cover;border-radius:var(--radius);" alt="${ev.title}">` : ''}
        <div style="flex:1;min-width:200px;">
          <h3 style="font-family:var(--font-display);color:var(--black);font-size:1.15rem;margin:0 0 4px;">${ev.title}</h3>
          <p style="color:var(--gray-500);font-size:0.85rem;margin:0 0 6px;">${ev.category || ''}</p>
          <p style="color:var(--gray-700);font-size:0.9rem;margin:0;">${ev.description || ''}</p>
        </div>
        <div style="text-align:right;">
          <p style="color:var(--red);font-weight:700;font-size:0.9rem;margin:0;">
            ${ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'}) : 'Date TBC'}
          </p>
        </div>
      </div>`).join('');
  } catch {
    mount.innerHTML = '<div class="panel"><p style="color:var(--gray-400);text-align:center;padding:32px;">Could not load upcoming events.</p></div>';
  }
}

/* ============================================================
   PROFILE
   ============================================================ */
async function loadProfile() {
  try {
    const { user } = await api.get('/api/auth/me');
    CURRENT_USER = user;

    const initials = (user.full_name || 'V')
      .split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
    document.getElementById('profileInitials').textContent = initials;
    document.getElementById('profileDisplayName').textContent = user.full_name;

    /* ---------- TOTAL HOURS (from summary) ---------- */
    let approvedHours = 0;
    try {
      const { summary } = await api.get('/api/volunteers/me/summary');
      CACHED_SUMMARY = summary;
      approvedHours = parseFloat(summary.approvedHours || 0);
    } catch {
      approvedHours = 0;
    }
    document.getElementById('profileTotalHours').textContent = approvedHours.toFixed(1);
    /* -------------------------------------------------- */

    const joined = new Date(user.created_at || Date.now());
    document.getElementById('profileMemberSince').textContent = joined.getFullYear();

    document.getElementById('profFullName').value = user.full_name || '';
    document.getElementById('profEmail').value = user.email || '';
    document.getElementById('profPhone').value = user.phone || '';
    document.getElementById('profCity').value = user.city || '';
    document.getElementById('profSkills').value = user.skills || '';
    document.getElementById('profAbout').value = user.about_me || '';
  } catch (err) {
    console.warn('Profile load failed:', err);
  }
}

document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertBox = document.getElementById('profileAlert');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  const payload = {
    full_name: document.getElementById('profFullName').value.trim(),
    phone: document.getElementById('profPhone').value.trim(),
    city: document.getElementById('profCity').value.trim(),
    skills: document.getElementById('profSkills').value.trim(),
    about_me: document.getElementById('profAbout').value.trim()
  };

  if (!payload.full_name) {
    alertBox.className = 'alert alert-error';
    alertBox.textContent = 'Full name is required.';
    alertBox.classList.remove('hidden');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    const res = await api.put('/api/volunteers/me/profile', payload);
    alertBox.className = 'alert alert-success';
    alertBox.textContent = res.message || 'Profile updated successfully.';
    alertBox.classList.remove('hidden');
    setTimeout(() => alertBox.classList.add('hidden'), 4000);

    document.getElementById('profileDisplayName').textContent = payload.full_name;
    document.getElementById('volName').textContent = payload.full_name.split(' ')[0];
    const initials = payload.full_name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
    document.getElementById('profileInitials').textContent = initials;
  } catch (err) {
    alertBox.className = 'alert alert-error';
    alertBox.textContent = err.message || 'Could not save profile.';
    alertBox.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});