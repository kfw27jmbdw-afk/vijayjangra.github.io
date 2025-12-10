document.addEventListener("DOMContentLoaded", initFabricGenerator);

let threadingData = [];
let pegPlanData = [];

function initFabricGenerator() {
    const canvas = document.getElementById("fabricCanvas");
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = 600;

    setupGrids();
    setupInputs();

    drawFabric();

    function setupInputs() {
        document.querySelectorAll("input, select").forEach(el => {
            el.addEventListener("input", drawFabric);
        });
    }

    function setupGrids() {
        const threading = document.getElementById("threadingContainer");
        const pegplan = document.getElementById("pegPlanContainer");

        threading.innerHTML = "";
        pegplan.innerHTML = "";

        for (let i = 0; i < 8 * 8; i++) {
            const d = document.createElement("div");
            d.className = "grid-cell";
            d.addEventListener("click", () => {
                d.style.background = d.style.background === "yellow" ? "#333" : "yellow";
                drawFabric();
            });
            threading.appendChild(d);
        }

        for (let i = 0; i < 8 * 8; i++) {
            const d = document.createElement("div");
            d.className = "grid-cell";
            d.addEventListener("click", () => {
                d.style.background = d.style.background === "cyan" ? "#333" : "cyan";
                drawFabric();
            });
            pegplan.appendChild(d);
        }
    }

    function drawFabric() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const warpColor = document.getElementById("warpColorPicker").value;
        const weftColor = document.getElementById("weftColorPicker").value;
        const threadSize = parseInt(document.getElementById("threadSizeInput").value);

        const pattern = document.getElementById("weaveType").value;

        let warpOverWeft = (pattern === "plain")
            ? (i, j) => (i + j) % 2 === 0
            : (pattern === "twill")
            ? (i, j) => (i + j) % 3 === 0
            : customWeave(); // from grids

        for (let y = 0; y < canvas.height; y += threadSize) {
            for (let x = 0; x < canvas.width; x += threadSize) {
                drawThread(
                    x,
                    y,
                    warpOverWeft(x, y) ? warpColor : weftColor,
                    threadSize
                );
            }
        }
    }

    function drawThread(x, y, color, size) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    function customWeave() {
        return () => Math.random() > 0.5; // simple fallback
    }
}