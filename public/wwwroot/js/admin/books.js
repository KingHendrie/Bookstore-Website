Modal.bind('addBookModal', { closeOnBackdrop: true, closeOnEscape: true });

async function populateGenreSelect(selectedId = null) {
	const res = await fetch('/api/categories');
	const genres = await res.json();
	const select = document.getElementById('genreId');
	select.innerHTML = genres.map(g =>
	  `<option value="${g.id}" ${selectedId == g.id ? "selected" : ""}>${g.name}</option>`
	).join('');
}

Modal.bindOpen('addBookModal', 'a[href="/admin/books/create"]', () => {
	populateGenreSelect();
	Modal.setupFormModal({
		modalId: 'addBookModal',
		title: 'Add New Book',
		submitText: 'Add',
		fields: { bookId: '' },
		errorDivId: 'add-book-error',
		resetForm: true
	});
});

window.openEditBookModal = function(book) {
	populateGenreSelect(book.genreId);
	Modal.setupFormModal({
		modalId: 'addBookModal',
		title: 'Edit Book',
		submitText: 'Update',
		fields: {
			bookId: book.id,
			title: book.title,
			author: book.author,
			genreId: book.genreId,
			isbn: book.isbn,
			publisher: book.publisher,
			description: book.description,
			price: book.price,
			stockQuantity: book.stockQuantity
		},
		errorDivId: 'add-book-error'
  	});
	const preview = document.getElementById('bookImagePreview');
	const input = document.getElementById('bookImage');
	if (book.image_base64) {
		preview.src = `data:image/jpeg;base64,${book.image_base64}`;
		preview.classList.remove('d-none');
		input.value = '';
		window.bookImageBase64 = book.image_base64;
	} else {
		preview.src = '';
		preview.classList.add('d-none');
		input.value = '';
		window.bookImageBase64 = "";
	}
	Modal.open('addBookModal');
};

let bookImageBase64 = "";
document.getElementById('bookImage').addEventListener('change', function() {
	const file = this.files[0];
	const preview = document.getElementById('bookImagePreview');
	if (!file) {
		preview.classList.add('d-none');
		bookImageBase64 = "";
		return;
	}
	const reader = new FileReader();
	reader.onload = function(e) {
		bookImageBase64 = e.target.result.split(',')[1];
		preview.src = e.target.result;
		preview.classList.remove('d-none');
	};
	reader.readAsDataURL(file);
});

Modal.bindFormSubmit('addBookForm', (form) => {
	const bookId = form.bookId.value;
	return {
		url: bookId ? `/api/books/${bookId}` : `/api/books/add`,
		method: bookId ? 'PUT' : 'POST',
		data: {
			title: form.title.value.trim(),
			author: form.author.value.trim(),
			genreId: form.genreId.value,
			isbn: form.isbn.value.trim(),
			publisher: form.publisher.value.trim(),
			description: form.description.value.trim(),
			price: parseFloat(form.price.value.trim()),
			stockQuantity: parseInt(form.stockQuantity.value.trim(), 10),
			image_base64: bookImageBase64
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
		console.log(data);
		const tbody = document.getElementById('books-table-body');
		tbody.innerHTML = '';
		if (data.books.length === 0) {
			tbody.innerHTML = '<tr><td colspan="9" class="text-center">No books found.</td></tr>';
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
					<td>${book.price}</td>
					<td>${book.stockQuantity}</td>
					<td><a class="text-d-none" href="/admin/reviews?id=${book.id}">Reviews</a></td>
				`;
				row.style.cursor = 'pointer';
				row.addEventListener('click', (event) => {
					if (event.target.closest('a')) return;
					openEditBookModal(book);
				});
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

function handleBookImageInput() {
	const fileInput = document.getElementById('bookImage');
	const preview = document.getElementById('bookImagePreview');
	let base64String = '';

	if (!fileInput) return '';

	fileInput.addEventListener('change', function() {
		 const file = fileInput.files[0];
		 if (!file) {
			  preview.style.display = 'none';
			  base64String = '';
			  return;
		 }
		 const reader = new FileReader();
		 reader.onload = function(e) {
			  base64String = e.target.result.split(',')[1];
			  preview.src = e.target.result;
			  preview.style.display = 'block';

			  fileInput.dataset.base64 = base64String;
		 };
		 reader.readAsDataURL(file);
	});
}
document.addEventListener('DOMContentLoaded', handleBookImageInput);

window.loadBooks = loadBooks;