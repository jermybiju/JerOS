/* JerOS script */

window.addEventListener('load', function() {
    setTimeout(function() {
        document.getElementById('boot').classList.add('hidden');
    }, 1800);
});

/* --------- clock with seconds -------- */
function updateClock() {                      /* ശരിയായി (updateclock അല്ല) */
    var now = new Date();
    document.getElementById('clockDisplay').textContent = now.toLocaleTimeString('en-US', 
{
         hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
  });
 document.getElementById('dateDisplay').textContent = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}
setInterval(updateClock,1000);
updateClock();

/* close menu function */                   /* പുതിയതായി ചേർത്തു */
function closeMenu() {
    document.getElementById('menu').classList.remove('open');
}

/* start menu */
function toggleMenu(){
    var menu = document.getElementById('menu');   /* ശരിയായി (Menu അല്ല) */
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

// ---- wallpaper---//
function changeWallpaper(classname) {  
   var desktop = document.getElementById('desktop'); 
   desktop.className = classname;
   localStorage.setItem('jeros-wallpaper', classname);
}
/* load saved wallpaper*/
window.addEventListener('load', function() {
    var savedWallpaper = localStorage.getItem('jeros-wallpaper');
    if (savedWallpaper) {
        document.getElementById('desktop').className = savedWallpaper;
    }
});

// ------ extra double click desktop to open menu -------//
document.getElementById('desktop').addEventListener('dblclick', function(e) {
    if (e.target.closest('#icons') || e.target.closest('#taskbar')) return;
    toggleMenu();
});

// extra keyboard shortcuts --- //
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

// ---- app click handler ---//
var appItems = document.querySelectorAll('.icon-item, .app');
for (var i = 0; i < appItems.length; i++) {
    appItems[i].addEventListener('click', function(e) {
        var app = this.dataset.app || 'unknown';
        if (app == 'terminal' || app == 'notes' || app == 'drawing' || app == 'settings') 
        {
            alert(app.charAt(0).toUpperCase() + app.slice(1) + ' — Phase 2 coming soon.');
        } else if (app == 'about') {
            alert('JerOS v1.0 — Built for Stardance WebOS 1.\n© 2026 Jermy Biju');
        }
        closeMenu();
    });
}

console.log('JerOS script loaded successfully.');
console.log('wallpaper changer works.');
console.log('Alt + M = toggle menu.');
console.log('double-click desktop = toggle menu.');
console.log('next: Phase 2 - window management.');
          
