const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const mysql = require('mysql2/promise');

const app = express();
const port = 3000;

// MySQL bağlantı konfigürasyonu
const connectionConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// CORS yapılandırması
app.use(cors({
  origin: '*',
}));

// JSON gövde verilerini işlemek için
app.use(express.json());

// Statik dosyalar için dizini ayarla
app.use(express.static(path.join(__dirname, 'public')));

// Geçici dosyalar için dizin
const tempDir = path.join(__dirname, '..', 'temp');

// Multer yapılandırması
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);  // Geçici dosyalar için klasör
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// Flask uygulamasının URL'sini ortam değişkeni olarak al
const FLASK_APP_URL = process.env.FLASK_APP_URL || 'http://flask_app:5000';

// Ana sayfa endpoint'i
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Öğretmen bilgilerini doğrulama endpoint'i
app.post('/validate-teacher', async (req, res) => {
  const { teacher_email, password } = req.body;

  if (!teacher_email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ status: 'error', message: 'Email and password are required' });
  }

  try {
    const connection = await mysql.createConnection(connectionConfig);
    const [results] = await connection.execute(
      'SELECT * FROM teacher_credentials WHERE teacher_email = ? AND password = ?',
      [teacher_email, password]
    );

    console.log('Teacher validation results:', results);

    if (results.length > 0) {
      const teacherId = results[0].teacher_id;
      console.log('Teacher ID:', teacherId);
      res.json({ status: 'success', message: 'Validation successful', teacher_id: teacherId });
    } else {
      console.log('Invalid email or password');
      res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    await connection.end();
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ status: 'error', message: 'Database query error' });
  }
});

// Öğrenci listesini getirme endpoint'i
app.post('/get-students', async (req, res) => {
  const { teacher_email } = req.body;

  if (!teacher_email) {
    console.log('Missing teacher email');
    return res.status(400).json({ status: 'error', message: 'Teacher email is required' });
  }

  try {
    const connection = await mysql.createConnection(connectionConfig);

    // Öğretmen ID'sini almak için email ile sorgu yap
    const [teacherResults] = await connection.execute(
      'SELECT teacher_id FROM teacher_credentials WHERE teacher_email = ?',
      [teacher_email]
    );
    console.log('Teacher ID Results:', teacherResults);

    if (teacherResults.length === 0) {
      await connection.end();
      console.log('Teacher not found');
      return res.status(404).json({ status: 'error', message: 'Teacher not found' });
    }

    const teacherId = teacherResults[0].teacher_id;
    console.log('Teacher ID:', teacherId);

    // Öğretmenin sorumlu olduğu okulun ID'sini almak için teacher_id kullan
    const [schoolResults] = await connection.execute(
      'SELECT school_id FROM teacher_school_assignments WHERE teacher_id = ?',
      [teacherId]
    );
    console.log('School ID Results:', schoolResults);

    if (schoolResults.length === 0) {
      await connection.end();
      console.log('No school found for this teacher');
      return res.status(404).json({ status: 'error', message: 'No school found for this teacher' });
    }

    const schoolId = schoolResults[0].school_id;
    console.log('School ID:', schoolId);

    // Öğrenci ID'lerini almak için student_school tablosunu sorgula
    const [studentIdsResults] = await connection.execute(
      'SELECT student_id FROM student_school WHERE school_id = ?',
      [schoolId]
    );
    console.log('Student IDs Results:', studentIdsResults);

    const studentIds = studentIdsResults.map(row => row.student_id);

    if (studentIds.length === 0) {
      await connection.end();
      console.log('No students found for this school');
      return res.status(404).json({ status: 'error', message: 'No students found for this school' });
    }

    // Öğrenci isimlerini ve soyisimlerini almak için student_id'leri kullanarak student tablosunu sorgula
    const placeholders = studentIds.map(() => '?').join(',');
    const [studentDetailsResults] = await connection.execute(
      `SELECT student_id, student_name, student_surname FROM student WHERE student_id IN (${placeholders})`,
      studentIds
    );
    console.log('Student Details Results:', studentDetailsResults);

    // Arayüzde öğrenci seçimi için student_name ve student_surname bilgilerini gönder
    const students = studentDetailsResults.map(student => ({
      student_id: student.student_id,
      student_name: `${student.student_name} ${student.student_surname}`
    }));

    console.log('Students to send:', students);

    res.json({ status: 'success', students });

    await connection.end();
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// Görüntü işleme ve kaydetme endpoint'i
app.post('/process-image', upload.single('image'), async (req, res) => {
  const imageFilePath = path.join(tempDir, req.file.originalname);
  const { student_id } = req.body; // Öğrenci ID'sini al

  if (!student_id) {
    console.log('Missing student ID');
    return res.status(400).json({ status: 'error', message: 'Student ID is required' });
  }

  const formData = new FormData();
  formData.append('image', fs.createReadStream(imageFilePath));
  formData.append('student_id', student_id); // Öğrenci ID'sini formData'ya ekle

  try {
    const response = await axios.post(`${FLASK_APP_URL}/process-image`, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    // Geçici dosyayı sil
    fs.unlink(imageFilePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
      }
    });

    res.json({ status: 'success', result: response.data });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to process image' });
  }
});

app.listen(port, () => {
  console.log(`Node.js server running at http://localhost:${port}`);
});
