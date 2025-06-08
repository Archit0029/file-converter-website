from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from io import BytesIO
from PIL import Image
from pydub import AudioSegment
from fpdf import FPDF

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def home():
    return "AB File Converter Backend is running."

@app.route('/convert', methods=['POST'])
def convert():
    if 'file' not in request.files or 'format' not in request.form:
        return jsonify({"error": "File and format required"}), 400

    file = request.files['file']
    target_format = request.form['format'].lower()
    filename = secure_filename(file.filename)
    input_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(input_path)

    name, ext = os.path.splitext(filename)
    output_path = os.path.join(UPLOAD_FOLDER, f"{name}.{target_format}")

    try:
        if target_format in ['jpg', 'png']:
            img = Image.open(input_path)
            img.save(output_path, format=target_format.upper())

        elif target_format in ['mp3', 'wav']:
            sound = AudioSegment.from_file(input_path)
            sound.export(output_path, format=target_format)

        elif target_format == 'pdf':
            img = Image.open(input_path).convert('RGB')
            img.save(output_path, format='PDF')

        elif ext.lower() == '.txt' and target_format == 'pdf':
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Arial", size=12)
            with open(input_path, 'r') as f:
                for line in f:
                    pdf.cell(200, 10, txt=line.strip(), ln=True)
            pdf.output(output_path)

        else:
            return jsonify({"error": "Unsupported conversion"}), 400

        return send_file(output_path, as_attachment=True)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        try:
            os.remove(input_path)
        except:
            pass

if __name__ == '__main__':
    app.run(debug=True, port=5000)
