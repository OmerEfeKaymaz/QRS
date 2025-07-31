# QRS: Quick Recognition Systems

**QRS (Quick Recognition Systems)** is an end-to-end automated system designed to streamline the evaluation of handwritten exam papers in educational institutions. Built with a full-stack architecture using Python (Flask), Node.js, and MySQL, the system provides teachers with an intuitive and efficient platform for managing student submissions and automating image-based answer extraction.

---

## 🧠 Core Features

* **Image Preprocessing with OpenCV**: Converts scanned images to grayscale, performs edge detection and contour-based segmentation to automatically crop student answers.
* **Backend Orchestration**: Uses Flask for image processing APIs and Node.js for teacher/student management. Communication is handled via RESTful APIs.
* **Student Metadata Integration**: Links each answer image to student metadata (name, surname, ID) using MySQL.
* **Dockerized Deployment**: All components (Flask app, Node app, MySQL) are containerized and orchestrated via Docker Compose.
* **Authentication System**: Teacher login and student-school-class assignments managed securely with proper database relationships.

---

## 🧱 System Architecture

```text
+-----------------+       REST        +------------------+       SQL        +--------------+
| Node.js (API)   +----------------->+ Python Flask     +--------------->+   MySQL DB   |
| - Login UI      |                  | - Image Handler  |                |              |
| - Upload Form   |<-----------------+ - Crop Logic     |<---------------+   Persistent  |
+-----------------+                  +------------------+                +--------------+
```

---

## ⚙️ Technologies Used

* **Frontend**: HTML/CSS (via Express static hosting)
* **Backend**:

  * Python (Flask, OpenCV, SQLAlchemy)
  * Node.js (Express, Axios, FormData)
* **Database**: MySQL 8
* **Containerization**: Docker, Docker Compose
* **Libraries**:

  * Python: OpenCV, Flask-CORS, PyMySQL
  * Node.js: axios, multer, mysql2

---

## 🔧 Setup & Run Locally (With Docker Compose)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/bil-qrs.git
cd bil-qrs
```

### 2. Create `.env` file inside `node_app/`

```dotenv
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=mysql1234
DB_NAME=db3
FLASK_APP_URL=http://flask_app:5000
```

### 3. Run with Docker Compose

```bash
docker-compose up --build
```

### 4. Access the app

* Node.js App (Frontend & API): [http://localhost:3000](http://localhost:3000)
* Flask App (Image API): [http://localhost:5000](http://localhost:5000)

---

## 📂 Project Structure

```text
├── flask_app
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
├── node_app
│   ├── app.js
│   ├── public/
│   ├── .env
│   └── Dockerfile
├── mysql
│   └── init.sql
├── temp
│   └── [temporary uploaded images]
├── docker-compose.yml
```

---

## 📸 Sample Output

> Cropped handwritten answers are saved into uniquely named folders based on student identity and image metadata. Example file name:

```
Eslem_Tunç_5_answer_123_sorunun_cevabi.jpg
```

---

## 🔐 Security Notes

* Passwords are stored in plain text for demonstration. Consider using hashing (e.g., bcrypt) in production.
* CORS is enabled on all origins — restrict this in production.

---

## 👨‍💻 Developer

**Ömer Efe Kaymaz**
[LinkedIn](https://www.linkedin.com/in/omerefekaymaz) • [GitHub](https://github.com/OmerEfeKaymaz)

---

## 📜 License

### MIT License

Copyright (c) 2024 Ömer Efe Kaymaz

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
