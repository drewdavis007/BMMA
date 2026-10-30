/* =====================================================================
   GOOGLE REVIEWS (live, via Featurable)
   ---------------------------------------------------------------------
   One place that loads the practice's Google reviews and shares them
   with the rest of the site:

     1. The homepage "Client Love" carousel asks for them with
        BMMAReviews.load(callback) (see the script at the bottom of
        index.html).
     2. Every other page gets a small floating review card in the
        bottom-left corner that cycles through them.

   HIDING THE FLOATING CARD ON A PAGE
     Add  data-no-review-float  to that page's <body> tag, e.g.
         <body data-no-review-float>
     It is currently set on index.html and contact.html.

   WHERE THE REVIEWS COME FROM
     Featurable (featurable.com) reads the Google Business Profile once a
     day and serves the reviews as data. To change which reviews show,
     edit the widget in the Featurable dashboard - no code change needed.
     If Featurable can't be reached, the homepage keeps the reviews that
     are written into index.html, and the floating card simply doesn't
     appear.
   ===================================================================== */

var BMMAReviews = (function () {
    'use strict';

    // ---- Settings you might want to change --------------------------
    var FEATURABLE_URL = 'https://api.featurable.com/v2/widgets/006ea7aa-0e5b-4b50-aa05-1df817142fa7';
    var GOOGLE_REVIEWS_LINK = 'https://maps.google.com/?cid=6348847216280246981';   // opens the Google Maps listing (5.0 stars, all reviews)
    var MIN_RATING = 4;                 // only show 4- and 5-star reviews
    var CACHE_HOURS = 6;                // how long a visitor's browser reuses the last download
    var FLOAT_FIRST_DELAY = 3500;       // ms after page load before the card appears
    var FLOAT_INTERVAL = 10000;         // ms each review stays on screen
    // ------------------------------------------------------------------

    var CACHE_KEY = 'bmma_reviews_v1';
    var DISMISS_KEY = 'bmma_review_float_closed';

    var cached = null;       // { reviews: [...], summary: {...}, showBranding: bool }
    var waiting = [];
    var loading = false;

    function readCache() {
        try {
            var raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            var obj = JSON.parse(raw);
            if (!obj || !obj.savedAt || Date.now() - obj.savedAt > CACHE_HOURS * 3600000) return null;
            return obj.data;
        } catch (e) { return null; }
    }

    function writeCache(data) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data: data })); } catch (e) {}
    }

    // Turn Featurable's format into the simple shape the site uses.
    function normalise(json) {
        var w = json && json.widget;
        if (!w || !w.reviews || w.isExampleReviews) return null;
        var list = [];
        for (var i = 0; i < w.reviews.length; i++) {
            var r = w.reviews[i];
            var text = (r.text || '').trim();
            var rating = r.rating && r.rating.value ? r.rating.value : 0;
            if (!text || rating < MIN_RATING) continue;
            list.push({
                name: (r.author && r.author.name) || 'Google reviewer',
                text: text,
                rating: rating,
                date: r.publishedAt || null
            });
        }
        if (!list.length) return null;
        var s = w.gbpLocationSummary || {};
        return {
            reviews: list,
            summary: { rating: s.rating || null, count: s.reviewsCount || null },
            showBranding: w.showBranding !== false
        };
    }

    function finish(data) {
        cached = data;
        loading = false;
        var cbs = waiting; waiting = [];
        for (var i = 0; i < cbs.length; i++) { try { cbs[i](data); } catch (e) {} }
    }

    // Calls back with the review data, or with null if it couldn't be loaded.
    function load(callback) {
        if (cached !== null) { callback(cached); return; }
        waiting.push(callback);
        if (loading) return;
        loading = true;

        var fromCache = readCache();
        if (fromCache) { finish(fromCache); return; }

        if (!window.fetch) { finish(null); return; }
        fetch(FEATURABLE_URL)
            .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
            .then(function (json) {
                var data = normalise(json);
                if (data) writeCache(data);
                finish(data);
            })
            .catch(function () { finish(null); });
    }

    // "3 weeks ago", "a year ago", etc. from an ISO date string.
    function relativeDate(iso) {
        if (!iso) return '';
        var then = new Date(iso).getTime();
        if (isNaN(then)) return '';
        var d = Math.floor((Date.now() - then) / 86400000);
        if (d < 1) return 'today';
        if (d === 1) return 'yesterday';
        if (d < 7) return d + ' days ago';
        if (d < 14) return 'a week ago';
        if (d < 30) return Math.floor(d / 7) + ' weeks ago';
        if (d < 60) return 'a month ago';
        if (d < 365) return Math.floor(d / 30) + ' months ago';
        if (d < 730) return 'a year ago';
        return Math.floor(d / 365) + ' years ago';
    }

    function stars(n) {
        var s = '';
        for (var i = 0; i < 5; i++) s += i < Math.round(n) ? '★' : '☆';
        return s;
    }

    function el(tag, className, text) {
        var e = document.createElement(tag);
        if (className) e.className = className;
        if (text != null) e.textContent = text;
        return e;
    }

    /* ---------------- Floating review card ---------------- */

    function buildFloat(data) {
        var reviews = data.reviews.slice();
        var index = Math.floor(Math.random() * reviews.length);
        var timer = null;
        var paused = false;

        var box = el('aside', 'review-float');
        box.setAttribute('aria-label', 'Client reviews');

        var close = el('button', 'review-float-close', '×');
        close.type = 'button';
        close.setAttribute('aria-label', 'Hide reviews');

        var link = el('a', 'review-float-body');
        link.href = GOOGLE_REVIEWS_LINK;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        var starsEl = el('div', 'review-float-stars');
        var textEl = el('p', 'review-float-text');
        var metaEl = el('p', 'review-float-meta');
        link.appendChild(starsEl);
        link.appendChild(textEl);
        link.appendChild(metaEl);

        box.appendChild(close);
        box.appendChild(link);
        document.body.appendChild(box);

        function show(i) {
            var r = reviews[i];
            starsEl.textContent = stars(r.rating);
            starsEl.setAttribute('aria-label', r.rating + ' out of 5 stars');
            textEl.textContent = '“' + r.text + '”';
            metaEl.textContent = r.name + ' · Google review';
        }

        function next() {
            if (paused) return;
            box.classList.add('is-switching');
            setTimeout(function () {
                index = (index + 1) % reviews.length;
                show(index);
                box.classList.remove('is-switching');
            }, 350);
        }

        show(index);
        // next frame so the slide-in transition runs
        requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add('is-visible'); }); });
        if (reviews.length > 1) timer = setInterval(next, FLOAT_INTERVAL);

        box.addEventListener('mouseenter', function () { paused = true; });
        box.addEventListener('mouseleave', function () { paused = false; });
        box.addEventListener('focusin', function () { paused = true; });
        box.addEventListener('focusout', function () { paused = false; });

        close.addEventListener('click', function () {
            clearInterval(timer);
            box.classList.remove('is-visible');
            setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 400);
            try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
        });
    }

    function initFloat() {
        if (document.body.hasAttribute('data-no-review-float')) return;
        try { if (sessionStorage.getItem(DISMISS_KEY)) return; } catch (e) {}
        setTimeout(function () {
            load(function (data) { if (data) buildFloat(data); });
        }, FLOAT_FIRST_DELAY);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFloat);
    } else {
        initFloat();
    }

    return {
        load: load,
        relativeDate: relativeDate,
        stars: stars,
        googleLink: GOOGLE_REVIEWS_LINK
    };
})();
