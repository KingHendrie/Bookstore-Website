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

document.addEventListener('DOMContentLoaded', () => {
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