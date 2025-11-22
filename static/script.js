// Array to store book data
const books = [];

//Grab the author value
const author = document.getElementById("author").value;

// Function to add a book to the list and send it to the server
function addBook() {
    const bookTitle = document.getElementById('title').value;
    const author = document.getElementById('author').value;  // 👈 grab author
    const publicationYear = document.getElementById('publicationYear').value;
    const imageUrl = document.getElementById('imageUrl').value;

    // Create a JSON object with book data
    const bookData = {
        title: bookTitle,
        author: author,  // 👈 include author
        publication_year: publicationYear,
        image_url: imageUrl 
    };

    // Send the book data to the server via POST request
    fetch('/api/add_book', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookData)
    })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);

            // Add the new book data to the books array
            books.push(bookData);

            // Refresh the book list
            displayBooks();
        })
        .catch(error => {
            console.error('Error adding book:', error);
        });
}

// Function to display books in the list
function displayBooks() {
    const bookList = document.getElementById('bookList');
    bookList.innerHTML = ''; // Clear existing book list

    books.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.innerHTML = `
            <h2>Added Successfully: ${book.title}</h2>
            <p>Author: ${book.author ? book.author : 'Unknown'}</p>
            <p>Publication Year: ${book.publication_year}</p>
            ${book.image_url ? `<img src="${book.image_url}" alt="Book Cover" width="120">` : ""}
        `;
        bookList.appendChild(bookElement);
    });
}



// Function to fetch and display all books from the server
function showAllBooks() {
    fetch('/api/books')
        .then(response => response.json())
        .then(data => {
            const bookList = document.getElementById('allbooks');
            bookList.innerHTML = ''; // Clear existing book list
            console.log(data)
            data.books.forEach(book => { 
                const bookElement = document.createElement('div');
                bookElement.innerHTML = `
                    <h2>${book.title}</h2>
                    <p>Author: ${book.author ? book.author : 'Unknown'}</p>
                    <p>Publication Year: ${book.publication_year}</p>
                    ${book.image_url ? `<img src="${book.image_url}" alt="Book Cover" width="120">` : ""}
                `;
                bookList.appendChild(bookElement);
            });
        })
        .catch(error => {
            console.error('Error fetching all books:', error);
        });
}



// At the bottom of script.js
document.addEventListener("DOMContentLoaded", () => {
    // Load all books automatically on page load
    showAllBooks();

    // Dark mode toggle
    const toggleButton = document.getElementById("darkModeToggle");
    toggleButton.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        toggleButton.textContent = document.body.classList.contains("dark-mode")
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";
    });

    // Search input Enter key listener
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            if (searchInput.value.trim() === "") {
                showAllBooks(); // reset if empty
            } else {
                searchBooks();  // run search
            }
        }
    });
});


function searchBooks() {
    const query = document.getElementById('searchInput').value.trim();

    if (!query) {
        // If search is empty, reload full list
        showAllBooks();
        return;
    }

    fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            const bookList = document.getElementById('allbooks');
            bookList.innerHTML = '';

            if (data.books.length === 0) {
                bookList.innerHTML = `<p class="text-center text-muted">No results found for "${query}"</p>`;
                return;
            }

            data.books.forEach(book => {
    const col = document.createElement('div');
    col.className = 'col';
    col.innerHTML = `
        <div class="card h-100 shadow-sm">
            ${book.image_url ? `<img src="${book.image_url}" class="card-img-top" style="height: 250px; object-fit: cover;" alt="Book Cover">` : ""}
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${book.title}</h5>
                <p class="card-text"><strong>Author:</strong> ${book.author}</p>
                <p class="card-text"><small class="text-muted">Year: ${book.publication_year}</small></p>
            </div>
        </div>
    `;
    bookList.appendChild(col);
});
        })
        .catch(error => {
            console.error('Error searching books:', error);
        });
}


document.getElementById("searchInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        searchBooks();
    }
});

function clearSearch() {
    document.getElementById('searchInput').value = "";
    showAllBooks(); // reload full book shelf
}

// ================== REVIEWS SECTION ==================
async function loadReviews() {
  try {
    const response = await fetch("/api/reviews");
    const data = await response.json();
    const reviewsList = document.getElementById("reviewsList");
    reviewsList.innerHTML = "";

    data.reviews.forEach(r => {
      const card = document.createElement("div");
      card.classList.add("review-card");
      card.innerHTML = `
        <h5>${r.book_title}</h5>
        <p><strong>Reviewer:</strong> ${r.reviewer}</p>
        <p><strong>Rating:</strong> ⭐ ${r.rating}</p>
        <p><strong>Comment:</strong> “${r.comment}”</p>
      `;
      reviewsList.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading reviews:", err);
  }
}

// Load reviews when page loads
document.addEventListener("DOMContentLoaded", loadReviews);
