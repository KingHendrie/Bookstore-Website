Modal.bind('addBookModal', { closeOnBackdrop: true, closeOnEscape: true });
Modal.bindOpen('addBookModal', 'a[href="/admin/books/create"]', () =>
	Modal.setupFormModal({
		modalId: 'addBookModal',
		title: 'Add New Book',
		submitText: 'Add',
		fields: { bookId: '' },
		errorDivId: 'add-book-error',
		resetForm: true
	})
);

window.openEditBookModal = function(book) {
	Modal.setupFormModal({
		modalId: 'addBookModal',
		title: 'Edit Book',
		submitText: 'Update',
		fields: {
			bookId: book.id,
			title: book.title,
			author: book.author,
			genre: book.genre,
			isbn: book.isbn,
			publisher: book.publisher,
			description: book.description,
			price: book.price,
			stockQuantity: book.stockQuantity
		},
		errorDivId: 'add-book-error'
	});
	Modal.open('addBookModal');
};

Modal.bindFormSubmit('addBookForm', (form) => {
	const bookId = form.bookId.value;
	return {
		url: bookId ? `/api/books/${bookId}` : `/api/books/add`,
		method: bookId ? 'PUT' : 'POST',
		data: {
		title: form.title.value.trim(),
		author: form.author.value.trim(),
		genre: form.genre.value.trim(),
		isbn: form.isbn.value.trim(),
		publisher: form.publisher.value.trim(),
		description: form.description.value.trim(),
		price: parseFloat(form.price.value.trim()),
		stockQuantity: parseInt(form.stockQuantity.value.trim(), 10)
		}
	};
}, () => {
	Modal.close('addBookModal');
	loadBooks(window.currentPage || 1);
}, 'add-book-error');

async function loadBooks(page = 1, pageSize = 10) {
	window.currentPage = page;
	const loading = document.getElementById('books-loading');
	const error = document.getElementById('books-error');
	if (loading) loading.style.display = '';
	if (error) error.style.display = 'none';

	try {
		const res = await fetch(`/api/books?page=${page}&pageSize=${pageSize}`);
		if (!res.ok) throw new Error('Network error');
		const data = await res.json();
		const tbody = document.getElementById('books-table-body');
		tbody.innerHTML = '';
		if (data.books.length === 0) {
			tbody.innerHTML = '<tr><td colspan="7" class="text-center">No books found.</td></tr>';
		} else {
			data.books.forEach(book => {
				const row = document.createElement('tr');
				row.innerHTML = `
					<td>${book.id}</td>
					<td>${book.title}</td>
					<td>${book.author}</td>
					<td>${book.genre}</td>
					<td>${book.isbn}</td>
					<td>${book.publisher}</td>
					<td>${book.stockQuantity}</td>
				`;
				row.style.cursor = 'pointer';
				row.addEventListener('click', () => openEditBookModal(book));
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
		const tbody = document.getElementById('books-table-body');
		if (tbody) tbody.innerHTML = '';
	}
}

document.addEventListener('DOMContentLoaded', () => loadBooks(1, 10));

window.loadBooks = loadBooks;