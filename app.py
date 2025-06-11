# app.py
from flask import Flask, request, render_template, redirect, url_for, session, send_file, flash
from flask_mail import Mail, Message
from flask_cors import CORS
import os, random, uuid
from werkzeug.utils import secure_filename
from PIL import Image

app = Flask(__name__)
app.secret_key = 'your-secret-key'
CORS(app)

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'your_email@gmail.com'
app.config['MAIL_PASSWORD'] = 'your_app_password'
mail = Mail(app)

UPLOAD_FOLDER = 'uploads'
CONVERTED_FOLDER = 'converted'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CONVERTED_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/send_otp', methods=['POST'])
def send_otp():
    email = request.form['email']
    otp = str(random.randint(1000, 9999))
    session['email'] = email
    session['otp'] = otp
    try:
        msg = Message('Your OTP Code', sender=app.config['MAIL_USERNAME'], recipients=[email])
        msg.body = f'Your OTP is: {otp}'
        mail.send(msg)
        return render_template('otp_verify.html')
    except Exception as e:
        return f"Error sending email: {e}"

@app.route('/verify_otp', methods=['POST'])
def verify_otp():
    otp_entered = request.form['otp']
    if otp_entered == session.get('otp'):
        return redirect(url_for('dashboard'))
    else:
        return "Invalid OTP. Please try again."

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/convert', methods=['POST'])
def convert():
    if 'file' not in request.files or 'format' not in request.form:
        return "Missing file or format"

    file = request.files['file']
    output_format = request.form['format']
    filename = secure_filename(file.filename)
    input_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(input_path)

    try:
        output_filename = f"{uuid.uuid4().hex}.{output_format}"
        output_path = os.path.join(CONVERTED_FOLDER, output_filename)

        if output_format in ['png', 'jpg']:
            img = Image.open(input_path)
            img.save(output_path, output_format.upper())
        elif output_format == 'txt':
            import PyPDF2
            with open(input_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                text = "\n".join(page.extract_text() for page in reader.pages)
                with open(output_path, 'w') as out:
                    out.write(text)
        elif output_format == 'mp4':
            from moviepy.editor import AudioFileClip
            audio = AudioFileClip(input_path)
            audio.write_videofile(output_path)
        elif output_format == 'txt-img':
            from PIL import ImageDraw, ImageFont
            text = open(input_path, 'r').read()
            img = Image.new('RGB', (800, 400), color=(255, 255, 255))
            d = ImageDraw.Draw(img)
            d.text((10,10), text, fill=(0,0,0))
            img.save(output_path)

        return send_file(output_path, as_attachment=True)
    except Exception as e:
        return f"Conversion error: {e}"

# Bind to Render's dynamic port
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
    
