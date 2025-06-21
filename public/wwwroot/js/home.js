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

async function loadBooksTiles() {
	const booksList = document.getElementById('books-list');
	booksList.innerHTML = '<div>Loading...</div>';
	try {
		const res = await fetch('/api/public/home-books?limit=8');
		const books = await res.json();
		if (!books.length) {
			booksList.innerHTML = '<div>No books found.</div>';
			return;
		}
		booksList.innerHTML = "";
 
	  	books.forEach(book => {
			const tile = document.createElement('div');
			tile.className = 'book-tile';
	
			const card = document.createElement('div');
			card.className = 'book-card';
	
			const title = document.createElement('div');
			title.className = 'book-title';
			title.textContent = book.title;
	
			const author = document.createElement('div');
			author.className = 'book-author';
			author.textContent = book.author;
	
			const genre = document.createElement('div');
			genre.className = 'book-genre';
			genre.textContent = book.genre;
	
			const price = document.createElement('div');
			price.className = 'book-price';
			price.textContent = `R${book.price}`;
	
			card.appendChild(title);
			card.appendChild(author);
			card.appendChild(genre);
			card.appendChild(price);

			if (book.stockQuantity === 0) {
				const outOfStockBadge = document.createElement('span');
				outOfStockBadge.className = 'badge-out-stock';
				outOfStockBadge.textContent = 'Out of Stock';
				price.appendChild(outOfStockBadge);
			} else {
				card.appendChild(createAddToCartBtn(book));
			}
	
			const img = document.createElement('img');
			img.className = 'book-image';
			img.alt = book.title;
			if (book.image_base64) {
				img.src = `data:image/jpeg;base64,${book.image_base64}`;
			} else {
				img.src = '/images/default-book.jpg';
			}
	
			const link = document.createElement('a');
			link.className = 'book-link';
			link.href = `/books?id=${book.id}`;
			link.appendChild(card);
			link.appendChild(img);
	
			tile.appendChild(link);
			booksList.appendChild(tile);
	  	});
		  updateCartFab();
	} catch (err) {
	  	booksList.innerHTML = '<div>Error loading books.</div>';
	}
}

async function loadGenreTiles() {
	const categoriesList = document.getElementById('categories-list');
	categoriesList.innerHTML = '<div>Loading...</div>';
	try {
		const res = await fetch('/api/admin/genres?page=1&pageSize=100');
		const data = await res.json();
		const genres = data.genres || data;
		if (!genres.length) {
			categoriesList.innerHTML = '<div>No categories found.</div>';
			return;
		}
		categoriesList.innerHTML = '';
		const tileGroup = document.createElement('div');
		tileGroup.className = 'tile-group';

		genres.forEach(genre => {
			const link = document.createElement('a');
			link.className = 'tile-link';
			link.href = `/browse?genre=${encodeURIComponent(genre.name)}`;

			const tile = document.createElement('div');
			tile.className = 'tile';

			const tileImage = document.createElement('div');
			tileImage.className = 'tile-image';

			if (genre.genre_icon) {
				tileImage.innerHTML = genre.genre_icon;
			} else {
				tileImage.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-archive" viewBox="0 0 16 16">
					<path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5zm13-3H1v2h14zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/>
				</svg>`;
			}

			const tileBody = document.createElement('div');
			tileBody.className = 'tile-body';

			const h3 = document.createElement('h3');
			h3.textContent = genre.name;

			tileBody.appendChild(h3);
			tile.appendChild(tileImage);
			tile.appendChild(tileBody);
			link.appendChild(tile);
			tileGroup.appendChild(link);
		});
		categoriesList.appendChild(tileGroup);
	} catch (err) {
		categoriesList.innerHTML = '<div>Error loading categories.</div>';
	}
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

document.addEventListener("DOMContentLoaded", function() {
	loadBooksTiles();
	loadGenreTiles();
	updateCartFab();

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