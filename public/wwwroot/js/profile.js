async function populateProfile() {
	try {
		const res = await fetch('/api/profile');
		if (!res.ok) throw new Error('Could not fetch user info');
		const user = await res.json();
		document.getElementById('profileFirstName').value = user.firstName || '';
		document.getElementById('profileLastName').value = user.lastName || '';
		document.getElementById('profileEmail').value = user.email || '';
		render2FAStatus(user.twoFAEnabled);
	} catch (err) {
		document.getElementById('2fa-status').textContent = 'Unable to load profile.';
	}
}
 
function render2FAStatus(twoFAEnabled) {
	const statusDiv = document.getElementById('2fa-status');
	statusDiv.innerHTML = '';
	if (twoFAEnabled) {
		statusDiv.innerHTML = `
			<p>2FA is <strong>enabled</strong> on your account.</p>
			<button type="button" class="btn" id="disable2FA">Disable 2FA</button>
		`;
	} else {
		statusDiv.innerHTML = `
			<p>2FA is currently <strong>disabled</strong> on your account.</p>
			<button type="button" class="btn" id="enable2FA">Enable 2FA</button>
		`;
	}

	document.getElementById('enable2FA')?.addEventListener('click', enable2FA);
	document.getElementById('disable2FA')?.addEventListener('click', disable2FA);
}

document.getElementById('profileInfoForm').addEventListener('submit', async function(e) {
	e.preventDefault();
	const msg = document.getElementById('profile-info-message');
	msg.style.display = 'none';

	const data = {
		firstName: this.firstName.value.trim(),
		lastName: this.lastName.value.trim()
	};

	try {
		const res = await fetch('/api/profile', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		const json = await res.json();
		msg.textContent = json.success ? 'Profile updated!' : (json.error || 'Could not update profile.');
		msg.className = 'alert mt-3' + (json.success ? ' alert-success' : ' alert-danger');
		msg.style.display = '';
	} catch (err) {
		msg.textContent = 'Could not update profile.';
		msg.className = 'alert mt-3 alert-danger';
		msg.style.display = '';
	}
});

document.getElementById('profilePasswordForm').addEventListener('submit', async function(e) {
	e.preventDefault();
	const msg = document.getElementById('profile-password-message');
	msg.style.display = 'none';

	if (this.newPassword.value !== this.confirmNewPassword.value) {
		msg.textContent = 'New passwords do not match.';
		msg.className = 'alert mt-3 alert-danger';
		msg.style.display = '';
		return;
	}

	const data = {
		currentPassword: this.currentPassword.value,
		newPassword: this.newPassword.value
	};

	try {
		const res = await fetch('/api/profile/password', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		const json = await res.json();
		msg.textContent = json.success ? 'Password updated!' : (json.error || 'Could not change password.');
		msg.className = 'alert mt-3' + (json.success ? ' alert-success' : ' alert-danger');
		msg.style.display = '';
		if (json.success) this.reset();
	} catch (err) {
		msg.textContent = 'Could not change password.';
		msg.className = 'alert mt-3 alert-danger';
		msg.style.display = '';
	}
});

async function enable2FA() {
	const msg = document.getElementById('profile-2fa-message');
	msg.style.display = 'none';
	try {
		const res = await fetch('/api/profile/2fa', { method: 'POST' });
		const json = await res.json();
		msg.textContent = json.success ? '2FA enabled! (Further setup may be required)' : (json.error || 'Could not enable 2FA.');
		msg.className = 'alert mt-3' + (json.success ? ' alert-success' : ' alert-danger');
		msg.style.display = '';
		if (json.success) render2FAStatus(true);
	} catch (err) {
		msg.textContent = 'Could not enable 2FA.';
		msg.className = 'alert mt-3 alert-danger';
		msg.style.display = '';
	}
}
 
async function disable2FA() {
	const msg = document.getElementById('profile-2fa-message');
	msg.style.display = 'none';
	try {
		const res = await fetch('/api/profile/2fa', { method: 'DELETE' });
		const json = await res.json();
		msg.textContent = json.success ? '2FA disabled.' : (json.error || 'Could not disable 2FA.');
		msg.className = 'alert mt-3' + (json.success ? ' alert-success' : ' alert-danger');
		msg.style.display = '';
		if (json.success) render2FAStatus(false);
	} catch (err) {
		msg.textContent = 'Could not disable 2FA.';
		msg.className = 'alert mt-3 alert-danger';
		msg.style.display = '';
	}
}

async function signOut() {
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
 
document.addEventListener('DOMContentLoaded', populateProfile);