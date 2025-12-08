document.addEventListener('DOMContentLoaded', initializeFabricGenerator);

// ग्लोबल वैरियेबल्स
let canvas, ctx;
let warpColorPicker, weftColorPicker, threadSizeInput, threadSizeValueSpan, weaveTypeSelect;

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

// धागे में अनियमितता (fuzziness) जोड़ने के लिए नॉइज़ फंक्शन
function applyNoise(baseColor, x, y, NOISE_FACTOR) {
    const seed = Math.sin(x * 0.1 + y * 0.1) * 10000;
    const random_val = (seed - Math.floor(seed)) * NOISE_FACTOR * 2 - NOISE_FACTOR; 

    const r = clamp(baseColor[0] + random_val);
    const g = clamp(baseColor[1] + random_val);
    const b = clamp(baseColor[2] + random_val);
    
    return [r, g, b];
}

// शेडिंग फंक्शन: इसमें गोलाई (curvature) और गहरी छाया (deep shadow) दोनों शामिल हैं
function applyShading(baseColor, pos, HALF_THREAD, SHADE_FACTOR) {
    let adjustment = 0;
    let deep_shadow = 0;
    
    // 1. Shading for Curvature (गोलाई के लिए लाइटिंग)
    adjustment = SHADE_FACTOR * Math.sin((pos / HALF_THREAD) * Math.PI); 

    // 2. Deep Shadowing Logic (गहरी छाया के लिए लॉजिक): विकर्ण भ्रम तोड़ने के लिए
    const EDGE_SIZE = 1; // 1 पिक्सेल चौड़ी छाया
    const DEEP_SHADE_FACTOR = 50; // छाया की तीव्रता

    // धागे के किनारे (जहाँ यह नीचे जाता है) पर गहरी छाया लागू करें
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
    
    // Safety Check: THREAD_PIXELS को न्यूनतम 2 सेट करें
    let THREAD_PIXELS = parseInt(threadSizeInput.value);
    if (THREAD_PIXELS < 2 || THREAD_PIXELS % 2 !== 0) {
        THREAD_PIXELS = 2; 
        threadSizeInput.value = 2;
    }
    
    threadSizeValueSpan.textContent = THREAD_PIXELS;
    
    const HALF_THREAD = THREAD_PIXELS / 2;
    
    // सेटिंग्स
    const NOISE_FACTOR = 15; 
    const SHADE_FACTOR = 75; 
    
    // रंग और पैटर्न
    const WARP_COLOR = hexToRgb(warpColorPicker.value);
    const WEFT_COLOR = hexToRgb(weftColorPicker.value);
    const currentWeaveType = weaveTypeSelect.value;
    const { matrix: weaveMatrix, size: MATRIX_SIZE } = PATTERNS[currentWeaveType];

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            
            // Shading Position
            const lx = x % HALF_THREAD; 
            const ly = y % HALF_THREAD; 

            // Matrix Index
            const tx = Math.floor(x / HALF_THREAD) % MATRIX_SIZE; 
            const ty = Math.floor(y / HALF_THREAD) % MATRIX_SIZE; 

            const isWarpOver = weaveMatrix[ty][tx] === 1;
            
            let finalColorString;
            let baseColorArray;

            if (isWarpOver) {
                baseColorArray = WARP_COLOR;
                // Warp (खड़ा धागा) ऊपर: X-अक्ष के अनुसार शेड करें
                const noisyColor = applyNoise(baseColorArray, x, y, NOISE_FACTOR);
                finalColorString = applyShading(noisyColor, lx, HALF_THREAD, SHADE_FACTOR);
            } else {
                baseColorArray = WEFT_COLOR;
                // Weft (आड़ा धागा) ऊपर: Y-अक्ष के अनुसार शेड करें
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

    // HTML Controls को एक्सेस करें
    warpColorPicker = document.getElementById('warpColor');
    weftColorPicker = document.getElementById('weftColor');
    threadSizeInput = document.getElementById('threadSize');
    threadSizeValueSpan = document.getElementById('threadSizeValue');
    weaveTypeSelect = document.getElementById('weaveType');

    // इवेंट लिसनर्स सेट करें
    warpColorPicker.addEventListener('input', drawFabric);
    weftColorPicker.addEventListener('input', drawFabric);
    threadSizeInput.addEventListener('input', drawFabric);
    weaveTypeSelect.addEventListener('change', drawFabric);

    // पेज लोड होने पर पहली बार ड्रॉ करें
    drawFabric();
}
