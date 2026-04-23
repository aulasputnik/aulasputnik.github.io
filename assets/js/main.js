/**
 * Main JavaScript file for AulaSPUTNIK
 * Handles i18n with JSON translations, navigation, forms, and carousels
 */

// Global translations cache
let translations = {};
let currentLanguage = 'ca';

/**
 * Load translations — uses pre-loaded window.TRANSLATIONS_DATA if available
 * (set by translations-data.js), otherwise falls back to fetch
 */
async function loadTranslations() {
    if (window.TRANSLATIONS_DATA) {
        translations = window.TRANSLATIONS_DATA;
        return true;
    }
    try {
        const response = await fetch('assets/i18n/translations.json');
        if (!response.ok) throw new Error('Failed to load translations');
        translations = await response.json();
        return true;
    } catch (error) {
        console.error('Error loading translations:', error);
        return false;
    }
}

/**
 * Get a translation string by key and language
 * Supports nested keys like "workshop.1.title"
 */
function getTranslation(lang, keyPath) {
    const langData = translations[lang];
    if (!langData) return null;

    // Try flat dot-notation key first (e.g. "nav.home" stored as-is)
    if (keyPath in langData) {
        const val = langData[keyPath];
        return typeof val === 'string' ? val : null;
    }

    // For Catalan (default language), treat the key itself as a fallback
    // for legacy elements where the data-i18n value IS the Catalan text.
    // Skip if the key contains HTML — textContent would render literal tags.
    if (lang === 'ca' && !keyPath.includes('<')) {
        return keyPath;
    }

    // Fall back to nested traversal
    const keys = keyPath.split('.');
    let value = langData;
    for (let key of keys) {
        if (value && typeof value === 'object') {
            value = value[key];
        } else {
            return null;
        }
    }
    return typeof value === 'string' ? value : null;
}

/**
 * Determine the user's preferred language
 * Priority: 1. Saved preference, 2. Browser setting, 3. Default
 */
function getInitialLanguage() {
    const supportedLangs = ['ca', 'es', 'en'];
    const defaultLang = 'ca';

    // 1. Check localStorage
    const savedLang = localStorage.getItem('userLanguage');
    if (savedLang && supportedLangs.includes(savedLang)) {
        return savedLang;
    }

    // 2. Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (supportedLangs.includes(browserLang)) {
        return browserLang;
    }

    // 3. Default to Catalan
    return defaultLang;
}

/**
 * Apply translations to all elements with data-i18n* attributes
 */
function applyTranslations(lang, savePreference = false) {
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    currentLanguage = lang;

    // Handle legacy data-lang-* attributes (inline translated text/HTML)
    document.querySelectorAll(`[data-lang-${lang}]`).forEach(element => {
        const text = element.getAttribute(`data-lang-${lang}`);
        if (text !== null) element.innerHTML = text;
    });

    // Handle data-i18n (textContent)
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const text = getTranslation(lang, key);
        if (text) element.textContent = text;
    });

    // Handle data-i18n-html (innerHTML with markup)
    document.querySelectorAll('[data-i18n-html]').forEach(element => {
        const key = element.getAttribute('data-i18n-html');
        const html = getTranslation(lang, key);
        if (html) element.innerHTML = html;
    });

    // Handle data-i18n-ph (placeholder)
    document.querySelectorAll('[data-i18n-ph]').forEach(element => {
        const key = element.getAttribute('data-i18n-ph');
        const text = getTranslation(lang, key);
        if (text) element.setAttribute('placeholder', text);
    });

    // Handle data-i18n-aria (aria-label)
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
        const key = element.getAttribute('data-i18n-aria');
        const text = getTranslation(lang, key);
        if (text) element.setAttribute('aria-label', text);
    });

    // Handle data-i18n-title (title attribute)
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        const text = getTranslation(lang, key);
        if (text) element.setAttribute('title', text);
    });

    // Update page title
    const titleKey = document.querySelector('[data-i18n-page-title]');
    if (titleKey) {
        const key = titleKey.getAttribute('data-i18n-page-title');
        const title = getTranslation(lang, key);
        if (title) document.title = title + ' - AulaSPUTNIK';
    }

    // Update language buttons
    updateLanguageButtonStyles(lang);

    // Update dossier download buttons
    updateDossierButtons(lang);

    // Update ODS images
    updateODSImages(lang);

    // Update multiselect placeholder
    updateMultiselectPlaceholder(lang);

    // Update hamburger menu aria-label
    updateHamburgerLabel(lang);

    // Save preference only when user explicitly chose the language
    if (savePreference) localStorage.setItem('userLanguage', lang);
}

