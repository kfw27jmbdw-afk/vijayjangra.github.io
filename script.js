const audio = document.getElementById('main-audio');
const playBtn = document.getElementById('play-btn');
const fileInput = document.getElementById('file-upload');
const title = document.getElementById('title');
const seekBar = document.getElementById('seek-bar');
const songListDiv = document.getElementById('song-list');

let playlist = [];
let currentIndex = 0;

// 1. Files Upload Logic
fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if(files.length > 0) {
        playlist = files.map(file => ({
            name: file.name.replace(/\.[^/.]+$/, ""),
            url: URL.createObjectURL(file)
        }));
        currentIndex = 0;
        loadAndPlay(0);
        renderPlaylist();
    }
});

function loadAndPlay(index) {
    if(playlist[index]) {
        audio.src = playlist[index].url;
        title.innerText = playlist[index].name;
        audio.load();
        
        audio.play().then(() => {
            playBtn.classList.replace('fa-play-circle', 'fa-pause-circle');
        }).catch(err => console.log("Play blocked, waiting for user click."));
        
        renderPlaylist();
    }
}

// 2. Play/Pause Toggle
playBtn.onclick = () => {
    if(!audio.src) return alert("Pehle songs select karein!");
    if(audio.paused) {
        audio.play();
        playBtn.classList.replace('fa-play-circle', 'fa-pause-circle');
    } else {
        audio.pause();
        playBtn.classList.replace('fa-pause-circle', 'fa-play-circle');
    }
};

// 3. Next/Prev Controls
document.getElementById('next').onclick = () => {
    if(playlist.length === 0) return;
    currentIndex = (currentIndex + 1) % playlist.length;
    loadAndPlay(currentIndex);
};

document.getElementById('prev').onclick = () => {
    if(playlist.length === 0) return;
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    loadAndPlay(currentIndex);
};

// Auto-Next
audio.onended = () => document.getElementById('next').click();

// 4. Progress Update
audio.ontimeupdate = () => {
    if(audio.duration) {
        seekBar.value = (audio.currentTime / audio.duration) * 100;
        document.getElementById('current').innerText = formatTime(audio.currentTime);
        document.getElementById('duration').innerText = formatTime(audio.duration);
    }
};

seekBar.oninput = () => audio.currentTime = (seekBar.value / 100) * audio.duration;

function formatTime(t) {
    let m = Math.floor(t/60), s = Math.floor(t%60);
    return `${m}:${s < 10 ? '0'+s : s}`;
}

function renderPlaylist() {
    songListDiv.innerHTML = '<h4 style="margin-bottom:10px; color:#1db954;">YOUR PLAYLIST</h4>';
    playlist.forEach((s, i) => {
        const div = document.createElement('div');
        div.className = `song-item ${i === currentIndex ? 'active' : ''}`;
        div.innerText = `${i + 1}. ${s.name}`;
        div.onclick = () => {
            currentIndex = i;
            loadAndPlay(i);
        };
        songListDiv.appendChild(div);
    });
}

// 5. RELOAD PROTECTION (Popup)
// Ye function browser ko tabhi alert dene par majboor karega jab playlist mein gaane honge.
window.addEventListener('beforeunload', function (e) {
    if (playlist.length > 0) {
        e.preventDefault();
        e.returnValue = ''; // Modern browsers ko popup dikhane ke liye ye zaroori hai
    }
});
