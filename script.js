document.addEventListener('DOMContentLoaded', initializeFabricGenerator);

// Global Variables
let canvas, ctx;
let warpColorPicker, weftColorPicker, threadSizeInput, threadSizeValueSpan, weaveTypeSelect, matrixInput;

// --- WEAVE PATTERNS ---
const PATTERNS = {
    plain: {
        matrix: [
            [1, 0],
            [0, 1]
        ],
        size: 2
    },
    twill: {
        matrix: [
            [1, 1, 1, 0], 
            [0, 1, 1, 1], 
            [1, 0, 1, 1], 
            [1, 1, 0, 1]
        ],
        size: 4
    }
    // 'custom' will be handled by parsing the textarea
};

// --- HELPER FUNCTIONS ---

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
}

function clamp(value) {
    return Math.min(255, Math.max(0, value));
}

// Function to parse the user's string input into a matrix
function parseMatrix(inputString) {
    try {
        const rows = inputString.trim().split('\n');
        const matrix = rows.map(row => 
            row.trim().split(/\s+/).map(Number) // Splits by any space/tab and converts to number
        );
        
        // Basic validation: ensure all rows have the same number of columns
        const firstRowLength = matrix[0].length;
        if (matrix.some(row => row.length !== firstRowLength)) {
            console.error("Matrix error: Rows have different lengths.");
            return { matrix: PATTERNS.twill.matrix, size: 4 };
        }
        
        return { matrix: matrix, size: firstRowLength };
    } catch (e) {
        console.error("Error parsing matrix input:", e);
        // Return a default matrix on error
        return { matrix: PATTERNS.twill.matrix, size: 4 }; 
    }
}

// Noise, Shading, etc. functions remain the same
function applyNoise(baseColor, x, y, NOISE_FACTOR) {
    const seed = Math.sin(x * 0.1 + y * 0.1) * 10000;
    const random_val = (seed - Math.floor(seed)) * NOISE_FACTOR * 2 - NOISE_FACTOR; 
    const r = clamp(baseColor[0] + random_val);
    const g = clamp(baseColor[1] + random_val);
    const b = clamp(baseColor[2] + random_val);
    return [r, g, b];
}

function applyShading(baseColor, pos, HALF_THREAD, SHADE_FACTOR) {
    let adjustment = 0;
    let deep_shadow = 0;
    
    // 1. Shading for Curvature
    adjustment = SHADE_FACTOR * Math.sin((pos / HALF_THREAD) * Math.PI); 

    // 2. Deep Shadowing Logic (Breaks the diagonal illusion)
    const EDGE_SIZE = 1; 
    const DEEP_SHADE_FACTOR = 100;

    if (pos < EDGE_SIZE || pos >= HALF_THREAD - EDGE_SIZE) {
        deep_shadow = -DEEP_SHADE_FACTOR;
    }

    const final_adjustment = adjustment + deep_shadow;
    
    const r = clamp(baseColor[0] + final_adjustment);
    const g = clamp(baseColor[1] + final_adjustment);
    const b = clamp(baseColor[2] + final_adjustment);
    
    return `rgb(${r}, ${g}, ${b})`;
}

// --- MAIN DRAWING FUNCTION ---

function drawFabric() {
    if (!ctx) return;
    
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    
    // Safety Check: THREAD_PIXELS minimum 2
    let THREAD_PIXELS = parseInt(threadSizeInput.value);
    if (THREAD_PIXELS < 2 || THREAD_PIXELS % 2 !== 0) {
        THREAD_PIXELS = 2; 
        threadSizeInput.value = 2;
    }
    
    threadSizeValueSpan.textContent = THREAD_PIXELS;
    const HALF_THREAD = THREAD_PIXELS / 2;
    
    // Settings
    const NOISE_FACTOR = 15; 
    const SHADE_FACTOR = 75; 
    
    // Colors and Weave Selection
    const WARP_COLOR = hexToRgb(warpColorPicker.value);
    const WEFT_COLOR = hexToRgb(weftColorPicker.value);
    
    const currentWeaveType = weaveTypeSelect.value;
    
    let weaveMatrix, MATRIX_SIZE;
    
    if (currentWeaveType === 'custom') {
        // Use the custom matrix entered by the user
        const result = parseMatrix(matrixInput.value);
        weaveMatrix = result.matrix;
        MATRIX_SIZE = result.size;
    } else {
        // Use the preset matrix (Plain or Twill)
        weaveMatrix = PATTERNS[currentWeaveType].matrix;
        MATRIX_SIZE = PATTERNS[currentWeaveType].size;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            
            // Shading Position
            const lx = x % HALF_THREAD; 
            const ly = y % HALF_THREAD; 

            // Matrix Index (MODULO the size of the current matrix, not fixed 4)
            const tx = Math.floor(x / HALF_THREAD) % MATRIX_SIZE; 
            const ty = Math.floor(y / HALF_THREAD) % weaveMatrix.length; // Use matrix height for vertical repeat

            // Check the weave matrix value (This is the drawing order/peg plan)
            const isWarpOver = weaveMatrix[ty][tx] === 1;
            
            let finalColorString;
            let baseColorArray;

            if (isWarpOver) {
                baseColorArray = WARP_COLOR;
                // Warp (Vertical) is on top: Shade based on X-axis
                const noisyColor = applyNoise(baseColorArray, x, y, NOISE_FACTOR);
                finalColorString = applyShading(noisyColor, lx, HALF_THREAD, SHADE_FACTOR);
            } else {
                baseColorArray = WEFT_COLOR;
                // Weft (Horizontal) is on top: Shade based on Y-axis
                const noisyColor = applyNoise(baseColorArray, x, y, NOISE_FACTOR);
                finalColorString = applyShading(noisyColor, ly, HALF_THREAD, SHADE_FACTOR);
            }

            ctx.fillStyle = finalColorString;
            ctx.fillRect(x, y, 1, 1);
        }
    }
}

// --- INITIALIZATION AND EVENT LISTENERS ---

function initializeFabricGenerator() {
    canvas = document.getElementById('fabricCanvas');
    ctx = canvas.getContext('2d');

    // Access HTML Controls
    warpColorPicker = document.getElementById('warpColor');
    weftColorPicker = document.getElementById('weftColor');
    threadSizeInput = document.getElementById('threadSize');
    threadSizeValueSpan = document.getElementById('threadSizeValue');
    weaveTypeSelect = document.getElementById('weaveType');
    matrixInput = document.getElementById('matrixInput'); // New Input

    // Set Event Listeners to redraw on change
    warpColorPicker.addEventListener('input', drawFabric);
    weftColorPicker.addEventListener('input', drawFabric);
    threadSizeInput.addEventListener('input', drawFabric);
    weaveTypeSelect.addEventListener('change', drawFabric);
    matrixInput.addEventListener('input', drawFabric); // New listener for custom input

    // Draw fabric on load
    drawFabric();
}