/**
 * Update language button styles
 */
function updateLanguageButtonStyles(lang) {
    document.querySelectorAll('.lang-switcher-btn').forEach(btn => {
        const btnLang = btn.getAttribute('data-lang');
        btn.classList.toggle('active', btnLang === lang);
    });
}

/**
 * Update language-aware dossier download buttons
 */
function updateDossierButtons(lang) {
    const dossierLang = lang === 'en' ? 'ca' : lang;
    document.querySelectorAll('[data-dossier]').forEach(btn => {
        const dossierType = btn.getAttribute('data-dossier');
        let filename = '';

        if (dossierType === 'workshops') {
            filename = `dossier-${dossierLang}.pdf`;
        } else if (dossierType === 'challenge') {
            filename = `dossier-repte-${dossierLang}.pdf`;
        }

        if (filename) {
            btn.href = `assets/fitxers/${filename}`;
            btn.setAttribute('download', filename);
        }

        // Update button text
        const textKey = btn.getAttribute('data-i18n');
        if (textKey) {
            const text = getTranslation(lang, textKey);
            if (text) btn.textContent = text;
        }
    });
}

/**
 * Update ODS images based on language
 * Smooth fade transition
 */
function updateODSImages(lang) {
    document.querySelectorAll('[data-i18n-src-ca]').forEach(img => {
        const src = img.getAttribute(`data-i18n-src-${lang}`);
        if (src) {
            // Fade out
            img.style.opacity = '0';

            // After fade, change src
            setTimeout(() => {
                img.src = src;
                // Fade in
                img.style.opacity = '1';
            }, 150);
        }
    });
}

/**
 * Workshop filter bar — keyword, age range, duration
 */
function initWorkshopFilter() {
    const keywordInput = document.getElementById('filter-keyword');
    if (!keywordInput) return;

    const cards = document.querySelectorAll('.taller-card');
    const noResults = document.getElementById('filter-no-results');
    let activeAge = 'all';
    let activeDuration = 'all';

    function applyFilters() {
        const keyword = keywordInput.value.toLowerCase().trim();
        let visibleCount = 0;

        cards.forEach(card => {
            const ageMin = parseInt(card.dataset.ageMin) || 0;
            const ageMax = parseInt(card.dataset.ageMax) || 99;
            const duration = card.dataset.duration || '';
            const title = card.querySelector('.taller-title')?.textContent.toLowerCase() || '';
            const tags = card.querySelector('.taller-tags')?.textContent.toLowerCase() || '';

            const keywordMatch = !keyword || title.includes(keyword) || tags.includes(keyword);

            let ageMatch = true;
            if (activeAge !== 'all') {
                const [chipMin, chipMax] = activeAge.split('-').map(Number);
                ageMatch = ageMin <= chipMax && ageMax >= chipMin;
            }

            const durationMatch = activeDuration === 'all' || duration === activeDuration;

            const visible = keywordMatch && ageMatch && durationMatch;
            card.style.display = visible ? '' : 'none';
            if (visible) visibleCount++;
        });

        if (noResults) noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    keywordInput.addEventListener('input', applyFilters);

    document.querySelectorAll('[data-filter-age]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-filter-age]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeAge = btn.dataset.filterAge;
            applyFilters();
        });
    });

    document.querySelectorAll('[data-filter-duration]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-filter-duration]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeDuration = btn.dataset.filterDuration;
            applyFilters();
        });
    });

    const clearBtn = document.getElementById('filter-clear');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            keywordInput.value = '';
            activeAge = 'all';
            activeDuration = 'all';
            document.querySelectorAll('[data-filter-age]').forEach(b => b.classList.toggle('active', b.dataset.filterAge === 'all'));
            document.querySelectorAll('[data-filter-duration]').forEach(b => b.classList.toggle('active', b.dataset.filterDuration === 'all'));
            applyFilters();
        });
    }
}

