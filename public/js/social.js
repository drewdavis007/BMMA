/* =====================================================================
   HOMEPAGE SOCIAL FEEDS (live Instagram + Facebook)
   ---------------------------------------------------------------------
   Fills the "Follow Our Journey" section on index.html.

   INSTAGRAM - Behold (behold.so) reads the Instagram account and serves
     the latest posts as data; this file builds the photo grid from it.
     Free plan: 6 posts, refreshed once a day, 1,200 feed loads a month.
     To stay inside that, the feed is only requested when a visitor
     scrolls near the section, and each visitor's browser reuses it for
     a few hours. If it can't be loaded, the grid is hidden and the
     "Follow on Instagram" button is left on its own.

   FACEBOOK - Facebook's official Page Plugin, loaded as an iframe when
     the visitor scrolls near it. Facebook controls how it looks; it is
     between 180px and 500px wide.
   ===================================================================== */

(function () {
    'use strict';

    // ---- Settings you might want to change --------------------------
    var BEHOLD_FEED_URL = 'https://feeds.behold.so/RiPLKzLKY4XaANWfss8x';
    var FACEBOOK_PAGE_URL = 'https://www.facebook.com/p/Beautiful-Minds-Medical-Aesthetics-61567757859137/';
    var FACEBOOK_HEIGHT = 500;          // px height of the Facebook timeline box
    var INSTAGRAM_POSTS = 6;
    var CACHE_HOURS = 3;
    // ------------------------------------------------------------------

    var CACHE_KEY = 'bmma_instagram_v1';

    var igGrid = document.getElementById('igFeed');
    var fbBox = document.getElementById('fbFeed');
    var section = document.getElementById('social');
    if (!section) return;

    /* ---------------- helpers ---------------- */

    function readCache() {
        try {
            var obj = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
            if (!obj || Date.now() - obj.savedAt > CACHE_HOURS * 3600000) return null;
            return obj.data;
        } catch (e) { return null; }
    }

    function writeCache(data) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data: data })); } catch (e) {}
    }

    function whenNear(target, fn) {
        if (!('IntersectionObserver' in window)) { fn(); return; }
        var io = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) { io.disconnect(); fn(); return; }
            }
        }, { rootMargin: '600px 0px' });
        io.observe(target);
    }

    /* ---------------- Instagram ---------------- */

    function pickImage(post) {
        var s = post.sizes || {};
        var size = s.medium || s.small || s.large;
        if (size && size.mediaUrl) return size.mediaUrl;
        return post.mediaType === 'VIDEO' ? post.thumbnailUrl : post.mediaUrl;
    }

    function shortCaption(post) {
        var c = (post.prunedCaption || post.caption || '').replace(/\s+/g, ' ').trim();
        return c.length > 110 ? c.slice(0, 107).replace(/\s+\S*$/, '') + '…' : c;
    }

    function renderInstagram(feed) {
        var posts = (feed && feed.posts) || [];
        if (!posts.length) { failInstagram(); return; }
        igGrid.innerHTML = '';
        for (var i = 0; i < posts.length && i < INSTAGRAM_POSTS; i++) {
            var p = posts[i];
            var src = pickImage(p);
            if (!src) continue;

            var a = document.createElement('a');
            a.className = 'ig-tile';
            a.href = p.permalink;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            if (p.colorPalette && p.colorPalette.muted) a.style.backgroundColor = 'rgb(' + p.colorPalette.muted + ')';

            var img = document.createElement('img');
            img.src = src;
            img.loading = 'lazy';
            img.decoding = 'async';
            img.alt = p.altText || shortCaption(p) || 'Instagram post';
            a.appendChild(img);

            if (p.mediaType === 'VIDEO' || p.mediaType === 'CAROUSEL_ALBUM') {
                var badge = document.createElement('span');
                badge.className = 'ig-badge';
                badge.setAttribute('aria-hidden', 'true');
                badge.textContent = p.mediaType === 'VIDEO' ? '▶' : '❐';
                a.appendChild(badge);
            }

            var cap = shortCaption(p);
            if (cap) {
                var ov = document.createElement('span');
                ov.className = 'ig-caption';
                ov.textContent = cap;
                a.appendChild(ov);
            }
            igGrid.appendChild(a);
        }
        igGrid.classList.remove('is-loading');
    }

    function failInstagram() {
        igGrid.style.display = 'none';
    }

    function loadInstagram() {
        var c = readCache();
        if (c) { renderInstagram(c); return; }
        if (!window.fetch) { failInstagram(); return; }
        fetch(BEHOLD_FEED_URL)
            .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(function (feed) {
                if (feed && feed.posts && feed.posts.length) writeCache(feed);
                renderInstagram(feed);
            })
            .catch(failInstagram);
    }

    /* ---------------- Facebook ---------------- */

    function loadFacebook() {
        var w = Math.max(180, Math.min(500, Math.floor(fbBox.clientWidth)));
        var src = 'https://www.facebook.com/plugins/page.php' +
            '?href=' + encodeURIComponent(FACEBOOK_PAGE_URL) +
            '&tabs=timeline&width=' + w + '&height=' + FACEBOOK_HEIGHT +
            '&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=false';
        var f = document.createElement('iframe');
        f.src = src;
        f.width = w;
        f.height = FACEBOOK_HEIGHT;
        f.title = 'Beautiful Minds Medical Aesthetics on Facebook';
        f.setAttribute('scrolling', 'no');
        f.setAttribute('frameborder', '0');
        f.setAttribute('allowfullscreen', 'true');
        f.setAttribute('allow', 'encrypted-media; picture-in-picture; web-share');
        f.loading = 'lazy';
        fbBox.innerHTML = '';
        fbBox.appendChild(f);
        fbBox.classList.remove('is-loading');
    }

    whenNear(section, function () {
        if (igGrid) loadInstagram();
        if (fbBox) loadFacebook();
    });
})();
