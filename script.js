// ============================================
// SliceHub — Scripts
// ============================================

const WA_NUMBER = '917367013432';


function generalOrderURL() {
    const msg = 'Hi SliceHub! I\u2019d like to place an order. Please share the menu.';
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
}

// ============================================
// Cart State
// ============================================

let cart = loadCart();

function loadCart() {
    try {
        const saved = localStorage.getItem('slicehub_cart');
        return saved ? JSON.parse(saved) : { items: [], couponApplied: false };
    } catch (e) {
        return { items: [], couponApplied: false };
    }
}

function saveCart() {
    localStorage.setItem('slicehub_cart', JSON.stringify(cart));
}

// ---- Calculations ----
function calculateSubtotal() {
    return cart.items.reduce(function (sum, item) { return sum + (item.price * item.quantity); }, 0);
}

function calculateDiscount(subtotal) {
    return cart.couponApplied ? Math.round(subtotal * 0.10) : 0;
}

function calculateDelivery(subtotal) {
    return subtotal > 0 && subtotal < 299 ? 40 : 0;
}

function calculateSavings(subtotal, discount) {
    var deliverySavings = subtotal >= 299 && subtotal > 0 ? 40 : 0;
    return { discount: discount, deliverySavings: deliverySavings, total: discount + deliverySavings };
}

function calculateSavingsPercentage(subtotal, savings) {
    if (savings.total === 0) return 0;
    var baseAmount = subtotal + (savings.deliverySavings > 0 ? 40 : 0);
    return Math.round((savings.total / baseAmount) * 100);
}

// ---- Add Combo to Cart ----
function addComboToCart(btn) {
    var name  = btn.dataset.name;
    var emoji = btn.dataset.emoji;
    var price = parseInt(btn.dataset.price, 10);
    var note  = btn.dataset.note;

    var existing = null;
    for (var i = 0; i < cart.items.length; i++) {
        if (cart.items[i].name === name && cart.items[i].size === 'Combo') {
            existing = cart.items[i];
            break;
        }
    }
    if (existing) {
        existing.quantity++;
    } else {
        cart.items.push({ name: name, emoji: emoji, size: 'Combo', price: price, quantity: 1, note: note });
    }

    saveCart();
    renderCart();
    updateCartBadge();
    updateStickyBar();
    showToast(name + ' added to cart!');
}

// ---- Add to Cart ----
function addToCart(btn) {
    var card  = btn.closest('.pizza-card');
    var name  = card.dataset.name;
    var emoji = card.querySelector('.pizza-emoji').textContent.trim();
    var size  = btn.dataset.size;
    var price = parseInt(btn.dataset.price, 10);

    var existing = null;
    for (var i = 0; i < cart.items.length; i++) {
        if (cart.items[i].name === name && cart.items[i].size === size) {
            existing = cart.items[i];
            break;
        }
    }
    if (existing) {
        existing.quantity++;
    } else {
        cart.items.push({ name: name, emoji: emoji, size: size, price: price, quantity: 1 });
    }

    saveCart();
    renderCart();
    updateCartBadge();
    updateStickyBar();
    showToast(name + ' (' + size + ') added to cart!');
}

// ---- Quantity & Remove ----
function updateQuantity(index, delta) {
    cart.items[index].quantity += delta;
    if (cart.items[index].quantity <= 0) {
        cart.items.splice(index, 1);
    }
    saveCart();
    renderCart();
    updateCartBadge();
    updateStickyBar();
}

function removeCartItem(index) {
    cart.items.splice(index, 1);
    saveCart();
    renderCart();
    updateCartBadge();
    updateStickyBar();
}

// ---- Coupon ----
function toggleCoupon() {
    cart.couponApplied = !cart.couponApplied;
    saveCart();
    renderCart();
    updateStickyBar();
}

// ---- Toggle Cart Drawer ----
function toggleCart() {
    document.body.classList.toggle('cart-open');
}

