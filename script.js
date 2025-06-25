// Variables globales
let selectedImage = null;
let selectedGrid = null;
let selectedFormat = 'square'; // Format par défaut
let originalImageData = null;

// Éléments DOM
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const configSection = document.getElementById('configSection');
const previewSection = document.getElementById('previewSection');
const resultsSection = document.getElementById('resultsSection');
const previewCanvas = document.getElementById('previewCanvas');
const cutButton = document.getElementById('cutButton');
const gridResults = document.getElementById('gridResults');
const downloadAllBtn = document.getElementById('downloadAllBtn');

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

function initializeEventListeners() {
    // Upload area
    uploadArea.addEventListener('click', () => imageInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // File input
    imageInput.addEventListener('change', handleFileSelect);
    
    // Grid selection
    document.querySelectorAll('.grid-option').forEach(option => {
        option.addEventListener('click', () => selectGrid(option));
    });
    
    // Format selection
    document.querySelectorAll('.format-option').forEach(option => {
        option.addEventListener('click', () => selectFormat(option));
    });
    
    // Cut button
    cutButton.addEventListener('click', cutImage);
    
    // Download all button
    downloadAllBtn.addEventListener('click', downloadAllImages);
}

// Gestion du drag & drop
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            processImageFile(file);
        } else {
            alert('Veuillez sélectionner une image valide (JPG ou PNG)');
        }
    }
}

// Gestion de la sélection de fichier
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processImageFile(file);
    }
}

function processImageFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            selectedImage = img;
            originalImageData = {
                width: img.width,
                height: img.height,
                file: file
            };
            
            // Afficher la section de configuration
            configSection.style.display = 'block';
            configSection.scrollIntoView({ behavior: 'smooth' });
            
            // Réinitialiser les sélections
            document.querySelectorAll('.grid-option').forEach(option => {
                option.classList.remove('selected');
            });
            document.querySelectorAll('.format-option').forEach(option => {
                option.classList.remove('selected');
            });
            selectedGrid = null;
            selectedFormat = 'square'; // Format par défaut
            
            // Sélectionner le format carré par défaut
            document.querySelector('.format-option[data-format="square"]').classList.add('selected');
            
            // Masquer les sections suivantes
            previewSection.style.display = 'none';
            resultsSection.style.display = 'none';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Sélection de la grille
