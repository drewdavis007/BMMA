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
            if (window.innerWidth <= 768) {
                navLinks.classList.remove('open');
            }
        });
    });
}

// ── Dropdown: toggle on mobile tap, hover handled by CSS on desktop
document.querySelectorAll('.nav-dropdown > a').forEach(function(trigger) {
    trigger.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            e.preventDefault();
            var menu = trigger.parentElement.querySelector('.dropdown-menu');
            if (menu) menu.classList.toggle('open');
        }
    });
});

// ── Cross-page dropdown navigation (store target slide in sessionStorage)
// Dropdown links that point to services.html with a data-slide attribute
document.querySelectorAll('.dropdown-menu a[data-slide]').forEach(function(link) {
    link.addEventListener('click', function() {
        sessionStorage.setItem('bmma_slide', link.dataset.slide);
        // Allow normal navigation to services.html
    });
});
