// Variables globales
let selectedImage = null;
let selectedGrid = null;
let selectedFormat = 'square'; // Format par défaut
let originalImageData = null;
const OVERLAP = 10; // chevauchement en pixels entre tuiles (ajustable)
const SIMULATED_GUTTER = 4; // espace simulé entre les tuiles dans l'aperçu grille

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
    // Crée un canvas en mémoire pour la découpe et l'aperçu grille
    let canvasWidth, canvasHeight;
    let sourceWidth, sourceHeight, sourceX, sourceY;
    switch(selectedFormat) {
        case 'current': {
            const aspectRatio = selectedImage.width / selectedImage.height;
            if (aspectRatio > 1) {
                canvasWidth = 400;
                canvasHeight = 400 / aspectRatio;
            } else {
                canvasHeight = 400;
                canvasWidth = 400 * aspectRatio;
            }
            sourceWidth = selectedImage.width;
            sourceHeight = selectedImage.height;
            sourceX = 0;
            sourceY = 0;
            break;
        }
        case 'instagram-portrait': {
            canvasWidth = 1080;
            canvasHeight = 1350;
            const targetRatio = 4/5;
            const imgRatio = selectedImage.width / selectedImage.height;
            if (imgRatio > targetRatio) {
                sourceHeight = selectedImage.height;
                sourceWidth = selectedImage.height * targetRatio;
                sourceX = (selectedImage.width - sourceWidth) / 2;
                sourceY = 0;
            } else {
                sourceWidth = selectedImage.width;
                sourceHeight = selectedImage.width / targetRatio;
                sourceX = 0;
                sourceY = (selectedImage.height - sourceHeight) / 2;
            }
            break;
        }
        case 'instagram-landscape': {
            canvasWidth = 1080;
            canvasHeight = 566;
            const targetRatio = 1.91;
            const imgRatio = selectedImage.width / selectedImage.height;
            if (imgRatio > targetRatio) {
                sourceHeight = selectedImage.height;
                sourceWidth = selectedImage.height * targetRatio;
                sourceX = (selectedImage.width - sourceWidth) / 2;
                sourceY = 0;
            } else {
                sourceWidth = selectedImage.width;
                sourceHeight = selectedImage.width / targetRatio;
                sourceX = 0;
                sourceY = (selectedImage.height - sourceHeight) / 2;
            }
            break;
        }
        case 'square':
        default: {
            canvasWidth = 400;
            canvasHeight = 400;
            const size = Math.min(selectedImage.width, selectedImage.height);
            sourceWidth = size;
            sourceHeight = size;
            sourceX = (selectedImage.width - size) / 2;
            sourceY = (selectedImage.height - size) / 2;
            break;
        }
    }
    // Canvas en mémoire pour la découpe et l'aperçu grille
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = canvasWidth;
    previewCanvas.height = canvasHeight;
    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(
        selectedImage,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, canvasWidth, canvasHeight
    );
    // Affichage d'une safe zone (bordure intérieure) sur le canvas grille
    if (selectedFormat === 'instagram-portrait' || selectedFormat === 'instagram-landscape' || selectedFormat === 'square') {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
        ctx.lineWidth = 2;
        // 10% de marge de sécurité
        const marginX = canvasWidth * 0.10;
        const marginY = canvasHeight * 0.10;
        ctx.strokeRect(marginX, marginY, canvasWidth - 2 * marginX, canvasHeight - 2 * marginY);
        ctx.restore();
    }
    previewSection.style.display = 'block';
    previewSection.scrollIntoView({ behavior: 'smooth' });
    // Aperçu grille Instagram simulée (unique aperçu visible)
    showSimulatedGridPreview(canvasWidth, canvasHeight, previewCanvas);
}