function selectGrid(option) {
    // Retirer la sélection précédente
    document.querySelectorAll('.grid-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Sélectionner la nouvelle option
    option.classList.add('selected');
    selectedGrid = parseInt(option.dataset.grid);
    
    // Afficher l'aperçu si le format est aussi sélectionné
    if (selectedFormat) {
        showPreview();
    }
}

// Sélection du format
function selectFormat(option) {
    // Retirer la sélection précédente
    document.querySelectorAll('.format-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Sélectionner la nouvelle option
    option.classList.add('selected');
    selectedFormat = option.dataset.format;
    
    // Afficher l'aperçu si la grille est aussi sélectionnée
    if (selectedGrid) {
        showPreview();
    }
}

function showPreview() {
    if (!selectedImage || !selectedGrid || !selectedFormat) return;
    
    const ctx = previewCanvas.getContext('2d');
    
    // Adapter le canvas selon le format
    let canvasWidth, canvasHeight;
    let sourceWidth, sourceHeight, sourceX, sourceY;
    
    switch(selectedFormat) {
        case 'current':
            // Format actuel - garder les proportions originales
            const aspectRatio = selectedImage.width / selectedImage.height;
            if (aspectRatio > 1) {
                // Image plus large que haute
                canvasWidth = 400;
                canvasHeight = 400 / aspectRatio;
            } else {
                // Image plus haute que large
                canvasHeight = 400;
                canvasWidth = 400 * aspectRatio;
            }
            sourceWidth = selectedImage.width;
            sourceHeight = selectedImage.height;
            sourceX = 0;
            sourceY = 0;
            break;
            
        case 'instagram':
            // Format Instagram 4:5
            canvasWidth = 400;
            canvasHeight = 500; // Ratio 4:5
            const instagramRatio = 4/5;
            const imageRatio = selectedImage.width / selectedImage.height;
            
            if (imageRatio > instagramRatio) {
                // Image plus large, crop horizontalement
                sourceWidth = selectedImage.height * instagramRatio;
                sourceHeight = selectedImage.height;
                sourceX = (selectedImage.width - sourceWidth) / 2;
                sourceY = 0;
            } else {
                // Image plus haute, crop verticalement
                sourceWidth = selectedImage.width;
                sourceHeight = selectedImage.width / instagramRatio;
                sourceX = 0;
                sourceY = (selectedImage.height - sourceHeight) / 2;
            }
            break;
            
        case 'square':
        default:
            // Format carré
            canvasWidth = 400;
            canvasHeight = 400;
            const size = Math.min(selectedImage.width, selectedImage.height);
            sourceWidth = size;
            sourceHeight = size;
            sourceX = (selectedImage.width - size) / 2;
            sourceY = (selectedImage.height - size) / 2;
            break;
    }
    
    // Redimensionner le canvas
    previewCanvas.width = canvasWidth;
    previewCanvas.height = canvasHeight;
    
    // Dessiner l'image
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(
        selectedImage,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, canvasWidth, canvasHeight
    );
    
    // Afficher la section d'aperçu
    previewSection.style.display = 'block';
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

// Découpe de l'image
function cutImage() {
    if (!selectedImage || !selectedGrid || !selectedFormat) return;
    
    const pieces = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Déterminer la configuration de la grille
    let rows, cols;
    switch(selectedGrid) {
        case 3:
            rows = 1; cols = 3;
            break;
        case 6:
            rows = 2; cols = 3;
            break;
        case 9:
            rows = 3; cols = 3;
            break;
        default:
            return;
    }
    
    // Calculer les dimensions de l'image finale selon le format
    let finalWidth, finalHeight;
    let sourceWidth, sourceHeight, sourceX, sourceY;
    
    switch(selectedFormat) {
        case 'current':
            // Garder les proportions originales
            const aspectRatio = selectedImage.width / selectedImage.height;
            if (aspectRatio > 1) {
                finalWidth = selectedImage.width;
                finalHeight = selectedImage.height;
            } else {
                finalWidth = selectedImage.width;
                finalHeight = selectedImage.height;
            }
            sourceWidth = selectedImage.width;
            sourceHeight = selectedImage.height;
            sourceX = 0;
            sourceY = 0;
            break;
            
        case 'instagram':
            // Format Instagram 4:5
            const instagramRatio = 4/5;
            const imageRatio = selectedImage.width / selectedImage.height;
            
            if (imageRatio > instagramRatio) {
                // Image plus large, crop horizontalement
                finalWidth = selectedImage.height * instagramRatio;
                finalHeight = selectedImage.height;
                sourceWidth = finalWidth;
                sourceHeight = finalHeight;
                sourceX = (selectedImage.width - sourceWidth) / 2;
                sourceY = 0;
            } else {
                // Image plus haute, crop verticalement
                finalWidth = selectedImage.width;
                finalHeight = selectedImage.width / instagramRatio;
                sourceWidth = finalWidth;
                sourceHeight = finalHeight;
                sourceX = 0;
                sourceY = (selectedImage.height - sourceHeight) / 2;
            }
            break;
            
        case 'square':
        default:
            // Format carré
            const size = Math.min(selectedImage.width, selectedImage.height);
            finalWidth = size;
            finalHeight = size;
            sourceWidth = size;
            sourceHeight = size;
            sourceX = (selectedImage.width - size) / 2;
            sourceY = (selectedImage.height - size) / 2;
            break;
    }
    
    // Taille de chaque morceau
    const pieceWidth = finalWidth / cols;
    const pieceHeight = finalHeight / rows;
    
    // Créer chaque morceau
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const pieceCanvas = document.createElement('canvas');
            const pieceCtx = pieceCanvas.getContext('2d');
            
            pieceCanvas.width = pieceWidth;
            pieceCanvas.height = pieceHeight;
            
            // Dessiner le morceau
            pieceCtx.drawImage(
                selectedImage,
                sourceX + col * pieceWidth,
                sourceY + row * pieceHeight,
                pieceWidth,
                pieceHeight,
                0, 0, pieceWidth, pieceHeight
            );
            
            pieces.push({
                canvas: pieceCanvas,
                row: row + 1,
                col: col + 1,
                index: row * cols + col + 1
            });
        }
    }
    
    // Afficher les résultats
    displayResults(pieces);
}

// Affichage des résultats
function displayResults(pieces) {
    gridResults.innerHTML = '';
    gridResults.className = `grid-results grid-${selectedGrid}`;
    
    pieces.forEach(piece => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        const img = document.createElement('img');
        img.src = piece.canvas.toDataURL('image/png');
        img.alt = `Morceau ${piece.index}`;
        
        const filename = document.createElement('div');
        filename.className = 'filename';
        filename.textContent = `piece_${piece.index}.png`;
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn btn-download';
        downloadBtn.textContent = 'Télécharger';
        downloadBtn.onclick = () => downloadImage(piece.canvas, `piece_${piece.index}.png`);
        
        resultItem.appendChild(img);
        resultItem.appendChild(filename);
        resultItem.appendChild(downloadBtn);
        
        gridResults.appendChild(resultItem);
    });
    
    // Afficher la section des résultats
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Téléchargement d'une image individuelle
function downloadImage(canvas, filename) {
    canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 'image/png');
}

// Téléchargement de toutes les images (ZIP)
async function downloadAllImages() {
    try {
        // Vérifier si JSZip est disponible
        if (typeof JSZip === 'undefined') {
            // Fallback: télécharger les images une par une
            const downloadButtons = document.querySelectorAll('.btn-download');
            downloadButtons.forEach(btn => btn.click());
            return;
        }
        
        const zip = new JSZip();
        const pieces = document.querySelectorAll('.result-item img');
        
        pieces.forEach((img, index) => {
            // Convertir l'image en blob
            fetch(img.src)
                .then(res => res.blob())
                .then(blob => {
                    zip.file(`piece_${index + 1}.png`, blob);
                });
        });
        
        // Générer et télécharger le ZIP
        const content = await zip.generateAsync({type: 'blob'});
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'instagram_grid.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Erreur lors de la création du ZIP:', error);
        // Fallback: télécharger les images une par une
        const downloadButtons = document.querySelectorAll('.btn-download');
        downloadButtons.forEach(btn => btn.click());
    }
}

// Fonction utilitaire pour redimensionner une image
function resizeImage(img, maxWidth, maxHeight) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    let { width, height } = img;
    
    // Calculer les nouvelles dimensions
    if (width > height) {
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
    } else {
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
}

// Fonction utilitaire pour créer une image carrée (crop centré)
function cropToSquare(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const size = Math.min(img.width, img.height);
    const offsetX = (img.width - size) / 2;
    const offsetY = (img.height - size) / 2;
    
    canvas.width = size;
    canvas.height = size;
    
    ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
    return canvas;
} 