// ---- Badge ----
function updateCartBadge() {
    var total = cart.items.reduce(function (sum, item) { return sum + item.quantity; }, 0);
    var badge = document.getElementById('cartBadge');
    if (!badge) return;
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
}

// ---- Sticky Bar ----
function updateStickyBar() {
    var bar = document.getElementById('stickyCartBar');
    if (!bar) return;
    var totalItems = cart.items.reduce(function (sum, item) { return sum + item.quantity; }, 0);
    if (totalItems === 0) {
        bar.classList.remove('visible');
        return;
    }
    bar.classList.add('visible');
    var subtotal = calculateSubtotal();
    var discount = calculateDiscount(subtotal);
    var delivery = calculateDelivery(subtotal);
    var total    = subtotal - discount + delivery;
    document.getElementById('stickyCount').textContent = totalItems + ' item' + (totalItems > 1 ? 's' : '');
    document.getElementById('stickyTotal').textContent = '\u20B9' + total;
}

// ---- Render Cart ----
function renderCart() {
    var itemsEl  = document.getElementById('cartItems');
    var footerEl = document.getElementById('cartFooter');
    var countEl  = document.getElementById('cartCount');
    if (!itemsEl || !footerEl || !countEl) return;

    var totalItems = cart.items.reduce(function (sum, item) { return sum + item.quantity; }, 0);
    countEl.textContent = totalItems > 0 ? '(' + totalItems + ' item' + (totalItems > 1 ? 's' : '') + ')' : '';

    if (cart.items.length === 0) {
        itemsEl.innerHTML =
            '<div class="cart-empty">' +
                '<div class="cart-empty-emoji">\uD83D\uDED2</div>' +
                '<p class="cart-empty-title">Your cart is empty</p>' +
                '<p class="cart-empty-sub">Select a pizza and tap \u201CAdd to Cart\u201D</p>' +
            '</div>';
        footerEl.innerHTML = '';
        return;
    }

    var itemsHTML = '';
    for (var i = 0; i < cart.items.length; i++) {
        var item = cart.items[i];
        itemsHTML +=
            '<div class="cart-item">' +
                '<div class="cart-item-info">' +
                    '<span class="cart-item-emoji">' + item.emoji + '</span>' +
                    '<div class="cart-item-details">' +
                        '<div class="cart-item-name">' + item.name + '</div>' +
                        '<div class="cart-item-size">' + (item.note ? item.note : item.size + ' \u2022 \u20B9' + item.price + ' each') + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="qty-controls">' +
                    '<button class="qty-btn" onclick="updateQuantity(' + i + ', -1)">\u2212</button>' +
                    '<span class="qty-count">' + item.quantity + '</span>' +
                    '<button class="qty-btn" onclick="updateQuantity(' + i + ', 1)">+</button>' +
                '</div>' +
                '<div class="cart-item-subtotal">\u20B9' + (item.price * item.quantity) + '</div>' +
                '<button class="cart-item-remove" onclick="removeCartItem(' + i + ')" aria-label="Remove">\u2715</button>' +
            '</div>';
    }
    itemsEl.innerHTML = itemsHTML;

    var subtotal  = calculateSubtotal();
    var discount  = calculateDiscount(subtotal);
    var delivery  = calculateDelivery(subtotal);
    var total     = subtotal - discount + delivery;
    var savings   = calculateSavings(subtotal, discount);
    var savingsPct = calculateSavingsPercentage(subtotal, savings);

    var discountRow = discount > 0
        ? '<div class="summary-row discount-row"><span>Discount (SLICE10)</span><span>\u2212\u20B9' + discount + '</span></div>'
        : '';

    var deliveryRow;
    if (delivery === 0 && subtotal > 0) {
        deliveryRow =
            '<div class="summary-row">' +
                '<span>Delivery</span>' +
                '<span class="free-delivery">FREE \u2713</span>' +
            '</div>' +
            '<div class="free-unlock-banner">' +
                '\uD83D\uDE9A You unlocked FREE delivery!' +
            '</div>';
    } else if (delivery > 0) {
        deliveryRow =
            '<div class="summary-row">' +
                '<span>Delivery</span>' +
                '<span>\u20B9' + delivery + '</span>' +
            '</div>' +
            '<p class="delivery-hint">Add \u20B9' + (299 - subtotal) + ' more for FREE delivery</p>';
    } else {
        deliveryRow = '';
    }

    var savingsBadge = savings.total > 0
        ? '<div class="savings-badge" id="savingsBadge">' +
              '\uD83C\uDF89 You saved \u20B9' + savings.total + ' (' + savingsPct + '%) on this order!' +
          '</div>'
        : '';

    footerEl.innerHTML =
        '<button class="coupon-btn' + (cart.couponApplied ? ' applied' : '') + '" onclick="toggleCoupon()">' +
            (cart.couponApplied ? '\u2705 SLICE10 Applied \u2014 10% OFF' : '\uD83C\uDFF7\uFE0F Apply SLICE10 (10% OFF for New Users)') +
        '</button>' +
        '<div class="cart-summary">' +
            '<div class="summary-row"><span>Subtotal</span><span>\u20B9' + subtotal + '</span></div>' +
            discountRow +
            deliveryRow +
            '<div class="summary-divider"></div>' +
            '<div class="summary-row total-row"><span>Total</span><span>\u20B9' + total + '</span></div>' +
        '</div>' +
        savingsBadge +
        '<button class="btn-checkout-wa" onclick="checkoutWhatsApp()">' +
            '<i class="fa-brands fa-whatsapp"></i> Checkout on WhatsApp' +
        '</button>';
}

