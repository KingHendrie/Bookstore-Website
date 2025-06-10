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
		alert('Login successful! Redirecting...');
		window.location.href = '/profile';
	} else {
		alert(result.error);
	}
}

async function singOut() {
	const response = await fetch('/api/logout', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' }
	});

	const result = await response.json();
	if (result.success) {
		alert('Logout successful! Redirecting...');
		window.location.href = '/login';
	} else {
		alert(result.error);
	}
}