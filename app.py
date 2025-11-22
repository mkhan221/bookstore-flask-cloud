from flask import Flask, jsonify, render_template, request
import sqlite3
import os
import time
import mysql.connector
from pymongo import MongoClient

app = Flask(__name__)

# -------------------------------
# MONGODB (Local OR Cloud)
# -------------------------------
# If MONGO_URL is set → use cloud database.
# Otherwise → use local localhost MongoDB.
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URL)

mongo_db = client["BookShelf"]
reviews_collection = mongo_db["Reviews"]

# -------------------------------
# SQLITE (Books Database)
# -------------------------------
DATABASE = os.getenv("DATABASE_URL", "db/books.db")
print(f"📚 Using SQLite database: {DATABASE}")

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# -------------------------------
# MYSQL LOGGING (optional in cloud)
# -------------------------------
MYSQL_HOST = os.getenv("MYSQL_HOST", None)
MYSQL_USER = os.getenv("MYSQL_USER", None)
MYSQL_PASS = os.getenv("MYSQL_PASS", None)
MYSQL_DB   = os.getenv("MYSQL_DB", None)

def get_mysql_connection():
    if not MYSQL_HOST:
        return None  # Disable MySQL logging in cloud
    return mysql.connector.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASS,
        database=MYSQL_DB
    )

def log_to_mysql(function_name, status="success", message=None, execution_time=None):
    try:
        conn = get_mysql_connection()
        if conn is None:
            return  # Skip logging in cloud
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO logs (function_name, status, message, execution_time) "
            "VALUES (%s, %s, %s, %s)",
            (function_name, status, message, execution_time)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[LOGGING ERROR] {e}")

# -------------------------------
# ROUTES
# -------------------------------

@app.route('/api/books', methods=['GET'])
def get_all_books():
    start_time = time.time()
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT book_id, title, author, publication_year, image_url FROM Books")
        books = cursor.fetchall()
        conn.close()

        exec_time = time.time() - start_time
        log_to_mysql("get_all_books", "success", "Fetched all books", exec_time)

        return jsonify({'books': [
            {
                'book_id': b[0],
                'title': b[1],
                'author': b[2],
                'publication_year': b[3],
                'image_url': b[4]
            } for b in books
        ]})
    except Exception as e:
        log_to_mysql("get_all_books", "error", str(e))
        return jsonify({'error': str(e)})


@app.route('/api/authors', methods=['GET'])
def get_all_authors():
    start_time = time.time()
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Authors")
        authors = cursor.fetchall()
        conn.close()

        exec_time = time.time() - start_time
        log_to_mysql("get_all_authors", "success", "Fetched all authors", exec_time)

        return jsonify(authors)
    except Exception as e:
        log_to_mysql("get_all_authors", "error", str(e))
        return jsonify({'error': str(e)})


@app.route('/api/add_book', methods=['POST'])
def add_book():
    start_time = time.time()
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO Books (title, author, publication_year, image_url) VALUES (?, ?, ?, ?)",
            (data.get('title'), data.get('author'), data.get('publication_year'), data.get('image_url'))
        )
        conn.commit()
        conn.close()

        exec_time = time.time() - start_time
        log_to_mysql("add_book", "success", f"Added book: {data.get('title')}", exec_time)

        return jsonify({'message': 'Book added successfully'})
    except Exception as e:
        log_to_mysql("add_book", "error", str(e))
        return jsonify({'error': str(e)})


@app.route('/api/search', methods=['GET'])
def search_books():
    start_time = time.time()
    try:
        query = request.args.get('q', '').strip().lower()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT book_id, title, author, publication_year, image_url
            FROM Books
            WHERE LOWER(title) LIKE ? OR LOWER(author) LIKE ?
        """, (f'%{query}%', f'%{query}%'))
        books = cursor.fetchall()
        conn.close()

        exec_time = time.time() - start_time
        log_to_mysql("search_books", "success", f"Searched for query: {query}", exec_time)

        return jsonify({'books': [
            {
                'book_id': b[0],
                'title': b[1],
                'author': b[2],
                'publication_year': b[3],
                'image_url': b[4]
            } for b in books
        ]})
    except Exception as e:
        log_to_mysql("search_books", "error", str(e))
        return jsonify({'error': str(e)})


@app.route('/')
def index():
    return render_template('index.html')


# -------------------------------
# REVIEWS (MongoDB)
# -------------------------------

@app.route('/api/add_review', methods=['POST'])
def add_review():
    start_time = time.time()
    try:
        data = request.get_json()
        review = {
            "book_title": data.get("book_title"),
            "reviewer": data.get("reviewer"),
            "rating": data.get("rating"),
            "comment": data.get("comment")
        }
        reviews_collection.insert_one(review)

        exec_time = time.time() - start_time
        log_to_mysql("add_review", "success", f"Review added for {data.get('book_title')}", exec_time)

        return jsonify({"message": "Review added successfully!"})
    except Exception as e:
        log_to_mysql("add_review", "error", str(e))
        return jsonify({"error": str(e)})


@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    start_time = time.time()
    try:
        reviews = list(reviews_collection.find({}, {"_id": 0}))

        exec_time = time.time() - start_time
        log_to_mysql("get_reviews", "success", "Fetched all reviews", exec_time)

        return jsonify({"reviews": reviews})
    except Exception as e:
        log_to_mysql("get_reviews", "error", str(e))
        return jsonify({"error": str(e)})


# -------------------------------
# MAIN
# -------------------------------
if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")
