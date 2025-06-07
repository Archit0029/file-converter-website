from flask import Flask, render_template, request, send_file
from PIL import Image
from fpdf import FPDF
import fitz  # PyMuPDF
import os
import mimetypes

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'converted'

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert():
    file = request.files['file']
    if not file:
        return "No file uploaded"

    filename = file.filename
    ext = filename.split('.')[-1].lower()
    input_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(input_path)

    base_name = os.path.splitext(filename)[0]
    output_path = ""

    try:
        if ext in ['jpg', 'jpeg']:
            img = Image.open(input_path)
            output_path = os.path.join(app.config['OUTPUT_FOLDER'], base_name + '.png')
            img.save(output_path)

        elif ext == 'png':
            img = Image.open(input_path)
            output_path = os.path.join(app.config['OUTPUT_FOLDER'], base_name + '.jpg')
            img.convert("RGB").save(output_path)

        elif ext == 'txt':
            output_path = os.path.join(app.config['OUTPUT_FOLDER'], base_name + '.pdf')
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Arial", size=12)
            with open(input_path, 'r') as f:
                for line in f:
                    pdf.cell(200, 10, txt=line.strip(), ln=True)
            pdf.output(output_path)

        elif ext == 'pdf':
            images = convert_from_path(input_path)
            output_path = os.path.join(app.config['OUTPUT_FOLDER'], base_name + '_page1.jpg')
            images[0].save(output_path, 'JPEG')  # Save first page for simplicity

        else:
            return "Unsupported file type"

        return send_file(output_path, as_attachment=True)

    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
