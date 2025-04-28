const img = document.getElementById("freak");
const music = document.getElementById("music");
const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
const colorPicker2 = document.getElementById("colorPicker2");
const brushSizeInput = document.getElementById("brushSize");
const markerOpacityInput = document.getElementById("markerOpacity");
const markerOpacityOption = document.getElementById("markerOpacityOption");
const sidebar = document.getElementById("sidebar");
const galleryModal = document.getElementById("galleryModal");
const galleryGrid = document.getElementById("galleryGrid");
const noDrawings = document.getElementById("noDrawings");
const toast = document.getElementById("toast");
const volumeControl = document.getElementById("volumeControl");
const toggleMusicBtn = document.getElementById("toggleMusic");
const saveDrawingBtn = document.getElementById("saveDrawing");
const drawingNameInput = document.getElementById("drawingName");
const glowEffectToggle = document.getElementById("glowEffect");
const rainbowModeToggle = document.getElementById("rainbowMode");

let isDragging = false;
let offsetX, offsetY;
let lastX, lastY;
let currentTool = 'pencil';
let currentColor = "#ffffff";
let brushSize = 2;
let markerOpacity = 0.5;
let isDrawing = false;
let musicPlaying = false;
let glowEffect = false;
let rainbowMode = false;
let rainbowHue = 0;

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    redrawSavedPaths();
}

let drawingPaths = [];
let currentPath = null;

function initApp() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    initEventListeners();

    music.volume = volumeControl.value / 100;

    loadGallery();
}

function initEventListeners() {
    img.addEventListener("mousedown", startDragging);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", stopDragging);
    document.addEventListener("dragstart", (e) => e.preventDefault());

    document.querySelectorAll('.sidebar .menu-button[data-tool]').forEach(button => {
        button.addEventListener('click', function () {
            setActiveTool(this.getAttribute('data-tool'));



            document.querySelectorAll('.bottom-menu .menu-item[data-tool]').forEach(item => {
                if (item.getAttribute('data-tool') === this.getAttribute('data-tool')) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        });
    });

    document.querySelectorAll('.bottom-menu .menu-item[data-tool]').forEach(item => {
        item.addEventListener('click', function () {
            setActiveTool(this.getAttribute('data-tool'));

            document.querySelectorAll('.bottom-menu .menu-item[data-tool]').forEach(menuItem => {
                menuItem.classList.remove('active');
            });
            this.classList.add('active');

            document.querySelectorAll('.sidebar .menu-button[data-tool]').forEach(button => {
                if (button.getAttribute('data-tool') === this.getAttribute('data-tool')) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        });
    });

    colorPicker.addEventListener("input", updateColor);
    colorPicker2.addEventListener("input", updateColor);

    brushSizeInput.addEventListener("input", function () {
        brushSize = parseInt(this.value);
    });

    markerOpacityInput.addEventListener("input", function () {
        markerOpacity = parseInt(this.value) / 100;
    });


    document.getElementById("openGallery").addEventListener("click", openGallery);
    document.getElementById("closeGallery").addEventListener("click", closeGallery);
    document.getElementById("quiackGallery").addEventListener("click", openGallery);

    document.getElementById("clearAll").addEventListener("click", clearCanvas);

    document.getElementById("quickSave").addEventListener("click", quickSave);

    volumeControl.addEventListener("input", function () {
        music.volume = this.value / 100;
    });

    toggleMusicBtn.addEventListener("click", toggleMusic);

    saveDrawingBtn.addEventListener("click", saveDrawing);

    glowEffectToggle.addEventListener("change", function () {
        glowEffect = this.checked;
    });

    rainbowModeToggle.addEventListener("change", function () {
        rainbowMode = this.checked;
    });
}

function startDragging(e) {
    isDragging = true;
    offsetX = e.clientX - img.offsetLeft;
    offsetY = e.clientY - img.offsetTop;
    img.style.cursor = "grabbing";

    currentPath = {
        tool: currentTool,
        color: rainbowMode ? getRandomColor() : currentColor,
        size: brushSize,
        opacity: markerOpacity,
        glow: glowEffect,
        points: []
    };

    lastX = img.offsetLeft + img.width / 2;
    lastY = img.offsetTop + img.height / 2;

    currentPath.points.push({
        x: lastX,
        y: lastY
    });
}

function drag(e) {
    if (isDragging) {
        const containerRect = canvas.getBoundingClientRect();
        const imgRect = img.getBoundingClientRect();

        let newLeft = e.clientX - offsetX;
        let newTop = e.clientY - offsetY;

        if (newLeft < 0) {
            newLeft = 0;
        }
        if (newLeft + imgRect.width > containerRect.width) {
            newLeft = containerRect.width - imgRect.width;
        }
        if (newTop < 0) {
            newTop = 0;
        }
        if (newTop + imgRect.height > containerRect.height) {
            newTop = containerRect.height - imgRect.height;
        }

        img.style.left = newLeft + "px";
        img.style.top = newTop + "px";

        const currentX = newLeft + img.width / 2;
        const currentY = newTop + img.height / 2;

        currentPath.points.push({
            x: currentX,
            y: currentY
        });

        drawLine(lastX, lastY, currentX, currentY, currentPath);

        lastX = currentX;
        lastY = currentY;

        if (rainbowMode) {
            rainbowHue = (rainbowHue + 1) % 360;
            currentPath.color = `hsl(${rainbowHue}, 100%, 50%)`;
        }
    }
}

function stopDragging() {
    if (isDragging) {
        isDragging = false;
        img.style.cursor = "grab";

        if (currentPath && currentPath.points.length > 1) {
            drawingPaths.push(currentPath);
            currentPath = null;
        }
    }
}

function drawLine(fromX, fromY, toX, toY, path) {
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);

    if (path.tool === 'pencil') {
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.size;
        if (path.glow) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = path.color;
        } else {
            ctx.shadowBlur = 0;
        }
    }
    else if (path.tool === 'marker') {
        ctx.strokeStyle = path.color.startsWith('#') ?
            hexToRgba(path.color, path.opacity) : path.color;
        ctx.lineWidth = path.size * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (path.glow) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = path.color;
        } else {
            ctx.shadowBlur = 0;
        }
    }
    else if (path.tool === 'eraser') {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = path.size * 3;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 0;
    }
    else if (path.tool === 'spray') {

        const density = path.size * 2;
        const radius = path.size * 2;

        for (let i = 0; i < density; i++) {
            const offsetX = (Math.random() - 0.5) * radius * 2;
            const offsetY = (Math.random() - 0.5) * radius * 2;
            const sprayX = toX + offsetX;
            const sprayY = toY + offsetY;

            ctx.beginPath();
            ctx.arc(sprayX, sprayY, 1, 0, Math.PI * 2);
            ctx.fillStyle = path.color;
            if (path.glow) {
                ctx.shadowBlur = 5;
                ctx.shadowColor = path.color;
            } else {
                ctx.shadowBlur = 0;
            }
            ctx.fill();
        }
        return;
    }

    ctx.stroke();
}

function setActiveTool(tool) {
    currentTool = tool;

    if (tool === 'marker') {
        markerOpacityOption.style.display = 'block';
    } else {
        markerOpacityOption.style.display = 'none';
    }
}

function updateColor(e) {
    currentColor = e.target.value;

    colorPicker.value = currentColor;
    colorPicker2.value = currentColor;
}

function clearCanvas() {
    if (confirm("are you sure you want to clear the canvas? this cannot be undone.")) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawingPaths = [];
        showToast("Canvas cleared");
    }
}

