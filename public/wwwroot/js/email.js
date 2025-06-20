async function sendEmailFromFrontend() {
	const email = document.getElementById('email').value;
	const subject = document.getElementById('subject').value;
	const message = document.getElementById('message').value;
	const emailBody = `
		<html>
			<body>
				<h2>New submit from: ${email}</h2>
				<p><strong>Subject:</strong> ${subject}</p>
				<p><strong>Message:</strong></p>
				<p>${message}</p>
			</body>
		</html>
	`;

	const response = await fetch('/api/email/send-contact', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			to: email,
			subject: subject,
			html: emailBody,
		})
	});

	const result = await response.json();
	if (result.success) {
		showToast('Email sent!', 'success');
	} else {
		showToast(result.error, 'error');
	}
}