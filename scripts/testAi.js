// Quick test of the AI form-ask endpoint
const base = 'http://localhost:3000';

(async () => {
  console.log('Testing /api/ai/form-ask...');
  try {
    const res = await fetch(`${base}/api/ai/form-ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formName: 'register',
        question: 'Does my name need to be in capital letters?',
        fieldContext: '- name: Your full name (required) Example: Lerato Dlamini\n- email: Your email address (required) Example: lerato@example.com',
        valueContext: '- name = "LERATO DLAMINI"\n- email = (empty)'
      })
    });
    const data = await res.json();
    console.log('\nStatus:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    if (data.success && data.answer) {
      console.log('\n✓ AI is working.');
      console.log('\nAnswer from Gemini:\n' + data.answer);
    } else {
      console.log('\n✗ AI unavailable — Gemini call failed or key missing.');
      console.log('Check your server terminal for "[ai] Gemini error: ..."');
    }
  } catch (err) {
    console.error('\n✗ Fetch failed:', err.message);
  }
})();