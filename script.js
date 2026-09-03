// WINDOW MANAGER
var windowCount = 0;
var windows = [];
var zIndexCounter = 100;

var appConfig = {
    terminal: { title: 'Terminal', icon: 'fa-terminal', w: 420, h: 280 },
    notes: { title: 'Notes', icon: 'fa-note-sticky', w: 460, h: 600 }, // height increased to 600
    drawing: { title: 'Drawing', icon: 'fa-palette', w: 500, h: 400 },
    settings: { title: 'Settings', icon: 'fa-sliders', w: 460, h: 320 },
    about: { title: 'About JerOS', icon: 'fa-circle-question', w: 420, h: 300 },
    files: { title: 'File Manager', icon: 'fa-folder', w: 520, h: 380 },
    calculator: { title: 'Calculator', icon: 'fa-calculator', w: 340, h: 420 }
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

    // Perfect centering
    var screenW = window.innerWidth;
    var screenH = window.innerHeight;
    var winW = cfg.w;
    var winH = cfg.h;
    var left = (screenW - winW) / 2;
    var top = (screenH - winH) / 2;
    left = Math.max(10, Math.min(left, screenW - winW - 10));
    top = Math.max(10, Math.min(top, screenH - winH - 10));

    var win = document.createElement('div');
    win.className = 'window';
    win.style.width = winW + 'px';
    win.style.height = winH + 'px';
    win.style.left = left + 'px';
    win.style.top = top + 'px';
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

    // Resize handle
    var resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    win.appendChild(resizeHandle);

    var isResizing = false;
    resizeHandle.addEventListener('mousedown', function(e) {
        e.stopPropagation();
        isResizing = true;
        var startX = e.clientX;
        var startY = e.clientY;
        var startW = win.offsetWidth;
        var startH = win.offsetHeight;

        function onMouseMove(e) {
            if (!isResizing) return;
            var newW = Math.max(320, startW + (e.clientX - startX));
            var newH = Math.max(180, startH + (e.clientY - startY));
            win.style.width = newW + 'px';
            win.style.height = newH + 'px';
        }
        function onMouseUp() {
            isResizing = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    // --- Terminal (Prompt at Top) ---
    if (type === 'terminal') {
        body.innerHTML = `
            <div style="background:var(--bg-textarea); padding:12px; border-radius:6px; font-family:'Courier New',monospace; color:#7aff8a; flex:1; display:flex; flex-direction:column;">
                <div style="display:flex; gap:8px; align-items:baseline; margin-bottom:6px;">
                    <span style="color:#7aff8a;">$</span>
                    <input type="text" id="term-input" style="background:transparent; border:none; color:#7aff8a; font-family:'Courier New',monospace; font-size:0.8rem; outline:none; flex:1;">
                </div>
                <div id="term-output" style="color:var(--text-secondary); white-space:pre-wrap; flex:1; overflow-y:auto; min-height:60px;"></div>
            </div>
        `;
        var input = body.querySelector('#term-input');
        var output = body.querySelector('#term-output');
        output.textContent = 'Type "help" to get started.';
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                var cmd = input.value.trim();
                input.value = '';
                executeTerminal(cmd, output);
            }
        });
        setTimeout(function() { input.focus(); }, 50);
    }
    // --- Notes (Textarea full height, buttons readable, window height 600) ---
    else if (type === 'notes') {
        var saved = localStorage.getItem('jeros-notes') || '';
        body.className = 'window-body notes-body';
        body.innerHTML = `
            <textarea>${saved}</textarea>
            <div class="note-actions">
                <button onclick="saveNotes()">Save</button>
                <button onclick="clearNotes()">Clear</button>
            </div>
        `;
        window._notesBody = body;
    }
    // Drawing
    else if (type === 'drawing') {
        body.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:10px; height:100%; flex:1;">
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button onclick="setDrawColor('#5f7cff')" style="width:30px; height:30px; border-radius:50%; border:2px solid var(--border-glass); background:#5f7cff; cursor:pointer;"></button>
                    <button onclick="setDrawColor('#ff6b6b')" style="width:30px; height:30px; border-radius:50%; border:2px solid var(--border-glass); background:#ff6b6b; cursor:pointer;"></button>
                    <button onclick="setDrawColor('#51cf66')" style="width:30px; height:30px; border-radius:50%; border:2px solid var(--border-glass); background:#51cf66; cursor:pointer;"></button>
                    <button onclick="setDrawColor('#fcc419')" style="width:30px; height:30px; border-radius:50%; border:2px solid var(--border-glass); background:#fcc419; cursor:pointer;"></button>
                    <button onclick="setDrawColor('#ffffff')" style="width:30px; height:30px; border-radius:50%; border:2px solid var(--border-glass); background:#ffffff; cursor:pointer;"></button>
                    <button onclick="clearCanvas()" style="background:var(--bg-card); border:1px solid var(--border-glass); padding:4px 16px; border-radius:6px; color:var(--text-secondary); cursor:pointer; font-size:0.7rem;">Clear</button>
                </div>
                <canvas id="drawCanvas" style="flex:1; background:#0a0a0e; border-radius:8px; border:1px solid var(--border-glass); cursor:crosshair; width:100%; height:100%;"></canvas>
            </div>
        `;
        setTimeout(initCanvas, 50);
    }
    // Settings
    else if (type === 'settings') {
        var darkMode = localStorage.getItem('jeros-theme') !== 'light';
        body.innerHTML = `
            <h3 style="font-size:0.9rem; color:var(--text-primary); margin-bottom:14px;">System Settings</h3>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border-glass);">
                <span style="font-size:0.75rem; color:var(--text-secondary);">Dark Mode</span>
                <div class="toggle ${darkMode ? 'active' : ''}" onclick="toggleTheme(this)" style="width:40px; height:22px; background:${darkMode ? 'var(--accent)' : 'var(--bg-glass)'}; border-radius:40px; cursor:pointer; position:relative; transition:0.2s; border:1px solid var(--border-glass);">
                    <div style="width:16px; height:16px; background:var(--text-primary); border-radius:50%; position:absolute; top:2px; left:${darkMode ? '21px' : '2px'}; transition:0.2s;"></div>
                </div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border-glass);">
                <span style="font-size:0.75rem; color:var(--text-secondary);">Version</span>
                <span style="font-size:0.75rem; color:var(--accent);">1.0.0</span>
            </div>
        `;
    }
    // About
    else if (type === 'about') {
        body.innerHTML = `
            <div style="text-align:center; padding:12px 0; flex:1; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:3.6rem; margin-bottom:8px; color:var(--accent);">✦</div>
                <h2 style="font-size:1.4rem; font-weight:700; color:var(--text-primary); letter-spacing:-0.5px;">JerOS</h2>
                <p style="font-size:0.8rem; color:var(--text-secondary);">Your Web. Your Workspace. Your OS.</p>
                <div style="margin:14px 0; padding:14px; background:var(--bg-card); border-radius:8px; border:1px solid var(--border-glass);">
                    <p style="font-size:0.7rem; color:var(--text-muted);">Version 1.0.0</p>
                    <p style="font-size:0.7rem; color:var(--text-muted);">Built with HTML, CSS, JavaScript</p>
                    <p style="font-size:0.7rem; color:var(--accent);">Stardance WebOS 1</p>
                </div>
                <p style="font-size:0.6rem; color:var(--text-muted);">© 2026 JerOS · Jermy Biju</p>
            </div>
        `;
    }
    // File Manager
    else if (type === 'files') {
        body.innerHTML = `
            <div style="display:flex; gap:16px; height:100%; flex:1;">
                <div style="min-width:120px; border-right:1px solid var(--border-glass); padding-right:12px;">
                    <div style="font-size:0.6rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Folders</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary); padding:4px 0; cursor:pointer;" onclick="showNotification('Folder', 'Documents opened')">📁 Documents</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary); padding:4px 0; cursor:pointer;" onclick="showNotification('Folder', 'Downloads opened')">📁 Downloads</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary); padding:4px 0; cursor:pointer;" onclick="showNotification('Folder', 'Projects opened')">📁 Projects</div>
                </div>
                <div style="flex:1;">
                    <div style="font-size:0.6rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Files</div>
                    <div class="file-grid">
                        <div class="file-item" onclick="showNotification('File', 'README.md opened')"><span class="file-icon">📄</span><span class="file-name">README.md</span></div>
                        <div class="file-item" onclick="showNotification('File', 'index.html opened')"><span class="file-icon">📄</span><span class="file-name">index.html</span></div>
                        <div class="file-item" onclick="showNotification('File', 'style.css opened')"><span class="file-icon">📄</span><span class="file-name">style.css</span></div>
                        <div class="file-item" onclick="showNotification('File', 'script.js opened')"><span class="file-icon">📄</span><span class="file-name">script.js</span></div>
                    </div>
                </div>
            </div>
        `;
    }
    // Calculator
    else if (type === 'calculator') {
        body.innerHTML = `
            <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; padding:8px;">
                <div class="calc-grid">
                    <div class="display" id="calc-display">0</div>
                    <button onclick="calcInput('7')">7</button>
                    <button onclick="calcInput('8')">8</button>
                    <button onclick="calcInput('9')">9</button>
                    <button class="op" onclick="calcInput('/')">÷</button>
                    <button onclick="calcInput('4')">4</button>
                    <button onclick="calcInput('5')">5</button>
                    <button onclick="calcInput('6')">6</button>
                    <button class="op" onclick="calcInput('*')">×</button>
                    <button onclick="calcInput('1')">1</button>
                    <button onclick="calcInput('2')">2</button>
                    <button onclick="calcInput('3')">3</button>
                    <button class="op" onclick="calcInput('-')">−</button>
                    <button onclick="calcInput('0')">0</button>
                    <button onclick="calcInput('.')">.</button>
                    <button onclick="calcInput('C')">C</button>
                    <button class="eq" onclick="calcInput('=')">=</button>
                </div>
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
        if (e.target.closest('.window-controls') || e.target.closest('.resize-handle')) return;
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

