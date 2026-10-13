document.getElementById('contactForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const alertBox = document.getElementById('contactAlert');
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  try {
    const res = await api.post('/api/contact', {
      name: `${firstName} ${lastName}`.trim(),
      email: document.getElementById('email').value.trim(),
      subject: document.getElementById('subject').value.trim(),
      message: document.getElementById('message').value.trim()
    });
    alertBox.className = 'alert alert-success';
    alertBox.textContent = res.message;
    alertBox.classList.remove('hidden');
    e.target.reset();
    window.scrollTo({ top: 300, behavior: 'smooth' });
  } catch (err) {
    alertBox.className = 'alert alert-error';
    alertBox.textContent = err.message;
    alertBox.classList.remove('hidden');
  }
});