function redrawSavedPaths() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawingPaths.forEach(path => {
        if (path.points.length < 2) return;

        for (let i = 1; i < path.points.length; i++) {
            const from = path.points[i - 1];
            const to = path.points[i];
            drawLine(from.x, from.y, to.x, to.y, path);
        }
    });
}

function saveDrawing() {
    const name = drawingNameInput.value.trim() || `Drawing ${new Date().toLocaleString()}`;

    if (drawingPaths.length === 0) {
        showToast("nothing to save! draw something first!!");
        return;
    }

    const dataURL = canvas.toDataURL('image/png');

    let savedDrawings = JSON.parse(localStorage.getItem('freakydrawGallery')) || [];

    savedDrawings.push({
        id: Date.now(),
        name: name,
        date: new Date().toISOString(),
        thumbnail: dataURL,
        paths: drawingPaths
    });

    localStorage.setItem('freakydrawGallery', JSON.stringify(savedDrawings));

    showToast(`drawing saved as: ${name}`);
    drawingNameInput.value = '';

    loadGallery();
}

function quickSave() {
    drawingNameInput.value = `quick Drawing ${new Date().toLocaleTimeString()}`;
    saveDrawing();
}

function loadDrawing(id) {
    const savedDrawings = JSON.parse(localStorage.getItem('freakydrawGallery')) || [];
    const drawing = savedDrawings.find(d => d.id == id);

    if (drawing) {
        drawingPaths = drawing.paths;
        redrawSavedPaths();
        closeGallery();
        showToast(`loaded drawing: ${drawing.name}`);
    } else {
        showToast("drawing not found..");
    }
}

function deleteDrawing(id) {
    if (confirm("are you sure you want to delete this drawing?")) {
        let savedDrawings = JSON.parse(localStorage.getItem('freakydrawGallery')) || [];
        savedDrawings = savedDrawings.filter(d => d.id !== id);
        localStorage.setItem('freakydrawGallery', JSON.stringify(savedDrawings));
        loadGallery();
        showToast("Drawing deleted");
    }
}

function openGallery() {
    galleryModal.style.display = "block";
    loadGallery();
}

function closeGallery() {
    galleryModal.style.display = "none";
}

function loadGallery() {
    galleryGrid.innerHTML = '';
    const savedDrawings = JSON.parse(localStorage.getItem('freakydrawGallery')) || [];

    if (savedDrawings.length === 0) {
        noDrawings.style.display = "block";
    } else {
        noDrawings.style.display = "none";
        savedDrawings.forEach(drawing => {
            const item = document.createElement('div');
            item.classList.add('gallery-item');
            item.innerHTML = `
                        <img src="${drawing.thumbnail}" alt="${drawing.name}">
                        <div class="gallery-item-overlay">
                            <p>${drawing.name}</p>
                            <div class="gallery-item-buttons">
                                <button class="gallery-item-button" onclick="loadDrawing(${drawing.id})">Load</button>
                                <button class="gallery-item-button" onclick="deleteDrawing(${drawing.id})">Delete</button>
                            </div>
                        </div>
                    `;
            galleryGrid.appendChild(item);
        });
    }
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.opacity = 1;
    setTimeout(() => {
        toast.style.opacity = 0;
    }, 3000);
}

function toggleMusic() {
    if (musicPlaying) {
        music.pause();
        toggleMusicBtn.textContent = "▶";
    } else {
        music.play();
        toggleMusicBtn.textContent = "||";
    }
    musicPlaying = !musicPlaying;
}

function hexToRgba(hex, opacity) {
    hex = hex.replace("#", "");
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

initApp();
