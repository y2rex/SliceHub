// ============================================
// SliceHub — Scripts
// ============================================

const WA_NUMBER = '917367013432';

function buildPizzaURL(name, size, price) {
    const msg = 'Hi SliceHub, I want to order:\nPizza: ' + name + '\nSize: ' + size + '\nPrice: \u20B9' + price;
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
}

function buildComboURL(name, items, price) {
    const msg = 'Hi SliceHub, I want to order:\nCombo: ' + name + '\nItems: ' + items + '\nPrice: \u20B9' + price;
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
}

function generalOrderURL() {
    const msg = 'Hi SliceHub! I\u2019d like to place an order. Please share the menu.';
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
}

// ---- Pizza size selector ----
function selectSize(btn, size, price) {
    const card = btn.closest('.pizza-card');
    card.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    card.querySelector('.pizza-price').textContent = '\u20B9' + price;
    card.querySelector('.order-btn').href = buildPizzaURL(card.dataset.name, size, price);
}

// ============================================
// DOM Ready
// ============================================
document.addEventListener('DOMContentLoaded', function () {

    // ---- Init pizza card order links ----
    document.querySelectorAll('.pizza-card').forEach(function (card) {
        const activeBtn = card.querySelector('.size-btn.active');
        if (!activeBtn) return;
        const text  = activeBtn.textContent.trim();
        const match = text.match(/\u20B9(\d+)/);
        if (!match) return;
        const price   = parseInt(match[1]);
        const sizeMap = { S: 'Small', M: 'Medium', L: 'Large' };
        const size    = sizeMap[text.charAt(0)] || 'Small';
        card.querySelector('.order-btn').href = buildPizzaURL(card.dataset.name, size, price);
    });

    // ---- Init general order links ----
    document.querySelectorAll('[data-general-order]').forEach(el => {
        el.href = generalOrderURL();
    });

    // ---- Init combo order links ----
    document.querySelectorAll('[data-combo-name]').forEach(el => {
        el.href = buildComboURL(
            el.dataset.comboName,
            el.dataset.comboItems,
            parseInt(el.dataset.comboPrice)
        );
    });

    // ============================================
    // Hamburger / Mobile Nav
    // ============================================
    const hamburger  = document.getElementById('hamburger');
    const navLinks   = document.getElementById('navLinks');
    const navOverlay = document.getElementById('navOverlay');

    function closeNav() {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', function () {
        const isOpen = navLinks.classList.contains('open');
        if (isOpen) {
            closeNav();
        } else {
            hamburger.classList.add('active');
            navLinks.classList.add('open');
            navOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });

    navOverlay.addEventListener('click', closeNav);
    navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));

    // ============================================
    // Sticky Navbar + Back to Top
    // ============================================
    const navbar    = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', function () {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
        backToTop.classList.toggle('visible', window.scrollY > 400);
    });

    backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ============================================
    // Active Nav Link on Scroll
    // ============================================
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-links a[href^="#"]');

    function highlightNav() {
        const scrollPos = window.scrollY + 130;
        sections.forEach(function (section) {
            const top    = section.offsetTop;
            const height = section.offsetHeight;
            const id     = section.getAttribute('id');
            if (scrollPos >= top && scrollPos < top + height) {
                navItems.forEach(item => {
                    item.classList.toggle('active', item.getAttribute('href') === '#' + id);
                });
            }
        });
    }
    window.addEventListener('scroll', highlightNav);

    // ============================================
    // Scroll Reveal (IntersectionObserver)
    // ============================================
    const revealEls = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));

    // ============================================
    // Stats Counter Animation
    // ============================================
    const statEls = document.querySelectorAll('.stat-number[data-target]');
    const counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                animateCounter(entry.target, parseInt(entry.target.dataset.target));
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statEls.forEach(el => counterObserver.observe(el));

    function animateCounter(el, target) {
        const duration = 1800;
        const start    = performance.now();
        (function update(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased    = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target);
            if (progress < 1) requestAnimationFrame(update);
            else el.textContent = target;
        })(start);
    }

    // ============================================
    // Reviews Auto-Slider
    // ============================================
    const track    = document.getElementById('reviewTrack');
    const dotsWrap = document.getElementById('reviewDots');
    const prevBtn  = document.getElementById('reviewPrev');
    const nextBtn  = document.getElementById('reviewNext');

    if (track && dotsWrap) {
        const cards = track.querySelectorAll('.review-card');
        let current = 0;
        let autoTimer;

        // Build dots
        cards.forEach(function (_, i) {
            const dot = document.createElement('button');
            dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Go to review ' + (i + 1));
            dot.addEventListener('click', () => goTo(i));
            dotsWrap.appendChild(dot);
        });

        function goTo(index) {
            current = index;
            track.style.transform = 'translateX(-' + (index * 100) + '%)';
            dotsWrap.querySelectorAll('.slider-dot').forEach((d, i) => d.classList.toggle('active', i === index));
            resetAuto();
        }
        function next() { goTo((current + 1) % cards.length); }
        function prev() { goTo((current - 1 + cards.length) % cards.length); }

        if (nextBtn) nextBtn.addEventListener('click', next);
        if (prevBtn) prevBtn.addEventListener('click', prev);

        function resetAuto() {
            clearInterval(autoTimer);
            autoTimer = setInterval(next, 5000);
        }
        resetAuto();

        // Pause on hover
        const sliderWrap = track.closest('.reviews-slider');
        sliderWrap.addEventListener('mouseenter', () => clearInterval(autoTimer));
        sliderWrap.addEventListener('mouseleave', resetAuto);

        // Touch swipe
        let touchStartX = 0;
        sliderWrap.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
        sliderWrap.addEventListener('touchend', function (e) {
            const diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
        });
    }

    // ============================================
    // FAQ Accordion
    // ============================================
    document.querySelectorAll('.faq-question').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const item   = btn.closest('.faq-item');
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });

});