function showSimulatedGridPreview(canvasWidth, canvasHeight, previewCanvas) {
    // Crée ou récupère le canvas d'aperçu grille
    let gridCanvas = document.getElementById('simulatedGridCanvas');
    if (!gridCanvas) {
        gridCanvas = document.createElement('canvas');
        gridCanvas.id = 'simulatedGridCanvas';
        gridCanvas.style.display = 'block';
        gridCanvas.style.margin = '24px auto 0 auto';
        gridCanvas.style.maxWidth = '100%';
        gridCanvas.style.background = '#fff';
        const previewDiv = document.querySelector('.image-preview');
        previewDiv.appendChild(gridCanvas);
    }
    // Taille d'affichage
    const gridCols = (selectedGrid === 3) ? 3 : 3;
    const gridRows = (selectedGrid === 6) ? 2 : (selectedGrid === 9 ? 3 : 1);
    const gutter = SIMULATED_GUTTER;
    const tileW = Math.floor((canvasWidth - (gridCols - 1) * gutter) / gridCols);
    const tileH = Math.floor((canvasHeight - (gridRows - 1) * gutter) / gridRows);
    gridCanvas.width = tileW * gridCols + gutter * (gridCols - 1);
    gridCanvas.height = tileH * gridRows + gutter * (gridRows - 1);
    const gctx = gridCanvas.getContext('2d');
    gctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    // Redessine chaque tuile avec le chevauchement
    for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
            let sx = col * (canvasWidth / gridCols) - (col > 0 ? OVERLAP / 2 : 0);
            let sy = row * (canvasHeight / gridRows) - (row > 0 ? OVERLAP / 2 : 0);
            let sw = (canvasWidth / gridCols) + (col > 0 ? OVERLAP / 2 : 0) + (col < gridCols - 1 ? OVERLAP / 2 : 0);
            let sh = (canvasHeight / gridRows) + (row > 0 ? OVERLAP / 2 : 0) + (row < gridRows - 1 ? OVERLAP / 2 : 0);
            if (sx < 0) sx = 0;
            if (sy < 0) sy = 0;
            if (sx + sw > canvasWidth) sw = canvasWidth - sx;
            if (sy + sh > canvasHeight) sh = canvasHeight - sy;
            gctx.save();
            gctx.beginPath();
            gctx.rect(col * (tileW + gutter), row * (tileH + gutter), tileW, tileH);
            gctx.clip();
            gctx.drawImage(
                previewCanvas,
                sx, sy, sw, sh,
                col * (tileW + gutter), row * (tileH + gutter), tileW, tileH
            );
            gctx.restore();
        }
    }
    // Ajoute le texte explicatif
    gctx.save();
    gctx.font = 'bold 16px sans-serif';
    gctx.fillStyle = 'rgba(0,0,0,0.5)';
    gctx.fillText('Aperçu grille Instagram simulée (gutter visible)', 10, 24);
    gctx.restore();
}

// Découpe de l'image
function cutImage() {
    if (!selectedImage || !selectedGrid || !selectedFormat) return;
    const pieces = [];
    let rows, cols;
    switch(selectedGrid) {
        case 3: rows = 1; cols = 3; break;
        case 6: rows = 2; cols = 3; break;
        case 9: rows = 3; cols = 3; break;
        default: return;
    }
    // Taille Grids : 1152x1440 (portrait) ou 1152x1152 (carré)
    let tileW = 1152, tileH = 1440;
    if (selectedFormat === 'square') tileH = tileW;
    if (selectedFormat === 'instagram-landscape') tileH = Math.round(tileW / 1.91);
    const finalWidth = tileW * cols;
    const finalHeight = tileH * rows;
    // Redimensionner/cropper l'image d'origine au bon ratio et à la bonne taille
    let sourceWidth, sourceHeight, sourceX, sourceY;
    let targetRatio = finalWidth / finalHeight;
    const imgRatio = selectedImage.width / selectedImage.height;
    if (imgRatio > targetRatio) {
        // Image trop large, crop horizontal
        sourceHeight = selectedImage.height;
        sourceWidth = selectedImage.height * targetRatio;
        sourceX = (selectedImage.width - sourceWidth) / 2;
        sourceY = 0;
    } else {
        // Image trop haute, crop vertical
        sourceWidth = selectedImage.width;
        sourceHeight = selectedImage.width / targetRatio;
        sourceX = 0;
        sourceY = (selectedImage.height - sourceHeight) / 2;
    }
    // Alerte si l'image d'origine est trop petite
    if (selectedImage.width < finalWidth || selectedImage.height < finalHeight) {
        alert("⚠️ L'image d'origine est plus petite que la taille finale recommandée (" + finalWidth + "x" + finalHeight + "). La qualité peut être dégradée.");
    }
    // Canvas temporaire à la taille finale
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = finalWidth;
    tempCanvas.height = finalHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(
        selectedImage,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, finalWidth, finalHeight
    );
    // Découper chaque tuile sans chevauchement
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const pieceCanvas = document.createElement('canvas');
            pieceCanvas.width = tileW;
            pieceCanvas.height = tileH;
            const pieceCtx = pieceCanvas.getContext('2d');
            pieceCtx.drawImage(
                tempCanvas,
                col * tileW,
                row * tileH,
                tileW,
                tileH,
                0, 0, tileW, tileH
            );
            pieces.push({
                canvas: pieceCanvas,
                row: row + 1,
                col: col + 1,
                index: row * cols + col + 1
            });
        }
    }
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