// ===== TERMINAL COMMANDS =====
function executeTerminal(cmd, output) {
    var line = document.createElement('div');
    line.style.color = 'var(--text-secondary)';
    line.style.whiteSpace = 'pre-wrap';
    var l = cmd.toLowerCase();
    if (l === 'help') line.textContent = 'Commands: help, clear, date, time, about, apps, neofetch, echo, whoami';
    else if (l === 'clear') { output.innerHTML = ''; return; }
    else if (l === 'date') line.textContent = new Date().toDateString();
    else if (l === 'time') line.textContent = new Date().toTimeString();
    else if (l === 'about') line.textContent = 'JerOS v1.0 — Modern Web OS for Stardance.';
    else if (l === 'whoami') line.textContent = 'jermybiju';
    else if (l === 'apps') line.textContent = 'Terminal, Notes, Drawing, Settings, Files, Calculator';
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
    showNotification('Notes', 'Note saved!');
}
function clearNotes() {
    if (!confirm('Clear all notes?')) return;
    var body = window._notesBody;
    if (!body) return;
    var textarea = body.querySelector('textarea');
    if (!textarea) return;
    textarea.value = '';
    localStorage.removeItem('jeros-notes');
    showNotification('Notes', 'Cleared!');
}

// ===== DRAWING =====
var drawColor = '#5f7cff';
var canvasCtx = null;

