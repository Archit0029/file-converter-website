from flask import Flask, render_template, request, send_from_directory, redirect, url_for, flash
from werkzeug.utils import secure_filename
from PIL import Image
from fpdf import FPDF
import fitz  # PyMuPDF
import os
from zipfile import ZipFile

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Needed for flash messages

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'static/converted'

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert():
    file = request.files.get('file')
    target_format = request.form.get('target_format')

    if not file or not target_format:
        flash("❌ Missing file or target format")
        return redirect(url_for('index'))

    filename = secure_filename(file.filename)
    input_ext = filename.rsplit('.', 1)[-1].lower()
    base_name = os.path.splitext(filename)[0]
    input_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(input_path)

    try:
        # Image (JPG/PNG) → PDF
        if input_ext in ['jpg', 'jpeg', 'png'] and target_format == 'pdf':
            img = Image.open(input_path)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            output_file = f"{base_name}.pdf"
            output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_file)
            img.save(output_path, "PDF")
        
        # JPG ↔ PNG
        elif input_ext in ['jpg', 'jpeg', 'png'] and target_format in ['jpg', 'png']:
            img = Image.open(input_path)
            output_file = f"{base_name}.{target_format}"
            output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_file)
            if target_format == 'jpg':
                img.convert("RGB").save(output_path, "JPEG")
            else:
                img.save(output_path, "PNG")

        # TXT → PDF
        elif input_ext == 'txt' and target_format == 'pdf':
            output_file = f"{base_name}.pdf"
            output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_file)
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Arial", size=12)
            with open(input_path, 'r', encoding='utf-8') as f:
                for line in f:
                    pdf.cell(200, 10, txt=line.strip(), ln=True)
            pdf.output(output_path)

        # PDF → All pages → JPG/PNG
        elif input_ext == 'pdf' and target_format in ['jpg', 'png']:
            doc = fitz.open(input_path)
            image_paths = []
            for i in range(len(doc)):
                page = doc.load_page(i)
                pix = page.get_pixmap()
                img_file = f"{base_name}_page{i+1}.{target_format}"
                img_path = os.path.join(app.config['OUTPUT_FOLDER'], img_file)
                pix.save(img_path)
                image_paths.append(img_path)

            zip_name = f"{base_name}_images.zip"
            zip_path = os.path.join(app.config['OUTPUT_FOLDER'], zip_name)
            with ZipFile(zip_path, 'w') as zipf:
                for img_path in image_paths:
                    zipf.write(img_path, arcname=os.path.basename(img_path))

            output_file = zip_name
            output_path = zip_path

        else:
            flash("❌ Unsupported file type or conversion format.")
            return redirect(url_for('index'))

        flash("✅ File converted successfully!")
        return render_template('index.html', download_url=url_for('static', filename=f"converted/{output_file}"))

    except Exception as e:
        flash(f"❌ Error during conversion: {str(e)}")
        return redirect(url_for('index'))

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
