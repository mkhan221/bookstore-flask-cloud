// ======================================================
// =============== BOOK STORE FRONTEND JS ===============
// ======================================================

// Store locally added books (UI only)
const books = [];


// ======================================================
// =============== ADD BOOK TO DATABASE =================
// ======================================================

function addBook() {
    const bookTitle = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const publicationYear = document.getElementById('publicationYear').value;
    const imageUrl = document.getElementById('imageUrl').value;

    const bookData = {
        title: bookTitle,
        author: author,
        publication_year: publicationYear,
        image_url: imageUrl 
    };

    fetch('/api/add_book', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(bookData)
    })
    .then(r => r.json())
    .then(data => {
        console.log("Added:", data);
        books.push(bookData);
        displayBooks();
        loadBooksDropdown();  // refresh dropdown for reviews
    })
    .catch(err => console.error("Error adding book:", err));
}


// UI Message after adding a book
function displayBooks() {
    const bookList = document.getElementById('bookList');
    bookList.innerHTML = '';

    books.forEach(book => {
        const el = document.createElement('div');
        el.innerHTML = `
            <h2>Added Successfully: ${book.title}</h2>
            <p>Author: ${book.author ? book.author : 'Unknown'}</p>
            <p>Publication Year: ${book.publication_year}</p>
            ${book.image_url ? `<img src="${book.image_url}" width="120">` : ""}
        `;
        bookList.appendChild(el);
    });
}


// ======================================================
// =============== SHOW ALL BOOKS =======================
// ======================================================

function showAllBooks() {
    fetch('/api/books')
    .then(r => r.json())
    .then(data => {
        const container = document.getElementById("allbooks");
        container.innerHTML = "";

        data.books.forEach(book => {
            const col = document.createElement('div');
            col.className = 'col';

            col.innerHTML = `
                <div class="card h-100 shadow-sm">
                    ${book.image_url ? `<img src="${book.image_url}" class="card-img-top" style="height:250px; object-fit:cover;">` : ""}
                    <div class="card-body">
                        <h5>${book.title}</h5>
                        <p><strong>Author:</strong> ${book.author || "Unknown"}</p>
                        <p><small class="text-muted">Year: ${book.publication_year}</small></p>
                    </div>
                </div>
            `;

            container.appendChild(col);
        });

        loadBooksDropdown();  // ensure dropdown stays updated
    })
    .catch(err => console.error("Error fetching books:", err));
}


// ======================================================
// ================== SEARCH BOOKS ======================
// ======================================================

function searchBooks() {
    const query = document.getElementById('searchInput').value.trim();

    if (!query) {
        showAllBooks();
        return;
    }

    fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(data => {
            const list = document.getElementById('allbooks');
            list.innerHTML = "";

            if (data.books.length === 0) {
                list.innerHTML = `<p class="text-center text-muted">No results found.</p>`;
                return;
            }

            data.books.forEach(book => {
                const col = document.createElement('div');
                col.className = 'col';

                col.innerHTML = `
                    <div class="card h-100 shadow-sm">
                        ${book.image_url ? `<img src="${book.image_url}" class="card-img-top" style="height:250px; object-fit:cover;">` : ""}
                        <div class="card-body">
                            <h5>${book.title}</h5>
                            <p><strong>Author:</strong> ${book.author}</p>
                            <p><small class="text-muted">Year: ${book.publication_year}</small></p>
                        </div>
                    </div>
                `;
                list.appendChild(col);
            });
        })
        .catch(err => console.error("Error searching books:", err));
}


// Clear search box
function clearSearch() {
    document.getElementById("searchInput").value = "";
    showAllBooks();
}


// ======================================================
// =============== DOM READY BOOTSTRAP ==================
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    showAllBooks();
    loadReviews();
    loadBooksDropdown();

    // Search Enter key
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            searchBooks();
        }
    });

    // Dark Mode
    const toggleButton = document.getElementById("darkModeToggle");
    toggleButton.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");

        toggleButton.textContent =
            document.body.classList.contains("dark-mode")
                ? "☀️ Light Mode"
                : "🌙 Dark Mode";
    });
});


// ======================================================
// =================== REVIEWS SECTION ==================
// ======================================================

// Auto-fill dropdown with book titles for review form
async function loadBooksDropdown() {
    const dropdown = document.getElementById("reviewBookTitle");
    if (!dropdown) return;

    const response = await fetch("/api/books");
    const data = await response.json();

    dropdown.innerHTML = "";

    data.books.forEach(book => {
        const opt = document.createElement("option");
        opt.value = book.title;
        opt.textContent = book.title;
        dropdown.appendChild(opt);
    });
}


// Submit a review
async function submitReview() {
    const book_title = document.getElementById("reviewBookTitle").value;
    const reviewer = document.getElementById("reviewer").value;
    const rating = document.getElementById("rating").value;
    const comment = document.getElementById("comment").value;

    if (!book_title || !reviewer || !rating || !comment) {
        alert("Please fill all review fields.");
        return;
    }

    const payload = { book_title, reviewer, rating, comment };

    const response = await fetch("/api/add_review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log("Review Added:", result);

    // Refresh the review list
    loadReviews();

    // Clear form inputs
    document.getElementById("reviewer").value = "";
    document.getElementById("rating").value = "";
    document.getElementById("comment").value = "";
}


// Load and show all reviews
async function loadReviews() {
    try {
        const response = await fetch("/api/reviews");
        const data = await response.json();

        const list = document.getElementById("reviewsList");
        list.innerHTML = "";

        data.reviews.forEach(r => {
            const card = document.createElement("div");
            card.classList.add("review-card");

            card.innerHTML = `
                <h5>${r.book_title}</h5>
                <p><strong>Reviewer:</strong> ${r.reviewer}</p>
                <p><strong>Rating:</strong> ⭐ ${r.rating}</p>
                <p><strong>Comment:</strong> “${r.comment}”</p>
            `;

            list.appendChild(card);
        });
    } catch (err) {
        console.error("Error loading reviews:", err);
    }
}
