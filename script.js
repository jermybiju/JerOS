// ===== GLOBALS =====
var windowCount = 0;
var windows = [];
var zIndexCounter = 100;
var drawColor = '#5f7cff';
var canvasCtx = null;

// ===== APP CONFIG =====
var appConfig = {
    terminal: { title: 'Terminal', icon: 'fa-terminal', w: 440, h: 300 },
    notes: { title: 'Notes', icon: 'fa-note-sticky', w: 460, h: 500 },
    drawing: { title: 'Drawing', icon: 'fa-palette', w: 520, h: 420 },
    settings: { title: 'Settings', icon: 'fa-sliders', w: 460, h: 340 },
    about: { title: 'About JerOS', icon: 'fa-circle-question', w: 420, h: 300 },
    files: { title: 'File Manager', icon: 'fa-folder', w: 540, h: 400 },
    calculator: { title: 'Calculator', icon: 'fa-calculator', w: 480, h: 440 }
};

// ===== OPEN APP =====
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

    // resize handle
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

    // --- Terminal ---
    if (type === 'terminal') {
        body.innerHTML = `
            <div style="background:var(--bg-textarea); padding:12px; border-radius:6px; font-family:'Courier New',monospace; flex:1; display:flex; flex-direction:column;">
                <div style="display:flex; gap:8px; align-items:baseline; margin-bottom:6px;">
                    <span class="term-prompt">$</span>
                    <input type="text" id="term-input" style="background:transparent; border:none; color:var(--text-primary); font-family:'Courier New',monospace; font-size:0.8rem; outline:none; flex:1;">
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

    // --- Notes ---
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

    // --- Drawing ---
    else if (type === 'drawing') {
        body.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:10px; height:100%; flex:1; padding:10px;">
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button onclick="setDrawColor('#5f7cff')" style="width:32px; height:32px; border-radius:50%; border:2px solid var(--border-glass); background:#5f7cff; cursor:pointer;"></button>
                    <button onclick="setDrawColor('#ff6b6b')" style="width:32px; height:32px; border-radius:50%; border:2px solid var(--border-glass); background:#ff6b6b; cursor:pointer;"></button>
                    <button onclick="setDrawColor('#51cf66')" style="width:32px; height:32px; border-radius:50%; border:2px solid var(--border-glass); background:#51cf66; cursor:pointer;"></button>
                    <button onclick="setDrawColor('#fcc419')" style="width:32px; height:32px; border-radius:50%; border:2px solid var(--border-glass); background:#fcc419; cursor:pointer;"></button>
                    <button onclick="setDrawColor('#ffffff')" style="width:32px; height:32px; border-radius:50%; border:2px solid var(--border-glass); background:#ffffff; cursor:pointer;"></button>
                    <button onclick="clearCanvas()" style="background:var(--bg-card); border:1px solid var(--border-glass); padding:4px 16px; border-radius:6px; color:var(--text-secondary); cursor:pointer; font-size:0.7rem;">Clear</button>
                </div>
                <canvas id="drawCanvas" style="flex:1; background:#0a0a0e; border-radius:8px; border:1px solid var(--border-glass); cursor:crosshair; width:100%; height:100%;"></canvas>
            </div>
        `;
        setTimeout(initCanvas, 50);
    }

    // --- Settings ---
    else if (type === 'settings') {
        var darkMode = localStorage.getItem('jeros-theme') !== 'light';
        var fontSize = localStorage.getItem('jeros-font-size') || '1rem';
        body.innerHTML = `
            <h3 style="font-size:0.9rem; color:var(--text-primary); margin-bottom:14px; padding:0 12px;">System Settings</h3>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border-bottom:1px solid var(--border-glass);">
                <span style="font-size:0.75rem; color:var(--text-secondary);">Dark Mode</span>
                <div class="toggle ${darkMode ? 'active' : ''}" onclick="toggleTheme(this)" style="width:40px; height:22px; background:${darkMode ? 'var(--accent)' : 'var(--bg-glass)'}; border-radius:40px; cursor:pointer; position:relative; transition:0.2s; border:1px solid var(--border-glass);">
                    <div style="width:16px; height:16px; background:var(--text-primary); border-radius:50%; position:absolute; top:2px; left:${darkMode ? '21px' : '2px'}; transition:0.2s;"></div>
                </div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border-bottom:1px solid var(--border-glass);">
                <span style="font-size:0.75rem; color:var(--text-secondary);">Font Size</span>
                <select onchange="changeFontSize(this.value)" style="background:var(--bg-input); border:1px solid var(--border-input); border-radius:4px; color:var(--text-primary); padding:2px 6px; font-size:0.8rem;">
                    <option value="0.8rem" ${fontSize === '0.8rem' ? 'selected' : ''}>Small</option>
                    <option value="1rem" ${fontSize === '1rem' ? 'selected' : ''}>Normal</option>
                    <option value="1.2rem" ${fontSize === '1.2rem' ? 'selected' : ''}>Large</option>
                </select>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border-bottom:1px solid var(--border-glass);">
                <span style="font-size:0.75rem; color:var(--text-secondary);">Version</span>
                <span style="font-size:0.75rem; color:var(--accent);">1.0.0</span>
            </div>
        `;
    }

    // --- About ---
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

    // --- File Manager ---
    else if (type === 'files') {
        body.innerHTML = `
            <div style="display:flex; gap:16px; height:100%; flex:1; padding:10px;">
                <div style="min-width:130px; border-right:1px solid var(--border-glass); padding-right:12px;">
                    <div style="font-size:0.6rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Folders</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary); padding:6px 0; cursor:pointer;" data-folder="Documents">📁 Documents</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary); padding:6px 0; cursor:pointer;" data-folder="Downloads">📁 Downloads</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary); padding:6px 0; cursor:pointer;" data-folder="Projects">📁 Projects</div>
                </div>
                <div style="flex:1;">
                    <div style="font-size:0.6rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Files</div>
                    <div class="file-grid" id="file-grid">
                        <div style="color:var(--text-muted); font-size:0.7rem; padding:20px; text-align:center; grid-column:1/-1;">Select a folder to view files</div>
                    </div>
                </div>
            </div>
        `;
        var folderItems = body.querySelectorAll('[data-folder]');
        for (var i = 0; i < folderItems.length; i++) {
            folderItems[i].addEventListener('click', function() {
                var folder = this.dataset.folder;
                openFolderContent(folder, this.closest('.window'));
            });
        }
    }

    // --- Calculator (with History) ---
    else if (type === 'calculator') {
        var historyHtml = localStorage.getItem('jeros-calc-history') || '';
        body.innerHTML = `
            <div class="calc-wrapper">
                <div class="calc-main">
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
                <div class="calc-history-side" id="calc-history-side">
                    <div class="hist-title">
                        📜 History
                        <button class="clear-history" onclick="clearCalcHistory()">Clear all</button>
                    </div>
                    ${historyHtml}
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

// ===== TERMINAL =====
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

// ===== SETTINGS =====
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
function changeFontSize(size) {
    localStorage.setItem('jeros-font-size', size);
    document.documentElement.style.fontSize = size;
    showNotification('Settings', 'Font size changed!');
}

// ===== FILE MANAGER =====
function openFolderContent(folder, win) {
    var fileGrid = win.querySelector('#file-grid');
    if (!fileGrid) return;
    var files = {
        'Documents': ['📄 Report.docx', '📊 Sheet.xlsx', '📝 Notes.txt', '📑 Invoice.pdf'],
        'Downloads': ['📦 setup.exe', '🎬 video.mp4', '🖼 image.png', '🎵 song.mp3'],
        'Projects': ['📁 ProjectA', '📁 ProjectB', '📄 README.md', '📊 timeline.gantt']
    };
    var items = files[folder] || ['📁 Empty folder'];
    fileGrid.innerHTML = '';
    for (var i = 0; i < items.length; i++) {
        var div = document.createElement('div');
        div.className = 'file-item';
        div.innerHTML = `
            <span class="file-icon">${items[i].split(' ')[0]}</span>
            <span class="file-name">${items[i].substring(items[i].indexOf(' ') + 1)}</span>
        `;
        div.onclick = function() {
            showNotification('File', this.querySelector('.file-name').textContent + ' opened');
        };
        fileGrid.appendChild(div);
    }
    showNotification('Folder', folder + ' opened');
}

// ===== WALLPAPER =====
function uploadWallpaper(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var desktop = document.getElementById('desktop');
        desktop.style.backgroundImage = 'url(' + e.target.result + ')';
        desktop.style.backgroundSize = 'cover';
        desktop.style.backgroundPosition = 'center';
        localStorage.setItem('jeros-wallpaper-custom', e.target.result);
        showNotification('Wallpaper', 'Custom wallpaper uploaded!');
    };
    reader.readAsDataURL(file);
}
function changeWallpaper(classname) {
    var desktop = document.getElementById('desktop');
    desktop.className = classname;
    desktop.style.backgroundImage = '';
    localStorage.removeItem('jeros-wallpaper-custom');
    localStorage.setItem('jeros-wallpaper', classname);
    showNotification('Wallpaper', 'Changed!');
}

// ===== CALCULATOR =====
var calcStr = '';

function calcInput(val) {
    var display = document.getElementById('calc-display');
    if (!display) return;

    if (val === 'C') {
        calcStr = '';
        display.textContent = '0';
        return;
    }

    if (val === '=') {
        // Store the expression before evaluating
        var expression = calcStr;
        try {
            // Evaluate safely
            var result = Function('"use strict"; return (' + calcStr + ')')();
            calcStr = String(result);
            display.textContent = calcStr;

            // Add to history with expression and result
            var history = document.getElementById('calc-history-side');
            if (history) {
                var entry = document.createElement('div');
                entry.className = 'hist-entry';
                // Format nicely for display: replace * with ×, / with ÷, - with −
                var displayExpr = expression.replace(/\*/g, '×').replace(/\//g, '÷').replace(/\-/g, '−');
                entry.textContent = displayExpr + ' = ' + calcStr;
                history.appendChild(entry);

                // Save only entries (without heading) to localStorage
                var entries = history.querySelectorAll('.hist-entry');
                var historyData = '';
                for (var i = 0; i < entries.length; i++) {
                    historyData += entries[i].outerHTML;
                }
                localStorage.setItem('jeros-calc-history', historyData);
            }
        } catch (e) {
            calcStr = 'Error';
            display.textContent = calcStr;
        }
        return;
    }

    // Normal input
    if (calcStr === '0' && val !== '.') {
        calcStr = val;
    } else {
        calcStr += val;
    }
    display.textContent = calcStr;
}

function clearCalcHistory() {
    if (!confirm('Clear calculation history?')) return;
    var history = document.getElementById('calc-history-side');
    if (history) {
        // Remove only entries, keep the title heading
        var entries = history.querySelectorAll('.hist-entry');
        for (var i = 0; i < entries.length; i++) {
            entries[i].remove();
        }
        localStorage.removeItem('jeros-calc-history');
        showNotification('Calculator', 'History cleared!');
    }
}

// ===== SYSTEM TRAY — Actual Device Info =====
document.getElementById('tray-network').addEventListener('click', function() {
    if (navigator.connection) {
        var conn = navigator.connection;
        var type = conn.effectiveType || 'unknown';
        var speed = conn.downlink ? conn.downlink + ' Mbps' : 'N/A';
        showNotification('Network', '📶 ' + type + ' · ' + speed);
    } else {
        showNotification('Network', '📶 Wi-Fi: Connected');
    }
});
// Volume state (stored in localStorage for persistence)
var systemVolume = parseInt(localStorage.getItem('jeros-system-volume')) || 75;

document.getElementById('tray-volume').addEventListener('click', function() {
    // Simulate system volume fluctuation (-5% to +5%)
    var change = Math.floor(Math.random() * 11) - 5;
    systemVolume = Math.min(100, Math.max(0, systemVolume + change));
    localStorage.setItem('jeros-system-volume', systemVolume);
    
    // Create a volume bar (▰ filled, ▱ empty)
    var bar = '';
    var filled = Math.round(systemVolume / 10);
    for (var i = 0; i < 10; i++) {
        bar += (i < filled) ? '▰' : '▱';
    }
    
    // Dynamic icon based on level
    var icon = systemVolume > 60 ? '🔊' : (systemVolume > 30 ? '🔉' : '🔈');
    var muted = systemVolume === 0 ? ' 🔇 Muted' : '';
    
    showNotification('Volume', icon + ' ' + systemVolume + '%  ' + bar + muted);
});


document.getElementById('tray-battery').addEventListener('click', function() {
    if (navigator.getBattery) {
        navigator.getBattery().then(function(battery) {
            var level = Math.round(battery.level * 100);
            var charging = battery.charging ? 'Charging' : 'Discharging';
            showNotification('Battery', '🔋 ' + level + '% · ' + charging);
        }).catch(function() {
            showNotification('Battery', '🔋 Battery info not available');
        });
    } else {
        showNotification('Battery', '🔋 Battery: 87% (API not supported)');
    }
});

// ===== TASKBAR RIGHT-CLICK =====
document.getElementById('taskbar').addEventListener('contextmenu', function(e) {
    e.preventDefault();
    var menu = document.getElementById('taskbar-context-menu');
    if (!menu) return;
    menu.style.left = e.clientX - 100 + 'px';
    menu.style.bottom = '70px';
    menu.classList.toggle('open');
});
document.addEventListener('click', function() {
    var menu = document.getElementById('taskbar-context-menu');
    if (menu) menu.classList.remove('open');
});

document.getElementById('ctx-taskmgr').addEventListener('click', function() {
    document.getElementById('taskbar-context-menu').classList.remove('open');
    showNotification('Task Manager', 'Processes: 24 running, 0 suspended');
});
document.getElementById('ctx-settings').addEventListener('click', function() {
    document.getElementById('taskbar-context-menu').classList.remove('open');
    openApp('settings');
});
document.getElementById('ctx-startmenu').addEventListener('click', function() {
    document.getElementById('taskbar-context-menu').classList.remove('open');
    toggleMenu();
});

// ===== NOTIFICATIONS =====
function showNotification(title, body, duration) {
    duration = duration || 3000;
    var container = document.getElementById('notification-container');
    if (!container) return;
    var notif = document.createElement('div');
    notif.className = 'notification';
    notif.innerHTML = `<button class="notif-close" onclick="this.parentElement.remove()">✕</button><div class="notif-title">${title}</div><div class="notif-body">${body}</div>`;
    container.appendChild(notif);
    setTimeout(function() {
        notif.classList.add('notification-out');
        setTimeout(function() { notif.remove(); }, 300);
    }, duration);
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

// ===== CONTEXT MENU (Desktop) =====
document.addEventListener('contextmenu', function(e) {
    if (e.target.closest('#taskbar') || e.target.closest('#menu')) return;
    e.preventDefault();
    var menu = document.getElementById('context-menu');
    if (!menu) return;
    menu.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
    menu.style.top = Math.min(e.clientY, window.innerHeight - 150) + 'px';
    menu.classList.add('open');
});
document.addEventListener('click', function() { var menu = document.getElementById('context-menu'); if (menu) menu.classList.remove('open'); });

document.getElementById('ctx-wallpaper').addEventListener('click', function() {
    document.getElementById('context-menu').classList.remove('open');
    document.getElementById('wallpaperUpload').click();
});
document.getElementById('ctx-refresh').addEventListener('click', function() {
    document.getElementById('context-menu').classList.remove('open');
    showNotification('Refresh', 'Desktop refreshed');
});

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

// ===== KEYBOARD SHORTCUTS =====
function showShortcuts() {
    document.getElementById('shortcuts-popup').classList.add('open');
}
function closeShortcuts() {
    document.getElementById('shortcuts-popup').classList.remove('open');
}
document.addEventListener('keydown', function(e) {
    if (e.altKey && e.key === 't') { e.preventDefault(); openApp('terminal'); }
    if (e.altKey && e.key === 'n') { e.preventDefault(); openApp('notes'); }
    if (e.altKey && e.key === 'm') { e.preventDefault(); toggleMenu(); }
    if (e.altKey && e.key === 's') { e.preventDefault(); showShortcuts(); }
    if (e.key === 'Escape') {
        if (document.getElementById('menu').classList.contains('open')) closeMenu();
        if (document.getElementById('shortcuts-popup').classList.contains('open')) closeShortcuts();
    }
});

// ===== CLOCK =====
function updateClock() {
    var now = new Date();
    document.getElementById('clockDisplay').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('dateDisplay').textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
setInterval(updateClock, 1000); updateClock();

// ===== APP CLICK HANDLER =====
var appItems = document.querySelectorAll('.icon-item, .app');
for (var i = 0; i < appItems.length; i++) {
    appItems[i].addEventListener('click', function(e) {
        var app = this.dataset.app || 'unknown';
        openApp(app);
        closeMenu();
    });
}

// ===== BOOT =====
window.addEventListener('load', function() {
    var theme = localStorage.getItem('jeros-theme') || 'dark';
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        var toggle = document.querySelector('.toggle');
        if (toggle) { toggle.classList.remove('active'); var knob = toggle.querySelector('div'); if (knob) knob.style.left = '2px'; toggle.style.background = 'var(--bg-glass)'; }
    }
    var fontSize = localStorage.getItem('jeros-font-size') || '1rem';
    document.documentElement.style.fontSize = fontSize;
    var customWallpaper = localStorage.getItem('jeros-wallpaper-custom');
    if (customWallpaper) {
        var desktop = document.getElementById('desktop');
        desktop.style.backgroundImage = 'url(' + customWallpaper + ')';
        desktop.style.backgroundSize = 'cover';
        desktop.style.backgroundPosition = 'center';
    }
    var savedWallpaper = localStorage.getItem('jeros-wallpaper');
    if (savedWallpaper && !localStorage.getItem('jeros-wallpaper-custom')) {
        document.getElementById('desktop').className = savedWallpaper;
    }
    setTimeout(function() { document.getElementById('boot').classList.add('hidden'); }, 1800);
});

console.log('JerOS Phase 6 loaded — History fixed with calculations.');