/* ============================================================
   ADMIN DASHBOARD — Browser-side logic
   Uses window.api, window.confirmModal, window.toastSuccess, window.toastError
   ============================================================ */
console.log('[admin.js] loaded');

/* ---------------- NAV ---------------- */
const SECTIONS = ['overview','team','volunteers','hours','events','donations','gallery','testimonials','enquiries'];

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
    if (sec === 'team') loadTeam();
    if (sec === 'volunteers') loadVolunteers();
    if (sec === 'hours') loadEventSubmissions();
    if (sec === 'events') loadEvents();
    if (sec === 'donations') loadDonations();
    if (sec === 'gallery') loadGallery();
    if (sec === 'testimonials') loadTestimonials();
    if (sec === 'enquiries') loadEnquiries();
  });
});

/* ---------------- LOGOUT ---------------- */
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/index.html';
});

/* ---------------- INIT ---------------- */
(async function init() {
  try {
    const { user } = await api.get('/api/auth/me');
    if (user.role !== 'admin') {
      window.location.href = '/dashboards/volunteer.html';
      return;
    }
    document.getElementById('adminName').textContent = user.full_name;
    await loadOverview();
  } catch (err) {
    console.error('[admin.js] init failed:', err);
    window.location.href = '/login.html';
  }
})();

/* ============================================================
   OVERVIEW
   ============================================================ */
async function loadOverview() {
  try {
    const { stats } = await api.get('/api/dashboard/stats');
    document.getElementById('statVolunteers').textContent = stats.volunteers;
    document.getElementById('statActiveProjects').textContent = stats.activeProjects;
    document.getElementById('statPendingHours').textContent = stats.pendingHours;
    document.getElementById('statNewRegs').textContent = stats.newRegistrations;
  } catch (err) { console.warn('[admin.js] stats failed:', err); }

  try {
    const { donations } = await api.get('/api/dashboard/recent-donations');
    const dList = document.getElementById('recentDonationsList');
    if (!donations.length) {
      dList.innerHTML = '<p style="color:var(--gray-400);">No donations yet.</p>';
    } else {
      dList.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Donor</th><th>Type</th><th>Amount / Items</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            ${donations.map(d => `
              <tr>
                <td>${d.donor_name}</td>
                <td style="text-transform:capitalize;">${d.donation_type}</td>
                <td>${d.amount ? 'R' + parseFloat(d.amount).toFixed(2) : (d.quantity_description || '—')}</td>
                <td><span class="badge badge-${d.status === 'verified' || d.status === 'completed' ? 'green' : d.status === 'rejected' ? 'red' : 'gray'}">${d.status.replace(/_/g,' ')}</span></td>
                <td>${new Date(d.created_at).toLocaleDateString('en-ZA')}</td>
              </tr>`).join('')}
          </tbody>
        </table>`;
    }
  } catch (err) { console.warn('[admin.js] recent donations failed:', err); }

  try {
    const { volunteers } = await api.get('/api/dashboard/recent-volunteers');
    const vList = document.getElementById('recentVolunteersList');
    if (!volunteers.length) {
      vList.innerHTML = '<p style="color:var(--gray-400);">No volunteer registrations yet.</p>';
    } else {
      vList.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>City</th><th>Joined</th></tr></thead>
          <tbody>
            ${volunteers.map(v => `
              <tr>
                <td>${v.full_name}</td>
                <td>${v.email}</td>
                <td>${v.city || '—'}</td>
                <td>${new Date(v.created_at).toLocaleDateString('en-ZA')}</td>
              </tr>`).join('')}
          </tbody>
        </table>`;
    }
  } catch (err) { console.warn('[admin.js] recent volunteers failed:', err); }
}

/* ============================================================
   TEAM
   ============================================================ */
