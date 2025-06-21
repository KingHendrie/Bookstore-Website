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
			showToast("Login successful!", "success");
			if (typeof onSuccess === "function") onSuccess();
		}, 'login-error');
	}
}

async function updateCartFab() {
	try {
		const res = await fetch('/api/cart');
		if (res.ok) {
			const { items } = await res.json();
			const cartCount = document.getElementById('cart-count');
			const count = items.reduce((sum, item) => sum + item.quantity, 0);
			cartCount.textContent = count;
			cartCount.style.display = count > 0 ? 'flex' : 'none';
			document.getElementById('cart-fab').style.display = '';
		} else {
			document.getElementById('cart-count').style.display = 'none';
		}
	} catch {
		document.getElementById('cart-count').style.display = 'none';
	}
}

function getBookImageSrc(item) {
	if (item.imageUrl) return item.imageUrl;
	if (item.image_base64) return `data:image/jpeg;base64,${item.image_base64}`;
	return '/wwwroot/img/book-placeholder.png';
}

async function loadCart() {
	const cartLoading = document.getElementById('cart-loading');
	const cartError = document.getElementById('cart-error');
	const cartEmpty = document.getElementById('cart-empty');
	const cartList = document.getElementById('cart-list');
	const cartSummary = document.getElementById('cart-summary');
	const clearBtn = document.getElementById('cart-clear-btn');
	const checkoutBtn = document.getElementById('cart-checkout-btn');

	cartLoading.style.display = '';
	cartError.classList.add('d-none');
	cartEmpty.classList.add('d-none');
	cartList.innerHTML = '';
	cartSummary.innerHTML = '';
	clearBtn.classList.add('d-none');
	checkoutBtn.classList.add('d-none');

	try {
		const res = await fetch('/api/cart');
		cartLoading.style.display = 'none';

		if (res.status === 401 || res.status === 403) {
			openLoginModal(() => window.location.reload());
			return;
		}
		if (!res.ok) {
			cartError.classList.remove('d-none');
			return;
		}
		const { items } = await res.json();
		if (!items || !items.length) {
			cartEmpty.classList.remove('d-none');
			return;
		}

		cartList.innerHTML = items.map(item => `
			<div class="cart-item-card" data-id="${item.bookId}">
				<div class="cart-item-img-wrap">
					<img src="${getBookImageSrc(item)}" alt="${item.title}" class="cart-item-img">
				</div>
				<div class="cart-item-details">
					<a href="/books?id=${item.bookId}" class="cart-item-title">${item.title}</a>
					<div class="cart-item-author">${item.author}</div>
					${item.genre ? `<div class="cart-item-genre">${item.genre}</div>` : ""}
					<div class="cart-item-qty-row">
						<button class="btn btn-light btn-sm btn-qty" data-action="decrement">-</button>
						<input type="number" class="cart-qty-input" value="${item.quantity}" min="1" max="${item.maxQuantity || 99}">
						<button class="btn btn-light btn-sm btn-qty" data-action="increment">+</button>
						<button class="btn btn-link text-danger btn-remove" title="Remove from cart">
							<span style="font-size:1.3em;">&times;</span>
						</button>
					</div>
				</div>
				<div class="cart-item-price">
					<span>R${(item.price * item.quantity).toFixed(2)}</span>
				</div>
			</div>
		`).join('');

		let total = 0;
		items.forEach(item => total += item.price * item.quantity);
		cartSummary.innerHTML = `
			<div class="cart-summary-card">
				<span>Total:</span>
				<span class="cart-summary-total">R${total.toFixed(2)}</span>
			</div>
		`;

		clearBtn.classList.remove('d-none');
		checkoutBtn.classList.remove('d-none');
		updateCartFab();

		cartList.querySelectorAll('.btn-qty').forEach(btn => {
			btn.onclick = async function() {
				const itemDiv = btn.closest('.cart-item-card');
				const bookId = itemDiv.getAttribute('data-id');
				const input = itemDiv.querySelector('.cart-qty-input');
				let qty = parseInt(input.value, 10) || 1;
				if (btn.dataset.action === 'decrement') qty = Math.max(1, qty - 1);
				if (btn.dataset.action === 'increment') qty = Math.min(parseInt(input.max), qty + 1);
				await updateItemQuantity(bookId, qty, input);
			};
		});

		cartList.querySelectorAll('.cart-qty-input').forEach(input => {
			input.onchange = async function() {
				const itemDiv = input.closest('.cart-item-card');
				const bookId = itemDiv.getAttribute('data-id');
				let qty = parseInt(input.value, 10) || 1;
				qty = Math.max(1, qty);
				await updateItemQuantity(bookId, qty, input);
			};
		});

		cartList.querySelectorAll('.btn-remove').forEach(btn => {
			btn.onclick = async function() {
				const itemDiv = btn.closest('.cart-item-card');
				const bookId = itemDiv.getAttribute('data-id');
				await removeItem(bookId);
			};
		});

		clearBtn.onclick = async function() {
			await clearCart();
		};

		checkoutBtn.onclick = function() {
			showToast("Checkout is not implemented in demo.", "info");
		};
	} catch(e) {
		cartLoading.style.display = 'none';
		cartError.classList.remove('d-none');
	}
}

async function updateItemQuantity(bookId, quantity, input) {
	try {
		const res = await fetch('/api/cart/update', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({ bookId, quantity })
		});
		if (res.ok) {
			showToast('Cart updated', 'success');
			loadCart();
		} else if (res.status === 401 || res.status === 403) {
			openLoginModal(() => window.location.reload());
		} else {
			const data = await res.json();
			showToast(data.error || 'Error updating cart', 'error');
			if (input) input.value = 1;
		}
	} catch {
		showToast('Could not update cart', 'error');
		if (input) input.value = 1;
	}
}

async function removeItem(bookId) {
	try {
		const confirmed = await confirmModal('Remove this item from your cart?');
		if (!confirmed) return;
		const res = await fetch('/api/cart/remove', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({ bookId })
		});
		if (res.ok) {
			showToast('Item removed from cart', 'success');
			loadCart();
		} else if (res.status === 401 || res.status === 403) {
			openLoginModal(() => window.location.reload());
		} else {
			const data = await res.json();
			showToast(data.error || 'Error removing item', 'error');
		}
	} catch {
		showToast('Could not remove item', 'error');
	}
}

async function clearCart() {
	try {
		const confirmed = await confirmModal('Are you sure you want to clear your cart?');
		if (!confirmed) return;
		const res = await fetch('/api/cart/clear', { method: 'POST' });
		if (res.ok) {
			showToast('Cart cleared', 'success');
			loadCart();
		} else if (res.status === 401 || res.status === 403) {
			openLoginModal(() => window.location.reload());
		} else {
			const data = await res.json();
			showToast(data.error || 'Error clearing cart', 'error');
		}
	} catch {
		showToast('Could not clear cart', 'error');
	}
}

document.addEventListener('DOMContentLoaded', () => {
	loadCart();
	updateCartFab();

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