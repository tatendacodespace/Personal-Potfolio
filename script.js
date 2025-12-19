// Mobile Menu Toggle
const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav-links');
const navLinks = document.querySelectorAll('.nav-links li');

// accessibility: track burger expanded state
if (burger) burger.setAttribute('aria-expanded', 'false');

burger.addEventListener('click', () => {
    // Toggle Nav
    const opened = nav.classList.toggle('nav-active');
    // update aria
    burger.setAttribute('aria-expanded', opened ? 'true' : 'false');
    
    // Animate Links
    navLinks.forEach((link, index) => {
        if (link.style.animation) {
            link.style.animation = '';
        } else {
            link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
        }
    });
    
    // Burger Animation
    burger.classList.toggle('toggle');
});

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Adjust for fixed header
                behavior: 'smooth'
            });
            
            // Close mobile menu if open
            if (nav.classList.contains('nav-active')) {
                nav.classList.remove('nav-active');
                burger.classList.remove('toggle');
                if (burger) burger.setAttribute('aria-expanded', 'false');
            }
        }
    });
});

// Add animation to burger menu
const burgerAnimation = () => {
    const lines = document.querySelectorAll('.burger div');
    lines.forEach(line => {
        line.style.transition = 'all 0.3s ease';
    });
};

burgerAnimation();

// Add scroll animation to sections
const sections = document.querySelectorAll('section');

const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

sections.forEach(section => {
    observer.observe(section);
});

// Lightbox functionality
let __previousFocus = null;
let __focusTrapHandler = null;
let __trapModal = null;
function openLightbox(element) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = lightbox.querySelector('img');
    const imgSrc = element.querySelector('img').src;
    const closeBtn = lightbox.querySelector('.lightbox-close');
    
    __previousFocus = document.activeElement;
    lightboxImg.src = imgSrc;
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Prevent scrolling when lightbox is open
    if (closeBtn) closeBtn.focus();
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Restore scrolling
    if (__previousFocus && typeof __previousFocus.focus === 'function') {
        __previousFocus.focus();
    }
    __previousFocus = null;
}

// Project modals functionality
function openProjectModal(key) {
    const modalId = key + '-modal';
    const modal = document.getElementById(modalId);
    if (!modal) return;
    __previousFocus = document.activeElement;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // focus first focusable element (close button)
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
    // setup focus trap
    setupFocusTrap(modal);
    // staggered reveal for elements marked with .stagger
    const stagger = modal.querySelector('.stagger');
    if (stagger) {
        const children = Array.from(stagger.children);
        children.forEach((child, i) => {
            // set incremental delays so children animate in sequence
            child.style.transitionDelay = `${i * 80}ms`;
        });
        // trigger reveal slightly after adding delays
        window.setTimeout(() => stagger.classList.add('stagger-in'), 20);
    }

    // contrast/a11y check: ensure card background vs text meets 4.5:1; if not, apply fallback class
    try {
        const card = modal.querySelector('.modal-card');
        if (card) {
            const style = getComputedStyle(card);
            const bg = style.backgroundColor || window.getComputedStyle(document.documentElement).getPropertyValue('--card-bg');
            const fg = style.color || window.getComputedStyle(document.documentElement).getPropertyValue('--text-dark');
            const ratio = contrastRatio(parseColor(fg), parseColor(bg));
            if (ratio < 4.5) {
                card.classList.add('modal-a11y-fix');
                console.warn('Modal contrast low (ratio=' + ratio.toFixed(2) + '), applied modal-a11y-fix');
            }
        }
    } catch (e) {
        // silent
    }
}

