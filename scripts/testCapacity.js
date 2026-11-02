/* ============================================================
   CAPACITY TEST
   - Logs in as admin
   - Creates a test event with capacity 2
   - Logs in as 5 test volunteers (creates them if needed)
   - Fires all 5 registrations concurrently
   - Asserts exactly 2 succeed
   ============================================================ */
const BASE = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@bltfoundation.org';
const ADMIN_PASSWORD = 'LittleThings!BigImpact2019'; // change if yours is different

function makeCookieJar() {
  const jar = {};
  return {
    setFromResponse(res) {
      const sc = res.headers.get('set-cookie');
      if (sc) jar.token = sc.split(';')[0];
    },
    header() { return jar.token ? { Cookie: jar.token } : {}; }
  };
}

async function login(email, password, jar) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  jar?.setFromResponse(res);
  return res.ok;
}

async function createTestEvent(jar) {
  const fd = new FormData();
  fd.append('title', `TEST Capacity ${Date.now()}`);
  fd.append('status', 'active');
  fd.append('capacity', '2');
  fd.append('registration_open', 'true');
  const res = await fetch(`${BASE}/api/events`, {
    method: 'POST',
    headers: jar.header(),
    body: fd
  });
  const data = await res.json();
  return data.id;
}

async function registerAsVolunteer(eventId, jar) {
  const res = await fetch(`${BASE}/api/events/${eventId}/register`, {
    method: 'POST',
    headers: jar.header()
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, body: data };
}

async function ensureVolunteer(i, password) {
  const email = `captest${i}@blt-test.local`;
  // Try to register; if it fails because email exists, that's fine
  await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email, password,
      full_name: `Cap Test ${i}`,
      city: 'Pretoria'
    })
  }).catch(() => {});
  return email;
}

(async () => {
  console.log('--- Capacity concurrency test ---');

  // 1. Admin login
  const adminJar = makeCookieJar();
  const ok = await login(ADMIN_EMAIL, ADMIN_PASSWORD, adminJar);
  if (!ok) { console.log('X Admin login failed. Check credentials at the top of this script.'); process.exit(1); }
  console.log('OK Admin logged in');

  // 2. Create test event
  const eventId = await createTestEvent(adminJar);
  console.log(`OK Test event created (id ${eventId}, capacity 2)`);

  // 3. Prepare 5 volunteers
  const password = 'captest1234';
  const emails = await Promise.all([1,2,3,4,5].map(i => ensureVolunteer(i, password)));
  const jars = emails.map(() => makeCookieJar());
  await Promise.all(emails.map((e, i) => login(e, password, jars[i])));
  console.log('OK 5 volunteer sessions ready');

  // 4. Fire 5 registrations concurrently
  const results = await Promise.all(
    jars.map(jar => registerAsVolunteer(eventId, jar))
  );

  const succeeded = results.filter(r => r.status === 200 && r.body.success).length;
  const rejected = results.filter(r => r.status === 409).length;
  const others = results.length - succeeded - rejected;

  // Repeating a successful request must not consume an extra place or fail
  // just because the event is now full.
  const firstSuccess = results.findIndex(r => r.status === 200 && r.body.success);
  const duplicate = firstSuccess < 0 ? null : await registerAsVolunteer(eventId, jars[firstSuccess]);
  const registrationsRes = await fetch(`${BASE}/api/events/${eventId}/registrations`, { headers: adminJar.header() });
  const registrationsData = await registrationsRes.json().catch(() => ({}));

  console.log(`\nResults: ${succeeded} succeeded, ${rejected} rejected as full, ${others} other`);
  results.forEach((r, i) => console.log(`  Volunteer ${i+1}: HTTP ${r.status} — ${r.body.message || '(no message)'}`));
  console.log(`Duplicate registration: HTTP ${duplicate?.status ?? 'not run'} — ${duplicate?.body.message || '(no message)'}`);
  console.log(`Admin registration list: HTTP ${registrationsRes.status}, ${registrationsData.registrations?.length ?? 'unknown'} rows`);

  if (succeeded === 2 && rejected === 3 && duplicate?.status === 200 && registrationsRes.ok && registrationsData.registrations?.length === 2) {
    console.log('\nOK PASS — capacity, duplicate handling, and admin registration list passed.');
  } else {
    console.log('\nX FAIL — expected exactly 2 successes and 3 rejections.');
  }

  process.exit(0);
})();
