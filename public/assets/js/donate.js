/* ============================================================
   DONATION PAGE — form logic
   ============================================================ */
console.log('[donate.js] loaded');

const typeGrid = document.getElementById('typeGrid');
const moneySection = document.getElementById('moneySection');
const itemSection = document.getElementById('itemSection');
const proofSection = document.getElementById('proofSection');
const donationTypeInput = document.getElementById('donation_type');
const donateAlert = document.getElementById('donateAlert');

/* Show/hide sections depending on selected donation type */
typeGrid?.addEventListener('click', e => {
  const btn = e.target.closest('.amount-btn');
  if (!btn || !btn.dataset.type) return;
  const type = btn.dataset.type;
  donationTypeInput.value = type;

  // Mark the type button selected
  typeGrid.querySelectorAll('.amount-btn').forEach(b => {
    b.classList.toggle('selected', b === btn);
  });

  if (type === 'money') {
    moneySection.classList.remove('hidden');
    itemSection.classList.add('hidden');
    proofSection.classList.remove('hidden');   // ✓ only for money
  } else {
    moneySection.classList.add('hidden');
    itemSection.classList.remove('hidden');
    proofSection.classList.add('hidden');      // ✓ hidden for food/clothing/sanitary
  }
});

/* Preset amount buttons */
document.querySelectorAll('.preset').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('amount').value = btn.dataset.amount;
    document.querySelectorAll('.preset').forEach(b => b.classList.toggle('selected', b === btn));
  });
});

/* Copy banking details */
document.getElementById('copyBank')?.addEventListener('click', () => {
  navigator.clipboard.writeText(
    'Account name: BLT Foundation\nBank: ABSA Bank\nAccount number: 9366270023\nBranch code: 632005'
  ).then(() => {
    const btn = document.getElementById('copyBank');
    const orig = btn.textContent;
    btn.textContent = '✓ Copied';
    setTimeout(() => btn.textContent = orig, 2000);
  });
});

/* Submit the form */
document.getElementById('donateForm')?.addEventListener('submit', async e => {
  e.preventDefault();

  if (!donationTypeInput.value) {
    alert('Please select a donation type first.');
    return;
  }

  const fd = new FormData(e.target);
  fd.set('donation_type', donationTypeInput.value);

  // Optional: client-side validation for money amount
  if (donationTypeInput.value === 'money') {
    const amount = parseFloat(fd.get('amount'));
    if (!amount || amount < 5) {
      alert('Please enter a valid amount (minimum R5).');
      return;
    }
  }

  try {
    const res = await api.postForm('/api/donations', fd);

    donateAlert.className = 'alert alert-success';
    donateAlert.textContent = res.message || 'Thank you for your donation!';
    donateAlert.classList.remove('hidden');

    // Reset the form
    e.target.reset();
    typeGrid.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
    moneySection.classList.add('hidden');
    itemSection.classList.add('hidden');
    proofSection.classList.add('hidden');
    donationTypeInput.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    donateAlert.className = 'alert alert-error';
    donateAlert.textContent = err.message || 'Could not submit donation.';
    donateAlert.classList.remove('hidden');
  }
});