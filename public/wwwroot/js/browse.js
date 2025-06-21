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

async function updateCartFab() {
	try {
		const res = await fetch('/api/cart');
		if (res.ok) {
			const { items } = await res.json();
			const count = items.reduce((sum, item) => sum + item.quantity, 0);
			const cartCount = document.getElementById('cart-count');
			cartCount.textContent = count;
			cartCount.style.display = count > 0 ? 'flex' : 'none';
		} else {
			document.getElementById('cart-count').style.display = 'none';
		}
	} catch {
		document.getElementById('cart-count').style.display = 'none';
	}
}

function createAddToCartBtn(book) {
	const btn = document.createElement('button');
	btn.className = 'btn btn-primary add-to-cart-btn';
	btn.textContent = 'Add to Cart';
	btn.onclick = async function(e) {
		e.preventDefault();
		try {
			const res = await fetch('/api/cart/add', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ bookId: book.id, quantity: 1 })
			});
			if (res.ok) {
				showToast('Added to cart!', 'success');
				updateCartFab();
			} else if (res.status === 401 || res.status === 403) {
				openLoginModal();
			} else {
				const data = await res.json();
				showToast(data.error || "Could not add to cart.", "error");
			}
		} catch {
			showToast("Could not add to cart.", "error");
		}
	};
	return btn;
}

function renderBookTile(book) {
	return `
		<div class="book-tile-wrap" data-book-id="${book.id}">
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
						${book.stockQuantity === 0 ? `<span class="badge-out-stock">Out of Stock</span>` : `<div class="book-tile-add-btn-holder"></div>`}
					</div>
				</div>
			</a>
		</div>
	`;
}

function injectAddToCartButtons() {
	document.querySelectorAll('.book-tile-wrap').forEach(tile => {
		const btnHolder = tile.querySelector('.book-tile-add-btn-holder');
		if (btnHolder) {
			const bookId = tile.getAttribute('data-book-id');
			const book = { id: bookId };
			btnHolder.appendChild(createAddToCartBtn(book));
		}
	});
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
	injectAddToCartButtons();
}

function renderBooksFlat(data) {
	const container = document.getElementById('browse-books-list');
	if (!data.books.length) {
		container.innerHTML = '<div class="text-center my-4">No books found.</div>';
		return;
	}
	container.innerHTML = data.books.map(renderBookTile).join('');
	injectAddToCartButtons();
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

	const cartFab = document.getElementById('cart-fab');
	if (cartFab) {
		cartFab.onclick = async function() {
			try {
				const res = await fetch('/api/cart');
				if (res.ok) {
					const { items } = await res.json();
					if (!items || !items.length) {
						showToast("Your cart is empty.", "info");
					} else {
						window.location.href = "/cart";
					}
				} else if (res.status === 401 || res.status === 403) {
					openLoginModal();
				} else {
					showToast("You need to be logged in to view your cart.", "error");
				}
			} catch {
				showToast("Could not load cart.", "error");
			}
		};
	}
});