// ---- WhatsApp Checkout ----
function generateWhatsAppMessage() {
    var lines = [];
    for (var i = 0; i < cart.items.length; i++) {
        var item = cart.items[i];
        var label = item.size === 'Combo' ? 'Combo Deal' : item.size;
        lines.push((i + 1) + '. ' + item.name + ' (' + label + ') x' + item.quantity + ' \u2192 \u20B9' + (item.price * item.quantity));
    }

    var subtotal = calculateSubtotal();
    var discount = calculateDiscount(subtotal);
    var delivery = calculateDelivery(subtotal);
    var total    = subtotal - discount + delivery;

    var savings    = calculateSavings(subtotal, discount);
    var savingsPct = calculateSavingsPercentage(subtotal, savings);

    var msg = '\uD83E\uDDFE SliceHub Order Summary\n\nItems:\n' + lines.join('\n') + '\n\n';
    msg += 'Subtotal: \u20B9' + subtotal + '\n';
    if (discount > 0) msg += 'Discount (SLICE10): \u2212\u20B9' + discount + '\n';
    msg += 'Delivery: ' + (delivery === 0 ? 'FREE' : '\u20B9' + delivery) + '\n';
    msg += '------------------------\n';
    msg += 'Total: \u20B9' + total + '\n';
    if (savings.total > 0) msg += '\n\uD83C\uDF89 You saved \u20B9' + savings.total + ' (' + savingsPct + '%)\n';
    msg += '\n\uD83D\uDCCD Please share your delivery address.';
    return msg;
}

function checkoutWhatsApp() {
    if (cart.items.length === 0) return;
    var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(generateWhatsAppMessage());
    window.open(url, '_blank');
}

