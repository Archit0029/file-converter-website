from flask import Flask, render_template, request, send_file
from PIL import Image
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['CONVERTED_FOLDER'] = 'converted'

# Ensure folders exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['CONVERTED_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert():
    if 'file' not in request.files:
        return "No file part"
    
    file = request.files['file']
    if file.filename == '':
        return "No selected file"
    
    if file:
        # Save original
        input_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(input_path)

        # Convert image
        filename_wo_ext = os.path.splitext(file.filename)[0]
        output_path = os.path.join(app.config['CONVERTED_FOLDER'], filename_wo_ext + '.png')
        
        try:
            with Image.open(input_path) as img:
                img = img.convert("RGB")
                img.save(output_path, "PNG")
        except Exception as e:
            return f"Error converting file: {e}"

        # Download converted file
        return send_file(output_path, as_attachment=True)

    return "Something went wrong"

if __name__ == '__main__':
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
