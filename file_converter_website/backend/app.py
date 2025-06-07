from flask import Flask, render_template, request, send_file
import os
from werkzeug.utils import secure_filename
from PIL import Image
from fpdf import FPDF
import docx

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
CONVERTED_FOLDER = 'converted'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CONVERTED_FOLDER, exist_ok=True)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert_file():
    file = request.files['file']
    target_format = request.form['target_format']
    filename = secure_filename(file.filename)
    input_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(input_path)

    base, ext = os.path.splitext(filename)
    output_filename = f"{base}_converted.{target_format}"
    output_path = os.path.join(CONVERTED_FOLDER, output_filename)

    try:
        if target_format == 'pdf':
            if ext.lower() in ['.jpg', '.png']:
                image = Image.open(input_path)
                image.save(output_path, 'PDF')
            elif ext.lower() in ['.txt']:
                pdf = FPDF()
                pdf.add_page()
                with open(input_path, 'r') as f:
                    for line in f:
                        pdf.set_font("Arial", size=12)
                        pdf.multi_cell(0, 10, line)
                pdf.output(output_path)
        elif target_format in ['jpg', 'png']:
            image = Image.open(input_path)
            image.save(output_path, target_format.upper())
        elif target_format == 'txt' and ext.lower() == '.pdf':
            output_path = input_path  # pdf to txt not implemented here
        elif target_format == 'docx' and ext.lower() == '.txt':
            doc = docx.Document()
            with open(input_path, 'r') as f:
                for line in f:
                    doc.add_paragraph(line.strip())
            doc.save(output_path)
        else:
            return "Conversion not supported.", 400
    except Exception as e:
        return str(e), 500

    return send_file(output_path, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)