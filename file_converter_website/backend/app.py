from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import uuid
from PIL import Image

app = Flask(__name__)
CORS(app)

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
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