/**
 * Update multiselect placeholder based on current language
 */
function updateMultiselectPlaceholder(lang) {
    const multiselect = document.getElementById('workshops-multiselect');
    if (!multiselect) return;

    const placeholder = multiselect.querySelector('.multiselect-placeholder');
    if (!placeholder) return;

    // If no workshops selected, show placeholder
    const checkboxes = multiselect.querySelectorAll('input[type="checkbox"]');
    const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

    if (selectedCount === 0) {
        const key = placeholder.getAttribute('data-i18n');
        const text = getTranslation(lang, key);
        if (text) placeholder.textContent = text;
    }
}

/**
 * Update hamburger menu aria-label based on language
 */
function updateHamburgerLabel(lang) {
    const hamburger = document.querySelector('.hamburger-menu');
    if (!hamburger) return;

    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    const key = isOpen ? 'nav.closeMenu' : 'nav.openMenu';
    const label = getTranslation(lang, key);
    if (label) hamburger.setAttribute('aria-label', label);
}

/**
 * Cookie consent banner — shown once, preference stored in localStorage
 */
function initCookieBanner() {
    if (localStorage.getItem('cookieConsent')) return;

    const t = (key) => getTranslation(currentLanguage, key);
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = `
        <div class="cookie-banner-content">
            <p class="cookie-text">
                ${t('cookie.banner')}
                <a href="politica-de-privacitat.html">${t('cookie.learnMore')}</a>
            </p>
            <div class="cookie-actions">
                <button class="cookie-btn cookie-accept" id="cookie-accept">${t('cookie.accept')}</button>
                <button class="cookie-btn cookie-decline" id="cookie-decline">${t('cookie.reject')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('visible'));

    const dismiss = (value) => {
        localStorage.setItem('cookieConsent', value);
        banner.classList.remove('visible');
        setTimeout(() => banner.remove(), 400);
    };

    banner.querySelector('#cookie-accept').addEventListener('click', () => dismiss('accepted'));
    banner.querySelector('#cookie-decline').addEventListener('click', () => dismiss('declined'));
}

/**
 * Real-time form validation — shows inline errors on blur, clears on input
 */
function initFormValidation() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    const t = (key) => getTranslation(currentLanguage, key);
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const rules = {
        name:        (v) => v.trim().length < 1 ? t('form.error.name') : null,
        email:       (v) => !v.trim() ? t('form.error.email.required') : !EMAIL_RE.test(v.trim()) ? t('form.error.email.invalid') : null,
        institution: (v) => v.trim().length < 1 ? t('form.error.institution') : null,
        message:     (v) => v.trim().length < 1 ? t('form.error.message') : null,
    };

    Object.entries(rules).forEach(([id, validate]) => {
        const field = form.querySelector(`#${id}`);
        if (!field) return;

        const group = field.closest('.form-group');
        const errorEl = document.createElement('span');
        errorEl.className = 'form-error';
        group.appendChild(errorEl);

        const check = () => {
            const error = validate(field.value);
            if (error) {
                errorEl.textContent = error;
                group.classList.add('has-error');
                group.classList.remove('is-valid');
            } else {
                group.classList.remove('has-error');
                if (field.value.trim()) group.classList.add('is-valid');
            }
        };

        field.addEventListener('blur', check);
        field.addEventListener('input', () => {
            if (group.classList.contains('has-error')) check();
        });
    });

    form.addEventListener('submit', (e) => {
        let hasErrors = false;
        Object.keys(rules).forEach((id) => {
            const field = form.querySelector(`#${id}`);
            if (field) field.dispatchEvent(new Event('blur'));
            if (form.querySelector(`#${id}`)?.closest('.form-group')?.classList.contains('has-error')) {
                hasErrors = true;
            }
        });
        if (hasErrors) e.stopImmediatePropagation();
    }, true);
}

