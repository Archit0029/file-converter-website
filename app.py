from flask import Flask, render_template, request, redirect, url_for, session, send_file, flash
from flask_cors import CORS
from werkzeug.utils import secure_filename
from PIL import Image
import os
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Config
app.secret_key = os.getenv("SECRET_KEY")
UPLOAD_FOLDER = 'uploads'
CONVERTED_FOLDER = 'converted'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CONVERTED_FOLDER, exist_ok=True)

# Email settings
EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

# In-memory store for OTP (temporary)
otp_store = {}

@app.route('/')
def login():
    return render_template('login.html')

@app.route('/send_otp', methods=['POST'])
def send_otp():
    email = request.form['email']
    otp = str(random.randint(100000, 999999))
    otp_store[email] = otp

    msg = MIMEMultipart()
    msg['From'] = EMAIL_SENDER
    msg['To'] = email
    msg['Subject'] = "Your OTP for AB File Converter"
    msg.attach(MIMEText(f"Your OTP is: {otp}", 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        session['email'] = email
        return render_template('otp_verify.html')
    except Exception as e:
        return f"Error sending email: {e}"

@app.route('/verify_otp', methods=['POST'])
def verify_otp():
    entered_otp = request.form['otp']
    email = session.get('email')
    if email and otp_store.get(email) == entered_otp:
        session['logged_in'] = True
        return redirect(url_for('dashboard'))
    else:
        flash("Invalid OTP")
        return redirect(url_for('login'))

@app.route('/dashboard')
def dashboard():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('dashboard.html')

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
        img = Image.open(input_path)
        output_filename = f"{uuid.uuid4().hex}.{output_format}"
        output_path = os.path.join(CONVERTED_FOLDER, output_filename)
        img.save(output_path, output_format.upper())
        return send_file(output_path, as_attachment=True)
    except Exception as e:
        return f"Conversion error: {e}", 500

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
