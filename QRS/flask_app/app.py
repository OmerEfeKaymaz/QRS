from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import cv2
import os
import uuid
import pymysql

app = Flask(__name__)
CORS(app)

# Flask-SQLAlchemy yapılandırması
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:mysql1234@mysql/db3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Giriş bilgilerini saklamak için bir model oluşturuyoruz
class TeacherCredentials(db.Model):
    __tablename__ = 'teacher_credentials'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)

# Öğrenci bilgilerini saklamak için bir model oluşturuyoruz
class Student(db.Model):
    __tablename__ = 'student'
    student_id = db.Column(db.Integer, primary_key=True)
    student_name = db.Column(db.String(255), nullable=False)
    school_id = db.Column(db.Integer, nullable=False)
    student_surname = db.Column(db.String(255), nullable=False)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = TeacherCredentials.query.filter_by(email=email, password=password).first()
        
        if user:
            session['logged_in'] = True
            return redirect(url_for('index'))
        else:
            return 'Invalid credentials', 401
    
    return render_template('login.html')

@app.route('/')
def index():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    
    return render_template('index.html')

@app.route('/process-image', methods=['POST'])
def process_image():
    if 'image' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file part in the request'}), 400

    student_id = request.form.get('student_id')
    if not student_id:
        return jsonify({'status': 'error', 'message': 'Student ID is required'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'status': 'error', 'message': 'No selected file'}), 400

    # Öğrenci adı alınır
    student = Student.query.get(student_id)
    if not student:
        return jsonify({'status': 'error', 'message': 'Student not found'}), 404

    student_name = student.student_name
    student_surname = student.student_surname

    # Dosya adının alınması ve uzantısının çıkarılması
    file_name = os.path.splitext(file.filename)[0]

    # Benzersiz bir dizin oluşturmak için UUID kullanımı
    unique_id = str(uuid.uuid4().int)[:3]  # 3 karakter uzunluğunda UUID
    unique_dir_name = f"{student_name}_{student_surname}_{student_id}_{file_name}_{unique_id}"
    unique_dir = os.path.join('temp', unique_dir_name)
    os.makedirs(unique_dir, exist_ok=True)

    temp_path = os.path.join(unique_dir, f"{student_name}_{student_surname}_{unique_id}_{file.filename}")
    file.save(temp_path)

    print(f'Saved file path: {temp_path}')
    if not os.path.exists(temp_path):
        return jsonify({'status': 'error', 'message': f'Image file not found: {temp_path}'}), 404

    image = cv2.imread(temp_path)
    if image is None:
        return jsonify({'status': 'error', 'message': 'Failed to load image.'}), 500

    # Görüntünün gri tonlamaya çevrilmesi
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Görüntüyü bulanıklaştırma
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Kenar tespiti
    edged = cv2.Canny(blurred, 50, 150)

    # Konturları bulma
    contours, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Bulunan konturları yukarıdan aşağıya doğru sıralama işlemi
    contours = sorted(contours, key=lambda c: cv2.boundingRect(c)[1])

    # Sonuçları saklamak için bir liste
    output_images = []

    # Her kutuyu sırayla işleme ve kaydetme
    counter = 1
    for contour in contours:
        area = cv2.contourArea(contour)
        if area > 1000:
            x, y, w, h = cv2.boundingRect(contour)
            
            cropped_image = image[y:y+h, x:x+w]
            output_path = os.path.join(unique_dir, f'{student_name}_{student_surname}_{student_id}_{unique_id}_{counter}_sorunun_cevabi.jpg')
            cv2.imwrite(output_path, cropped_image)
            output_images.append(output_path)
            counter += 1

    return jsonify({'status': 'success', 'message': 'Image processed successfully!', 'output_images': output_images})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
