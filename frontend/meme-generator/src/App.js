import React, { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [textColor, setTextColor] = useState("#ffffff");
  const [contrast, setContrast] = useState(100);
  const [image, setImage] = useState(null);
  const [text, setText] = useState("Votre texte ici");
  const [textPos, setTextPos] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);

  const [gallery, setGallery] = useState([]);
  const [showGallery, setShowGallery] = useState(false);

  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const maxWidth = 600;
      const scale = Math.min(1, maxWidth / img.width);
      const width = img.width * scale;
      const height = img.height * scale;

      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.filter = `contrast(${contrast}%)`;
      ctx.drawImage(img, 0, 0, width, height);
      ctx.filter = "none";

      ctx.font = "30px Arial";
      ctx.fillStyle = textColor;
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.textAlign = "center";
      ctx.strokeText(text, textPos.x, textPos.y);
      ctx.fillText(text, textPos.x, textPos.y);
;
    };

    img.src = URL.createObjectURL(image);
    imgRef.current = img;
  }, [image, text, textColor, contrast, textPos]);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTextPos({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL();
    const link = document.createElement("a");
    link.download = "meme.png";
    link.href = url;
    link.click();
  };

  const handleSaveToBackend = async () => {
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL("image/png");

    try {
      const response = await fetch("http://127.0.0.1:5000/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ image: imageData })
      });

      const result = await response.json();
      if (result.message) {
        alert("Image enregistrée avec succès !");
      } else {
        alert("Erreur lors de l'enregistrement");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de communication avec le serveur");
    }
  };

  const handleShowGallery = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/gallery");
      const images = await response.json();
      setGallery(images);
      setShowGallery(true);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la récupération de la galerie");
    }
  };

  return (
    <div className="container">
      <h2>Générateur de Mèmes – Aperçu en temps réel</h2>

      <input type="file" accept="image/*" onChange={handleImageChange} />
      <input
        type="text"
        value={text}
        onChange={handleTextChange}
        placeholder="Entrez le texte"
      />

      <label style={{ marginTop: "10px", display: "block" }}>
        Couleur du texte :
        <input
          type="color"
          value={textColor}
          onChange={(e) => setTextColor(e.target.value)}
          style={{ marginLeft: "10px", verticalAlign: "middle" }}
        />
      </label>

      <label style={{ marginTop: "10px", display: "block" }}>
        Contraste :
        <input
          type="range"
          min="0"
          max="200"
          value={contrast}
          onChange={(e) => setContrast(Number(e.target.value))}
          style={{ width: "300px", marginLeft: "10px" }}
        /> {contrast}%
      </label>

      <canvas
        ref={canvasRef}
        className="canvas"
        style={{ cursor: "move" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {image && (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "20px" }}>
          <button onClick={handleDownload}>Télécharger</button>
          <button onClick={handleSaveToBackend}>Enregistrer l'image</button>
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <button className="gallery-button" onClick={handleShowGallery}>Afficher la galerie</button>
      </div>

      {showGallery && (
        <div style={{ marginTop: "30px" }}>
          <h3>Galerie des Mèmes enregistrés</h3>
          <div className="gallery">
            {gallery.map((imgUrl, idx) => {
              const fullUrl = `http://127.0.0.1:5000${imgUrl}`;
              const encodedUrl = encodeURIComponent(fullUrl);

              return (
                <div key={idx} className="gallery-item">
                  <img
                    src={fullUrl}
                    alt={`meme-${idx}`}
                  />
                  <div>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Partager Facebook
                    </a>
                    <a
                      href={`https://wa.me/?text=${encodedUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(fullUrl);
                        alert("Lien copié dans le presse-papiers");
                      }}
                    >
                      Copier
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
