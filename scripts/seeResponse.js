(async () => {
  const res = await fetch('http://localhost:3000/api/ai/form-ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      formName: 'register',
      question: 'test',
      fieldContext: '',
      valueContext: ''
    })
  });
  console.log('Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));
  const text = await res.text();
  console.log('\nFirst 300 characters of the response:\n');
  console.log(text.slice(0, 300));
  process.exit(0);
})();