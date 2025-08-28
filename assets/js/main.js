// (Col·laboradors logo hover effect removed as per user request)
/**
 * Main JavaScript file for the website.
 * Handles the language switching functionality.
 */

// This event listener waits for the HTML document to be fully loaded and parsed
// before running the script, preventing errors from trying to access elements that don't exist yet.
document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---

    // An array of supported language codes. This makes the script easily scalable if we add English later.
    const supportedLangs = ['ca', 'es'];
    // The default language to use if a user's browser language is not supported or cannot be detected.
    const defaultLang = 'ca';

    // Get references to the language switcher buttons from the HTML file.
    const langCaButton = document.getElementById('lang-ca-btn');
    const langEsButton = document.getElementById('lang-es-btn');


    // --- CATALOGUE DOWNLOAD BUTTON LOGIC ---
    // This assumes you will have:
    // assets/fitxers/catalogue-ca.pdf (Catalan)
    // assets/fitxers/catalogue-es.pdf (Spanish)
    // and want to set the download name accordingly
    const catalogueBtn = document.getElementById('catalogue-download-btn');
    function updateCatalogueBtn(lang) {
        if (!catalogueBtn) return;
        if (lang === 'es') {
            catalogueBtn.href = 'assets/fitxers/dossier-es.pdf';
            catalogueBtn.setAttribute('download', 'Dossier-Talleres-2025.pdf');
        } else {
            catalogueBtn.href = 'assets/fitxers/dossier-ca.pdf';
            catalogueBtn.setAttribute('download', 'Dossier-Tallers-2025.pdf');
        }
    }

    /**
 * Updates all text on the page to the selected language.
 * @param {string} lang - The language code to switch to (e.g., 'ca').
 */
const setLanguage = (lang) => {
    // First, check if the chosen language is actually supported.
    if (!supportedLangs.includes(lang)) {
        console.error(`Language "${lang}" is not supported.`);
        return;
    }

    // Set the 'lang' attribute on the <html> tag for accessibility and SEO.
    document.documentElement.lang = lang;

    // Save the user's choice in their browser's localStorage for their next visit.
    localStorage.setItem('userLanguage', lang);

    // Find all elements that have our special 'data-lang-ca' attribute (for text content).
    const elementsToTranslate = document.querySelectorAll('[data-lang-ca]');
    elementsToTranslate.forEach(element => {
        const translation = element.getAttribute(`data-lang-${lang}`);
        if (translation) {
            // Use innerHTML instead of textContent to allow for icons inside elements.
            element.innerHTML = translation;
        }
    });
    // Find all elements that need their placeholder translated.
    const placeholdersToTranslate = document.querySelectorAll('[data-lang-ca-placeholder]');
    placeholdersToTranslate.forEach(element => {
        const placeholderText = element.getAttribute(`data-lang-${lang}-placeholder`);
        if (placeholderText) {
            // Set the placeholder attribute to the correct language.
            element.setAttribute('placeholder', placeholderText);
        }
    });

    // Update the catalogue download button for the selected language
    updateCatalogueBtn(lang);


    // Update the visual style of the buttons to show which language is active.
    updateButtonStyles(lang);
    };

    /**
     * Determines the user's preferred language.
     * Priority: 1. Saved preference, 2. Browser setting, 3. Default.
     * @returns {string} The determined language code.
     */
    const getInitialLanguage = () => {
        // 1. Check for a previously saved language in local storage.
        const savedLang = localStorage.getItem('userLanguage');
        if (savedLang && supportedLangs.includes(savedLang)) {
            return savedLang;
        }

        // 2. Check the browser's language setting. `navigator.language` can be 'es-ES', so we split and take the 'es'.
        const browserLang = navigator.language.split('-')[0];
        if (supportedLangs.includes(browserLang)) {
            return browserLang;
        }

        // 3. If neither of the above are found, use the default language.
        return defaultLang;
    };

    /**
     * Visually distinguishes the active language button.
     * @param {string} activeLang - The currently active language code.
     */
    const updateButtonStyles = (activeLang) => {
        // Add the 'active' class to the current language's button and remove it from the other.
        if (activeLang === 'ca') {
            langCaButton.classList.add('active');
            langEsButton.classList.remove('active');
        } else if (activeLang === 'es') {
            langEsButton.classList.add('active');
            langCaButton.classList.remove('active');
        }
    };

    // --- INITIALIZATION ---

    // Add click event listeners to the buttons. When clicked, they will call setLanguage.
    langCaButton.addEventListener('click', () => setLanguage('ca'));
    langEsButton.addEventListener('click', () => setLanguage('es'));

    // Determine and set the initial language when the page first loads.
    const initialLang = getInitialLanguage();
    setLanguage(initialLang);
});

