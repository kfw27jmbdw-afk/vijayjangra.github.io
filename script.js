const ROWS = 20, COLS = 20;
let pegPlanData = Array(20).fill(0).map(() => Array(20).fill(0));
let dentingMatrix = [[1, 2, 3, 4, "", 1]]; 
let warpMults = Array(COLS).fill(""); 
let warpVals = Array.from({length: ROWS}, () => Array(COLS).fill(""));
let weftMults = Array(COLS).fill(""); 
let weftVals = Array.from({length: ROWS}, () => Array(COLS).fill(""));
let warpColors = Array.from({length: ROWS}, (_, i) => ({hex: i===0 ? "#0044ff" : "#444444", active: i===0}));
let weftColors = Array.from({length: ROWS}, (_, i) => ({hex: i===0 ? "#eeeeee" : "#888888", active: i===0}));

window.onbeforeunload = () => "Aapka unsaved data reset ho sakta hai!";

function saveToStorage() {
    const data = { pegPlanData, dentingMatrix, warpMults, warpVals, weftMults, weftVals, warpColors, weftColors };
    localStorage.setItem('bubu_weaver_data', JSON.stringify(data));
}

function loadFromStorage() {
    const saved = localStorage.getItem('bubu_weaver_data');
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(window, data);
        return true;
    }
    return false;
}

function clearAllData() {
    if(confirm("Saara pattern delete kar dein?")) {
        localStorage.removeItem('bubu_weaver_data');
        location.reload();
    }
}

function openTab(evt, tabName) {
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
    applyAndRender();
}

function initTables(type) {
    const head = document.getElementById(`${type}Header`);
    const body = document.getElementById(`${type}Body`);
    const colors = type==='warp' ? warpColors : weftColors;
    const vals = type==='warp' ? warpVals : weftVals;
    head.innerHTML = `<tr><th>Col</th>${Array(COLS).fill(0).map((_, c) => `<th><input type="text" value="${(type==='warp'?warpMults:weftMults)[c]}" oninput="updateTableMult('${type}',${c},this.value)" style="width:25px;border:none;text-align:center"></th>`).join('')}</tr>`;
    body.innerHTML = colors.map((col, r) => `<tr><td><input type="color" value="${col.hex}" onchange="updateC('${type}',${r},this.value)"></td>${vals[r].map((v, c) => `<td><input type="number" value="${v}" oninput="updateV('${type}',${r},${c},this.value)" style="width:30px;border:none;text-align:center;"></td>`).join('')}</tr>`).join('');
}

function updateTableMult(t, c, v) { (t==='warp'?warpMults:weftMults)[c] = v; applyAndRender(); }
function updateC(t, r, v) { (t==='warp'?warpColors:weftColors)[r].hex = v; (t==='warp'?warpColors:weftColors)[r].active = true; applyAndRender(); }
function updateV(t, r, c, v) { (t==='warp'?warpVals:weftVals)[r][c] = v === "" ? "" : parseInt(v); applyAndRender(); }

function renderDent() {
    const body = document.getElementById("dentBody");
    body.innerHTML = dentingMatrix.map((row, r) => `<tr>${row.map((val, c) => `<td><input type="number" value="${val}" oninput="updateD(${r},${c},this.value)" style="width:100%;border:none;text-align:center;"></td>`).join('')}</tr>`).join('');
}
function updateD(r, c, v) { dentingMatrix[r][c] = v === "" ? "" : parseInt(v); applyAndRender(); }
function addDentRow() { dentingMatrix.push(["","","","","",1]); renderDent(); }

// --- TERE DIYE HUYE ORIGINAL FABRIC FUNCTIONS ---
function drawYarnSegment(ctx, x, y, w, h, color, isVertical) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    let grad = isVertical ? ctx.createLinearGradient(x, 0, x + w, 0) : ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, "rgba(0,0,0,0.6)");
    grad.addColorStop(0.5, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
}

function getPattern(colors, vals, mults) {
    let fullSeq = [];
    let currentGroup = [];
    for(let c=0; c<COLS; c++) {
        let colThreads = [];
        for(let r=0; r<ROWS; r++) {
            if(vals[r][c] !== "" && !isNaN(vals[r][c]) && colors[r].active) {
                for(let i=0; i<vals[r][c]; i++) colThreads.push(colors[r].hex);
            }
        }
        if(colThreads.length > 0) currentGroup = currentGroup.concat(colThreads);
        let mStr = mults[c].toString().toLowerCase();
        if(mStr.includes('x')) {
            let mult = parseInt(mStr.replace('x','')) || 1;
            let unit = [...currentGroup];
            for(let i=1; i<mult; i++) fullSeq = fullSeq.concat(unit);
            fullSeq = fullSeq.concat(currentGroup);
            currentGroup = [];
        } else if (c === COLS-1 || (mults[c+1] && mults[c+1].toString().includes('x'))) {
        } else {
            fullSeq = fullSeq.concat(colThreads);
            currentGroup = [];
        }
    }
    return fullSeq.length ? fullSeq : ["#444"];
}

