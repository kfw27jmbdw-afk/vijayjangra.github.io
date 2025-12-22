const audio = document.getElementById('main-audio');
const playBtn = document.getElementById('play-btn');
const fileInput = document.getElementById('file-upload');
const title = document.getElementById('title');
const seekBar = document.getElementById('seek-bar');
const songListDiv = document.getElementById('song-list');

// Aapka Working Link
let playlist = [
    {
        name: "Guru Randhawa - Lahore",
        url: "https://files.catbox.moe/41aleb.mp3"
    }
];

let currentIndex = 0;

window.onload = () => {
    if (playlist.length > 0) {
        loadSong(0);
        renderPlaylist();
    }
};

function loadSong(index) {
    currentIndex = index;
    audio.src = playlist[index].url;
    title.innerText = playlist[index].name;
}

function loadAndPlay(index) {
    loadSong(index);
    audio.play().catch(e => console.log("Playback error: ", e));
    playBtn.classList.replace('fa-play-circle', 'fa-pause-circle');
    renderPlaylist();
}

// Play/Pause Button
playBtn.onclick = () => {
    if (audio.paused) {
        audio.play();
        playBtn.classList.replace('fa-play-circle', 'fa-pause-circle');
    } else {
        audio.pause();
        playBtn.classList.replace('fa-pause-circle', 'fa-play-circle');
    }
};

document.getElementById('next').onclick = () => {
    currentIndex = (currentIndex + 1) % playlist.length;
    loadAndPlay(currentIndex);
};

document.getElementById('prev').onclick = () => {
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    loadAndPlay(currentIndex);
};

audio.ontimeupdate = () => {
    if (audio.duration) {
        seekBar.value = (audio.currentTime / audio.duration) * 100;
        document.getElementById('current').innerText = formatTime(audio.currentTime);
        document.getElementById('duration').innerText = formatTime(audio.duration);
    }
};

seekBar.oninput = () => audio.currentTime = (seekBar.value / 100) * audio.duration;

function formatTime(t) {
    let m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' + s : s}`;
}

function renderPlaylist() {
    songListDiv.innerHTML = '<h4 style="color:#1db954;margin-bottom:10px;">YOUR PLAYLIST</h4>';
    playlist.forEach((s, i) => {
        const div = document.createElement('div');
        div.className = `song-item ${i === currentIndex ? 'active' : ''}`;
        div.style.padding = "10px";
        div.style.color = i === currentIndex ? "#1db954" : "#fff";
        div.innerText = `${i + 1}. ${s.name}`;
        div.onclick = () => loadAndPlay(i);
        songListDiv.appendChild(div);
    });
}
