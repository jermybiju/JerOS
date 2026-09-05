// jerOS main script 

let windowCount = 0;
let openWindows = [];
let zIndex = 100;
let drawColor = '#5f7cff';
let canvasContext = null;

const appsList = {
  terminal: { title: 'Terminal', icon: 'fa-terminal', w: 440, h: 300 },
  notes: { title: 'Notes', icon: 'fa-note-sticky', w: 460, h: 500 },
  drawing: { title: 'Drawing', icon: 'fa-palette', w: 520, h: 420 },
  settings: { title: 'Settings', icon: 'fa-sliders', w: 460, h: 340 },
  about: { title: 'About JerOS', icon: 'fa-circle-question', w: 420, h: 300 },
  files: { title: 'File Manager', icon: 'fa-folder', w: 540, h: 400 },
  calculator: { title: 'Calculator', icon: 'fa-calculator', w: 480, h: 440 }
};

function launchApp(appType) {
  const cfg = appsList[appType];
  if (!cfg) return;

  const existing = openWindows.find(w => w.type === appType && !w.closed);
  if (existing) {
    existing.win.style.zIndex = ++zIndex;
    if (existing.minimized) {
      existing.minimized = false;
      existing.win.style.display = 'flex';
      refreshTaskbar();
    }
    return;
  }

  const screenW = window.innerWidth;
  const screenH = window.innerHeight;
  let winW = cfg.w;
  let winH = cfg.h;
  let left = (screenW - winW) / 2;
  let top = (screenH - winH) / 2;
  left = Math.max(10, Math.min(left, screenW - winW - 10));
  top = Math.max(10, Math.min(top, screenH - winH - 10));

  const win = document.createElement('div');
  win.className = 'window';
  win.style.width = winW + 'px';
  win.style.height = winH + 'px';
  win.style.left = left + 'px';
  win.style.top = top + 'px';
  win.dataset.id = windowCount;
  win.style.zIndex = ++zIndex;

  const header = document.createElement('div');
  header.className = 'window-header';
  header.innerHTML = `
    <span class="window-title">
      <span class="dot"></span>
      <i class="fa-solid ${cfg.icon}"></i> ${cfg.title}
    </span>
    <span class="window-controls">
      <button onclick="minimizeWin(this)">−</button>
      <button onclick="maximizeWin(this)"><i class="fa-regular fa-square"></i></button>
      <button class="close" onclick="closeWin(this)">X</button>
    </span>
  `;
  win.appendChild(header);

  const body = document.createElement('div');
  body.className = 'window-body';
  body.id = 'win-body-' + windowCount;
  win.appendChild(body);

  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'resize-handle';
  win.appendChild(resizeHandle);

  let isResizing = false;
  resizeHandle.addEventListener('mousedown', function(e) {
    e.stopPropagation();
    isResizing = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = win.offsetWidth;
    const startH = win.offsetHeight;

    function onMouseMove(e) {
      if (!isResizing) return;
      const newW = Math.max(320, startW + (e.clientX - startX));
      const newH = Math.max(180, startH + (e.clientY - startY));
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

  if (appType === 'terminal') {
    body.innerHTML = `
      <div style="background:var(--bg-textarea); padding:12px; border-radius:6px; font-family:'Courier New',monospace; flex:1; display:flex; flex-direction:column;">
        <div style="display:flex; gap:8px; align-items:baseline; margin-bottom:6px;">
          <span class="term-prompt">$</span>
          <input type="text" id="term-input" style="background:transparent; border:none; color:var(--text-primary); font-family:'Courier New',monospace; font-size:0.8rem; outline:none; flex:1;">
        </div>
        <div id="term-output" style="color:var(--text-secondary); white-space:pre-wrap; flex:1; overflow-y:auto; min-height:60px;"></div>
      </div>
    `;
    const input = body.querySelector('#term-input');
    const output = body.querySelector('#term-output');
    output.textContent = 'Type "help" to get started.';
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        const cmd = input.value.trim();
        input.value = '';
        runCommand(cmd, output);
      }
    });
    setTimeout(() => input.focus(), 50);
  }

  else if (appType === 'notes') {
    const saved = localStorage.getItem('jeros-notes') || '';
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

  else if (appType === 'drawing') {
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

  else if (appType === 'settings') {
    const darkMode = localStorage.getItem('jeros-theme') !== 'light';
    const fontSize = localStorage.getItem('jeros-font-size') || '1rem';
    body.innerHTML = `
      <h3 style="font-size:0.9rem; color:var(--text-primary); margin-bottom:14px; padding:0 12px;">System Settings</h3>
      <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border-bottom:1px solid var(--border-glass);">
        <span style="font-size:0.75rem; color:var(--text-secondary);">Dark Mode</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="toggle ${darkMode ? 'active' : ''}" onclick="toggleTheme(this)" style="width:44px; height:24px; border-radius:40px; cursor:pointer; position:relative; transition:background 0.3s; border:2px solid ${darkMode ? '#7a9cff' : 'rgba(255,255,255,0.2)'}; background:${darkMode ? '#7a9cff' : 'rgba(255,255,255,0.12)'};">
            <div class="knob" style="width:18px; height:18px; background:${darkMode ? '#ffffff' : '#f0f2f8'}; border-radius:50%; position:absolute; top:1px; left:${darkMode ? '22px' : '2px'}; transition:left 0.3s, background 0.3s; box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>
          </div>
          <span class="toggle-label" style="font-size:0.7rem; font-weight:600; color:${darkMode ? '#7a9cff' : 'var(--text-secondary)'};">${darkMode ? 'ON' : 'OFF'}</span>
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

  else if (appType === 'about') {
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
        <p style="font-size:0.6rem; color:var(--text-muted);">2026 JerOS</p>
      </div>
    `;
  }

  else if (appType === 'files') {
    body.innerHTML = `
      <div style="display:flex; gap:16px; height:100%; flex:1; padding:10px;">
        <div style="min-width:130px; border-right:1px solid var(--border-glass); padding-right:12px;">
          <div style="font-size:0.6rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Folders</div>
          <div style="font-size:0.75rem; color:var(--text-secondary); padding:6px 0; cursor:pointer;" data-folder="Documents">Documents</div>
          <div style="font-size:0.75rem; color:var(--text-secondary); padding:6px 0; cursor:pointer;" data-folder="Downloads">Downloads</div>
          <div style="font-size:0.75rem; color:var(--text-secondary); padding:6px 0; cursor:pointer;" data-folder="Projects">Projects</div>
        </div>
        <div style="flex:1;">
          <div style="font-size:0.6rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Files</div>
          <div class="file-grid" id="file-grid">
            <div style="color:var(--text-muted); font-size:0.7rem; padding:20px; text-align:center; grid-column:1/-1;">Select a folder to view files</div>
          </div>
        </div>
      </div>
    `;
    const folderItems = body.querySelectorAll('[data-folder]');
    for (let i = 0; i < folderItems.length; i++) {
      folderItems[i].addEventListener('click', function() {
        const folder = this.dataset.folder;
        openFolderContent(folder, this.closest('.window'));
      });
    }
  }

  else if (appType === 'calculator') {
    const historyHtml = localStorage.getItem('jeros-calc-history') || '';
    body.innerHTML = `
      <div class="calc-wrapper">
        <div class="calc-main">
          <div class="calc-grid">
            <div class="display" id="calc-display">0</div>
            <button onclick="handleCalc('7')">7</button>
            <button onclick="handleCalc('8')">8</button>
            <button onclick="handleCalc('9')">9</button>
            <button class="op" onclick="handleCalc('/')">/</button>
            <button onclick="handleCalc('4')">4</button>
            <button onclick="handleCalc('5')">5</button>
            <button onclick="handleCalc('6')">6</button>
            <button class="op" onclick="handleCalc('*')">*</button>
            <button onclick="handleCalc('1')">1</button>
            <button onclick="handleCalc('2')">2</button>
            <button onclick="handleCalc('3')">3</button>
            <button class="op" onclick="handleCalc('-')">-</button>
            <button onclick="handleCalc('0')">0</button>
            <button onclick="handleCalc('.')">.</button>
            <button onclick="handleCalc('C')">C</button>
            <button class="eq" onclick="handleCalc('=')">=</button>
          </div>
        </div>
        <div class="calc-history-side" id="calc-history-side">
          <div class="hist-title">
            History
            <button class="clear-history" onclick="clearCalcHistory()">Clear all</button>
          </div>
          ${historyHtml}
        </div>
      </div>
    `;
  }

  document.getElementById('desktop').appendChild(win);
  const winData = {
    id: windowCount,
    type: appType,
    win: win,
    body: body,
    minimized: false,
    maximized: false,
    closed: false,
    prevRect: null
  };
  openWindows.push(winData);
  windowCount++;
  refreshTaskbar();

  win.addEventListener('mousedown', function() {
    win.style.zIndex = ++zIndex;
  });

  let isDragging = false;
  let offX = 0, offY = 0;
  header.addEventListener('mousedown', function(e) {
    if (e.target.closest('.window-controls') || e.target.closest('.resize-handle')) return;
    const rect = win.getBoundingClientRect();
    offX = e.clientX - rect.left;
    offY = e.clientY - rect.top;
    isDragging = true;
    win.style.zIndex = ++zIndex;
    if (winData.maximized) {
      winData.maximized = false;
      win.style.width = winData.prevRect ? winData.prevRect.width : cfg.w + 'px';
      win.style.height = winData.prevRect ? winData.prevRect.height : cfg.h + 'px';
      win.style.borderRadius = '14px 10px 16px 8px';
    }
  });
  document.addEventListener('mousemove', function(e) {
    if (!isDragging || winData.maximized) return;
    const newLeft = e.clientX - offX;
    const newTop = e.clientY - offY;
    win.style.left = Math.max(0, Math.min(newLeft, window.innerWidth - 100)) + 'px';
    win.style.top = Math.max(0, Math.min(newTop, window.innerHeight - 80)) + 'px';
  });
  document.addEventListener('mouseup', function() {
    isDragging = false;
  });
}

function runCommand(cmd, output) {
  const line = document.createElement('div');
  line.style.color = 'var(--text-secondary)';
  line.style.whiteSpace = 'pre-wrap';
  const l = cmd.toLowerCase();

  if (l === 'help') {
    line.textContent = 'Commands: help, clear, date, time, about, apps, neofetch, echo, whoami';
  }
  else if (l === 'clear') {
    output.innerHTML = '';
    return;
  }
  else if (l === 'date') {
    line.textContent = new Date().toDateString();
  }
  else if (l === 'time') {
    line.textContent = new Date().toTimeString();
  }
  else if (l === 'about') {
    line.textContent = 'JerOS v1.0 Modern Web OS';
  }
  else if (l === 'whoami') {
    line.textContent = 'jermybiju';
  }
  else if (l === 'apps') {
    line.textContent = 'Terminal, Notes, Drawing, Settings, Files, Calculator';
  }
  else if (l === 'neofetch') {
    line.textContent = `
    ██████╗ ███████╗██████╗  ██████╗ ███████╗
    ██╔══██╗██╔════╝██╔══██╗██╔═══██╗██╔════╝
    ██████╔╝█████╗  ██████╔╝██║   ██║███████╗
    ██╔══██╗██╔══╝  ██╔══██╗██║   ██║╚════██║
    ██║  ██║███████╗██║  ██║╚██████╔╝███████║
    ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
    JerOS v1.0 Modern Web OS Stardance`;
  }
  else if (l.startsWith('echo ')) {
    line.textContent = l.substring(5);
  }
  else if (cmd === '') {
    return;
  }
  else {
    line.textContent = 'command not found: ' + cmd;
  }
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

function saveNotes() {
  const body = window._notesBody;
  if (!body) return;
  const textarea = body.querySelector('textarea');
  if (!textarea) return;
  localStorage.setItem('jeros-notes', textarea.value);
  notify('Notes', 'Note saved!');
}
function clearNotes() {
  if (!confirm('Clear all notes?')) return;
  const body = window._notesBody;
  if (!body) return;
  const textarea = body.querySelector('textarea');
  if (!textarea) return;
  textarea.value = '';
  localStorage.removeItem('jeros-notes');
  notify('Notes', 'Cleared!');
}

function initCanvas() {
  const canvas = document.getElementById('drawCanvas');
  if (!canvas) return;
  canvasContext = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  canvasContext.fillStyle = '#0a0a0e';
  canvasContext.fillRect(0, 0, canvas.width, canvas.height);
  canvasContext.strokeStyle = drawColor;
  canvasContext.lineWidth = 3;
  canvasContext.lineCap = 'round';
  canvasContext.lineJoin = 'round';

  window.addEventListener('resize', function() {
    const rect = canvas.getBoundingClientRect();
    const tempData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvasContext.putImageData(tempData, 0, 0);
    canvasContext.strokeStyle = drawColor;
    canvasContext.lineWidth = 3;
    canvasContext.lineCap = 'round';
    canvasContext.lineJoin = 'round';
  });

  let isDown = false;
  canvas.addEventListener('mousedown', function(e) {
    isDown = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const lastX = (e.clientX - rect.left) * scaleX;
    const lastY = (e.clientY - rect.top) * scaleY;
    canvasContext.beginPath();
    canvasContext.moveTo(lastX, lastY);
    canvas.addEventListener('mousemove', function onMove(e) {
      if (!isDown) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      canvasContext.lineTo(x, y);
      canvasContext.stroke();
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
  if (canvasContext) canvasContext.strokeStyle = color;
}
function clearCanvas() {
  const canvas = document.getElementById('drawCanvas');
  if (!canvas || !canvasContext) return;
  canvasContext.fillStyle = '#0a0a0e';
  canvasContext.fillRect(0, 0, canvas.width, canvas.height);
  notify('Drawing', 'Canvas cleared!');
}

function toggleTheme(el) {
  const isActive = el.classList.toggle('active');
  const body = document.body;
  const label = el.parentElement.querySelector('.toggle-label');
  
  if (isActive) {
    body.classList.remove('light-mode');
    localStorage.setItem('jeros-theme', 'dark');
    el.style.background = '#7a9cff';
    el.style.borderColor = '#7a9cff';
    if (label) label.textContent = 'ON';
    if (label) label.style.color = '#7a9cff';
  } else {
    body.classList.add('light-mode');
    localStorage.setItem('jeros-theme', 'light');
    el.style.background = 'rgba(255,255,255,0.12)';
    el.style.borderColor = 'rgba(255,255,255,0.2)';
    if (label) label.textContent = 'OFF';
    if (label) label.style.color = 'var(--text-secondary)';
  }
  
  const knob = el.querySelector('.knob');
  if (knob) {
    knob.style.left = isActive ? '22px' : '2px';
    knob.style.background = isActive ? '#ffffff' : '#f0f2f8';
  }
  
  notify('Settings', 'Theme changed!');
}
function changeFontSize(size) {
  localStorage.setItem('jeros-font-size', size);
  document.documentElement.style.fontSize = size;
  notify('Settings', 'Font size changed!');
}

function openFolderContent(folder, win) {
  const fileGrid = win.querySelector('#file-grid');
  if (!fileGrid) return;
  const files = {
    'Documents': ['Report.docx', 'Sheet.xlsx', 'Notes.txt', 'Invoice.pdf'],
    'Downloads': ['setup.exe', 'video.mp4', 'image.png', 'song.mp3'],
    'Projects': ['ProjectA', 'ProjectB', 'README.md', 'timeline.gantt']
  };
  const items = files[folder] || ['Empty folder'];
  fileGrid.innerHTML = '';
  for (let i = 0; i < items.length; i++) {
    const div = document.createElement('div');
    div.className = 'file-item';
    const icon = items[i].includes('.') ? '📄' : '📁';
    div.innerHTML = `<span class="file-icon">${icon}</span><span class="file-name">${items[i]}</span>`;
    div.onclick = function() {
      notify('File', this.querySelector('.file-name').textContent + ' opened');
    };
    fileGrid.appendChild(div);
  }
  notify('Folder', folder + ' opened');
}

function uploadWallpaper(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const desktop = document.getElementById('desktop');
    desktop.style.backgroundImage = 'url(' + e.target.result + ')';
    desktop.style.backgroundSize = 'cover';
    desktop.style.backgroundPosition = 'center';
    localStorage.setItem('jeros-wallpaper-custom', e.target.result);
    notify('Wallpaper', 'Custom wallpaper uploaded!');
  };
  reader.readAsDataURL(file);
}
function changeWallpaper(classname) {
  const desktop = document.getElementById('desktop');
  desktop.className = classname;
  desktop.style.backgroundImage = '';
  localStorage.removeItem('jeros-wallpaper-custom');
  localStorage.setItem('jeros-wallpaper', classname);
  notify('Wallpaper', 'Changed!');
}

let calcStr = '';

function handleCalc(val) {
  const display = document.getElementById('calc-display');
  if (!display) return;

  if (val === 'C') {
    calcStr = '';
    display.textContent = '0';
    return;
  }

  if (val === '=') {
    const expression = calcStr;
    try {
      const result = Function('"use strict"; return (' + calcStr + ')')();
      calcStr = String(result);
      display.textContent = calcStr;

      const history = document.getElementById('calc-history-side');
      if (history) {
        const entry = document.createElement('div');
        entry.className = 'hist-entry';
        const displayExpr = expression.replace(/\*/g, 'x').replace(/\//g, '/');
        entry.textContent = displayExpr + ' = ' + calcStr;
        history.appendChild(entry);

        const entries = history.querySelectorAll('.hist-entry');
        let historyData = '';
        for (let i = 0; i < entries.length; i++) {
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

  if (calcStr === '0' && val !== '.') {
    calcStr = val;
  } else {
    calcStr += val;
  }
  display.textContent = calcStr;
}

function clearCalcHistory() {
  if (!confirm('Clear calculation history?')) return;
  const history = document.getElementById('calc-history-side');
  if (history) {
    const entries = history.querySelectorAll('.hist-entry');
    for (let i = 0; i < entries.length; i++) {
      entries[i].remove();
    }
    localStorage.removeItem('jeros-calc-history');
    notify('Calculator', 'History cleared!');
  }
}

document.getElementById('tray-network').addEventListener('click', function() {
  if (navigator.connection) {
    const conn = navigator.connection;
    const type = conn.effectiveType || 'unknown';
    const speed = conn.downlink ? conn.downlink + ' Mbps' : 'N/A';
    notify('Network', type + ' ' + speed);
  } else {
    notify('Network', 'Wi-Fi Connected');
  }
});

let systemVolume = parseInt(localStorage.getItem('jeros-system-volume')) || 75;

document.getElementById('tray-volume').addEventListener('click', function() {
  const change = Math.floor(Math.random() * 11) - 5;
  systemVolume = Math.min(100, Math.max(0, systemVolume + change));
  localStorage.setItem('jeros-system-volume', systemVolume);

  const filled = Math.round(systemVolume / 10);
  let bar = '';
  for (let i = 0; i < 10; i++) {
    bar += (i < filled) ? '|' : '.';
  }
  const muted = systemVolume === 0 ? ' (Muted)' : '';
  notify('Volume', systemVolume + '% ' + bar + muted);
});

document.getElementById('tray-battery').addEventListener('click', function() {
  if (navigator.getBattery) {
    navigator.getBattery().then(function(battery) {
      const level = Math.round(battery.level * 100);
      const charging = battery.charging ? 'Charging' : 'Discharging';
      notify('Battery', level + '% ' + charging);
    }).catch(function() {
      notify('Battery', 'Battery info not available');
    });
  } else {
    notify('Battery', '87% (API not supported)');
  }
});

document.getElementById('taskbar').addEventListener('contextmenu', function(e) {
  e.preventDefault();
  const menu = document.getElementById('taskbar-context-menu');
  if (!menu) return;
  menu.style.left = (e.clientX - 100) + 'px';
  menu.style.bottom = '70px';
  menu.classList.toggle('open');
});
document.addEventListener('click', function() {
  const menu = document.getElementById('taskbar-context-menu');
  if (menu) menu.classList.remove('open');
});

document.getElementById('ctx-taskmgr').addEventListener('click', function() {
  document.getElementById('taskbar-context-menu').classList.remove('open');
  notify('Task Manager', 'Processes: 24 running, 0 suspended');
});
document.getElementById('ctx-settings').addEventListener('click', function() {
  document.getElementById('taskbar-context-menu').classList.remove('open');
  launchApp('settings');
});
document.getElementById('ctx-startmenu').addEventListener('click', function() {
  document.getElementById('taskbar-context-menu').classList.remove('open');
  toggleMenu();
});

function notify(title, body, duration) {
  duration = duration || 3000;
  const container = document.getElementById('notification-container');
  if (!container) return;
  const notif = document.createElement('div');
  notif.className = 'notification';
  notif.innerHTML = `<button class="notif-close" onclick="this.parentElement.remove()">x</button><div class="notif-title">${title}</div><div class="notif-body">${body}</div>`;
  container.appendChild(notif);
  setTimeout(function() {
    notif.classList.add('notification-out');
    setTimeout(function() { notif.remove(); }, 300);
  }, duration);
}

function closeWin(btn) {
  const win = btn.closest('.window');
  const data = openWindows.find(w => w.win === win);
  if (data) {
    data.closed = true;
    win.classList.add('closing');
    setTimeout(function() {
      win.remove();
      openWindows = openWindows.filter(w => w.win !== win);
      refreshTaskbar();
    }, 160);
  }
}
function minimizeWin(btn) {
  const win = btn.closest('.window');
  const data = openWindows.find(w => w.win === win);
  if (data) {
    data.minimized = !data.minimized;
    win.style.display = data.minimized ? 'none' : 'flex';
    refreshTaskbar();
  }
}
function maximizeWin(btn) {
  const win = btn.closest('.window');
  const data = openWindows.find(w => w.win === win);
  if (!data) return;
  if (!data.maximized) {
    data.prevRect = { left: win.style.left, top: win.style.top, width: win.style.width, height: win.style.height };
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

function refreshTaskbar() {
  const container = document.getElementById('taskbar-apps');
  container.innerHTML = '';
  for (let i = 0; i < openWindows.length; i++) {
    const w = openWindows[i];
    if (w.closed) continue;
    const btn = document.createElement('div');
    btn.className = 'taskbar-app' + (w.minimized ? '' : ' active');
    const cfg = appsList[w.type];
    const icon = cfg ? cfg.icon : 'fa-cube';
    btn.innerHTML = '<i class="fa-solid ' + icon + '"></i> ' + (cfg ? cfg.title : w.type) + ' <button class="close-btn" onclick="closeWinFromTaskbar(this)">x</button>';
    btn.onclick = function(e) {
      if (e.target.classList.contains('close-btn')) return;
      if (w.minimized) { w.minimized = false; w.win.style.display = 'flex'; }
      w.win.style.zIndex = ++zIndex;
      refreshTaskbar();
    };
    container.appendChild(btn);
  }
}
function closeWinFromTaskbar(btn) {
  const taskbarApp = btn.closest('.taskbar-app');
  if (!taskbarApp) return;
  const index = Array.from(taskbarApp.parentNode.children).indexOf(taskbarApp);
  const visibleWindows = openWindows.filter(w => !w.closed);
  if (index < visibleWindows.length) {
    const data = visibleWindows[index];
    if (data) {
      const win = data.win;
      const closeBtn = win.querySelector('.window-controls .close');
      if (closeBtn) closeBtn.click();
    }
  }
  refreshTaskbar();
}

document.addEventListener('contextmenu', function(e) {
  if (e.target.closest('#taskbar') || e.target.closest('#menu')) return;
  e.preventDefault();
  const menu = document.getElementById('context-menu');
  if (!menu) return;
  menu.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
  menu.style.top = Math.min(e.clientY, window.innerHeight - 150) + 'px';
  menu.classList.add('open');
});
document.addEventListener('click', function() {
  const menu = document.getElementById('context-menu');
  if (menu) menu.classList.remove('open');
});

document.getElementById('ctx-wallpaper').addEventListener('click', function() {
  document.getElementById('context-menu').classList.remove('open');
  document.getElementById('wallpaperUpload').click();
});
document.getElementById('ctx-refresh').addEventListener('click', function() {
  document.getElementById('context-menu').classList.remove('open');
  notify('Refresh', 'Desktop refreshed');
});

function closeMenu() {
  document.getElementById('menu').classList.remove('open');
}
function toggleMenu() {
  const menu = document.getElementById('menu');
  menu.classList.toggle('open');
  if (menu.classList.contains('open')) {
    document.getElementById('searchInput').focus();
  }
}
function filterApps(val) {
  const items = document.querySelectorAll('#appGrid .app');
  const v = val.toLowerCase();
  for (let i = 0; i < items.length; i++) {
    const text = items[i].textContent.toLowerCase();
    items[i].style.display = text.includes(v) ? 'flex' : 'none';
  }
}

function showShortcuts() {
  document.getElementById('shortcuts-popup').classList.add('open');
}
function closeShortcuts() {
  document.getElementById('shortcuts-popup').classList.remove('open');
}
document.addEventListener('keydown', function(e) {
  if (e.altKey && e.key === 't') { e.preventDefault(); launchApp('terminal'); }
  if (e.altKey && e.key === 'n') { e.preventDefault(); launchApp('notes'); }
  if (e.altKey && e.key === 'm') { e.preventDefault(); toggleMenu(); }
  if (e.altKey && e.key === 's') { e.preventDefault(); showShortcuts(); }
  if (e.key === 'Escape') {
    if (document.getElementById('menu').classList.contains('open')) closeMenu();
    if (document.getElementById('shortcuts-popup').classList.contains('open')) closeShortcuts();
  }
});

function updateClock() {
  const now = new Date();
  document.getElementById('clockDisplay').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('dateDisplay').textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

const appItems = document.querySelectorAll('.icon-item, .app');
for (let i = 0; i < appItems.length; i++) {
  appItems[i].addEventListener('click', function() {
    const app = this.dataset.app || 'unknown';
    launchApp(app);
    closeMenu();
  });
}

window.addEventListener('load', function() {
  const theme = localStorage.getItem('jeros-theme') || 'dark';
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    const toggle = document.querySelector('.toggle');
    if (toggle) {
      toggle.classList.remove('active');
      const knob = toggle.querySelector('.knob');
      if (knob) knob.style.left = '2px';
      toggle.style.background = 'rgba(0,0,0,0.08)';
      const label = toggle.parentElement.querySelector('.toggle-label');
      if (label) label.textContent = 'OFF';
    }
  }

  const fontSize = localStorage.getItem('jeros-font-size') || '1rem';
  document.documentElement.style.fontSize = fontSize;

  const customWallpaper = localStorage.getItem('jeros-wallpaper-custom');
  if (customWallpaper) {
    const desktop = document.getElementById('desktop');
    desktop.style.backgroundImage = 'url(' + customWallpaper + ')';
    desktop.style.backgroundSize = 'cover';
    desktop.style.backgroundPosition = 'center';
  }
  const savedWallpaper = localStorage.getItem('jeros-wallpaper');
  if (savedWallpaper && !localStorage.getItem('jeros-wallpaper-custom')) {
    document.getElementById('desktop').className = savedWallpaper;
  }

  setTimeout(function() {
    document.getElementById('boot').classList.add('hidden');
  }, 1800);
});