/**
 * Logic for the custom multi-select dropdown component.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Find the main container of our multi-select component.
    const multiselect = document.getElementById('workshops-multiselect');
    // If the component doesn't exist on the page, stop the script.
    if (!multiselect) return;

    // Get references to the key parts of the component.
    const display = multiselect.querySelector('.multiselect-display');
    const placeholder = multiselect.querySelector('.multiselect-placeholder');
    const optionsContainer = multiselect.querySelector('.multiselect-options');
    const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]');
    const hiddenInput = document.getElementById('selected-workshops-input');
    
    // Get the default placeholder text for both languages.
    const defaultTextCA = placeholder.getAttribute('data-lang-ca');
    const defaultTextES = placeholder.getAttribute('data-lang-es');

    // --- Event Listeners ---

    // Toggle the dropdown when the display area is clicked.
    display.addEventListener('click', () => {
        multiselect.classList.toggle('active');
        display.classList.toggle('active');
    });

    // Close the dropdown if the user clicks anywhere else on the page.
    document.addEventListener('click', (e) => {
        // Check if the click was outside the main multiselect container.
        if (!multiselect.contains(e.target)) {
            multiselect.classList.remove('active');
            display.classList.remove('active');
        }
    });

    // Update everything when any checkbox is changed.
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateMultiselectState);
    });
    
    // --- Core Functions ---

    /**
     * This function runs every time a checkbox is checked or unchecked.
     */
    function updateMultiselectState() {
        // Get a list of all currently checked checkboxes.
        const selectedCheckboxes = Array.from(checkboxes).filter(cb => cb.checked);
        // Get the values of the selected checkboxes (e.g., "Nanosatèl·lits", "Explorem espai").
        const selectedValues = selectedCheckboxes.map(cb => cb.value);
        
        // Update the hidden input field with a comma-separated string for Formspree.
        hiddenInput.value = selectedValues.join(', ');

        // Update the visible text in the display area.
        if (selectedCheckboxes.length === 0) {
            // If nothing is selected, show the default placeholder text.
            const currentLang = document.documentElement.lang;
            placeholder.textContent = currentLang === 'es' ? defaultTextES : defaultTextCA;
            placeholder.style.opacity = '0.7'; // Make it look like a placeholder
        } else if (selectedCheckboxes.length === 1) {
            // If one item is selected, show its full text.
            // We find the 'span' next to the checkbox to get its text content.
            placeholder.textContent = selectedCheckboxes[0].nextElementSibling.textContent;
            placeholder.style.opacity = '1'; // Make it look like selected text
        } else {
            // If multiple items are selected, show a summary.
            const currentLang = document.documentElement.lang;
            if (currentLang === 'es') {
                placeholder.textContent = `${selectedCheckboxes.length} talleres seleccionados`;
            } else {
                placeholder.textContent = `${selectedCheckboxes.length} tallers seleccionats`;
            }
            placeholder.style.opacity = '1';
        }
    }
    // --- NAVIGATION LOGIC ---

    // Get references to the navigation bar and the hamburger menu button.
    const nav = document.querySelector('.site-nav');
    const hamburger = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');

    // --- 1. Scroll Effect ---
    // This function handles adding/removing the 'scrolled' class to the nav.
    const handleScroll = () => {
        // Check if the user has scrolled more than 50 pixels down the page.
        if (window.scrollY > 50) {
            // If so, add the 'scrolled' class.
            nav.classList.add('scrolled');
        } else {
            // Otherwise, remove it.
            nav.classList.remove('scrolled');
        }
    };

    // Add an event listener to the window to detect when the user scrolls.
    window.addEventListener('scroll', handleScroll);


    // --- 2. Mobile Hamburger Menu ---
    // Add an event listener to the hamburger button for click events.
    hamburger.addEventListener('click', () => {
        // Toggle the 'is-active' class on both the hamburger and the menu itself.
        hamburger.classList.toggle('is-active');
        navMenu.classList.toggle('is-active');

        // Update the aria-expanded attribute for accessibility.
        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', !isExpanded);
    });

    // --- SCROLL TO TOP BUTTON LOGIC ---

    // Get a reference to the button from the HTML.
    const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
    
    // Check if the button actually exists on the page before adding listeners.
    if (scrollToTopBtn) {
        
        // This function adds/removes the 'is-visible' class based on scroll position.
        const toggleVisibility = () => {
            // We'll show the button after the user scrolls down 400 pixels.
            if (window.scrollY > 400) {
                scrollToTopBtn.classList.add('is-visible');
            } else {
                scrollToTopBtn.classList.remove('is-visible');
            }
        };

        // This function scrolls the page smoothly to the top when the button is clicked.
        const scrollToTop = () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth' // This is what makes the scrolling smooth!
            });
        };

        // Add the event listeners.
        window.addEventListener('scroll', toggleVisibility);
        scrollToTopBtn.addEventListener('click', scrollToTop);
    }
    // Seleccionem tots els elements que són capçaleres de l'acordió.
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    // Recorrem cada capçalera per afegir-li un esdeveniment de clic.
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            // Trobem l'element pare de la capçalera (l'ítem sencer de l'acordió).
            const accordionItem = header.parentElement;
            
            // Comprovem si l'ítem clicat ja estava obert.
            const isActive = accordionItem.classList.contains('is-active');

            // --- Opcional: Tancar tots els altres ítems ---
            // Si vols que només es pugui obrir un ítem a la vegada, descomenta aquest bloc.
            // document.querySelectorAll('.accordion-item').forEach(item => {
            //     item.classList.remove('is-active');
            //     item.querySelector('.accordion-content').style.maxHeight = '0px';
            // });
            // ---------------------------------------------

            // Si l'ítem NO estava actiu, l'obrim. Si sí que ho estava, el tanquem.
            if (!isActive) {
                accordionItem.classList.add('is-active');
                const content = accordionItem.querySelector('.accordion-content');
                // Calculem l'alçada real del contingut i l'apliquem com a max-height per a l'animació.
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                accordionItem.classList.remove('is-active');
                accordionItem.querySelector('.accordion-content').style.maxHeight = '0px';
            }
        });
    });
    
    // --- LÒGICA PER A LES TARGETES DESPLEGABLES I CARRUSELS DE TALLERS ---
    const setupCarousel = (carousel) => {
        // Si ja està inicialitzat, no fem res.
        if (carousel.dataset.initialized === 'true') return;

        const track = carousel.querySelector('.carousel-track');
        const slides = Array.from(track.children);
        const nextButton = carousel.querySelector('.carousel-button--right');
        const prevButton = carousel.querySelector('.carousel-button--left');

        // Si només hi ha una imatge, amaguem els botons.
        if (slides.length <= 1) {
            if(nextButton) nextButton.style.display = 'none';
            if(prevButton) prevButton.style.display = 'none';
            return;
        }

        let currentIndex = 0;
        let isAnimating = false;

        // Funció per actualitzar la posició del carrusel.
        const updateCarousel = () => {
            const slideWidth = slides[0].getBoundingClientRect().width;
            track.style.transition = 'transform 0.4s ease-in-out';
            track.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
            prevButton.classList.toggle('is-hidden', currentIndex === 0);
            nextButton.classList.toggle('is-hidden', currentIndex === slides.length - 1);
        };

        // Listen for transition end to unlock animation
        track.addEventListener('transitionend', () => {
            isAnimating = false;
        });

        // Esdeveniments dels botons.
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

        // Guardem la funció d'actualització per poder-la cridar des de fora (en canviar la mida).
        carousel.updateDimensions = updateCarousel;
        carousel.dataset.initialized = 'true';
        updateCarousel(); // Crida inicial per posicionar-lo correctament.
    };

    // Lògica principal per obrir/tancar les targetes.
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
                    // Esperem un instant perquè l'animació d'obertura acabi abans d'activar el carrusel.
                    setTimeout(() => setupCarousel(carousel), 50); 
                }
            } else {
                hiddenContent.style.maxHeight = null;
            }
        });
    });

    // --- ESCOLTADOR PER AL CANVI DE MIDA (RESIZE) ---
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Recalculem l'alçada de totes les targetes obertes.
            document.querySelectorAll('.taller-card.is-open').forEach(card => {
                const hiddenContent = card.querySelector('.taller-card-hidden');
                if (hiddenContent) {
                    // Primer resetegem l'alçada per obtenir el nou 'scrollHeight' correcte.
                    hiddenContent.style.maxHeight = 'none';
                    // Després, en el següent fotograma, apliquem la nova alçada.
                    requestAnimationFrame(() => {
                        hiddenContent.style.maxHeight = hiddenContent.scrollHeight + 'px';
                        // Actualitzem les dimensions del carrusel si existeix.
                        const carousel = card.querySelector('.taller-carousel');
                        if (carousel && carousel.dataset.initialized === 'true') {
                            carousel.updateDimensions();
                        }
                    });
                }
            });
        }, 250);
    });
    
    // --- LÒGICA PER AL CARRUSEL DE TESTIMONIS AMB BUCLE INFINIT ---
    const testimonialCarousel = document.querySelector('.testimonial-carousel');
    if (testimonialCarousel) {
        const track = testimonialCarousel.querySelector('.testimonial-track');
        const prevButton = testimonialCarousel.querySelector('.carousel-nav-btn.prev');
        const nextButton = testimonialCarousel.querySelector('.carousel-nav-btn.next');
        const slides = Array.from(track.children);
        let currentIndex = 0;
        let autoplayInterval;
        let isTransitioning = false;

        // Clonem els slides per a l'efecte de bucle
        const clones = slides.map(slide => slide.cloneNode(true));
        clones.forEach(clone => track.appendChild(clone));

        const allSlides = Array.from(track.children);

        const updateCarousel = (withTransition = true) => {
            const cardWidth = slides[0].offsetWidth + 20; // Amplada + marges
            if (!withTransition) {
                track.style.transition = 'none';
            }
            track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
            if (!withTransition) {
                // Forcem el navegador a aplicar el canvi abans de reactivar la transició
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

        nextButton.addEventListener('click', moveToNext);
        prevButton.addEventListener('click', moveToPrev);
        testimonialCarousel.addEventListener('mouseenter', stopAutoplay);
        testimonialCarousel.addEventListener('mouseleave', startAutoplay);
        
        window.addEventListener('resize', () => updateCarousel(false));

        startAutoplay();
    }
});
