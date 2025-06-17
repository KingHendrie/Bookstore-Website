function loadUsers(page = 1, pageSize = 10) {
	let currentPage = 1;
	let totalPages = 1;

	if (window.currentPage) currentPage = window.currentPage;
	if (window.totalPages) totalPages = window.totalPages;
	if (typeof page === 'number') currentPage = page;

	const loading = document.getElementById('users-loading');
	const error = document.getElementById('users-error');
	if (loading) loading.style.display = '';
	if (error) error.style.display = 'none';

	fetch(`/api/users?page=${currentPage}&pageSize=${pageSize}`)
		.then(res => {
			if (!res.ok) throw new Error('Network error');
			return res.json();
		})
		.then(data => {
			const tbody = document.getElementById('users-table-body');
			if (!tbody) return;
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
					<td>${user.role}</td>
				`;
				tbody.appendChild(row);
			});
			}
			window.currentPage = data.page;
			window.totalPages = data.totalPages;
			document.getElementById('page-info').textContent = `Page ${data.page} of ${data.totalPages}`;
			document.getElementById('prev-btn').disabled = data.page <= 1;
			document.getElementById('next-btn').disabled = data.page >= data.totalPages;
			if (loading) loading.style.display = 'none';
		})
		.catch(err => {
			if (loading) loading.style.display = 'none';
			if (error) error.style.display = '';
			const tbody = document.getElementById('users-table-body');
			if (tbody) tbody.innerHTML = '';
	});
}

document.addEventListener('DOMContentLoaded', () => loadUsers(1, 10));

window.loadUsers = loadUsers;