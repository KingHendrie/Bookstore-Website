async function registerUser() {
	const firstName = document.getElementById('firstName').value;
	const lastName = document.getElementById('lastName').value;
	const email = document.getElementById('email').value;
	const password = document.getElementById('password').value;
	const confirmPassword = document.getElementById('confirmPassword').value;

	if (password != confirmPassword) {
		alert('Passwords do not match!');
		return;
	}

	const response = await fetch('/api/register', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			firstName: firstName,
			lastName: lastName,
			email: email,
			password: password
		})
	});

	const result = await response.json();
	if (result.success) {
		alert('Register successful! Redirecting...');
		window.location.href = '/login';
	} else {
		alert(result.error);
	}
}