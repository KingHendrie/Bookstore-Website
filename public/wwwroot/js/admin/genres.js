Modal.bind('addGenreModal', { closeOnBackdrop: true, closeOnEscape: true });

function openAddGenreModal() {
	Modal.setupFormModal({
		modalId: 'addGenreModal',
		title: 'Add Genre',
		submitText: 'Add',
		fields: { genreId: '', genre: '' },
		errorDivId: 'add-genre-error',
		resetForm: true
	});
	Modal.open('addGenreModal');
}

function openEditGenreModal(genre) {
	Modal.setupFormModal({
		modalId: 'addGenreModal',
		title: 'Edit Genre',
		submitText: 'Update',
		fields: { genreId: genre.id, genre: genre.name },
		errorDivId: 'add-genre-error'
	});
	Modal.open('addGenreModal');
}

document.getElementById('addGenreBtn').addEventListener('click', openAddGenreModal);
document.getElementById('cancelAddGenre').addEventListener('click', () => Modal.close('addGenreModal'));
document.getElementById('closeAddGenreModal').addEventListener('click', () => Modal.close('addGenreModal'));

Modal.bindFormSubmit('addGenreForm', (form) => {
	const genreId = form.genreId.value;
	return {
		url: genreId ? `/api/genres/${genreId}` : `/api/genres/add`,
		method: genreId ? 'PUT' : 'POST',
		data: {
			genre: form.genre.value.trim()
		}
	};
}, () => {
	loadGenres(window.genrePage || 1, 10);
	Modal.close('addGenreModal');
}, 'add-genre-error');

async function loadGenres(page = 1, pageSize = 10) {
	window.genrePage = page;
	const loading = document.getElementById('genres-loading');
	const error = document.getElementById('genres-error');
	if (loading) loading.style.display = '';
	if (error) error.style.display = 'none';

	try {
		const res = await fetch(`/api/genres?page=${page}&pageSize=${pageSize}`);
		const data = await res.json();
		const tbody = document.getElementById('genres-table-body');
		tbody.innerHTML = '';
		if (!data.genres || data.genres.length === 0) {
			tbody.innerHTML = '<tr><td colspan="2" class="text-center">No genres found.</td></tr>';
		} else {
			data.genres.forEach(genre => {
			const row = document.createElement('tr');
			row.innerHTML = `
				<td>${genre.id}</td>
				<td>${genre.name}</td>
			`;
			row.style.cursor = 'pointer';
			row.addEventListener('click', () => openEditGenreModal(genre));
			tbody.appendChild(row);
			});
		}
		window.genrePage = data.page;
		window.totalGenrePages = data.totalPages;
		document.getElementById('genre-page-info').textContent = `Page ${data.page} of ${data.totalPages}`;
		document.getElementById('prev-genre-btn').disabled = data.page <= 1;
		document.getElementById('next-genre-btn').disabled = data.page >= data.totalPages;
		if (loading) loading.style.display = 'none';
	} catch (err) {
		if (loading) loading.style.display = 'none';
		if (error) error.style.display = '';
		document.getElementById('genres-table-body').innerHTML = '';
	}
}
window.openEditGenreModal = openEditGenreModal;

document.addEventListener('DOMContentLoaded', () => loadGenres(1, 10));