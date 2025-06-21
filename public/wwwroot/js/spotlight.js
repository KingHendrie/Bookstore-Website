async function updateCartFab() {
	try {
		const res = await fetch('/api/cart');
		if (res.ok) {
			const { items } = await res.json();
			const cartCount = document.getElementById('cart-count');
			const count = items.reduce((sum, item) => sum + item.quantity, 0);
			cartCount.textContent = count;
			cartCount.style.display = count > 0 ? 'flex' : 'none';
		} else {
			document.getElementById('cart-count').style.display = 'none';
		}
	} catch {
		document.getElementById('cart-count').style.display = 'none';
	}
}

function openLoginModal(onSuccess) {
	if (window.Modal && typeof Modal.setupFormModal === 'function') {
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
			if (typeof onSuccess === "function") onSuccess();
		}, 'login-error');
	}
}

function createAddToCartBtn(book) {
	const btn = document.createElement('button');
	btn.className = 'btn btn-primary add-to-cart-btn';
	btn.textContent = 'Add to Cart';
	btn.onclick = async function (e) {
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
		`).join('');

		document.querySelectorAll('.book-tile-wrap').forEach(tile => {
			const btnHolder = tile.querySelector('.book-tile-add-btn-holder');
			if (btnHolder) {
				const bookId = tile.getAttribute('data-book-id');
				const book = books.find(b => String(b.id) === String(bookId));
				if (book) btnHolder.appendChild(createAddToCartBtn(book));
			}
		});
		updateCartFab();
	} catch (err) {
		loadingDiv.style.display = 'none';
		errorDiv.classList.remove('d-none');
	}
}

document.addEventListener('DOMContentLoaded', () => {
	loadSpotlightBooks();

	const cartFab = document.getElementById('cart-fab');
	if (cartFab) {
		cartFab.onclick = async function () {
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