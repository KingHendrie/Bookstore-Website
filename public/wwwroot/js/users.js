const modal = document.getElementById('createUserModal');
const openBtn = document.querySelector('a[href="/admin/users/create"]');
const closeBtn = document.getElementById('closeCreateUserModal');
const cancelBtn = document.getElementById('cancelCreateUser');
const modalBackdrop = modal ? modal.querySelector('.modal-backdrop') : null;
const modalTitle = document.getElementById('modalTitle');
const modalSubmitBtn = document.getElementById('modalSubmitBtn');
const userIdInput = document.getElementById('userId');
const errorDiv = document.getElementById('create-user-error');

function openCreateUserModal(e) {
	if (e) e.preventDefault();
	modalTitle.textContent = 'Create New User';
	modalSubmitBtn.textContent = 'Create';
	userIdInput.value = '';
	document.getElementById('createUserForm').reset();
	errorDiv.style.display = 'none';
	document.getElementById('password').required = true;
	document.getElementById('confirmPassword').required = true;
	document.getElementById('confirmPasswordGroup').style.display = '';
	modal.classList.remove('d-none');
	document.body.style.overflow = 'hidden';
	document.getElementById('firstName').focus();
 }

 function openEditUserModal(user) {
	modalTitle.textContent = 'Edit User';
	modalSubmitBtn.textContent = 'Update';
	userIdInput.value = user.id;
	document.getElementById('firstName').value = user.firstName;
	document.getElementById('lastName').value = user.lastName;
	document.getElementById('email').value = user.email;
	document.getElementById('password').value = '';
	document.getElementById('role').value = user.role;
	errorDiv.style.display = 'none';
	document.getElementById('password').required = false;
	document.getElementById('confirmPassword').required = false;
	document.getElementById('confirmPasswordGroup').style.display = 'none';
	modal.classList.remove('d-none');
	document.body.style.overflow = 'hidden';
	document.getElementById('firstName').focus();
 }

function closeCreateUserModal() {
	modal.classList.add('d-none');
	document.body.style.overflow = '';

	document.getElementById('createUserForm').reset();
	errorDiv.style.display = 'none';
}

if (openBtn) openBtn.addEventListener('click', openCreateUserModal);
if (closeBtn) closeBtn.addEventListener('click', closeCreateUserModal);
if (cancelBtn) cancelBtn.addEventListener('click', closeCreateUserModal);
if (modalBackdrop) modalBackdrop.addEventListener('click', closeCreateUserModal);

document.addEventListener('keydown', function(e) {
	if (!modal.classList.contains('d-none') && e.key === 'Escape') closeCreateUserModal();
});

document.getElementById('createUserForm').addEventListener('submit', async function(e) {
	e.preventDefault();
	const form = e.target;
	const userId = form.userId.value;
	const isCreate = !userId;

	if (isCreate) {
		if (form.password.value !== form.confirmPassword.value) {
			errorDiv.textContent = 'Passwords do not match.';
			errorDiv.style.display = '';
			return;
		}
		if (!form.password.value) {
			errorDiv.textContent = 'Password is required.';
			errorDiv.style.display = '';
			return;
		}
	}

	const url = userId ? `/api/users/${userId}` : '/api/register';
	const method = userId ? 'PUT' : 'POST';

	const data = {
		firstName: form.firstName.value.trim(),
		lastName: form.lastName.value.trim(),
		email: form.email.value.trim(),
		password: form.password.value,
		role: form.role.value
	};
	errorDiv.style.display = 'none';

	try {
		const res = await fetch(url, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		const json = await res.json();
		if (res.ok && (json.success || json.id)) {
			closeCreateUserModal();
			loadUsers(window.currentPage || 1);
		} else {
			errorDiv.textContent = json.error || (userId ? 'Could not update user.' : 'Could not create user.');
			errorDiv.style.display = '';
		}
	} catch (err) {
		errorDiv.textContent = userId ? 'Could not update user.' : 'Could not create user.';
		errorDiv.style.display = '';
	}
});

async function loadUsers(page = 1, pageSize = 10) {
	window.currentPage = page;
	const loading = document.getElementById('users-loading');
	const error = document.getElementById('users-error');
	if (loading) loading.style.display = '';
	if (error) error.style.display = 'none';

	try {
		const res = await fetch(`/api/users?page=${page}&pageSize=${pageSize}`);
		if (!res.ok) throw new Error('Network error');
		const data = await res.json();
		const tbody = document.getElementById('users-table-body');
		tbody.innerHTML = '';
		if (data.users.length === 0) {
			tbody.innerHTML = '<tr><td colspan="5" class="text-center">No users found.</td></tr>';
		} else {
			data.users.forEach(user => {
				const row = document.createElement('tr');
				row.innerHTML = `
					<td>${user.id}</td>
					<td>${user.firstName}</td>
					<td>${user.lastName}</td>
					<td>${user.email}</td>
					<td>${user.two_factor_enabled ? 'Yes' : ''}</td>
					<td>${user.role}</td>
				`;
				row.style.cursor = 'pointer';
				row.addEventListener('click', () => openEditUserModal(user));
				tbody.appendChild(row);
			});
		}
		window.currentPage = data.page;
		window.totalPages = data.totalPages;
		document.getElementById('page-info').textContent = `Page ${data.page} of ${data.totalPages}`;
		document.getElementById('prev-btn').disabled = data.page <= 1;
		document.getElementById('next-btn').disabled = data.page >= data.totalPages;
		if (loading) loading.style.display = 'none';
	} catch (err) {
		if (loading) loading.style.display = 'none';
		if (error) error.style.display = '';
		const tbody = document.getElementById('users-table-body');
		if (tbody) tbody.innerHTML = '';
	}
}

document.addEventListener('DOMContentLoaded', () => loadUsers(1, 10));

window.loadUsers = loadUsers;