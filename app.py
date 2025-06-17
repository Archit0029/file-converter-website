from flask import Flask, request, render_template, redirect, url_for, session, send_file, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os
import uuid
import smtplib
import imghdr
from email.message import EmailMessage
from PIL import Image
import PyPDF2
import pytesseract
from moviepy.editor import AudioFileClip

app = Flask(__name__)
CORS(app)
app.secret_key = "your_secret_key_here"

UPLOAD_FOLDER = 'uploads'
CONVERTED_FOLDER = 'converted'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CONVERTED_FOLDER, exist_ok=True)

# Email config
EMAIL_ADDRESS = 'architbishnoi177@gmail.com'
EMAIL_PASSWORD = 'exoaiimgqxkjobhu'

otp_store = {}
@app.route('/sitemap.xml')
def sitemap():
    return send_from_directory('static', 'sitemap.xml')
@app.route('/login')
def login():
    return render_template('login.html')
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/send-otp', methods=['POST'])
def send_otp():
    email = request.form['email']
    if not email:
        return render_template('login.html', error='Please enter your email')

    otp = str(uuid.uuid4().int)[0:6]
    otp_store[email] = otp

    msg = EmailMessage()
    msg.set_content(f"Your OTP is: {otp}")
    msg['Subject'] = 'Your OTP for AB File Converter'
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = email

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(msg)
        session['email'] = email
        return redirect(url_for('otp_verify'))
    except Exception as e:
        return render_template('login.html', error=f"Error sending email: {e}")

@app.route('/verify-otp', methods=['GET', 'POST'])
def otp_verify():
    if request.method == 'POST':
        email = session.get('email')
        otp_input = request.form['otp']
        if email and otp_store.get(email) == otp_input:
            session['logged_in'] = True
            return redirect(url_for('dashboard'))
        else:
            return render_template('otp_verify.html', error='Invalid OTP')
    return render_template('otp_verify.html')

@app.route('/dashboard')
def dashboard():
    if not session.get('logged_in'):
        return redirect(url_for('index'))
    return render_template('dashboard.html')

@app.route('/convert', methods=['POST'])
def convert_file():
    if 'file' not in request.files or 'format' not in request.form:
        return jsonify({'error': 'Missing file or format'}), 400

    file = request.files['file']
    output_format = request.form['format']
    filename = secure_filename(file.filename)
    input_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(input_path)

    try:
        ext = filename.split('.')[-1].lower()
        output_filename = f"{uuid.uuid4().hex}.{output_format}"
        output_path = os.path.join(CONVERTED_FOLDER, output_filename)

        if ext == 'pdf' and output_format in ['jpg', 'png']:
            from pdf2image import convert_from_path
            pages = convert_from_path(input_path, 300)
            pages[0].save(output_path, output_format.upper())

        elif ext == 'pdf' and output_format == 'txt':
            with open(input_path, 'rb') as pdf_file:
                reader = PyPDF2.PdfReader(pdf_file)
                text = "\n".join([page.extract_text() or '' for page in reader.pages])
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(text)

        elif ext in ['png', 'jpg', 'jpeg'] and output_format == 'pdf':
            img = Image.open(input_path)
            img.save(output_path, 'PDF')

        elif ext == 'mp3' and output_format == 'mp4':
            audio = AudioFileClip(input_path)
            audio.write_videofile(output_path, codec="libx264", fps=1)

        elif output_format == 'text':
            img = Image.open(input_path)
            text = pytesseract.image_to_string(img)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(text)

        elif output_format in ['png', 'jpeg', 'jpg', 'gif', 'bmp']:
            img = Image.open(input_path)
            img.save(output_path, output_format.upper())

        else:
            return jsonify({'error': 'Unsupported conversion'}), 400

        return send_file(output_path, as_attachment=True)

    except Exception as e:
        return jsonify({'error': f"Conversion error: {str(e)}"}), 500

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
