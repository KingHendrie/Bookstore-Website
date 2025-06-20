async function loadReviews(bookId) {
	const reviewsSection = document.getElementById('book-reviews');
	const reviewsList = document.getElementById('reviews-list');
	const summaryDiv = document.getElementById('reviews-summary');
	reviewsList.innerHTML = '';
	summaryDiv.innerHTML = '';
	reviewsSection.classList.add('d-none');

	try {
		const res = await fetch(`/api/public/books/${bookId}/reviews`);
		const { reviews, avgRating, count } = await res.json();

		summaryDiv.innerHTML = `
			<h4>Reviews (${count || 0})</h4>
			${count ? `<div class="mb-2">Average Rating: <strong>${avgRating.toFixed(2)} / 5</strong> ${renderStars(avgRating)}</div>` : ''}
			${!count ? '<div class="mb-2">No reviews yet.</div>' : ''}
		`;

		const latestReviews = (reviews && reviews.length) ? reviews.slice(0, 5) : [];

		if (latestReviews.length) {
			reviewsList.innerHTML = latestReviews.map(r => `
				<div class="card mb-3">
				  <div class="card-body">
					<div class="review-header d-flex justify-content-between align-items-center mb-1">
						<strong>${r.firstName || "Anonymous"}</strong>
						<span>${renderStars(r.rating)} <span style="font-size:0.95em;opacity:0.7;">(${r.rating}/5)</span></span>
					</div>
					<div class="review-date" style="font-size:0.92em;color:#777;">${new Date(r.datePosted).toLocaleDateString()}</div>
					<div class="review-comment mt-1">${r.comment ? escapeHTML(r.comment) : ''}</div>
				  </div>
				</div>
			`).join('');
		}

		reviewsSection.classList.remove('d-none');
	} catch (err) {
		reviewsSection.classList.remove('d-none');
		summaryDiv.innerHTML = '<div class="alert alert-danger">Could not load reviews.</div>';
	}
}

function renderStars(rating) {
	const rounded = Math.round(rating);
	return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
}

function escapeHTML(str) {
	return String(str)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function openLeaveReviewModal(bookId) {
	Modal.setupFormModal({
		modalId: 'leaveReviewModal',
		title: 'Leave a Review',
		submitText: 'Submit Review',
		fields: { bookId, rating: '', comment: '' },
		errorDivId: 'leave-review-error',
		resetForm: true
	});
	Modal.open('leaveReviewModal');
}

Modal.bind('leaveReviewModal', { closeOnBackdrop: true, closeOnEscape: true });
document.getElementById('cancelLeaveReview').onclick = () => Modal.close('leaveReviewModal');
document.getElementById('closeLeaveReviewModal').onclick = () => Modal.close('leaveReviewModal');

Modal.bindFormSubmit('leaveReviewForm', (form) => {
	return {
		url: `/api/user/books/${form.bookId.value}/reviews`,
		method: 'POST',
		data: {
			rating: Number(form.rating.value),
			comment: form.comment.value.trim()
		}
	};
}, () => {
	Modal.close('leaveReviewModal');
	Modal.toast("Review submitted!", "success");
	const params = new URLSearchParams(window.location.search);
	const bookId = params.get('id');
	loadReviews(bookId, window.currentUser);
}, 'leave-review-error');

function openLoginModal(onSuccess) {
	Modal.setupFormModal({
		modalId: 'loginModal',
		title: 'Login',
		submitText: 'Login',
		fields: { email: '', password: '' },
		errorDivId: 'login-error',
		resetForm: true
	});
	Modal.open('loginModal');

	document.getElementById('closeLoginModal').onclick = () => Modal.close('loginModal');
	document.getElementById('cancelLogin').onclick = () => Modal.close('loginModal');

	Modal.bindFormSubmit('loginForm', (form) => {
		return {
			url: '/api/user/login',
			method: 'POST',
			data: {
				email: form.email.value.trim(),
				password: form.password.value
			}
		};
	}, (response) => {
		Modal.close('loginModal');
		Modal.toast("Login successful!", "success");
		if (typeof onSuccess === "function") {
		onSuccess();
		}
	}, 'login-error');
}

document.addEventListener('DOMContentLoaded', async () => {
	const params = new URLSearchParams(window.location.search);
	const bookId = params.get('id');
	if (!bookId) window.location.href = '/browse';

	const user = window.currentUser || null;
	
	const loading = document.getElementById('book-details-loading');
	const errorDiv = document.getElementById('book-details-error');
	const detailsSection = document.getElementById('book-details');

	function showError(msg) {
		if (loading) loading.style.display = 'none';
		if (detailsSection) detailsSection.classList.add('d-none');
		if (errorDiv) {
			errorDiv.textContent = msg || "Could not load book details.";
			errorDiv.classList.remove('d-none');
		}
	}

	if (!bookId) {
		showError("No book specified.");
		return;
	}

	try {
		const res = await fetch(`/api/public/books/${bookId}`);
		if (!res.ok) {
			if (res.status === 404) window.location.href = '/404';
			else showError();
			return;
		}
		const book = await res.json();

		if (loading) loading.style.display = 'none';
		if (errorDiv) errorDiv.classList.add('d-none');
		detailsSection.classList.remove('d-none');
		detailsSection.innerHTML = `
			<div class="book-details-card d-flex position-relative" style="gap:2rem;">
				<div class="book-image-wrap" style="flex:0 0 220px;">
						<img src="${book.imageUrl ? book.imageUrl : '/wwwroot/img/book-placeholder.png'}"
							alt="${book.title}" class="book-details-image"
							style="max-width:200px; max-height:300px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.03);"/>
				</div>
				<div class="book-info" style="flex:1;">
						<h2 class="book-title" style="font-size:2rem;margin-bottom:0.6em;">${book.title}</h2>
						<p class="book-author"><strong>Author:</strong> ${book.author}</p>
						<p class="book-genre"><strong>Genre:</strong> ${book.genre}</p>
						<p class="book-isbn"><strong>ISBN:</strong> ${book.isbn}</p>
						<p class="book-publisher"><strong>Publisher:</strong> ${book.publisher}</p>
						<p class="book-description" style="margin:1em 0;">${book.description || ''}</p>
						<p class="book-price"><strong>Price:</strong> R${Number(book.price).toFixed(2)}</p>
						${
							book.stockQuantity === 0
							? `<span class="badge badge-out-stock" style="background:#e55;color:#fff;padding:0.4em 1em;border-radius:18px;font-weight:bold;font-size:1rem;display:inline-block;margin-top:1em;">Out of Stock</span>`
							: ''
						}
				</div>
				<button class="btn btn-primary"
						id="leaveReviewBtn"
						style="bottom:20px;right:20px;z-index:2;">
						Leave Review
				</button>
			</div>
		`;

		const leaveReviewBtn = document.getElementById('leaveReviewBtn');
		if (leaveReviewBtn) {
			leaveReviewBtn.onclick = async () => {
				// Check login status
				const resp = await fetch('/api/user/status');
				const data = await resp.json();
				if (data.loggedIn) {
					openLeaveReviewModal(bookId);
				} else {
					openLoginModal(() => {
						openLeaveReviewModal(bookId);
					});
				}
			};
		}
		loadReviews(bookId, user);

	} catch (err) {
		showError();
	}
});