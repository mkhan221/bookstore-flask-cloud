import pytest
import sqlite3
import os

# ✅ Set test DB path BEFORE importing app
os.environ["DATABASE_URL"] = "tests_db/test_books.db"

from app import app, get_db_connection  # Import AFTER setting env

# ---- Setup & Teardown ----
@pytest.fixture(autouse=True)
def setup_db():
    db_path = os.environ["DATABASE_URL"]

    # Ensure folder exists
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    # Reset test DB
    if os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE Books (
            book_id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            author TEXT,
            publication_year TEXT,
            image_url TEXT
        )
    """)
    conn.commit()
    conn.close()
    yield


# ---- Tests ----
def test_add_book():
    client = app.test_client()

    response = client.post("/api/add_book", json={
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "publication_year": "2008",
        "image_url": "https://m.media-amazon.com/images/I/41fijVG5x7L._SY445_SX342_FMwebp_.jpg"
    })

    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "Book added successfully"

    # Verify it’s in DB
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT title, author, image_url FROM Books WHERE title='Clean Code'")
    row = cursor.fetchone()
    conn.close()
    assert row[0] == "Clean Code"
    assert row[1] == "Robert C. Martin"
    assert "http" in row[2]


def test_search_by_title():
    client = app.test_client()
    client.post("/api/add_book", json={
        "title": "Atomic Habits",
        "author": "James Clear",
        "publication_year": "2018",
        "image_url": "https://m.media-amazon.com/images/I/71F4+7rk2eL._SL1500_.jpg"
    })

    response = client.get("/api/search?q=Atomic")
    data = response.get_json()
    assert len(data["books"]) == 1
    assert data["books"][0]["title"] == "Atomic Habits"


def test_search_by_author():
    client = app.test_client()
    client.post("/api/add_book", json={
        "title": "The Pragmatic Programmer",
        "author": "Andrew Hunt",
        "publication_year": "1999",
        "image_url": "https://m.media-amazon.com/images/I/51A8l+FxFNL._SY300_SX300_QL70_FMwebp_.jpg"
    })

    response = client.get("/api/search?q=Hunt")
    data = response.get_json()
    assert len(data["books"]) == 1
    assert data["books"][0]["author"] == "Andrew Hunt"


def test_search_no_results():
    client = app.test_client()
    response = client.get("/api/search?q=NonexistentBook")
    data = response.get_json()
    assert len(data["books"]) == 0
