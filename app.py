from flask import Flask, render_template, request, redirect, url_for, session, send_file, flash
from flask_mail import Mail, Message
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader
from pdf2image import convert_from_path
from PIL import Image
import pytesseract
import os
import random
import uuid

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'

# Folder setup
UPLOAD_FOLDER = 'uploads'
CONVERTED_FOLDER = 'converted'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CONVERTED_FOLDER, exist_ok=True)

# Flask-Mail config (use your app password!)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'architbishnoi177@gmail.com'  # Your Gmail
app.config['MAIL_PASSWORD'] = 'exoa iimg qxkj obhu'         # App password

mail = Mail(app)

# Home - Login Page
@app.route('/')
def home():
    return render_template('login.html')

# Send OTP
@app.route('/send_otp', methods=['POST'])
def send_otp():
    email = request.form['email']
    otp = str(random.randint(100000, 999999))
    session['email'] = email
    session['otp'] = otp

    try:
        msg = Message('Your OTP Code - AB File Converter', sender=app.config['MAIL_USERNAME'], recipients=[email])
        msg.body = f'Your OTP is: {otp}'
        mail.send(msg)
        return render_template('otp_verify.html', email=email)
    except Exception as e:
        return f"Error sending email: {e}"

# Verify OTP
@app.route('/verify_otp', methods=['POST'])
def verify_otp():
    entered_otp = request.form['otp']
    if entered_otp == session.get('otp'):
        return redirect('/dashboard')
    else:
        flash('Invalid OTP. Please try again.')
        return redirect('/')

# Dashboard - After OTP Verified
@app.route('/dashboard')
def dashboard():
    if 'email' not in session:
        return redirect('/')
    return render_template('dashboard.html')

# Convert File
@app.route('/convert', methods=['POST'])
def convert_file():
    if 'file' not in request.files or 'format' not in request.form:
        return "Missing file or format", 400

    file = request.files['file']
    output_format = request.form['format']
    filename = secure_filename(file.filename)
    input_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(input_path)

    try:
        if output_format == 'txt':
            reader = PdfReader(input_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            output_filename = f"{uuid.uuid4().hex}.txt"
            output_path = os.path.join(CONVERTED_FOLDER, output_filename)
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(text)
            return send_file(output_path, as_attachment=True)

        elif output_format == 'jpg':
            pages = convert_from_path(input_path)
            img_paths = []
            for i, page in enumerate(pages):
                img_path = os.path.join(CONVERTED_FOLDER, f"{uuid.uuid4().hex}_{i}.jpg")
                page.save(img_path, 'JPEG')
                img_paths.append(img_path)
            return send_file(img_paths[0], as_attachment=True)

        elif output_format == 'ocr':
            img = Image.open(input_path)
            text = pytesseract.image_to_string(img)
            output_path = os.path.join(CONVERTED_FOLDER, f"{uuid.uuid4().hex}.txt")
            with open(output_path, 'w') as f:
                f.write(text)
            return send_file(output_path, as_attachment=True)

        else:
            return "Unsupported conversion type", 400

    except Exception as e:
        return f"Conversion error: {str(e)}", 500

# Logout (optional)
@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

# Run Server
if __name__ == '__main__':
    app.run(debug=True, port=5000)