function initCanvas() {
    var canvas = document.getElementById('drawCanvas');
    if (!canvas) return;
    canvasCtx = canvas.getContext('2d');
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvasCtx.fillStyle = '#0a0a0e';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    canvasCtx.strokeStyle = drawColor;
    canvasCtx.lineWidth = 3;
    canvasCtx.lineCap = 'round';
    canvasCtx.lineJoin = 'round';

    window.addEventListener('resize', function() {
        var rect = canvas.getBoundingClientRect();
        var tempData = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = rect.width;
        canvas.height = rect.height;
        canvasCtx.putImageData(tempData, 0, 0);
        canvasCtx.strokeStyle = drawColor;
        canvasCtx.lineWidth = 3;
        canvasCtx.lineCap = 'round';
        canvasCtx.lineJoin = 'round';
    });

    var isDown = false;
    canvas.addEventListener('mousedown', function(e) {
        isDown = true;
        var rect = canvas.getBoundingClientRect();
        var scaleX = canvas.width / rect.width;
        var scaleY = canvas.height / rect.height;
        var lastX = (e.clientX - rect.left) * scaleX;
        var lastY = (e.clientY - rect.top) * scaleY;
        canvasCtx.beginPath();
        canvasCtx.moveTo(lastX, lastY);
        canvas.addEventListener('mousemove', function onMove(e) {
            if (!isDown) return;
            var rect = canvas.getBoundingClientRect();
            var scaleX = canvas.width / rect.width;
            var scaleY = canvas.height / rect.height;
            var x = (e.clientX - rect.left) * scaleX;
            var y = (e.clientY - rect.top) * scaleY;
            canvasCtx.lineTo(x, y);
            canvasCtx.stroke();
        });
        canvas.addEventListener('mouseup', function onUp() {
            isDown = false;
            canvas.removeEventListener('mousemove', onMove);
            canvas.removeEventListener('mouseup', onUp);
        });
        canvas.addEventListener('mouseleave', function onLeave() {
            isDown = false;
            canvas.removeEventListener('mousemove', onMove);
            canvas.removeEventListener('mouseup', onUp);
        });
    });
}