function drawScales(epi, ppi, wS, hS) {
    const hScl = document.getElementById('hScale'); const vScl = document.getElementById('vScale');
    if(!hScl || !vScl) return; hScl.innerHTML = ''; vScl.innerHTML = '';
    for(let i=0; i<=10; i+=0.5) {
        let ht = document.createElement('div'); ht.className='tick-label';
        ht.style.left = (i * epi * wS) + 'px'; ht.innerText = i + '"';
        hScl.appendChild(ht);
        let vt = document.createElement('div'); vt.className='tick-label';
        vt.style.top = (i * ppi * hS) + 'px'; vt.innerText = i + '"';
        vScl.appendChild(vt);
    }
}

function applyAndRender() {
    const reed = parseInt(document.getElementById("reedInput").value) || 40;
    const ppiInputValue = parseInt(document.getElementById("ppiInput").value) || 40;
    let threadSeq = []; let maxS = 0;
    dentingMatrix.forEach(row => {
        let threads = row.slice(0, 5).filter(n => n !== "" && !isNaN(n));
        let mult = parseInt(row[5]) || 1;
        if(threads.length > 0) {
            for(let m=0; m<mult; m++) threads.forEach(t => { 
                let s = parseInt(t); threadSeq.push(s-1); if(s > maxS) maxS = s; 
            });
        }
    });
    let epi = Math.round(reed * (threadSeq.length / (dentingMatrix.length || 1)));
    document.getElementById("epiVal").textContent = epi;

    let minR = ROWS, maxR = -1, minC = COLS, maxC = -1, active = false;
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            if(pegPlanData[r][c]) { active = true; minR = Math.min(minR, r); maxR = Math.max(maxR, r); minC = Math.min(minC, c); maxC = Math.max(maxC, c); }
        }
    }
    if(!active || threadSeq.length === 0) return;

    const warpP = getPattern(warpColors, warpVals, warpMults);
    const weftP = getPattern(weftColors, weftVals, weftMults);

    ["fabricCanvas", "weaveCanvas", "largeCanvas"].forEach(id => {
        const c = document.getElementById(id); if(!c) return;
        drawFabric(c, warpP, weftP, threadSeq, minR, minC, maxR-minR+1, maxS, epi, ppiInputValue);
    });
    saveToStorage();
}

function drawFabric(canvas, warpP, weftP, threadSeq, minR, minC, pH, pW, epi, ppi) {
    const ctx = canvas.getContext("2d");
    const zoom = canvas.id === "largeCanvas" ? 12 : 6;
    const wS = (96 * zoom) / epi; const hS = (96 * zoom) / ppi;
    const yarnW = wS * 0.65; const yarnH = hS * 0.65;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(canvas.id === "largeCanvas") drawScales(epi, ppi, wS, hS);

    const cols = Math.ceil(canvas.width / wS);
    const rows = Math.ceil(canvas.height / hS);

    for (let i = 0; i < cols; i++) {
        const warpCol = warpP[i % warpP.length];
        const shaft = threadSeq[i % threadSeq.length];
        for (let j = 0; j < rows; j++) {
            const weftCol = weftP[j % weftP.length];
            const isWarpOver = pegPlanData[minR + (j % pH)][minC + (shaft % pW)] === 1;
            if (isWarpOver) {
                drawYarnSegment(ctx, i * wS, j * hS + (hS-yarnH)/2, wS, yarnH, weftCol, false);
            } else {
                drawYarnSegment(ctx, i * wS + (wS-yarnW)/2, j * hS, yarnW, hS, warpCol, true);
            }
        }
    }
    for (let i = 0; i < cols; i++) {
        const warpCol = warpP[i % warpP.length];
        const shaft = threadSeq[i % threadSeq.length];
        for (let j = 0; j < rows; j++) {
            const weftCol = weftP[j % weftP.length];
            const isWarpOver = pegPlanData[minR + (j % pH)][minC + (shaft % pW)] === 1;
            ctx.shadowBlur = 8; ctx.shadowColor = "rgba(0,0,0,1)";
            if (isWarpOver) {
                drawYarnSegment(ctx, i * wS + (wS-yarnW)/2, j * hS, yarnW, hS, warpCol, true);
            } else {
                drawYarnSegment(ctx, i * wS, j * hS + (hS-yarnH)/2, wS, yarnH, weftCol, false);
            }
            ctx.shadowBlur = 0;
        }
    }
}

function initPeg() {
    const pc = document.getElementById("pegPlanContainer"); pc.innerHTML = "";
    for (let r = 0; r < 20; r++) {
        for (let c = 0; c < 20; c++) {
            let div = document.createElement("div"); div.className = "grid-cell";
            if(pegPlanData[r][c] === 1) div.classList.add('active');
            div.onclick = () => { div.classList.toggle("active"); pegPlanData[r][c] = div.classList.contains("active") ? 1 : 0; applyAndRender(); };
            pc.appendChild(div);
        }
    }
}

// 🌐 PWA REGISTRATION (Only Additions)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log(err));
    });
}

window.onload = () => { loadFromStorage(); initTables('warp'); initTables('weft'); renderDent(); initPeg(); applyAndRender(); };
