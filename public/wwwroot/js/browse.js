let currentPage = 1;
let totalPages = 1;
let lastSearch = "";
let lastGenre = "";

async function loadGenres() {
	const select = document.getElementById('genreFilter');
	select.innerHTML = `<option value="">All Genres</option>`;
	const res = await fetch('/api/public/genres');
	const genres = await res.json();
	genres.forEach(g => {
		const opt = document.createElement('option');
		opt.value = g.name;
		opt.textContent = g.name;
		select.appendChild(opt);
	});
}

function renderBookTile(book) {
	return `
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
	`;
}

function renderBooksGroupedByGenre(data) {
	const container = document.getElementById('browse-books-list');
	if (!data.books.length) {
		container.innerHTML = '<div class="text-center my-4">No books found.</div>';
		return;
	}
	// Group books by genre
	const byGenre = {};
	data.books.forEach(book => {
		const genre = book.genre || "Other";
		if (!byGenre[genre]) byGenre[genre] = [];
		byGenre[genre].push(book);
	});
	container.innerHTML = Object.entries(byGenre).map(([genre, books]) => `
		<section class="browse-genre-section">
			<h2 class="browse-genre-name">${genre}</h2>
			<div class="browse-genre-grid">
				${books.map(renderBookTile).join('')}
			</div>
		</section>
	`).join('');
}

function renderBooksFlat(data) {
	const container = document.getElementById('browse-books-list');
	if (!data.books.length) {
		container.innerHTML = '<div class="text-center my-4">No books found.</div>';
		return;
	}
	container.innerHTML = data.books.map(renderBookTile).join('');
}

async function loadBooks({page = 1, search = '', genre = ''} = {}) {
	currentPage = page;
	lastSearch = search;
	lastGenre = genre;

	const booksList = document.getElementById('browse-books-list');
	booksList.innerHTML = '<div class="text-center"><span class="spinner-border"></span> Loading...</div>';

	const params = new URLSearchParams({ page, pageSize: 24, search, genre });
	const res = await fetch(`/api/public/browse?${params}`);
	const data = await res.json();

	if (!search && !genre) renderBooksGroupedByGenre(data);
	else renderBooksFlat(data);

	document.getElementById('browsePageInfo').textContent = `Page ${data.page} of ${data.totalPages}`;
	totalPages = data.totalPages;
	document.getElementById('prevPageBtn').disabled = data.page <= 1;
	document.getElementById('nextPageBtn').disabled = data.page >= data.totalPages;
}

document.addEventListener('DOMContentLoaded', async () => {
	await loadGenres();

	// set genre and search from URL
	const params = new URLSearchParams(window.location.search);
	const genre = params.get('genre') || '';
	const search = params.get('search') || '';
	if (genre) document.getElementById('genreFilter').value = genre;
	if (search) document.getElementById('searchInput').value = search;

	loadBooks({page: 1, search, genre});

	document.getElementById('browse-search-form').addEventListener('submit', e => {
		e.preventDefault();
		loadBooks({
			page: 1,
			search: document.getElementById('searchInput').value.trim(),
			genre: document.getElementById('genreFilter').value
		});
	});

	document.getElementById('genreFilter').addEventListener('change', e => {
		loadBooks({
			page: 1,
			search: document.getElementById('searchInput').value.trim(),
			genre: e.target.value
		});
	});

	document.getElementById('prevPageBtn').addEventListener('click', () => {
		if (currentPage > 1) {
			loadBooks({page: currentPage - 1, search: lastSearch, genre: lastGenre});
		}
	});
	document.getElementById('nextPageBtn').addEventListener('click', () => {
		if (currentPage < totalPages) {
			loadBooks({page: currentPage + 1, search: lastSearch, genre: lastGenre});
		}
	});
});