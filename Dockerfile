# Use lightweight Python
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy dependency file first
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy entire project
COPY . .

# Expose port 5000 for Flask/Gunicorn
EXPOSE 5000

# Start app using gunicorn (production server)
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
