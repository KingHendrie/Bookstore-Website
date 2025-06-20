async function loadReviews() {
	const params = new URLSearchParams(window.location.search);
	const bookId = params.get('id');
	if (!bookId) return;

	const reviewsLoading = document.getElementById('reviews-loading');
	const reviewsError = document.getElementById('reviews-error');
	const tbody = document.getElementById('reviews-table-body');
	const bookInfo = document.getElementById('book-info');

	reviewsLoading.classList.remove('d-none');
	reviewsError.classList.add('d-none');
	tbody.innerHTML = '';
	bookInfo.innerHTML = '';

	try {
		const bookRes = await fetch(`/api/public/books/${bookId}`);
		let book = null;
		if (bookRes.ok) {
			book = await bookRes.json();
			bookInfo.innerHTML = `<h4>${book.title} <small>by ${book.author}</small></h4>`;
		}
	
		const res = await fetch(`/api/admin/reviews?bookId=${bookId}`);
		if (!res.ok) throw new Error('Network error');
		const data = await res.json();
 
	  	if (data.reviews.length === 0) {
		 	tbody.innerHTML = '<tr><td colspan="5" class="text-center">No reviews found.</td></tr>';
	  	} else {
			data.reviews.forEach(review => {
				const row = document.createElement('tr');
				row.innerHTML = `
					<td>${review.userName || review.userId}</td>
					<td>${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</td>
					<td>${review.comment}</td>
					<td>${new Date(review.datePosted).toLocaleString()}</td>
					<td><button class="btn btn-danger btn-sm" onclick="deleteReview(${review.id}, ${bookId})">Delete</button></td>
				`;
				tbody.appendChild(row);
		 	});
	  }
		reviewsLoading.classList.add('d-none');
	} catch (err) {
		reviewsLoading.classList.add('d-none');
		reviewsError.classList.remove('d-none');
	}
}

async function deleteReview(reviewId, bookId) {
	if (!confirm('Delete this review?')) return;
	const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' });
	if (res.ok) {
		loadReviews();
	} else {
		alert('Failed to delete review');
	}
}
 
document.addEventListener('DOMContentLoaded', loadReviews);