document.addEventListener('DOMContentLoaded', initializeFabricGenerator);

// --- SECTION A: GLOBAL DATA AND VARIABLES ---

let threadingData = [];
let pegPlanData = [];

// DOM Elements (ThreadSize से संबंधित वैरियेबल्स हटा दिए गए हैं)
let canvas, ctx;
let warpColorPicker, weftColorPicker, weaveTypeSelect, gridSizeInput; 
let threadingContainer, pegPlanContainer;
let endsPerDentInput, reedSizeInput, warpCountInput, weftCountInput;

// Output and New Manual Input
let epiOutputSpan, ppiOutputSpan;
let manualPpiInput; 


const PATTERNS = {
    plain: {
        threading: [1, 2],
        pegPlan: [[1, 0], [0, 1]]
    },
    twill: {
        threading: [1, 2, 3, 4],
        pegPlan: [
            [1,0,0,0],
            [0,1,0,0],
            [0,0,1,0],
            [0,0,0,1]
        ]
    }
};

// --- SECTION B: HELPER FUNCTIONS (Color Conversion and Diameter) ---

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
}

function calculateDiameterFactor(count) {
    if (count < 10) return 1 / Math.sqrt(10); 
    return 1 / Math.sqrt(count); 
}

// --- SECTION C: DRAFTING GRID GENERATION ---

function createGrids(size) {
    // Harness and Peg Plan Grids को रीसेट करें
    threadingContainer.innerHTML = '';
    pegPlanContainer.innerHTML = '';
    
    threadingData = Array(size).fill(0).map((_, i) => (i % size) + 1); // Default straight draft
    pegPlanData = Array(size).fill(0).map(() => Array(size).fill(0)); // Empty Peg Plan

    // 1. Threading Plan
    threadingData.forEach((harnessNumber, index) => {
        const input = document.createElement('input');
        input.type = 'number';
        input.value = harnessNumber;
        input.min = 1;
        input.max = size;
        input.addEventListener('input', function() {
            threadingData[index] = parseInt(this.value) || 1;
            drawFabric();
        });
        threadingContainer.appendChild(input);
    });

    // 2. Peg Plan (Matrix)
    pegPlanData.forEach((row, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('peg-plan-row');

        row.forEach((value, colIndex) => {
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = value === 1;
            input.addEventListener('change', function() {
                pegPlanData[rowIndex][colIndex] = this.checked ? 1 : 0;
                drawFabric();
            });
            rowDiv.appendChild(input);
        });
        pegPlanContainer.appendChild(rowDiv);
    });

    drawFabric();
}

function regenerateGrids() {
    const newSize = parseInt(gridSizeInput.value);
    if (newSize < 1 || newSize > 12) {
        alert("Grid Size must be between 1 and 12.");
        gridSizeInput.value = 4; // Reset to default
        return;
    }
    createGrids(newSize);
}

// --- SECTION D: CONSTRUCTION CALCULATION (Thread Thickness Removed) ---

function calculateConstruction() {
    if (!epiOutputSpan || !ppiOutputSpan || !manualPpiInput) return;

    // BASE_THICKNESS अब स्थिर है (8mm के अनुरूप, लेकिन अब यह केवल स्केलिंग बेस है)
    const BASE_THICKNESS = 8; 
    const WARP_COUNT = parseInt(warpCountInput.value) || 40; 
    const WEFT_COUNT = parseInt(weftCountInput.value) || 40; 
    
    // 1. EPI inputs (Stockport System)
    const ENDS_PER_DENT = parseInt(endsPerDentInput.value) || 2;
    // Reed Size (Dents per 2 inches)
    const REED_SIZE_STOCKPORT = parseInt(reedSizeInput.value) || 60; 

    // 2. PPI input (Manual Input)
    const MANUAL_PPI = parseInt(manualPpiInput.value) || 60; 

    // --- EPI Calculation (Stockport System) ---
    // Dents per Inch = Reed Size / 2
    const DENTS_PER_INCH = REED_SIZE_STOCKPORT / 2;
    
    // EPI = Ends per Dent * Dents per Inch
    const EPI_CALC = ENDS_PER_DENT * DENTS_PER_INCH; 

    // --- PPI Value ---
    const PPI_VALUE = MANUAL_PPI;

    // --- Output to HTML Spans ---
    epiOutputSpan.textContent = EPI_CALC;
    ppiOutputSpan.textContent = PPI_VALUE;
    
    // Return values needed for drawFabric to calculate pixel spacing
    return { 
        EPI: EPI_CALC, 
        PPI: PPI_VALUE,
        BaseThickness: BASE_THICKNESS
    };
}

