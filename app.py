from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from PIL import Image
import uuid

app = Flask(__name__)
CORS(app)  # Allow frontend access

UPLOAD_FOLDER = 'uploads'
CONVERTED_FOLDER = 'converted'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CONVERTED_FOLDER, exist_ok=True)

@app.route('/')
def home():
    return "AB file converter backend is running."

@app.route('/convert', methods=['POST'])
def convert_file():
    if 'file' not in request.files or 'format' not in request.form:
        return jsonify({'error': 'Missing file or format'}), 400

    file = request.files['file']
    output_format = request.form['format']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filename = secure_filename(file.filename)
    input_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(input_path)

    name, ext = os.path.splitext(filename)
    output_filename = f"{name}_{uuid.uuid4().hex}.{output_format}"
    output_path = os.path.join(CONVERTED_FOLDER, output_filename)

    try:
        img = Image.open(input_path)
        img.save(output_path, output_format.upper())
        return send_file(output_path, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
