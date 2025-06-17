function showLoading(show = true) {
	const overlay = document.getElementById('loadingOverlay');
	if (overlay) overlay.classList.toggle('d-none', !show);
}

function show2FAModal(email) {
	showLoading(true);
	document.getElementById('twoFACode').value = "";
	document.getElementById('twoFA-error').style.display = 'none';
	document.getElementById('twoFAModal').classList.remove('d-none');
	document.body.style.overflow = 'hidden';
	document.getElementById('twoFACode').focus();
	showLoading(false);
}

function hide2FAModal() {
	document.getElementById('twoFAModal').classList.add('d-none');
	document.body.style.overflow = '';
}

document.getElementById('close2FAModal').onclick =
document.getElementById('cancel2FA').onclick = hide2FAModal;
document.querySelector('#twoFAModal .modal-backdrop').onclick = hide2FAModal;
document.addEventListener('keydown', function(e) {
	if (!document.getElementById('twoFAModal').classList.contains('d-none') && e.key === 'Escape') hide2FAModal();
});

async function loginUser() {
	showLoading(true);
	const email = document.getElementById('email').value;
	const password = document.getElementById('password').value;
 
	const response = await fetch('/api/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			email: email, 
			password: password,
		})
	});
 
	const result = await response.json();
	showLoading(false);
 
	if (result.success) {
		showToast('Login successful!', 'success');
		window.location.href = '/profile';
	} else if (result.twoFA) {
		showToast('Two-factor authentication required. Check your email.', 'info');
		show2FAModal(email);
	} else {
		showToast(result.error, 'error');
	}
}

document.getElementById('twoFAForm').addEventListener('submit', async function(e) {
	e.preventDefault();
	showLoading(true);
	const code = document.getElementById('twoFACode').value;
	const errorDiv = document.getElementById('twoFA-error');
	errorDiv.style.display = 'none';

	const response = await fetch('/api/verify-2fa', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ code })
	});
	const result = await response.json();
	showLoading(false);

	if (result.success) {
		showToast('2FA verified. Login complete.', 'success');
		hide2FAModal();
		window.location.href = '/profile';
	} else {
		errorDiv.textContent = result.error || '2FA verification failed.';
		errorDiv.style.display = '';
		showToast(result.error || '2FA verification failed.', 'error');
	}
});

async function singOut() {
	const response = await fetch('/api/logout', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' }
	});

	const result = await response.json();
	if (result.success) {
		showToast('Logged out successfully', 'success');
		window.location.href = '/login';
	} else {
		showToast(result.error, 'error');
	}
}