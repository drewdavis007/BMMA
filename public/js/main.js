// ── Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ── Nav shadow on scroll
window.addEventListener('scroll', function() {
    var nav = document.querySelector('nav');
    if (!nav) return;
    nav.style.boxShadow = window.scrollY > 50
        ? '0 2px 20px rgba(0,0,0,0.25)'
        : '0 2px 10px rgba(0,0,0,0.15)';
});

// Must match the max-width of the hamburger-menu media query in css/styles.css
var NAV_BREAKPOINT = 1024;

// ── Hamburger menu toggle
var hamburger = document.getElementById('hamburger');
var navLinks  = document.getElementById('navLinks');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
        navLinks.classList.toggle('open');
    });

    // Close menu when a top-level link (not dropdown trigger) is clicked on mobile
    navLinks.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
            // The "Services" trigger only expands its submenu (handled below);
            // every other link closes the menu.
            if (link.matches('.nav-dropdown > a')) return;
            if (window.innerWidth <= NAV_BREAKPOINT) {
                navLinks.classList.remove('open');
            }
        });
    });
}

// ── Dropdown: toggle on mobile tap, hover handled by CSS on desktop
document.querySelectorAll('.nav-dropdown > a').forEach(function(trigger) {
    trigger.addEventListener('click', function(e) {
        if (window.innerWidth <= NAV_BREAKPOINT) {
            e.preventDefault();
            var menu = trigger.parentElement.querySelector('.dropdown-menu');
            if (menu) menu.classList.toggle('open');
        }
    });
});