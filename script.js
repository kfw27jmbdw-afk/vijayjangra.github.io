const audio = document.getElementById('main-audio') || document.querySelector('audio');
const playBtn = document.getElementById('play-btn');
const title = document.getElementById('title');
const seekBar = document.getElementById('seek-bar');
const songListDiv = document.getElementById('song-list');

// Aapki Updated Playlist (Dono gaano ke saath)
let playlist = [
    {
        name: "Guru Randhawa - Lahore",
        url: "https://files.catbox.moe/41aleb.mp3"
    },
    {
        name: "Second Song - Catbox",
        url: "https://files.catbox.moe/et6n02.mp3"
    },
    let playlist = [
    {
        name: "Guru Randhawa - Lahore",
        url: "https://files.catbox.moe/41aleb.mp3"
    },
    {
        name: "Second Song - Catbox",
        url: "https://files.catbox.moe/et6n02.mp3"
    },
    {
        name: "Gulaab - Google Drive",
        url: "https://drive.google.com/uc?export=download&id=1LkTLkmcy7Ljy-8wQN0kJy27ff5Ha2vok"
    }

];

let currentIndex = 0;

// Page load hote hi gaana aur list taiyar karein
window.onload = () => {
    if (playlist.length > 0) {
        loadSong(0);
        renderPlaylist();
    }
};

function loadSong(index) {
    currentIndex = index;
    audio.src = playlist[index].url;
    audio.load();
    title.innerText = playlist[index].name;
    renderPlaylist(); // List update karega active gaana dikhane ke liye
}

function loadAndPlay(index) {
    loadSong(index);
    audio.play().then(() => {
        playBtn.classList.replace('fa-play-circle', 'fa-pause-circle');
    }).catch(e => console.log("Playback error: ", e));
}

// Play/Pause Button
playBtn.onclick = () => {
    if (audio.paused) {
        audio.play().then(() => {
            playBtn.classList.replace('fa-play-circle', 'fa-pause-circle');
        }).catch(e => alert("Error playing: " + e.message));
    } else {
        audio.pause();
        playBtn.classList.replace('fa-pause-circle', 'fa-play-circle');
    }
};

// Next Button
document.getElementById('next').onclick = () => {
    currentIndex = (currentIndex + 1) % playlist.length;
    loadAndPlay(currentIndex);
};

// Previous Button
document.getElementById('prev').onclick = () => {
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    loadAndPlay(currentIndex);
};

// Time aur Seek Bar update
audio.ontimeupdate = () => {
    if (audio.duration) {
        seekBar.value = (audio.currentTime / audio.duration) * 100;
        document.getElementById('current').innerText = formatTime(audio.currentTime);
        document.getElementById('duration').innerText = formatTime(audio.duration);
    }
};

seekBar.oninput = () => audio.currentTime = (seekBar.value / 100) * audio.duration;

audio.onended = () => document.getElementById('next').click();

function formatTime(t) {
    let m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' + s : s}`;
}

// Playlist ko screen par dikhane ka function
function renderPlaylist() {
    if(!songListDiv) return;
    songListDiv.innerHTML = '<h4 style="color:#1db954;margin-bottom:10px;">YOUR PLAYLIST</h4>';
    playlist.forEach((s, i) => {
        const div = document.createElement('div');
        div.style.cssText = "padding:12px; border-bottom:1px solid #333; cursor:pointer; font-size:14px;";
        div.style.color = i === currentIndex ? "#1db954" : "#fff"; // Active gaana green dikhega
        div.style.backgroundColor = i === currentIndex ? "rgba(29, 185, 84, 0.1)" : "transparent";
        div.innerText = `${i + 1}. ${s.name}`;
        div.onclick = () => loadAndPlay(i);
        songListDiv.appendChild(div);
    });
}