function setDrawColor(color) {
    drawColor = color;
    if (canvasCtx) canvasCtx.strokeStyle = color;
}
function clearCanvas() {
    var canvas = document.getElementById('drawCanvas');
    if (!canvas || !canvasCtx) return;
    canvasCtx.fillStyle = '#0a0a0e';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    showNotification('Drawing', 'Canvas cleared!');
}

// ===== SETTINGS — THEME TOGGLE =====
function toggleTheme(el) {
    var isActive = el.classList.toggle('active');
    var body = document.body;
    if (isActive) {
        body.classList.remove('light-mode');
        localStorage.setItem('jeros-theme', 'dark');
    } else {
        body.classList.add('light-mode');
        localStorage.setItem('jeros-theme', 'light');
    }
    var knob = el.querySelector('div');
    if (knob) knob.style.left = isActive ? '21px' : '2px';
    el.style.background = isActive ? 'var(--accent)' : 'var(--bg-glass)';
    showNotification('Settings', 'Theme changed!');
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
        data.prevRect = { left: win.style.left, top: win.style.top, width: win.style.width, height: win.style.height };
        win.style.left = '0'; win.style.top = '0';
        win.style.width = '100%'; win.style.height = 'calc(100% - 80px)';
        win.style.borderRadius = '0';
        data.maximized = true;
    } else {
        if (data.prevRect) {
            win.style.left = data.prevRect.left; win.style.top = data.prevRect.top;
            win.style.width = data.prevRect.width; win.style.height = data.prevRect.height;
        } else {
            win.style.left = '60px'; win.style.top = '40px';
            win.style.width = '480px'; win.style.height = '320px';
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
        btn.innerHTML = '<i class="fa-solid ' + icon + '"></i> ' + (cfg ? cfg.title : w.type) + ' <button class="close-btn" onclick="closeWindowFromTaskbar(this)">×</button>';
        btn.onclick = function(e) {
            if (e.target.classList.contains('close-btn')) return;
            if (w.minimized) { w.minimized = false; w.win.style.display = 'flex'; }
            w.win.style.zIndex = ++zIndexCounter;
            updateTaskbar();
        };
        container.appendChild(btn);
    });
}
function closeWindowFromTaskbar(btn) {
    var taskbarApp = btn.closest('.taskbar-app');
    if (!taskbarApp) return;
    var index = Array.from(taskbarApp.parentNode.children).indexOf(taskbarApp);
    var visibleWindows = windows.filter(function(w) { return !w.closed; });
    if (index < visibleWindows.length) {
        var data = visibleWindows[index];
        if (data) { var win = data.win; var closeBtn = win.querySelector('.window-controls .close'); if (closeBtn) closeBtn.click(); }
    }
    updateTaskbar();
}

