async function loadBooksTiles() {
	const booksList = document.getElementById('books-list');
	booksList.innerHTML = '<div>Loading...</div>';
	try {
		const res = await fetch('/api/books?limit=8');
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
			link.href = `/books/${book.id}`;
			link.appendChild(card);
			link.appendChild(img);
	
			tile.appendChild(link);
			booksList.appendChild(tile);
	  	});
	} catch (err) {
	  	booksList.innerHTML = '<div>Error loading books.</div>';
	}
}

document.addEventListener("DOMContentLoaded", function() {
	loadBooksTiles();
});