const base = 'http://localhost:3000';

(async () => {
  const payload = {
    email: 'admin@bltfoundation.org',
    password: 'LittleThings!BigImpact2019'
  };

  console.log('Testing admin login...');

  try {
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('\nStatus:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (res.ok && data.success) {
      console.log('\n✓ Login works.');
      console.log('Role:', data.user.role);
      console.log('Redirect should go to:',
        data.user.role === 'admin' ? '/dashboards/admin.html' : '/dashboards/volunteer.html');

      const setCookie = res.headers.get('set-cookie');
      if (setCookie) console.log('\nCookie set:', setCookie.split(';')[0] + '...');
    }
  } catch (err) {
    console.error('\n✗ Failed:', err.message);
  }
})();