function closeProjectModal(key) {
    const modalId = key + '-modal';
    const modal = document.getElementById(modalId);
    if (!modal) return;
    // remove stagger class and clear transition-delays so children animate out
    const stagger = modal.querySelector('.stagger');
    if (stagger) {
        stagger.classList.remove('stagger-in');
        Array.from(stagger.children).forEach(child => { child.style.transitionDelay = ''; });
    }
    // remove modal active state — CSS transitions will animate opacity/visibility
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // teardown focus trap
    teardownFocusTrap();
    if (__previousFocus && typeof __previousFocus.focus === 'function') {
        // restore focus after a short delay to allow modal close animation to finish
        window.setTimeout(() => { __previousFocus.focus(); }, 260);
    }
    __previousFocus = null;
}

// Focus trap utilities
function setupFocusTrap(modal) {
    teardownFocusTrap();
    __trapModal = modal;
    const selectors = 'a[href], area[href], input:not([disabled]), button:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(modal.querySelectorAll(selectors)).filter(el => el.offsetParent !== null || el === document.activeElement);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    __focusTrapHandler = function(e) {
        if (e.key !== 'Tab') return;
        // if only one focusable element, keep focus there
        if (focusable.length === 1) {
            e.preventDefault();
            first.focus();
            return;
        }
        if (e.shiftKey) {
            if (document.activeElement === first || document.activeElement === modal) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };

    document.addEventListener('keydown', __focusTrapHandler);
}

function teardownFocusTrap() {
    if (__focusTrapHandler) {
        document.removeEventListener('keydown', __focusTrapHandler);
        __focusTrapHandler = null;
        __trapModal = null;
    }
}

// Wire data-project links
document.querySelectorAll('[data-project]').forEach(el => {
    el.addEventListener('click', function(e){
        e.preventDefault();
        const key = this.getAttribute('data-project');
        if (!key) return;
        openProjectModal(key);
    });
});

// For project card quick links to full case-study pages (if present)
document.querySelectorAll('.project-links a').forEach(a => {
    // if link href is '#' and data-project exists, also provide a fallback to the dedicated page
    if (a.getAttribute('href') === '#') {
        const dp = a.getAttribute('data-project');
        if (dp && document.getElementById(dp + '-modal') == null) {
            a.setAttribute('href', dp + '.html');
            a.setAttribute('target','_blank');
        }
    }
});

// Close modals on click outside or Esc
document.addEventListener('click', function(e){
    const modalOverlay = e.target.closest('.project-modal.active');
    if (modalOverlay && e.target === modalOverlay) {
        // find which modal
        const id = modalOverlay.id.replace('-modal','');
        closeProjectModal(id);
    }
});

document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') {
        // close any active project modals
        document.querySelectorAll('.project-modal.active').forEach(modal => {
            const id = modal.id.replace('-modal','');
            closeProjectModal(id);
        });
    }
});

// small color/contrast helpers
function parseColor(colorStr) {
    // support rgb(a) and hex
    if (!colorStr) return [0,0,0];
    colorStr = colorStr.trim();
    if (colorStr.startsWith('rgb')) {
        const nums = colorStr.match(/\d+/g).map(n => parseInt(n,10));
        return nums.slice(0,3);
    }
    // hex
    if (colorStr[0] === '#') {
        let hex = colorStr.slice(1);
        if (hex.length === 3) hex = hex.split('').map(h=>h+h).join('');
        const r = parseInt(hex.slice(0,2),16);
        const g = parseInt(hex.slice(2,4),16);
        const b = parseInt(hex.slice(4,6),16);
        return [r,g,b];
    }
    return [0,0,0];
}

function luminance(rgb) {
    const s = rgb.map(v => {
        v = v/255;
        return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
    });
    return 0.2126*s[0] + 0.7152*s[1] + 0.0722*s[2];
}

function contrastRatio(fgRgb, bgRgb) {
    const L1 = luminance(fgRgb) + 0.05;
    const L2 = luminance(bgRgb) + 0.05;
    return Math.max(L1, L2) / Math.min(L1, L2);
}

// Close lightbox when clicking outside the image
document.getElementById('lightbox').addEventListener('click', function(e) {
    if (e.target === this) {
        closeLightbox();
    }
});

// Close lightbox with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});
