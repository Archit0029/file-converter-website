from flask import Flask, render_template, request, send_file
import os

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert_file():
    # Placeholder for conversion logic
    return "File converted (placeholder)"

if __name__ == '__main__':
    app.run(debug=True)
