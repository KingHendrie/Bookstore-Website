document.addEventListener('DOMContentLoaded', async () => {
	const params = new URLSearchParams(window.location.search);
	const bookId = params.get('id');
	if (!bookId) return;
	
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
		const res = await fetch(`/api/books/browse/${bookId}`);
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
			<div class="book-details-card d-flex" style="gap:2rem;">
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
			</div>
		`;
	} catch (err) {
		showError();
	}
});