import os
from flask_cors import CORS
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from PIL import Image, ImageDraw, ImageFont
from flask import send_from_directory
import base64
from datetime import datetime


app = Flask(__name__)
CORS(app)


#Dossier pour stocker les fichiers
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
SAVED_MEMES_FOLDER = os.path.join(os.getcwd(), 'saved_memes')
os.makedirs(SAVED_MEMES_FOLDER, exist_ok=True)


#Extensions autorisées
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

#Vérifie si le fichier a une extension valide
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

#Route de test
@app.route("/")
def hello():
    return "Flask backend opérationnel"

# Route de traitement des images
@app.route("/upload", methods=["POST"])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'Aucun fichier envoyé'}), 400

    file = request.files['image']
    text = request.form.get('text', '')  # Récupère le texte à ajouter

    if file.filename == '':
        return jsonify({'error': 'Fichier sans nom'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)

        # Ajoute le texte sur l'image
        try:
            image = Image.open(save_path)
            draw = ImageDraw.Draw(image)

            # Utiliser une police par défaut 
            try:
                font = ImageFont.truetype("arial.ttf", 40)
            except:
                font = ImageFont.load_default()

            # Position du texte : en haut à gauche
            draw.text((10, 10), text, fill="white", font=font)

            # Nom du fichier modifié
            edited_filename = f"edited_{filename}"
            edited_path = os.path.join(app.config['UPLOAD_FOLDER'], edited_filename)
            image.save(edited_path)

            return jsonify({
                'message': 'Image éditée avec succès',
                'original': f'/uploads/{filename}',
                'edited': f'/uploads/{edited_filename}'
            })

        except Exception as e:
            return jsonify({'error': f'Erreur lors de l\'édition: {str(e)}'}), 500

    return jsonify({'error': 'Format de fichier non autorisé'}), 400

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route("/save", methods=["POST"])
def save_meme():
    data = request.get_json()
    base64_image = data.get("image")

    if not base64_image:
        return jsonify({"error": "Aucune image reçue"}), 400

    try:
        # Nettoyer l'en-tête data:image/png;base64,...
        header, encoded = base64_image.split(",", 1)
        image_data = base64.b64decode(encoded)

        filename = f"meme_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        filepath = os.path.join(SAVED_MEMES_FOLDER, filename)

        with open(filepath, "wb") as f:
            f.write(image_data)

        return jsonify({"message": "Image enregistrée", "filename": filename})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/gallery", methods=["GET"])
def get_gallery():
    try:
        files = os.listdir(SAVED_MEMES_FOLDER)
        urls = [f"/saved_memes/{file}" for file in files if file.endswith(".png")]
        return jsonify(urls)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/saved_memes/<path:filename>")
def serve_saved_meme(filename):
    return send_from_directory(SAVED_MEMES_FOLDER, filename)

#Lancer le serveur
if __name__ == "__main__":
    app.run(debug=True)
