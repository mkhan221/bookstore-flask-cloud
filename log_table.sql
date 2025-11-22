CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    function_name VARCHAR(100),
    status ENUM('success', 'error') DEFAULT 'success',
    message TEXT,
    execution_time FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