// --- SECTION E: MAIN DRAWING FUNCTION (Inch Scale Added) --- 

function drawFabric() {
    if (!ctx || !canvas) return; 

    // 1. Get Calculated Density 
    const construction = calculateConstruction(); 
    const EPI_VALUE = construction.EPI; 
    const PPI_VALUE = construction.PPI;

    // 2. Calculate Pixel Spacing based on REAL DENSITY (96 DPI/PPI ratio)
    
    const DPI_STANDARD = 96; // 96 Pixels per Inch
    
    const WARP_STEP = Math.max(1, DPI_STANDARD / EPI_VALUE); 
    const WEFT_STEP = Math.max(1, DPI_STANDARD / PPI_VALUE);
    
    const HALF_WARP_STEP = WARP_STEP / 2;
    const HALF_WEFT_STEP = WEFT_STEP / 2;

    // --- Color and Drafting Data ---
    const WARP_COLOR = warpColorPicker.value;
    const WEFT_COLOR = weftColorPicker.value;
    
    const threadingPlan = threadingData;
    const pegPlanMatrix = pegPlanData;
    const THREAD_REPEAT_SIZE = threadingPlan.length;
    const WEFT_REPEAT_SIZE = pegPlanMatrix.length;

    if (THREAD_REPEAT_SIZE === 0 || WEFT_REPEAT_SIZE === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 3. Drawing Loop for Fabric Pattern
    // (लूप में कोई बदलाव नहीं)
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            
            // Warp/Weft index
            const totalWarpIndex = Math.floor(x / HALF_WARP_STEP);
            const threadIndex = Math.floor(totalWarpIndex / 2) % THREAD_REPEAT_SIZE;
            
            const totalWeftIndex = Math.floor(y / HALF_WEFT_STEP);
            const weftIndex = Math.floor(totalWeftIndex / 2) % WEFT_REPEAT_SIZE;
            
            // Weaving Logic
            const harnessNumber = threadingPlan[threadIndex]; 
            const harnessIndex = harnessNumber - 1; 

            let isWarpOver = false;
            
            if (harnessIndex >= 0 && pegPlanMatrix[weftIndex] && harnessIndex < pegPlanMatrix[weftIndex].length) {
                 isWarpOver = pegPlanMatrix[weftIndex][harnessIndex] === 1;
            }

            // Coloring (Draw using 1x1 pixel for high detail)
            ctx.fillStyle = isWarpOver ? WARP_COLOR : WEFT_COLOR;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    // --- 4. DRAW INCH SCALE ---
    
    ctx.strokeStyle = '#FF0000'; // लाल रंग का स्केल
    ctx.lineWidth = 1;
    ctx.fillStyle = '#FF0000';
    ctx.font = '10px Arial';
    
    const CANVAS_WIDTH = canvas.width;
    const CANVAS_HEIGHT = canvas.height;
    
    // --- Horizontal Scale (Warp/EPI) ---
    for (let i = 0; i * DPI_STANDARD < CANVAS_WIDTH; i++) {
        const xPos = i * DPI_STANDARD;
        
        // 1-inch tick mark
        ctx.beginPath();
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos, 10); // 10px लंबा टिक
        ctx.stroke();
        
        // Label
        if (i > 0) {
            ctx.fillText(`${i} in`, xPos - 15, 20);
        }

        // Half-inch tick marks
        const halfInchPos = xPos + (DPI_STANDARD / 2);
        if (halfInchPos < CANVAS_WIDTH) {
            ctx.beginPath();
            ctx.moveTo(halfInchPos, 0);
            ctx.lineTo(halfInchPos, 5); // 5px लंबा टिक
            ctx.stroke();
        }
    }

    // --- Vertical Scale (Weft/PPI) ---
    for (let j = 0; j * DPI_STANDARD < CANVAS_HEIGHT; j++) {
        const yPos = j * DPI_STANDARD;
        
        // 1-inch tick mark
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.lineTo(10, yPos); // 10px चौड़ा टिक
        ctx.stroke();

        // Label
        if (j > 0) {
            // रोटेशन के बिना लेबल को ड्रा करने के लिए y=20 पर x=15 की जगह छोड़ें
            ctx.fillText(`${j} in`, 15, yPos + 5); 
        }
        
        // Half-inch tick marks
        const halfInchPos = yPos + (DPI_STANDARD / 2);
        if (halfInchPos < CANVAS_HEIGHT) {
            ctx.beginPath();
            ctx.moveTo(0, halfInchPos);
            ctx.lineTo(5, halfInchPos); // 5px चौड़ा टिक
            ctx.stroke();
        }
    }
}


