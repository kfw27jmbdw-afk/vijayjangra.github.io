document.addEventListener('DOMContentLoaded', initializeFabricGenerator);

// Global Variables
let canvas, ctx;
let warpColorPicker, weftColorPicker, threadSizeInput, threadSizeValueSpan, weaveTypeSelect, threadingInput, pegPlanInput;

// --- WEAVE PATTERNS (PRESETS) ---
// We'll use these only for default values, the main logic will use threading/pegPlan
const PATTERNS = {
    plain: {
        threading: [1, 2, 1, 2],
        pegPlan: ["x .", ". x"]
    },
    twill: {
        threading: [1, 2, 3, 4],
        pegPlan: ["x . . .", ". x . .", ". . x .", ". . . x"]
    },
    // Custom will read inputs directly
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

// Parses the input string into a numeric array (Threading) or 2D array (Peg Plan)
function parsePlan(inputString, isPegPlan = false) {
    try {
        const lines = inputString.trim().split('\n').filter(line => line.trim().length > 0);
        
        if (isPegPlan) {
            // Peg Plan: Array of arrays (1 for 'x', 0 for '.')
            const matrix = lines.map(line => 
                line.trim().split(/\s+/).map(char => (char === 'x' || char === '#') ? 1 : 0)
            );
            return matrix;
        } else {
            // Threading Plan: Single array of harness numbers
            return lines[0].trim().split(/\s+/).map(Number).filter(n => n > 0);
        }
    } catch (e) {
        console.error("Parsing Error:", e);
        return isPegPlan ? [[1, 0], [0, 1]] : [1, 2]; // Return safe defaults
    }
}

function applyNoise(baseColor, x, y, NOISE_FACTOR) {
    const seed = Math.sin(x * 0.1 + y * 0.1) * 10000;
    const random_val = (seed - Math.floor(seed)) * NOISE_FACTOR * 2 - NOISE_FACTOR; 
    const r = clamp(baseColor[0] + random_val);
    const g = clamp(baseColor[1] + random_val);
    const b = clamp(baseColor[2] + random_val);
    return [r, g, b];
}

function applyShading(baseColor, pos, HALF_THREAD, SHADE_FACTOR) {
    // Shading functions remain the same (optimized for realism)
    let adjustment = 0;
    let deep_shadow = 0;
    adjustment = SHADE_FACTOR * Math.sin((pos / HALF_THREAD) * Math.PI); 
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
    
    // Safety Check: THREAD_PIXELS
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
    
    // Colors
    const WARP_COLOR = hexToRgb(warpColorPicker.value);
    const WEFT_COLOR = hexToRgb(weftColorPicker.value);
    
    // --- DRAFTING PLAN LOGIC (The Core Change) ---
    
    const currentWeaveType = weaveTypeSelect.value;
    
    let threadingPlan, pegPlanMatrix;

    if (currentWeaveType === 'custom') {
        // Parse directly from text inputs
        threadingPlan = parsePlan(threadingInput.value, false);
        pegPlanMatrix = parsePlan(pegPlanInput.value, true);
    } else {
        // Use preset values
        const preset = PATTERNS[currentWeaveType];
        threadingPlan = parsePlan(preset.threading.join(' '), false); // Convert array to string for consistent parsing
        pegPlanMatrix = preset.pegPlan.map(row => parsePlan(row, true)[0]);
    }

    // Safety check for empty plans
    if (threadingPlan.length === 0 || pegPlanMatrix.length === 0) {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        return; 
    }

    const THREAD_REPEAT_SIZE = threadingPlan.length; // Warp repeat width
    const WEFT_REPEAT_SIZE = pegPlanMatrix.length;    // Weft repeat height
    const HARNESS_COUNT = pegPlanMatrix[0] ? pegPlanMatrix[0].length : 0; // Number of columns in peg plan

    if (HARNESS_COUNT === 0) {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        return; 
    }

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            
            // Shading Position
            const lx = x % HALF_THREAD; 
            const ly = y % HALF_THREAD; 

            // 1. Determine which Warp thread index we are on (Horizontal Position)
            const threadIndex = Math.floor(x / HALF_THREAD) % THREAD_REPEAT_SIZE;
            
            // 2. Determine which Weft thread index we are on (Vertical Position)
            const weftIndex = Math.floor(y / HALF_THREAD) % WEFT_REPEAT_SIZE;
            
            // 3. Find the Harness associated with the current Warp thread
            // Harness numbers start from 1, so subtract 1 for array index
            const harnessNumber = threadingPlan[threadIndex]; 
            const harnessIndex = harnessNumber - 1; 

            // 4. Look up the Peg Plan (Lifting Order)
            // If Harness is UP (1), Warp is on top.
            let isWarpOver = false;
            
            // Check boundaries
            if (harnessIndex >= 0 && harnessIndex < HARNESS_COUNT) {
                 // pegPlanMatrix[row: Weft Index][column: Harness Index]
                 isWarpOver = pegPlanMatrix[weftIndex][harnessIndex] === 1;
            }

            let finalColorString;
            let baseColorArray;

            if (isWarpOver) {
                baseColorArray = WARP_COLOR;
                const noisyColor = applyNoise(baseColorArray, x, y, NOISE_FACTOR);
                finalColorString = applyShading(noisyColor, lx, HALF_THREAD, SHADE_FACTOR);
            } else {
                baseColorArray = WEFT_COLOR;
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
    threadingInput = document.getElementById('threadingInput'); // New Input
    pegPlanInput = document.getElementById('pegPlanInput');     // New Input

    // Set Event Listeners
    warpColorPicker.addEventListener('input', drawFabric);
    weftColorPicker.addEventListener('input', drawFabric);
    threadSizeInput.addEventListener('input', drawFabric);
    weaveTypeSelect.addEventListener('change', drawFabric);
    threadingInput.addEventListener('input', drawFabric); // Listen to changes
    pegPlanInput.addEventListener('input', drawFabric);     // Listen to changes
    weaveTypeSelect.addEventListener('change', function() {
        // Load correct defaults when changing preset type
        if (weaveTypeSelect.value === 'plain') {
            threadingInput.value = '1 2 1 2';
            pegPlanInput.value = 'x .\n. x';
        } else if (weaveTypeSelect.value === 'twill') {
            threadingInput.value = '1 2 3 4';
            pegPlanInput.value = 'x . . .\n. x . .\n. . x .\n. . . x';
        }
        drawFabric();
    });

    // Draw fabric on load
    drawFabric();
}
