// WINDOW MANAGER
var windowCount = 0;
var windows = [];
var zIndexCounter = 100;

var appConfig = {
    terminal: { title: 'Terminal', icon: 'fa-terminal', w: 400, h: 300 },
    notes: { title: 'Notes', icon: 'fa-note-sticky', w: 460, h: 340 },
    drawing: { title: 'Drawing', icon: 'fa-palette', w: 500, h: 380 },
    settings: { title: 'Settings', icon: 'fa-sliders', w: 460, h: 320 },
    about: { title: 'About JerOS', icon: 'fa-circle-question', w: 420, h: 300 }
};

function openApp(type) {
    var cfg = appConfig[type];
    if (!cfg) return;

    var existing = windows.find(function(w) { return w.type === type && !w.closed; });
    if (existing) {
        existing.win.style.zIndex = ++zIndexCounter;
        if (existing.minimized) {
            existing.minimized = false;
            existing.win.style.display = 'flex';
            updateTaskbar();
        }
        return;
    }

    var win = document.createElement('div');
    win.className = 'window';
    win.style.width = cfg.w + 'px';
    win.style.height = cfg.h + 'px';
    win.style.left = (60 + windowCount * 28) + 'px';
    win.style.top = (40 + windowCount * 22) + 'px';
    win.dataset.id = windowCount;
    win.style.zIndex = ++zIndexCounter;

    var header = document.createElement('div');
    header.className = 'window-header';
    header.innerHTML = `
        <span class="window-title">
            <span class="dot"></span>
            <i class="fa-solid ${cfg.icon}"></i> ${cfg.title}
        </span>
        <span class="window-controls">
            <button onclick="minimizeWindow(this)">─</button>
            <button onclick="maximizeWindow(this)">⬜</button>
            <button class="close" onclick="closeWindow(this)">✕</button>
        </span>
    `;
    win.appendChild(header);

    var body = document.createElement('div');
    body.className = 'window-body';
    body.id = 'win-body-' + windowCount;
    win.appendChild(body);

    // Terminal
    if (type === 'terminal') {
        body.innerHTML = `
            <div style="background:#0a0a0e; padding:8px 12px; border-radius:6px; font-family:'Courier New',monospace; color:#7aff8a; min-height:180px;">
                <div id="term-output" style="color:#8a8a9e; white-space:pre-wrap; margin-bottom:4px;"></div>
                <div style="display:flex; gap:8px; align-items:baseline;">
                    <span style="color:#7aff8a;">$</span>
                    <input type="text" id="term-input" style="background:transparent; border:none; color:#7aff8a; font-family:'Courier New',monospace; font-size:0.8rem; outline:none; flex:1;">
                </div>
            </div>
        `;
        var input = body.querySelector('#term-input');
        var output = body.querySelector('#term-output');
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                var cmd = input.value.trim();
                input.value = '';
                executeTerminal(cmd, output);
            }
        });
        setTimeout(function() { input.focus(); }, 50);
    }
    // Notes
    else if (type === 'notes') {
        var saved = localStorage.getItem('jeros-notes') || '';
        body.innerHTML = `
            <textarea style="width:100%; height:160px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.04); border-radius:8px; color:#eeeef2; padding:10px; font-family:var(--font); font-size:0.8rem; resize:vertical; outline:none;">${saved}</textarea>
            <div style="display:flex; gap:8px; margin-top:10px;">
                <button onclick="saveNotes()" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.04); padding:4px 16px; border-radius:6px; color:var(--text-secondary); cursor:pointer; font-size:0.7rem;">Save</button>
                <button onclick="clearNotes()" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.02); padding:4px 16px; border-radius:6px; color:var(--text-muted); cursor:pointer; font-size:0.7rem;">Clear</button>
            </div>
        `;
        window._notesBody = body;
    }
    // Drawing
    else if (type === 'drawing') {
        body.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:10px; height:100%;">
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button onclick="setDrawColor('#5f7cff')" style="width:30px; height:30px; border-radius:50%; border:2px solid rgba(255,255,255,0.1); background:#5f7cff; cursor:pointer;"></button>
                    <button onclick="setDrawColor('#ff6b6b')" style="width:30px; height:30px; border-radius:50%; border:2px solid rgba(255,255,255,0.1); background:#ff6b6b; cursor:pointer;"></button>
                    <button onclick="setDrawColor('#51cf66')" style="width:30px; height:30px; border-radius:50%; border:2px solid rgba(255,255,255,0.1); background:#51cf66; cursor:pointer;"></button>
                    <button onclick="setDrawColor('#fcc419')" style="width:30px; height:30px; border-radius:50%; border:2px solid rgba(255,255,255,0.1); background:#fcc419; cursor:pointer;"></button>
                    <button onclick="setDrawColor('#ffffff')" style="width:30px; height:30px; border-radius:50%; border:2px solid rgba(255,255,255,0.1); background:#ffffff; cursor:pointer;"></button>
                    <button onclick="clearCanvas()" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.04); padding:4px 16px; border-radius:6px; color:var(--text-secondary); cursor:pointer; font-size:0.7rem;">Clear</button>
                </div>
                <canvas id="drawCanvas" style="flex:1; background:#0a0a0e; border-radius:8px; border:1px solid rgba(255,255,255,0.04); cursor:crosshair; width:100%; height:100%;"></canvas>
            </div>
        `;
        setTimeout(initCanvas, 50);
    }
    // Settings
    else if (type === 'settings') {
        var darkMode = localStorage.getItem('jeros-theme') !== 'light';
        body.innerHTML = `
            <h3 style="font-size:0.9rem; color:#eeeef2; margin-bottom:14px;">System Settings</h3>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.03);">
                <span style="font-size:0.75rem; color:var(--text-secondary);">Dark Mode</span>
                <div class="toggle ${darkMode ? 'active' : ''}" onclick="toggleTheme(this)" style="width:40px; height:22px; background:${darkMode ? 'var(--accent)' : 'rgba(255,255,255,0.08)'}; border-radius:40px; cursor:pointer; position:relative; transition:0.2s; border:1px solid rgba(255,255,255,0.04);">
                    <div style="width:16px; height:16px; background:#fff; border-radius:50%; position:absolute; top:2px; left:${darkMode ? '21px' : '2px'}; transition:0.2s;"></div>
                </div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.03);">
                <span style="font-size:0.75rem; color:var(--text-secondary);">Version</span>
                <span style="font-size:0.75rem; color:var(--accent);">1.0.0</span>
            </div>
        `;
    }
    // About
    else if (type === 'about') {
        body.innerHTML = `
            <div style="text-align:center; padding:12px 0;">
                <div style="font-size:3.6rem; margin-bottom:8px; color:var(--accent);">✦</div>
                <h2 style="font-size:1.4rem; font-weight:700; color:#eeeef2; letter-spacing:-0.5px;">JerOS</h2>
                <p style="font-size:0.8rem; color:var(--text-secondary);">Your Web. Your Workspace. Your OS.</p>
                <div style="margin:14px 0; padding:14px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(255,255,255,0.02);">
                    <p style="font-size:0.7rem; color:var(--text-muted);">Version 1.0.0</p>
                    <p style="font-size:0.7rem; color:var(--text-muted);">Built with HTML, CSS, JavaScript</p>
                    <p style="font-size:0.7rem; color:var(--accent);">Stardance WebOS 1</p>
                </div>
                <p style="font-size:0.6rem; color:var(--text-muted);">© 2026 JerOS · Jermy Biju</p>
            </div>
        `;
    }

    document.getElementById('desktop').appendChild(win);
    var winData = {
        id: windowCount,
        type: type,
        win: win,
        body: body,
        minimized: false,
        maximized: false,
        closed: false,
        prevRect: null
    };
    windows.push(winData);
    windowCount++;
    updateTaskbar();

    win.addEventListener('mousedown', function() {
        win.style.zIndex = ++zIndexCounter;
    });

    var isDragging = false;
    var offX = 0, offY = 0;
    header.addEventListener('mousedown', function(e) {
        if (e.target.closest('.window-controls')) return;
        var rect = win.getBoundingClientRect();
        offX = e.clientX - rect.left;
        offY = e.clientY - rect.top;
        isDragging = true;
        win.style.zIndex = ++zIndexCounter;
        if (winData.maximized) {
            winData.maximized = false;
            win.style.width = winData.prevRect ? winData.prevRect.width : cfg.w + 'px';
            win.style.height = winData.prevRect ? winData.prevRect.height : cfg.h + 'px';
            win.style.borderRadius = '14px 10px 16px 8px';
        }
    });
    document.addEventListener('mousemove', function(e) {
        if (!isDragging || winData.maximized) return;
        var newLeft = e.clientX - offX;
        var newTop = e.clientY - offY;
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - 100));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - 80));
        win.style.left = newLeft + 'px';
        win.style.top = newTop + 'px';
    });
    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
}

// ===== TERMINAL =====
function executeTerminal(cmd, output) {
    var line = document.createElement('div');
    line.style.color = '#8a8a9e';
    line.style.whiteSpace = 'pre-wrap';
    var l = cmd.toLowerCase();
    if (l === 'help') line.textContent = 'Commands: help, clear, date, time, about, apps, neofetch, echo, whoami';
    else if (l === 'clear') { output.innerHTML = ''; return; }
    else if (l === 'date') line.textContent = new Date().toDateString();
    else if (l === 'time') line.textContent = new Date().toTimeString();
    else if (l === 'about') line.textContent = 'JerOS v1.0 — Modern Web OS for Stardance.';
    else if (l === 'whoami') line.textContent = 'jermybiju';
    else if (l === 'apps') line.textContent = 'Terminal, Notes, Drawing, Settings';
    else if (l === 'neofetch') {
        line.textContent = `
    ██████╗ ███████╗██████╗  ██████╗ ███████╗
    ██╔══██╗██╔════╝██╔══██╗██╔═══██╗██╔════╝
    ██████╔╝█████╗  ██████╔╝██║   ██║███████╗
    ██╔══██╗██╔══╝  ██╔══██╗██║   ██║╚════██║
    ██║  ██║███████╗██║  ██║╚██████╔╝███████║
    ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
    JerOS v1.0 · Modern Web OS · Stardance
        `;
    } else if (l.startsWith('echo ')) line.textContent = l.substring(5);
    else if (cmd === '') return;
    else line.textContent = 'command not found: ' + cmd;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

// ===== NOTES =====
function saveNotes() {
    var body = window._notesBody;
    if (!body) return;
    var textarea = body.querySelector('textarea');
    if (!textarea) return;
    localStorage.setItem('jeros-notes', textarea.value);
    alert('Notes saved!');
}
function clearNotes() {
    if (!confirm('Clear all notes?')) return;
    var body = window._notesBody;
    if (!body) return;
    var textarea = body.querySelector('textarea');
    if (!textarea) return;
    textarea.value = '';
    localStorage.removeItem('jeros-notes');
}

// ===== DRAWING =====
var drawColor = '#5f7cff';
var isDrawing = false;
var canvasCtx = null;

function initCanvas() {
    var canvas = document.getElementById('drawCanvas');
    if (!canvas) return;
    canvasCtx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    canvasCtx.fillStyle = '#0a0a0e';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    canvasCtx.strokeStyle = drawColor;
    canvasCtx.lineWidth = 3;
    canvasCtx.lineCap = 'round';
    canvasCtx.lineJoin = 'round';

    canvas.addEventListener('mousedown', function(e) {
        isDrawing = true;
        var rect = canvas.getBoundingClientRect();
        canvasCtx.beginPath();
        canvasCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    });
    canvas.addEventListener('mousemove', function(e) {
        if (!isDrawing) return;
        var rect = canvas.getBoundingClientRect();
        canvasCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        canvasCtx.stroke();
    });
    canvas.addEventListener('mouseup', function() { isDrawing = false; });
    canvas.addEventListener('mouseleave', function() { isDrawing = false; });

    window.addEventListener('resize', function() {
        var w = canvas.clientWidth;
        var h = canvas.clientHeight;
        var tempData = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = w;
        canvas.height = h;
        canvasCtx.putImageData(tempData, 0, 0);
        canvasCtx.strokeStyle = drawColor;
        canvasCtx.lineWidth = 3;
        canvasCtx.lineCap = 'round';
        canvasCtx.lineJoin = 'round';
    });
}

function setDrawColor(color) {
    drawColor = color;
    if (canvasCtx) {
        canvasCtx.strokeStyle = color;
    }
}

function clearCanvas() {
    var canvas = document.getElementById('drawCanvas');
    if (!canvas || !canvasCtx) return;
    canvasCtx.fillStyle = '#0a0a0e';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
}

// ===== SETTINGS — THEME TOGGLE =====
function toggleTheme(el) {
    el.classList.toggle('active');
    var dark = el.classList.contains('active');
    var knob = el.querySelector('div');
    if (knob) {
        knob.style.left = dark ? '21px' : '2px';
    }
    localStorage.setItem('jeros-theme', dark ? 'dark' : 'light');
    document.documentElement.style.setProperty('--bg-primary', dark ? '#0c0c10' : '#f0f0f8');
    document.documentElement.style.setProperty('--text-primary', dark ? '#eeeef2' : '#1a1a2e');
    document.documentElement.style.setProperty('--text-secondary', dark ? '#8a8a9e' : '#4a4a6a');
    el.style.background = dark ? 'var(--accent)' : 'rgba(255,255,255,0.08)';
}

// ===== WINDOW CONTROLS =====
function closeWindow(btn) {
    var win = btn.closest('.window');
    var data = windows.find(function(w) { return w.win === win; });
    if (data) {
        data.closed = true;
        win.classList.add('closing');
        setTimeout(function() {
            win.remove();
            windows = windows.filter(function(w) { return w.win !== win; });
            updateTaskbar();
        }, 160);
    }
}

function minimizeWindow(btn) {
    var win = btn.closest('.window');
    var data = windows.find(function(w) { return w.win === win; });
    if (data) {
        data.minimized = !data.minimized;
        win.style.display = data.minimized ? 'none' : 'flex';
        updateTaskbar();
    }
}

function maximizeWindow(btn) {
    var win = btn.closest('.window');
    var data = windows.find(function(w) { return w.win === win; });
    if (!data) return;
    if (!data.maximized) {
        data.prevRect = {
            left: win.style.left,
            top: win.style.top,
            width: win.style.width,
            height: win.style.height
        };
        win.style.left = '0';
        win.style.top = '0';
        win.style.width = '100%';
        win.style.height = 'calc(100% - 80px)';
        win.style.borderRadius = '0';
        data.maximized = true;
    } else {
        if (data.prevRect) {
            win.style.left = data.prevRect.left;
            win.style.top = data.prevRect.top;
            win.style.width = data.prevRect.width;
            win.style.height = data.prevRect.height;
        } else {
            win.style.left = '60px';
            win.style.top = '40px';
            win.style.width = '480px';
            win.style.height = '320px';
        }
        win.style.borderRadius = '14px 10px 16px 8px';
        data.maximized = false;
    }
}

// ===== TASKBAR UPDATE =====
function updateTaskbar() {
    var container = document.getElementById('taskbar-apps');
    container.innerHTML = '';
    windows.forEach(function(w) {
        if (w.closed) return;
        var btn = document.createElement('div');
        btn.className = 'taskbar-app' + (w.minimized ? '' : ' active');
        var cfg = appConfig[w.type];
        var icon = cfg ? cfg.icon : 'fa-cube';
        btn.innerHTML = '<i class="fa-solid ' + icon + '"></i> ' + (cfg ? cfg.title : w.type);
        btn.onclick = function() {
            if (w.minimized) {
                w.minimized = false;
                w.win.style.display = 'flex';
            }
            w.win.style.zIndex = ++zIndexCounter;
            updateTaskbar();
        };
        container.appendChild(btn);
    });
}

// ===== BOOT =====
window.addEventListener('load', function() {
    setTimeout(function() {
        document.getElementById('boot').classList.add('hidden');
    }, 1800);
});

// ===== CLOCK =====
function updateClock() {
    var now = new Date();
    document.getElementById('clockDisplay').textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('dateDisplay').textContent = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}
setInterval(updateClock, 1000);
updateClock();

// ===== CLOSE MENU =====
function closeMenu() {
    document.getElementById('menu').classList.remove('open');
}

// ===== START MENU =====
function toggleMenu(){
    var menu = document.getElementById('menu');
    menu.classList.toggle('open');
    if (menu.classList.contains('open')) {
        document.getElementById('searchInput').focus();
    }
}
function filterApps(val) {
    var items = document.querySelectorAll('#appGrid .app');
    var v = val.toLowerCase();
    for (var i = 0; i < items.length; i++) {
        var text = items[i].textContent.toLowerCase();
        items[i].style.display = text.includes(v) ? 'flex' : 'none';
    }
}

// ===== WALLPAPER =====
function changeWallpaper(classname) {
    var desktop = document.getElementById('desktop');
    desktop.className = classname;
    localStorage.setItem('jeros-wallpaper', classname);
}
window.addEventListener('load', function() {
    var savedWallpaper = localStorage.getItem('jeros-wallpaper');
    if (savedWallpaper) {
        document.getElementById('desktop').className = savedWallpaper;
    }
});

// ===== DOUBLE CLICK =====
document.getElementById('desktop').addEventListener('dblclick', function(e) {
    if (e.target.closest('#icons') || e.target.closest('#taskbar')) return;
    toggleMenu();
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', function(e) {
    if (e.altKey && e.key === 'm') {
        e.preventDefault();
        toggleMenu();
    }
    if (e.key == 'Escape') {
        if (document.getElementById('menu').classList.contains('open')) {
            closeMenu();
        }
    }
});

// ===== APP CLICK HANDLER =====
var appItems = document.querySelectorAll('.icon-item, .app');
for (var i = 0; i < appItems.length; i++) {
    appItems[i].addEventListener('click', function(e) {
        var app = this.dataset.app || 'unknown';
        openApp(app);
        closeMenu();
    });
}

console.log('JerOS Phase 2 loaded successfully.');
console.log('wallpaper changer works.');
console.log('Alt + M = toggle menu.');
console.log('double-click desktop = toggle menu.');
console.log('Windows: draggable, minimize, maximize, close.');
