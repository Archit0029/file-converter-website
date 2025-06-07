from flask import Flask, render_template, request, send_file
from PIL import Image
from fpdf import FPDF
import fitz  # PyMuPDF
import os
from zipfile import ZipFile

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
    file = request.files.get('file')
    target_format = request.form.get('target_format')

    if not file or not target_format:
        return "Missing file or target format"

    filename = file.filename
    input_ext = filename.rsplit('.', 1)[-1].lower()
    base_name = os.path.splitext(filename)[0]
    input_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(input_path)

    try:
        # JPG or PNG → PDF
        if input_ext in ['jpg', 'jpeg', 'png'] and target_format == 'pdf':
            img = Image.open(input_path)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            output_path = os.path.join(app.config['OUTPUT_FOLDER'], base_name + '.pdf')
            img.save(output_path, "PDF")
            return send_file(output_path, as_attachment=True)

        # JPG ↔ PNG
        elif input_ext in ['jpg', 'jpeg', 'png'] and target_format in ['jpg', 'png']:
            img = Image.open(input_path)
            output_path = os.path.join(app.config['OUTPUT_FOLDER'], base_name + f'.{target_format}')
            if target_format == 'jpg':
                img.convert("RGB").save(output_path, "JPEG")
            else:
                img.save(output_path, "PNG")
            return send_file(output_path, as_attachment=True)

        # TXT → PDF
        elif input_ext == 'txt' and target_format == 'pdf':
            output_path = os.path.join(app.config['OUTPUT_FOLDER'], base_name + '.pdf')
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Arial", size=12)
            with open(input_path, 'r', encoding='utf-8') as f:
                for line in f:
                    pdf.cell(200, 10, txt=line.strip(), ln=True)
            pdf.output(output_path)
            return send_file(output_path, as_attachment=True)

        # PDF → All pages → JPG/PNG
        elif input_ext == 'pdf' and target_format in ['jpg', 'png']:
            doc = fitz.open(input_path)
            image_paths = []

            for i in range(len(doc)):
                page = doc.load_page(i)
                pix = page.get_pixmap()
                img_filename = f"{base_name}_page{i+1}.{target_format}"
                img_output_path = os.path.join(app.config['OUTPUT_FOLDER'], img_filename)
                pix.save(img_output_path)
                image_paths.append(img_output_path)

            zip_path = os.path.join(app.config['OUTPUT_FOLDER'], f"{base_name}_converted.zip")
            with ZipFile(zip_path, 'w') as zipf:
                for path in image_paths:
                    zipf.write(path, arcname=os.path.basename(path))

            return send_file(zip_path, as_attachment=True)

        else:
            return "❌ Unsupported conversion requested."

    except Exception as e:
        return f"❌ Error: {str(e)}"

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