/**
 * Scroll-triggered fade-in animations via IntersectionObserver
 */
function initScrollAnimations() {
    const targets = document.querySelectorAll('.scroll-animate');
    if (!targets.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    targets.forEach(el => observer.observe(el));
}

// =================== INITIALIZATION ===================

document.addEventListener('DOMContentLoaded', async () => {
    // Load translations first
    await loadTranslations();

    // Get initial language and apply
    const lang = getInitialLanguage();
    applyTranslations(lang);

    // ============ WORKSHOP FILTER ============
    initWorkshopFilter();

    // ============ SCROLL ANIMATIONS ============
    initScrollAnimations();

    // ============ COOKIE BANNER ============
    initCookieBanner();

    // ============ FORM VALIDATION ============
    initFormValidation();

    // ============ LANGUAGE SWITCHING ============
    document.querySelectorAll('.lang-switcher-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedLang = btn.getAttribute('data-lang');
            applyTranslations(selectedLang, true);
        });
    });

    // ============ NAVIGATION ============

    const nav = document.querySelector('.site-nav');
    const hamburger = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');

    // Scroll effect
    const handleScroll = () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', handleScroll);

    // Mobile hamburger menu
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('is-active');
            navMenu.classList.toggle('is-active');

            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !isExpanded);

            // Update label
            updateHamburgerLabel(currentLanguage);
        });
    }

    // ============ SCROLL TO TOP BUTTON ============

    const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
    if (scrollToTopBtn) {
        const toggleVisibility = () => {
            if (window.scrollY > 400) {
                scrollToTopBtn.classList.add('is-visible');
            } else {
                scrollToTopBtn.classList.remove('is-visible');
            }
        };

        const scrollToTop = () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        window.addEventListener('scroll', toggleVisibility);
        scrollToTopBtn.addEventListener('click', scrollToTop);
    }

    // ============ ACCORDION ============

    // Open first accordion item by default
    const firstAccordionItem = document.querySelector('.accordion-item.is-active');
    if (firstAccordionItem) {
        const content = firstAccordionItem.querySelector('.accordion-content');
        if (content) content.style.maxHeight = content.scrollHeight + 'px';
    }

    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const accordionItem = header.parentElement;
            const isActive = accordionItem.classList.contains('is-active');

            if (!isActive) {
                accordionItem.classList.add('is-active');
                const content = accordionItem.querySelector('.accordion-content');
                content.style.maxHeight = content.scrollHeight + 'px';

                // Set aria-expanded
                header.setAttribute('aria-expanded', 'true');
            } else {
                accordionItem.classList.remove('is-active');
                accordionItem.querySelector('.accordion-content').style.maxHeight = '0px';

                // Set aria-expanded
                header.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // ============ WORKSHOP CARDS ============

    const setupCarousel = (carousel) => {
        if (carousel.dataset.initialized === 'true') return;

        const track = carousel.querySelector('.carousel-track');
        const slides = Array.from(track.children);
        const nextButton = carousel.querySelector('.carousel-button--right');
        const prevButton = carousel.querySelector('.carousel-button--left');

        if (slides.length <= 1) {
            if (nextButton) nextButton.style.display = 'none';
            if (prevButton) prevButton.style.display = 'none';
            return;
        }

        let currentIndex = 0;
        let isAnimating = false;

        const updateCarousel = () => {
            const slideWidth = slides[0].getBoundingClientRect().width;
            track.style.transition = 'transform 0.4s ease-in-out';
            track.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
            prevButton.classList.toggle('is-hidden', currentIndex === 0);
            nextButton.classList.toggle('is-hidden', currentIndex === slides.length - 1);
        };

        track.addEventListener('transitionend', () => {
            isAnimating = false;
        });

        nextButton.addEventListener('click', () => {
            if (isAnimating) return;
            if (currentIndex < slides.length - 1) {
                currentIndex++;
                isAnimating = true;
                updateCarousel();
            }
        });

        prevButton.addEventListener('click', () => {
            if (isAnimating) return;
            if (currentIndex > 0) {
                currentIndex--;
                isAnimating = true;
                updateCarousel();
            }
        });

        carousel.updateDimensions = updateCarousel;
        carousel.dataset.initialized = 'true';
        updateCarousel();
    };

    const tallerCardHeaders = document.querySelectorAll('.taller-card-header');
    tallerCardHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const card = header.closest('.taller-card');
            const hiddenContent = card.querySelector('.taller-card-hidden');
            if (!card || !hiddenContent) return;

            card.classList.toggle('is-open');

            if (card.classList.contains('is-open')) {
                hiddenContent.style.maxHeight = hiddenContent.scrollHeight + 'px';
                const carousel = card.querySelector('.taller-carousel');
                if (carousel) {
                    setTimeout(() => setupCarousel(carousel), 50);
                }
            } else {
                hiddenContent.style.maxHeight = null;
            }
        });
    });

    // Auto-open a workshop card when navigating from the index carousel (e.g. #taller-2)
    if (window.location.hash) {
        const target = document.querySelector(window.location.hash);
        if (target && target.classList.contains('taller-card')) {
            const hiddenContent = target.querySelector('.taller-card-hidden');
            if (hiddenContent) {
                target.classList.add('is-open');
                hiddenContent.style.maxHeight = hiddenContent.scrollHeight + 'px';
                const carousel = target.querySelector('.taller-carousel');
                if (carousel) setTimeout(() => setupCarousel(carousel), 50);
                setTimeout(() => {
                    const nav = document.querySelector('.site-nav');
                    const offset = (nav ? nav.offsetHeight : 0) + 24;
                    const top = target.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({ top, behavior: 'smooth' });
                }, 200);
            }
        }
    }

    // Resize handler for workshop cards
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            document.querySelectorAll('.taller-card.is-open').forEach(card => {
                const hiddenContent = card.querySelector('.taller-card-hidden');
                if (hiddenContent) {
                    hiddenContent.style.maxHeight = 'none';
                    requestAnimationFrame(() => {
                        hiddenContent.style.maxHeight = hiddenContent.scrollHeight + 'px';
                        const carousel = card.querySelector('.taller-carousel');
                        if (carousel && carousel.dataset.initialized === 'true') {
                            carousel.updateDimensions();
                        }
                    });
                }
            });
        }, 250);
    });

    // ============ MULTI-SELECT DROPDOWN ============

    const multiselect = document.getElementById('workshops-multiselect');
    if (multiselect) {
        const display = multiselect.querySelector('.multiselect-display');
        const placeholder = multiselect.querySelector('.multiselect-placeholder');
        const optionsContainer = multiselect.querySelector('.multiselect-options');
        const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]');
        const hiddenInput = document.getElementById('selected-workshops-input');

        // Toggle dropdown
        display.addEventListener('click', () => {
            multiselect.classList.toggle('active');
            display.classList.toggle('active');
        });

        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            if (!multiselect.contains(e.target)) {
                multiselect.classList.remove('active');
                display.classList.remove('active');
            }
        });

        // Update multiselect state
        function updateMultiselectState() {
            const selectedCheckboxes = Array.from(checkboxes).filter(cb => cb.checked);
            const selectedValues = selectedCheckboxes.map(cb => cb.value);

            hiddenInput.value = selectedValues.join(', ');

            if (selectedCheckboxes.length === 0) {
                const key = placeholder.getAttribute('data-i18n');
                const text = getTranslation(currentLanguage, key);
                placeholder.textContent = text || 'Select...';
                placeholder.style.opacity = '0.7';
            } else if (selectedCheckboxes.length === 1) {
                placeholder.textContent = selectedCheckboxes[0].nextElementSibling.textContent;
                placeholder.style.opacity = '1';
            } else {
                const key = 'form.selected';
                let countText = getTranslation(currentLanguage, key) || '{n} selected';
                countText = countText.replace('{n}', selectedCheckboxes.length);
                placeholder.textContent = countText;
                placeholder.style.opacity = '1';
            }
        }

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateMultiselectState);
        });
    }

    // ============ TESTIMONIAL CAROUSEL ============

    const testimonialCarousel = document.querySelector('.testimonial-carousel');
    if (testimonialCarousel) {
        const track = testimonialCarousel.querySelector('.testimonial-track');
        const prevButton = testimonialCarousel.querySelector('.carousel-nav-btn.prev');
        const nextButton = testimonialCarousel.querySelector('.carousel-nav-btn.next');
        const slides = Array.from(track.children);
        let currentIndex = 0;
        let autoplayInterval;
        let isTransitioning = false;

        // Clone slides for loop effect
        const clones = slides.map(slide => slide.cloneNode(true));
        clones.forEach(clone => track.appendChild(clone));

        const allSlides = Array.from(track.children);

        const updateCarousel = (withTransition = true) => {
            const cardWidth = slides[0].offsetWidth + 20;
            if (!withTransition) {
                track.style.transition = 'none';
            }
            track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
            if (!withTransition) {
                setTimeout(() => {
                    track.style.transition = 'transform 0.5s ease-in-out';
                }, 50);
            }
        };

        const moveToNext = () => {
            if (isTransitioning) return;
            isTransitioning = true;
            currentIndex++;
            updateCarousel();
        };

        const moveToPrev = () => {
            if (isTransitioning) return;
            isTransitioning = true;
            currentIndex--;
            updateCarousel();
        };

        track.addEventListener('transitionend', () => {
            isTransitioning = false;
            if (currentIndex >= slides.length) {
                currentIndex = 0;
                updateCarousel(false);
            }
            if (currentIndex < 0) {
                currentIndex = slides.length - 1;
                updateCarousel(false);
            }
        });

        const startAutoplay = () => {
            stopAutoplay();
            autoplayInterval = setInterval(moveToNext, 5000);
        };

        const stopAutoplay = () => {
            clearInterval(autoplayInterval);
        };

        if (nextButton && prevButton) {
            nextButton.addEventListener('click', moveToNext);
            prevButton.addEventListener('click', moveToPrev);
        }

        testimonialCarousel.addEventListener('mouseenter', stopAutoplay);
        testimonialCarousel.addEventListener('mouseleave', startAutoplay);
        window.addEventListener('resize', () => updateCarousel(false));

        startAutoplay();
    }

    // ============ CONTACT FORM - AJAX ============

    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const formFeedback = document.querySelector('.form-feedback') ||
                createFormFeedback();

            // Disable button and show sending state
            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            const sendingText = getTranslation(currentLanguage, 'form.sending');
            submitBtn.textContent = sendingText || 'Sending...';

            try {
                const formData = new FormData(contactForm);
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' },
                    body: formData
                });

                if (response.ok) {
                    const successMsg = getTranslation(currentLanguage, 'form.success');
                    formFeedback.textContent = successMsg || 'Message sent successfully!';
                    formFeedback.className = 'form-feedback success';
                    formFeedback.style.display = 'block';

                    contactForm.reset();
                    setTimeout(() => {
                        formFeedback.style.display = 'none';
                    }, 5000);
                } else {
                    throw new Error('Form submission failed');
                }
            } catch (error) {
                const errorMsg = getTranslation(currentLanguage, 'form.error');
                formFeedback.textContent = errorMsg || 'Error sending message.';
                formFeedback.className = 'form-feedback error';
                formFeedback.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    function createFormFeedback() {
        const feedback = document.createElement('div');
        feedback.className = 'form-feedback';
        const form = document.querySelector('.contact-form');
        if (form) {
            form.insertAdjacentElement('beforebegin', feedback);
        }
        return feedback;
    }

    // ============ WORKSHOPS PREVIEW CAROUSEL ============

    const tallersPreviewSection = document.querySelector('.tallers-preview-section');
    if (tallersPreviewSection) {
        const track = tallersPreviewSection.querySelector('.tallers-preview-track');
        const cards = Array.from(track.querySelectorAll('.taller-preview-card'));
        const prevBtn = tallersPreviewSection.querySelector('.tallers-preview-nav--prev');
        const nextBtn = tallersPreviewSection.querySelector('.tallers-preview-nav--next');
        const dotsContainer = tallersPreviewSection.querySelector('.tallers-preview-dots');

        // Clones at each end = max visible count (desktop = 3).
        // This lets the carousel slide seamlessly into clone territory on any
        // breakpoint, then snap back to the real equivalent position on transitionend.
        const CLONES = 3;
        let currentAugIndex = CLONES; // track index in the augmented (clone-padded) list
        let isAnimating = false;

        // Prepend clones of the last CLONES real cards (reversed so order is preserved)
        [...cards.slice(-CLONES)].reverse().forEach(card => {
            const clone = card.cloneNode(true);
            clone.setAttribute('tabindex', '-1');
            clone.setAttribute('aria-hidden', 'true');
            track.prepend(clone);
        });

        // Append clones of the first CLONES real cards
        cards.slice(0, CLONES).forEach(card => {
            const clone = card.cloneNode(true);
            clone.setAttribute('tabindex', '-1');
            clone.setAttribute('aria-hidden', 'true');
            track.appendChild(clone);
        });

        function getVisibleCount() {
            if (window.innerWidth >= 900) return 3;
            if (window.innerWidth >= 600) return 2;
            return 1;
        }

        function getOffset(index) {
            const cardWidth = cards[0].getBoundingClientRect().width;
            const gap = parseInt(getComputedStyle(track).gap) || 24;
            return index * (cardWidth + gap);
        }

        // Instantly reposition without animation (used for loop snap-back)
        function snapTo(index) {
            track.style.transition = 'none';
            track.style.transform = `translateX(-${getOffset(index)}px)`;
            void track.offsetHeight; // force reflow so the browser applies the no-transition state
            track.style.transition = 'transform 0.4s ease';
            currentAugIndex = index;
        }

        function animateTo(index) {
            track.style.transform = `translateX(-${getOffset(index)}px)`;
            currentAugIndex = index;
            updateDots();
        }

        function getRealIndex() {
            return ((currentAugIndex - CLONES) % cards.length + cards.length) % cards.length;
        }

        function buildDots() {
            dotsContainer.innerHTML = '';
            cards.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.className = 'tallers-preview-dot' + (i === 0 ? ' active' : '');
                dot.setAttribute('aria-label', `Taller ${i + 1}`);
                dot.addEventListener('click', () => {
                    if (isAnimating) return;
                    isAnimating = true;
                    animateTo(CLONES + i);
                });
                dotsContainer.appendChild(dot);
            });
        }

        function updateDots() {
            dotsContainer.querySelectorAll('.tallers-preview-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === getRealIndex());
            });
        }

        // After each animation, check if we landed in the clone zone and snap back
        track.addEventListener('transitionend', () => {
            const maxRealAugIndex = CLONES + cards.length - getVisibleCount();
            if (currentAugIndex > maxRealAugIndex) {
                snapTo(currentAugIndex - cards.length);
            } else if (currentAugIndex < CLONES) {
                snapTo(currentAugIndex + cards.length);
            }
            isAnimating = false;
        });

        prevBtn.disabled = false;
        prevBtn.addEventListener('click', () => {
            if (isAnimating) return;
            isAnimating = true;
            animateTo(currentAugIndex - 1);
        });
        nextBtn.addEventListener('click', () => {
            if (isAnimating) return;
            isAnimating = true;
            animateTo(currentAugIndex + 1);
        });

        let previewResizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(previewResizeTimer);
            previewResizeTimer = setTimeout(() => snapTo(currentAugIndex), 150);
        });

        buildDots();
        // Defer initial snap to ensure flex layout has been calculated
        requestAnimationFrame(() => snapTo(CLONES));
    }

    // Focus the name input when clicking any contact CTA button
    document.querySelectorAll('.cta-btn, .nav-button-secondary, .taller-cta-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const nameInput = document.getElementById('name');
            if (nameInput) setTimeout(() => nameInput.focus(), 400);
        });
    });
});
