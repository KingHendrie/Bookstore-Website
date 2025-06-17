async function populateProfile() {
	try {
		const res = await fetch('/api/profile');
		if (!res.ok) throw new Error('Could not fetch user info');
		const user = await res.json();
		document.getElementById('profileFirstName').value = user.firstName || '';
		document.getElementById('profileLastName').value = user.lastName || '';
		document.getElementById('profileEmail').value = user.email || '';
		render2FAStatus(user.two_factor_enabled);
	} catch (error) {
		showToast('Unable to load profile.', 'error');
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
		if(json.success) {
			showToast('Profile updated!', 'success');
		} else {
			showToast(json.error || 'Could not update profile.', 'error');
		}
	} catch (error) {
		showToast('Could not update profile.', 'error');
	}
});

document.getElementById('profilePasswordForm').addEventListener('submit', async function(e) {
	e.preventDefault();

	if (this.newPassword.value !== this.confirmNewPassword.value) {
		showToast('New passwords do not match.', 'error');
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
		if(json.success) {
			showToast('Password updated!', 'success');
			this.reset();
		} else {
			showToast(json.error || 'Could not change password.', 'error');
		}
	} catch (error) {
		showToast('Could not change password.', 'error');
	}
});

async function enable2FA() {
	try {
		const res = await fetch('/api/profile/2fa', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ enabled: true })
		});
		const json = await res.json();
		if(json.success) {
			showToast('2FA enabled! (Further setup may be required)', 'success');
			render2FAStatus(true);
		} else {
			showToast(json.error || 'Could not enable 2FA.', 'error');
		}
	} catch (error) {
		showToast('Could not enable 2FA.', 'error');
	}
}
 
async function disable2FA() {
	try {
		const res = await fetch('/api/profile/2fa', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ enabled: false })
		});
		const json = await res.json();
		if(json.success) {
			showToast('2FA disabled.', 'success');
			render2FAStatus(false);
		} else {
			showToast(json.error || 'Could not disable 2FA. ' + json.error, 'error');
		}
	} catch (error) {
		showToast('Could not disable 2FA. - ' + error.stack, 'error');
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