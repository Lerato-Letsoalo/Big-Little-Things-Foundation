// Quick test of POST /api/auth/register
const base = 'http://localhost:3000';

(async () => {
  const payload = {
    full_name: 'Test User',
    email: `test${Date.now()}@blt.com`,   // unique each run
    password: 'testpass123',
    phone: '0712345678',
    city: 'Pretoria'
  };

  console.log('Sending registration request...');
  console.log('Payload:', payload);

  try {
    const res = await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('\nStatus:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (res.ok && data.success) {
      console.log('\n✓ Registration works. Backend is fine.');
    } else {
      console.log('\n✗ Backend returned an error. Check above.');
    }
  } catch (err) {
    console.error('\n✗ Request failed:', err.message);
    console.error('Is the server running? Try: npm start');
  }
})();