// ===== BOOT =====
window.addEventListener('load', function() {
    var theme = localStorage.getItem('jeros-theme') || 'dark';
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        var toggle = document.querySelector('.toggle');
        if (toggle) { toggle.classList.remove('active'); var knob = toggle.querySelector('div'); if (knob) knob.style.left = '2px'; toggle.style.background = 'var(--bg-glass)'; }
    }
    setTimeout(function() { document.getElementById('boot').classList.add('hidden'); }, 1800);
});

// ===== CLOCK =====
function updateClock() {
    var now = new Date();
    document.getElementById('clockDisplay').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('dateDisplay').textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
setInterval(updateClock, 1000); updateClock();

// ===== MENU =====
function closeMenu() { document.getElementById('menu').classList.remove('open'); }
function toggleMenu(){ var menu = document.getElementById('menu'); menu.classList.toggle('open'); if (menu.classList.contains('open')) { document.getElementById('searchInput').focus(); } }
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
    showNotification('Wallpaper', 'Changed!');
}
window.addEventListener('load', function() {
    var savedWallpaper = localStorage.getItem('jeros-wallpaper');
    if (savedWallpaper) document.getElementById('desktop').className = savedWallpaper;
});

// ===== DOUBLE CLICK (Disabled) =====

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', function(e) {
    if (e.altKey && e.key === 'm') { e.preventDefault(); toggleMenu(); }
    if (e.key == 'Escape') { if (document.getElementById('menu').classList.contains('open')) closeMenu(); }
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

// ===== CALCULATOR =====
var calcStr = '';
function calcInput(val) {
    var display = document.getElementById('calc-display');
    if (!display) return;
    if (val === 'C') { calcStr = ''; display.textContent = '0'; return; }
    if (val === '=') {
        try { calcStr = Function('"use strict"; return (' + calcStr + ')')(); } catch (e) { calcStr = 'Error'; }
        display.textContent = calcStr;
        return;
    }
    if (calcStr === '0' && val !== '.') calcStr = val;
    else calcStr += val;
    display.textContent = calcStr;
}

// ===== NOTIFICATIONS =====
function showNotification(title, body, duration) {
    duration = duration || 3000;
    var container = document.getElementById('notification-container');
    if (!container) return;
    var notif = document.createElement('div');
    notif.className = 'notification';
    notif.innerHTML = `<button class="notif-close" onclick="this.parentElement.remove()">✕</button><div class="notif-title">${title}</div><div class="notif-body">${body}</div>`;
    container.appendChild(notif);
    setTimeout(function() { notif.classList.add('notification-out'); setTimeout(function() { notif.remove(); }, 300); }, duration);
}

// ===== CONTEXT MENU =====
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    var menu = document.getElementById('context-menu');
    if (!menu) return;
    menu.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
    menu.style.top = Math.min(e.clientY, window.innerHeight - 150) + 'px';
    menu.classList.add('open');
});
document.addEventListener('click', function() { var menu = document.getElementById('context-menu'); if (menu) menu.classList.remove('open'); });

console.log('JerOS Phase 3 final — Notes textarea now much larger.');