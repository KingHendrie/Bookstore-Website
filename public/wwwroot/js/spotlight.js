async function loadSpotlightBooks() {
	const listDiv = document.getElementById('spotlight-books-list');
	const loadingDiv = document.getElementById('spotlight-loading');
	const errorDiv = document.getElementById('spotlight-error');
	listDiv.innerHTML = "";
	loadingDiv.style.display = '';
	errorDiv.classList.add('d-none');

	try {
		const booksRes = await fetch('/api/public/spotlight-books');
		const books = await booksRes.json();
		loadingDiv.style.display = 'none';

		if (!books.length) {
			listDiv.innerHTML = '<div class="text-center my-4">No spotlight books found.</div>';
			return;
		}

		listDiv.innerHTML = books.map(book => `
			<a class="book-tile-link" href="/books?id=${book.id}">
				<div class="book-tile-img-wrap">
						<img class="book-tile-img" src="${book.imageUrl || '/wwwroot/img/book-placeholder.png'}" alt="${book.title}">
				</div>
				<div class="book-tile-info">
						<div class="book-tile-title">${book.title}</div>
						<div class="book-tile-author">${book.author}</div>
						<div class="book-tile-genre">${book.genre || ""}</div>
						<div class="book-tile-desc">${book.description ? book.description.slice(0,110) + (book.description.length > 110 ? "..." : "") : ""}</div>
						<div class="book-tile-bottom">
							<span class="book-tile-price">R ${Number(book.price).toFixed(2)}</span>
							${book.stockQuantity === 0 ? `<span class="badge-out-stock">Out of Stock</span>` : ""}
						</div>
				</div>
			</a>
		`).join('');
	} catch (err) {
		loadingDiv.style.display = 'none';
		errorDiv.classList.remove('d-none');
	}
}

document.addEventListener('DOMContentLoaded', loadSpotlightBooks);