async function loadTeam() {
  try {
    const { team } = await api.get('/api/team');
    const mount = document.getElementById('teamAdminList');
    mount.innerHTML = team.map(m => `
      <div style="display:flex;gap:16px;padding:14px;border:1px solid var(--gray-200);border-radius:var(--radius);margin-bottom:12px;align-items:center;">
        <img src="${m.image_path || '/assets/img/placeholder-team.jpg'}"
             style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid var(--red);"
             onerror="this.src='/assets/img/placeholder-team.jpg'">
        <div style="flex:1;">
          <strong>${m.name}</strong>
          <p style="color:var(--red);font-size:0.8rem;font-weight:600;margin:2px 0 0;">${m.role}</p>
        </div>
        <button class="btn btn-outline btn-sm edit-team" data-id="${m.id}">Edit</button>
        <button class="btn btn-danger btn-sm delete-team" data-id="${m.id}">Delete</button>
      </div>`).join('');

    document.querySelectorAll('.edit-team').forEach(btn => btn.onclick = () => {
      const m = team.find(x => String(x.id) === String(btn.dataset.id));
      document.getElementById('teamId').value = m.id;
      document.getElementById('tName').value = m.name;
      document.getElementById('tRole').value = m.role;
      document.getElementById('tBio').value = m.bio;
      document.getElementById('tAlt').value = m.image_alt || '';
      document.getElementById('tOrder').value = 0;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.querySelectorAll('.delete-team').forEach(btn => btn.onclick = async () => {
      const confirmed = await confirmModal('Delete this team member?', {
        title: 'Delete team member',
        danger: true,
        okLabel: 'Delete'
      });
      if (!confirmed) return;
      try {
        await api.del(`/api/team/${btn.dataset.id}`);
        toastSuccess('Team member deleted.');
        loadTeam();
      } catch (err) { toastError('Delete failed: ' + err.message); }
    });
  } catch (err) { console.warn('[admin.js] team load failed:', err); }
}

document.getElementById('teamForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData();
  fd.append('name', document.getElementById('tName').value);
  fd.append('role', document.getElementById('tRole').value);
  fd.append('bio', document.getElementById('tBio').value);
  fd.append('image_alt', document.getElementById('tAlt').value);
  fd.append('display_order', document.getElementById('tOrder').value);
  const img = document.getElementById('tImage').files[0];
  if (img) fd.append('image', img);

  const id = document.getElementById('teamId').value;
  try {
    if (id) await api.putForm(`/api/team/${id}`, fd);
    else await api.postForm('/api/team', fd);
    document.getElementById('teamForm').reset();
    document.getElementById('teamId').value = '';
    toastSuccess(id ? 'Team member updated.' : 'Team member added.');
    loadTeam();
  } catch (err) { toastError('Save failed: ' + err.message); }
});

document.getElementById('resetTeam')?.addEventListener('click', () => {
  document.getElementById('teamForm').reset();
  document.getElementById('teamId').value = '';
});

/* ============================================================
   VOLUNTEERS
   ============================================================ */
async function loadVolunteers() {
  try {
    const { volunteers } = await api.get('/api/volunteers');
    const tbody = document.querySelector('#volunteersTable tbody');
    if (!volunteers.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:32px;">No volunteers yet.</td></tr>';
      return;
    }
    tbody.innerHTML = volunteers.map(v => `
      <tr>
        <td><strong>${v.full_name}</strong><br><small style="color:var(--gray-400);">${v.email}</small></td>
        <td>${v.city || '—'}</td>
        <td>${parseFloat(v.approved_hours || 0).toFixed(1)}</td>
        <td>${new Date(v.created_at).toLocaleDateString('en-ZA')}</td>
        <td><button class="btn btn-danger btn-sm remove-volunteer" data-id="${v.id}" data-name="${v.full_name}">Remove</button></td>
      </tr>`).join('');

    document.querySelectorAll('.remove-volunteer').forEach(btn => btn.onclick = async () => {
      const confirmed = await confirmModal(
        `Remove volunteer "${btn.dataset.name}"? This cannot be undone.`,
        { title: 'Remove volunteer', danger: true, okLabel: 'Remove' }
      );
      if (!confirmed) return;
      try {
        await api.del(`/api/volunteers/${btn.dataset.id}`);
        toastSuccess('Volunteer removed.');
        loadVolunteers();
      } catch (err) { toastError('Could not remove volunteer: ' + err.message); }
    });
  } catch (err) { console.warn('[admin.js] volunteers load failed:', err); }
}

/* ============================================================
   EVENT SUBMISSIONS
   ============================================================ */
async function loadEventSubmissions() {
  try {
    const { hours } = await api.get('/api/volunteers/hours');
    const tbody = document.querySelector('#hoursTable tbody');
    if (!hours.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:32px;">No event submissions yet.</td></tr>';
      return;
    }
    tbody.innerHTML = hours.map(h => `
      <tr>
        <td><strong>${h.volunteer_name}</strong><br><small style="color:var(--gray-400);">${h.volunteer_email}</small></td>
        <td>${h.session_title}</td>
        <td>${new Date(h.session_date).toLocaleDateString('en-ZA')}</td>
        <td>${parseFloat(h.hours).toFixed(1)}</td>
        <td><span class="badge badge-${h.status === 'approved' ? 'green' : h.status === 'rejected' ? 'red' : 'orange'}">${h.status}</span></td>
        <td>
          ${h.status === 'pending' ? `
            <button class="btn btn-primary btn-sm approve-hour" data-id="${h.id}">Approve</button>
            <button class="btn btn-danger btn-sm reject-hour" data-id="${h.id}" data-name="${h.volunteer_name}">Reject</button>
          ` : '—'}
        </td>
      </tr>`).join('');

    document.querySelectorAll('.approve-hour').forEach(btn => btn.onclick = async () => {
      try {
        await api.put(`/api/volunteers/attendance/${btn.dataset.id}`, { status: 'approved' });
        toastSuccess('Event approved. Certificate issued.');
        loadEventSubmissions();
        loadOverview();
      } catch (err) { toastError('Approval failed: ' + err.message); }
    });

    document.querySelectorAll('.reject-hour').forEach(btn => btn.onclick = async () => {
      const confirmed = await confirmModal(
        `Reject event submission from ${btn.dataset.name}?`,
        { title: 'Reject submission', danger: true, okLabel: 'Reject' }
      );
      if (!confirmed) return;
      try {
        await api.put(`/api/volunteers/attendance/${btn.dataset.id}`, { status: 'rejected' });
        toastSuccess('Event submission rejected.');
        loadEventSubmissions();
        loadOverview();
      } catch (err) { toastError('Rejection failed: ' + err.message); }
    });
  } catch (err) { console.warn('[admin.js] event submissions load failed:', err); }
}

/* ============================================================
   EVENTS (Community Drives)
   ============================================================ */
async function loadEvents() {
  try {
    const { events } = await api.get('/api/events/all');
    const tbody = document.querySelector('#eventsTable tbody');
    tbody.innerHTML = events.map(ev => `
      <tr>
        <td><strong>${ev.title}</strong><br><small style="color:var(--gray-400);">${ev.category || ''}</small></td>
        <td><span class="badge badge-${ev.status === 'active' ? 'green' : ev.status === 'upcoming' ? 'red' : 'gray'}">${ev.status}</span></td>
        <td>${ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-ZA') : 'TBC'}</td>
        <td>
          <button class="btn btn-outline btn-sm edit-event" data-id="${ev.id}">Edit</button>
          <button class="btn btn-danger btn-sm delete-event" data-id="${ev.id}">Delete</button>
        </td>
      </tr>`).join('');

    document.querySelectorAll('.edit-event').forEach(btn => btn.onclick = () => {
      const ev = events.find(x => String(x.id) === String(btn.dataset.id));
      document.getElementById('eventId').value = ev.id;
      document.getElementById('evTitle').value = ev.title;
      document.getElementById('evCategory').value = ev.category || '';
      document.getElementById('evDesc').value = ev.description || '';
      document.getElementById('evStatus').value = ev.status;
      document.getElementById('evDate').value = ev.event_date || '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.querySelectorAll('.delete-event').forEach(btn => btn.onclick = async () => {
      const confirmed = await confirmModal('Delete this drive?', {
        title: 'Delete drive', danger: true, okLabel: 'Delete'
      });
      if (!confirmed) return;
      try {
        await api.del(`/api/events/${btn.dataset.id}`);
        toastSuccess('Drive deleted.');
        loadEvents();
        loadOverview();
      } catch (err) { toastError('Delete failed: ' + err.message); }
    });
  } catch (err) { console.warn('[admin.js] events load failed:', err); }
}

document.getElementById('eventForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData();
  fd.append('title', document.getElementById('evTitle').value);
  fd.append('category', document.getElementById('evCategory').value);
  fd.append('description', document.getElementById('evDesc').value);
  fd.append('status', document.getElementById('evStatus').value);
  fd.append('event_date', document.getElementById('evDate').value);
  const img = document.getElementById('evImage').files[0];
  if (img) fd.append('image', img);

  const id = document.getElementById('eventId').value;
  try {
    if (id) await api.putForm(`/api/events/${id}`, fd);
    else await api.postForm('/api/events', fd);
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    toastSuccess(id ? 'Drive updated.' : 'Drive created.');
    loadEvents();
    loadOverview();
  } catch (err) { toastError('Save failed: ' + err.message); }
});

