Modal.bind('createUserModal', { closeOnBackdrop: true, closeOnEscape: true });
Modal.bindOpen('createUserModal', 'a[href="/admin/users/create"]', () =>
	Modal.setupFormModal({
		modalId: 'createUserModal',
		title: 'Create New User',
		submitText: 'Create',
		fields: { userId: '' },
		errorDivId: 'create-user-error',
		resetForm: true
	})
);

window.openEditUserModal = function(user) {
	Modal.setupFormModal({
		modalId: 'createUserModal',
		title: 'Edit User',
		submitText: 'Update',
		fields: {
		userId: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		password: '',
		role: user.role
		},
		errorDivId: 'create-user-error'
	});
	Modal.open('createUserModal');
};

Modal.bindFormSubmit('createUserForm', (form) => {
	const userId = form.userId.value;
	return {
		url: userId ? `/api/admin/users/${userId}` : '/api/user/register',
		method: userId ? 'PUT' : 'POST',
		data: {
		firstName: form.firstName.value.trim(),
		lastName: form.lastName.value.trim(),
		email: form.email.value.trim(),
		password: form.password.value,
		role: form.role.value
		}
	};
}, () => {
	Modal.close('createUserModal');
	loadUsers(window.currentPage || 1);
}, 'create-user-error');

async function loadUsers(page = 1, pageSize = 10) {
	window.currentPage = page;
	const loading = document.getElementById('users-loading');
	const error = document.getElementById('users-error');
	if (loading) loading.style.display = '';
	if (error) error.style.display = 'none';

	try {
		const res = await fetch(`/api/admin/users?page=${page}&pageSize=${pageSize}`);
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