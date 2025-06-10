async function loginUser() {
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
	if (result.success) {
		showToast('Login successful!', 'success');
		window.location.href = '/profile';
	} else {
		showToast(result.error, 'error');
	}
}

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