document.getElementById('resetEvent')?.addEventListener('click', () => {
  document.getElementById('eventForm').reset();
  document.getElementById('eventId').value = '';
});

/* ============================================================
   DONATIONS (View + Add)
   ============================================================ */

function toggleDonationFields() {
  const type = document.getElementById('dType').value;
  const amountWrap = document.getElementById('dAmountWrap');
  const itemsWrap = document.getElementById('dItemsWrap');
  if (type === 'money') {
    amountWrap.style.display = '';
    itemsWrap.style.display = 'none';
  } else if (type) {
    amountWrap.style.display = 'none';
    itemsWrap.style.display = '';
  } else {
    amountWrap.style.display = '';
    itemsWrap.style.display = '';
  }
}
document.getElementById('dType')?.addEventListener('change', toggleDonationFields);
document.addEventListener('DOMContentLoaded', toggleDonationFields);

/* Add-donation form submit */
document.getElementById('addDonationForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  const type = document.getElementById('dType').value;
  const isAnonymous = document.getElementById('dAnonymous').checked;

  if (!type) { toastError('Please select a donation type.'); return; }

  const donorName = isAnonymous
    ? 'Anonymous'
    : (document.getElementById('dDonorName').value.trim() || 'Anonymous');

  const fd = new FormData();
  fd.append('donor_name', donorName);
  fd.append('donor_email', document.getElementById('dDonorEmail').value.trim());
  fd.append('city', document.getElementById('dCity').value.trim());
  fd.append('donation_type', type);
  fd.append('amount', type === 'money' ? document.getElementById('dAmount').value : '');
  fd.append('quantity_description', type !== 'money' ? document.getElementById('dItems').value.trim() : '');
  fd.append('message', document.getElementById('dMessage').value.trim());
  fd.append('status', document.getElementById('dStatus').value);
  fd.append('anonymous', isAnonymous ? 'true' : 'false');
  const proof = document.getElementById('dProof').files[0];
  if (proof) fd.append('proof', proof);

  if (type === 'money' && (!fd.get('amount') || parseFloat(fd.get('amount')) <= 0)) {
    toastError('Please enter a valid amount.');
    return;
  }
  if (type !== 'money' && !fd.get('quantity_description')) {
    toastError('Please describe the items donated.');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    await api.postForm(`/api/donations?status=${encodeURIComponent(fd.get('status'))}&admin=true`, fd);

    toastSuccess('Donation added successfully.');
    e.target.reset();
    toggleDonationFields();
    loadDonations();
    loadOverview();
  } catch (err) {
    toastError(err.message || 'Could not add donation.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

/* Load and render all donations — WITH image column */
async function loadDonations() {
  try {
    const { donations } = await api.get('/api/donations');
    const tbody = document.querySelector('#donationsTable tbody');

    if (!donations.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray-400);padding:32px;">No donations yet.</td></tr>';
      return;
    }

    tbody.innerHTML = donations.map(d => {
      const donorCell = d.anonymous
        ? '<em style="color:var(--gray-400);">Anonymous</em>'
        : `<strong>${d.donor_name || 'Anonymous'}</strong>${d.donor_email ? `<br><small style="color:var(--gray-400);">${d.donor_email}</small>` : ''}`;

      const itemCell = d.amount
        ? 'R' + parseFloat(d.amount).toFixed(2)
        : (d.quantity_description || '—');

      const proofCell = d.proof_path
        ? `<a href="/api/donations/${d.id}/proof" target="_blank" class="btn btn-outline btn-sm">View</a>`
        : '—';

      const imageCell = d.item_image_path
        ? `<a href="${encodeURI(d.item_image_path)}" target="_blank" class="btn btn-outline btn-sm">View</a>`
        : '—';

      return `
        <tr>
          <td>${donorCell}</td>
          <td style="text-transform:capitalize;">${d.donation_type}</td>
          <td>${itemCell}</td>
          <td><span class="badge badge-${d.status === 'verified' || d.status === 'completed' ? 'green' : d.status === 'rejected' ? 'red' : 'gray'}">${d.status.replace(/_/g,' ')}</span></td>
          <td>${proofCell}</td>
          <td>${imageCell}</td>
          <td>
            <select class="form-control donation-status" data-id="${d.id}" style="padding:6px 10px;font-size:0.8rem;">
              <option value="pending_verification" ${d.status === 'pending_verification' ? 'selected' : ''}>Pending</option>
              <option value="verified" ${d.status === 'verified' ? 'selected' : ''}>Verified</option>
              <option value="rejected" ${d.status === 'rejected' ? 'selected' : ''}>Rejected</option>
              <option value="received" ${d.status === 'received' ? 'selected' : ''}>Received</option>
              <option value="collection_arranged" ${d.status === 'collection_arranged' ? 'selected' : ''}>Collection</option>
              <option value="completed" ${d.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
            <button class="btn btn-danger btn-sm delete-donation" data-id="${d.id}" style="margin-top:6px;">Delete</button>
          </td>
        </tr>`;
    }).join('');

    document.querySelectorAll('.donation-status').forEach(sel => sel.onchange = async () => {
      try {
        await api.put(`/api/donations/${sel.dataset.id}/status`, { status: sel.value });
        toastSuccess('Donation status updated.');
      } catch (err) { toastError('Update failed: ' + err.message); }
    });

    document.querySelectorAll('.delete-donation').forEach(btn => btn.onclick = async () => {
      const confirmed = await confirmModal('Delete this donation record?', {
        title: 'Delete donation', danger: true, okLabel: 'Delete'
      });
      if (!confirmed) return;
      try {
        await api.del(`/api/donations/${btn.dataset.id}`);
        toastSuccess('Donation deleted.');
        loadDonations();
        loadOverview();
      } catch (err) { toastError('Delete failed: ' + err.message); }
    });
  } catch (err) { console.warn('[admin.js] donations load failed:', err); }
}

/* ============================================================
   GALLERY
   ============================================================ */
document.getElementById('galleryForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData();
  fd.append('title', document.getElementById('gTitle').value);
  fd.append('caption', document.getElementById('gCaption').value);
  fd.append('image', document.getElementById('gImage').files[0]);
  try {
    await api.postForm('/api/gallery', fd);
    e.target.reset();
    toastSuccess('Image uploaded.');
    loadGallery();
  } catch (err) { toastError('Upload failed: ' + err.message); }
});

async function loadGallery() {
  try {
    const { images } = await api.get('/api/gallery');
    const mount = document.getElementById('galleryAdminGrid');
    mount.innerHTML = images.map(img => `
      <div class="gallery-item" style="position:relative;">
        <img src="${img.image_path}" alt="${img.alt_text || ''}">
        <button class="btn btn-danger btn-sm delete-gallery" data-id="${img.id}"
                style="position:absolute;top:8px;right:8px;padding:4px 10px;font-size:0.75rem;">×</button>
      </div>`).join('');

    document.querySelectorAll('.delete-gallery').forEach(b => b.onclick = async () => {
      const confirmed = await confirmModal('Delete this image?', {
        title: 'Delete image', danger: true, okLabel: 'Delete'
      });
      if (!confirmed) return;
      try {
        await api.del(`/api/gallery/${b.dataset.id}`);
        toastSuccess('Image deleted.');
        loadGallery();
      } catch (err) { toastError('Delete failed: ' + err.message); }
    });
  } catch (err) { console.warn('[admin.js] gallery load failed:', err); }
}

/* ============================================================
   TESTIMONIALS
   ============================================================ */
async function loadTestimonials() {
  try {
    const { testimonials } = await api.get('/api/testimonials/all');
    const mount = document.getElementById('testimonialsAdminList');
    mount.innerHTML = testimonials.map(t => `
      <div style="border:1px solid var(--gray-200);border-radius:var(--radius);padding:16px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
          <div>
            <strong>${t.author_name}</strong>
            ${t.event_label ? `<span style="color:var(--gray-400);"> · ${t.event_label}</span>` : ''}
          </div>
          <span class="badge badge-${t.status === 'published' ? 'green' : t.status === 'draft' ? 'orange' : t.status === 'approved' ? 'blue' : 'red'}">${t.status}</span>
        </div>
        <p style="margin:10px 0;font-size:0.9rem;color:var(--gray-700);">${t.content}</p>
        <button class="btn btn-outline btn-sm edit-tst" data-id="${t.id}">Edit</button>
        <button class="btn btn-danger btn-sm delete-tst" data-id="${t.id}">Delete</button>
      </div>`).join('');

    document.querySelectorAll('.edit-tst').forEach(b => b.onclick = () => {
      const t = testimonials.find(x => String(x.id) === String(b.dataset.id));
      document.getElementById('tstId').value = t.id;
      document.getElementById('tstAuthor').value = t.author_name;
      document.getElementById('tstEvent').value = t.event_label || '';
      document.getElementById('tstContent').value = t.content;
      document.getElementById('tstStatus').value = t.status;
      document.getElementById('tstOrder').value = t.display_order;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.querySelectorAll('.delete-tst').forEach(b => b.onclick = async () => {
      const confirmed = await confirmModal('Delete this testimonial?', {
        title: 'Delete testimonial', danger: true, okLabel: 'Delete'
      });
      if (!confirmed) return;
      try {
        await api.del(`/api/testimonials/${b.dataset.id}`);
        toastSuccess('Testimonial deleted.');
        loadTestimonials();
      } catch (err) { toastError('Delete failed: ' + err.message); }
    });
  } catch (err) { console.warn('[admin.js] testimonials load failed:', err); }
}

document.getElementById('testimonialForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    author_name: document.getElementById('tstAuthor').value,
    event_label: document.getElementById('tstEvent').value,
    content: document.getElementById('tstContent').value,
    status: document.getElementById('tstStatus').value,
    display_order: parseInt(document.getElementById('tstOrder').value) || 0
  };
  const id = document.getElementById('tstId').value;
  try {
    if (id) await api.put(`/api/testimonials/${id}`, body);
    else await api.post('/api/testimonials', body);
    document.getElementById('testimonialForm').reset();
    document.getElementById('tstId').value = '';
    toastSuccess(id ? 'Testimonial updated.' : 'Testimonial added.');
    loadTestimonials();
  } catch (err) { toastError('Save failed: ' + err.message); }
});

document.getElementById('resetTestimonial')?.addEventListener('click', () => {
  document.getElementById('testimonialForm').reset();
  document.getElementById('tstId').value = '';
});

/* ============================================================
   ENQUIRIES
   ============================================================ */
async function loadEnquiries() {
  try {
    const { enquiries } = await api.get('/api/contact');
    const tbody = document.querySelector('#enquiriesTable tbody');
    tbody.innerHTML = enquiries.map(en => `
      <tr>
        <td>${en.name}</td>
        <td>${en.email}</td>
        <td>${en.subject || '—'}</td>
        <td style="max-width:340px;font-size:0.85rem;">${en.message}</td>
        <td><span class="badge badge-gray">${en.status.replace(/_/g,' ')}</span></td>
        <td>
          <select class="form-control enquiry-status" data-id="${en.id}" style="padding:6px 10px;font-size:0.8rem;">
            <option value="pending" ${en.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="in_progress" ${en.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
            <option value="resolved" ${en.status === 'resolved' ? 'selected' : ''}>Resolved</option>
          </select>
        </td>
      </tr>`).join('');

    document.querySelectorAll('.enquiry-status').forEach(sel => sel.onchange = async () => {
      try {
        await api.put(`/api/contact/${sel.dataset.id}/status`, { status: sel.value });
        toastSuccess('Enquiry status updated.');
      } catch (err) { toastError('Update failed: ' + err.message); }
    });
  } catch (err) { console.warn('[admin.js] enquiries load failed:', err); }
}