// --- SECTION F: PRESET LOADING ---

function loadPreset(type) {
    const p = PATTERNS[type];
    if (!p) return;

    // 1. Grid Size सेट करें
    gridSizeInput.value = p.pegPlan.length;

    // 2. Grids को फिर से बनाएँ
    createGrids(p.pegPlan.length);

    // 3. Global Data Variables को सेट करें
    threadingData = [...p.threading];
    pegPlanData = p.pegPlan.map(row => [...row]); 

    // 4. Grid Cells में डेटा भरें
    
    const threadingCells = threadingContainer.querySelectorAll('input');
    threadingData.forEach((harnessNumber, index) => {
        if (threadingCells[index]) {
            threadingCells[index].value = harnessNumber;
        }
    });

    const pegPlanRows = pegPlanContainer.querySelectorAll('.peg-plan-row');
    pegPlanData.forEach((row, rowIndex) => {
        const rowInputs = pegPlanRows[rowIndex] ? pegPlanRows[rowIndex].querySelectorAll('input') : [];
        row.forEach((value, colIndex) => {
            if (rowInputs[colIndex]) {
                rowInputs[colIndex].checked = value === 1;
            }
        });
    });

    // 5. ड्रा करें
    drawFabric();
}


// --- SECTION G: INITIALIZATION AND EVENT LISTENERS ---

function initializeFabricGenerator() {
    canvas = document.getElementById('fabricCanvas');
    if (!canvas) {
        console.error("Canvas element not found. Initialization failed.");
        return; 
    }
    ctx = canvas.getContext('2d');

    // Access all DOM Elements (threadSizeInput और threadSizeValueSpan हटा दिए गए हैं)
    warpColorPicker = document.getElementById('warpColor');
    weftColorPicker = document.getElementById('weftColor');
    weaveTypeSelect = document.getElementById('weaveType');
    gridSizeInput = document.getElementById('gridSize'); 

    threadingContainer = document.getElementById('threadingContainer');
    pegPlanContainer = document.getElementById('pegPlanContainer');     

    // Yarn/Reed Inputs
    endsPerDentInput = document.getElementById('endsPerDent');
    reedSizeInput = document.getElementById('reedSize');    
    warpCountInput = document.getElementById('warpCount');
    weftCountInput = document.getElementById('weftCount');

    // 🌟 ACCESS: Manual PPI Input 🌟
    manualPpiInput = document.getElementById('manualPpi');

    // Output Spans
    epiOutputSpan = document.getElementById('epiOutput');
    ppiOutputSpan = document.getElementById('ppiOutput');

    // UPDATED EVENT LISTENERS
    warpColorPicker.addEventListener('input', drawFabric);
    weftColorPicker.addEventListener('input', drawFabric);
    
    // Thread Size Slider (हटा दिया गया है)
    
    // Yarn/Construction Inputs
    warpCountInput.addEventListener('input', drawFabric);
    weftCountInput.addEventListener('input', drawFabric);
    endsPerDentInput.addEventListener('input', drawFabric);
    reedSizeInput.addEventListener('input', drawFabric);
    
    // 🌟 NEW LISTENER: Manual PPI Input 🌟
    manualPpiInput.addEventListener('input', drawFabric);
    
    gridSizeInput.addEventListener('change', regenerateGrids);
    
    // Weave Type Preset Loader
    weaveTypeSelect.addEventListener('change', function() {
        loadPreset(weaveTypeSelect.value);
    });

    // Initial Setup
    createGrids(parseInt(gridSizeInput.value)); 
    loadPreset('twill'); 
}