// ---- Toast ----
function showToast(message) {
    var toast = document.getElementById('cartToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'cartToast';
        toast.className = 'cart-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { toast.classList.remove('show'); }, 2500);
}

// ---- Pizza size selector ----
function selectSize(btn, size, price) {
    var card = btn.closest('.pizza-card');
    card.querySelectorAll('.size-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    card.querySelector('.pizza-price').textContent = '\u20B9' + price;
    var addBtn = card.querySelector('.add-to-cart-btn');
    if (addBtn) {
        addBtn.dataset.size  = size;
        addBtn.dataset.price = price;
    }
}

// ============================================
// DOM Ready
// ============================================
document.addEventListener('DOMContentLoaded', function () {

    // ---- Init cart ----
    updateCartBadge();
    updateStickyBar();
    renderCart();

    // ---- Init general order links ----
    document.querySelectorAll('[data-general-order]').forEach(function (el) {
        el.href = generalOrderURL();
    });


    // ============================================
    // Hamburger / Mobile Nav
    // ============================================
    var hamburger  = document.getElementById('hamburger');
    var navLinks   = document.getElementById('navLinks');
    var navOverlay = document.getElementById('navOverlay');

    function closeNav() {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', function () {
        var isOpen = navLinks.classList.contains('open');
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
    navLinks.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', closeNav); });

    // ============================================
    // Sticky Navbar + Back to Top
    // ============================================
    var navbar    = document.getElementById('navbar');
    var backToTop = document.getElementById('backToTop');

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
    var sections = document.querySelectorAll('section[id]');
    var navItems = document.querySelectorAll('.nav-links a[href^="#"]');

    function highlightNav() {
        var scrollPos = window.scrollY + 130;
        sections.forEach(function (section) {
            var top    = section.offsetTop;
            var height = section.offsetHeight;
            var id     = section.getAttribute('id');
            if (scrollPos >= top && scrollPos < top + height) {
                navItems.forEach(function (item) {
                    item.classList.toggle('active', item.getAttribute('href') === '#' + id);
                });
            }
        });
    }
    window.addEventListener('scroll', highlightNav);

    // ============================================
    // Scroll Reveal (IntersectionObserver)
    // ============================================
    var revealEls = document.querySelectorAll('.reveal');
    var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });

    // ============================================
    // Stats Counter Animation
    // ============================================
    var statEls = document.querySelectorAll('.stat-number[data-target]');
    var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                animateCounter(entry.target, parseInt(entry.target.dataset.target, 10));
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statEls.forEach(function (el) { counterObserver.observe(el); });

    function animateCounter(el, target) {
        var duration = 1800;
        var start    = performance.now();
        (function update(now) {
            var progress = Math.min((now - start) / duration, 1);
            var eased    = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target);
            if (progress < 1) requestAnimationFrame(update);
            else el.textContent = target;
        })(start);
    }

    // ============================================
    // Reviews Auto-Slider
    // ============================================
    var track    = document.getElementById('reviewTrack');
    var dotsWrap = document.getElementById('reviewDots');
    var prevBtn  = document.getElementById('reviewPrev');
    var nextBtn  = document.getElementById('reviewNext');

    if (track && dotsWrap) {
        var cards   = track.querySelectorAll('.review-card');
        var current = 0;
        var autoTimer;

        cards.forEach(function (_, i) {
            var dot = document.createElement('button');
            dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Go to review ' + (i + 1));
            dot.addEventListener('click', function () { goTo(i); });
            dotsWrap.appendChild(dot);
        });

        function goTo(index) {
            current = index;
            track.style.transform = 'translateX(-' + (index * 100) + '%)';
            dotsWrap.querySelectorAll('.slider-dot').forEach(function (d, i) { d.classList.toggle('active', i === index); });
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

        var sliderWrap = track.closest('.reviews-slider');
        sliderWrap.addEventListener('mouseenter', function () { clearInterval(autoTimer); });
        sliderWrap.addEventListener('mouseleave', resetAuto);

        var touchStartX = 0;
        sliderWrap.addEventListener('touchstart', function (e) { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
        sliderWrap.addEventListener('touchend', function (e) {
            var diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
        });
    }

    // ============================================
    // FAQ Accordion
    // ============================================
    document.querySelectorAll('.faq-question').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var item   = btn.closest('.faq-item');
            var isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('open'); });
            if (!isOpen) item.classList.add('open');
        });
    });

});
