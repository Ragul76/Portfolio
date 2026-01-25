// script.js - MODIFIED VERSION

document.addEventListener("DOMContentLoaded", () => {

    // 1. AOS Initialization
    AOS.init({
        duration: 800,
        once: true,
        offset: 50,
    });

    // 2. Sticky Navbar & Active Link Highlighting
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    window.addEventListener('scroll', () => {
        // Sticky logic
        if (window.scrollY > 100) {
            navbar.classList.add('sticky');
        } else {
            navbar.classList.remove('sticky');
        }

        // Active link logic
        let currentSection = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            if (window.scrollY >= sectionTop) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === currentSection) {
                link.classList.add('active');
            }
        });
    });

    // 3. Mobile Hamburger Menu
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-nav-menu');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });

    // Close mobile menu when a link is clicked
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
        });
    });

    // 4. Home Section Text Slider
    const textSlider = document.querySelector('.text-slider');
    const roles = [
        "Aspiring Software Developer",
        "DSA Enthusiast",
        "Web Developer",
        "AI & ML Learner"
    ];
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
        const currentRole = roles[roleIndex];
        const currentText = currentRole.substring(0, charIndex);

        if (textSlider) {
            textSlider.textContent = currentText;
        }

        if (!isDeleting) {
            charIndex++;
            if (charIndex > currentRole.length) {
                isDeleting = true;
                setTimeout(type, 2000);
            } else {
                setTimeout(type, 100);
            }
        } else {
            charIndex--;
            if (charIndex === 0) {
                isDeleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                setTimeout(type, 500);
            } else {
                setTimeout(type, 50);
            }
        }
    }
    if (textSlider) {
        type();
    }

    // 5. Back to Top Button
    const backToTopButton = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            if (backToTopButton) backToTopButton.style.display = 'flex';
        } else {
            if (backToTopButton) backToTopButton.style.display = 'none';
        }
    });

    // 7. Modal Functionality
    const modalTriggers = document.querySelectorAll('.modal-trigger');
    const closeButtons = document.querySelectorAll('.close-button');
    const modals = document.querySelectorAll('.modal');

    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const modalId = trigger.dataset.modal;
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'flex';
            }
        });
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // 8. LeetCode Stats Fetcher & Calendar
    // 8. LeetCode Stats Fetcher
    async function fetchLeetCodeData() {
        const username = 'Ragul76';
        const totalEl = document.getElementById('leetcode-total');
        const easyEl = document.getElementById('leetcode-easy');
        const mediumEl = document.getElementById('leetcode-medium');
        const hardEl = document.getElementById('leetcode-hard');
        const activityList = document.querySelector('.activity-list');
        const fallbackMessage = document.querySelector('.leetcode-fallback-message');
        const lastUpdatedEl = document.getElementById('leetcode-last-updated');

        // Helper to update UI with data
        const updateUI = (data, sourceName) => {
            if (totalEl) totalEl.textContent = data.totalSolved || '0';
            if (easyEl) easyEl.textContent = data.easySolved || '0';
            if (mediumEl) mediumEl.textContent = data.mediumSolved || '0';
            if (hardEl) hardEl.textContent = data.hardSolved || '0';

            updateProgressBars(
                data.easySolved, data.totalEasy,
                data.mediumSolved, data.totalMedium,
                data.hardSolved, data.totalHard,
                data.totalSolved, data.totalQuestions
            );

            if (fallbackMessage) fallbackMessage.textContent = `* Real-time data loaded successfully.`;
            if (lastUpdatedEl) lastUpdatedEl.textContent = `Last updated: ${new Date().toLocaleString()}`;
        }

        try {
            // 1. Try Primary API (Heroku)
            try {
                const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}?cacheBust=${Date.now()}`);
                if (!response.ok) throw new Error('Primary API failed');
                const data = await response.json();
                if (data && data.status === 'success') {
                    updateUI(data, 'Primary');
                    return; // Success! Exit function.
                } else {
                    throw new Error('Primary API returned invalid status');
                }
            } catch (primaryError) {
                console.warn('Primary LeetCode API failed, trying backup...', primaryError);
            }

            // 2. Try Backup API (Alfa)
            try {
                const response = await fetch(`https://alfa-leetcode-api.onrender.com/userProfile/${username}`);
                if (!response.ok) throw new Error('Backup API failed');
                const data = await response.json();

                // Alfa API structure is slightly different, check for totalSolved
                if (data && data.totalSolved !== undefined) {
                    updateUI(data, 'Backup');
                    return; // Success! Exit function.
                } else {
                    throw new Error('Backup API returned invalid data');
                }
            } catch (backupError) {
                console.warn('Backup LeetCode API failed, trying GraphQL/Manual fallback...', backupError);
                throw new Error('All external APIs failed'); // Throw to trigger the outer catch block
            }

        } catch (error) {
            console.error('All LeetCode fetching attempts failed:', error);
            await fetchUsingGraphQL(username, totalEl, easyEl, mediumEl, hardEl, activityList, fallbackMessage, lastUpdatedEl);
        }
    }

    async function fetchUsingGraphQL(username, totalEl, easyEl, mediumEl, hardEl, activityList, fallbackMessage, lastUpdatedEl) {
        try {
            const query = `
                query getUserProfile($username: String!) {
                    matchedUser(username: $username) {
                        username
                        profile {
                            userAvatar
                        }
                        submitStatsGlobal {
                            acSubmissionNum {
                                difficulty
                                count
                            }
                        }
                    }
                }
            `;

            const response = await fetch('https://leetcode.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({
                    query: query,
                    variables: { username: username }
                }),
            });

            const data = await response.json();

            if (data.data && data.data.matchedUser) {
                const stats = data.data.matchedUser.submitStatsGlobal.acSubmissionNum;

                let solved = { All: 0, Easy: 0, Medium: 0, Hard: 0 };
                stats.forEach(stat => {
                    solved[stat.difficulty] = stat.count;
                });

                if (totalEl) totalEl.textContent = solved.All;
                if (easyEl) easyEl.textContent = solved.Easy;
                if (mediumEl) mediumEl.textContent = solved.Medium;
                if (hardEl) hardEl.textContent = solved.Hard;

                const fallbackTotals = { easy: 912, medium: 1948, hard: 883 };
                const totalAll = fallbackTotals.easy + fallbackTotals.medium + fallbackTotals.hard;

                updateProgressBars(
                    solved.Easy, fallbackTotals.easy,
                    solved.Medium, fallbackTotals.medium,
                    solved.Hard, fallbackTotals.hard,
                    solved.All, totalAll
                );

                if (fallbackMessage) fallbackMessage.textContent = "* Real-time data loaded (using fallback totals).";
                if (lastUpdatedEl) lastUpdatedEl.textContent = `Last updated: ${new Date().toLocaleString()}`;

            }
        } catch (error) {
            console.error('GraphQL fetch failed:', error);
            showFallbackData(totalEl, easyEl, mediumEl, hardEl, activityList, fallbackMessage, lastUpdatedEl);
        }
    }

    function updateProgressBars(easySolved, totalEasy, mediumSolved, totalMedium, hardSolved, totalHard, totalSolved, totalAll) {
        totalEasy = totalEasy || 1;
        totalMedium = totalMedium || 1;
        totalHard = totalHard || 1;
        totalAll = totalAll || 1;

        document.getElementById('easy-stats').textContent = `${easySolved} / ${totalEasy}`;
        document.getElementById('easy-bar').style.width = `${(easySolved / totalEasy) * 100}%`;

        document.getElementById('medium-stats').textContent = `${mediumSolved} / ${totalMedium}`;
        document.getElementById('medium-bar').style.width = `${(mediumSolved / totalMedium) * 100}%`;

        document.getElementById('hard-stats').textContent = `${hardSolved} / ${totalHard}`;
        document.getElementById('hard-bar').style.width = `${(hardSolved / totalHard) * 100}%`;

        document.getElementById('total-stats').textContent = `${totalSolved} / ${totalAll}`;
        document.getElementById('total-bar').style.width = `${(totalSolved / totalAll) * 100}%`;
    }

    async function fetchRecentSubmissions(username, activityList, fallbackMessage) {
        // This function is intentionally blank
    }

    function showFallbackData(totalEl, easyEl, mediumEl, hardEl, activityList, fallbackMessage, lastUpdatedEl) {
        if (totalEl) totalEl.textContent = '122'; // Update to your current total
        if (easyEl) easyEl.textContent = '54';   // Update to your current easy count
        if (mediumEl) mediumEl.textContent = '62'; // Update to your current medium count
        if (hardEl) hardEl.textContent = '6';   // Update to your current hard count

        const fallbackTotals = { easy: 912, medium: 1948, hard: 883 };
        const totalAll = fallbackTotals.easy + fallbackTotals.medium + fallbackTotals.hard;
        updateProgressBars(
            54, fallbackTotals.easy,
            62, fallbackTotals.medium,
            6, fallbackTotals.hard,
            122, totalAll
        );

        if (fallbackMessage) {
            fallbackMessage.textContent = '* Showing cached stats. Live data unavailable.';
            fallbackMessage.style.color = '#ff9800';
        }
        if (lastUpdatedEl) lastUpdatedEl.textContent = `Last updated: (showing cached data)`;
    }

    // Fetch LeetCode data on page load
    fetchLeetCodeData();

    // 9. Contact Form Validation (Frontend only)
    const contactForm = document.getElementById('contact-form');
    const formMessage = document.getElementById('form-message');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop the default browser submission

            // --- 1. VALIDATION ---
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();

            if (name === '' || email === '' || message === '') {
                showFormMessage('Please fill in all fields.', 'error');
                return;
            }
            if (!validateEmail(email)) {
                showFormMessage('Please enter a valid email address.', 'error');
                return;
            }

            // --- 2. PREPARE FOR SUBMISSION ---
            const button = contactForm.querySelector('button[type="submit"]');
            button.disabled = true; // Disable button to prevent double-clicks
            showFormMessage('Sending...', 'success'); // Show a sending message

            // --- 3. SEND DATA TO FORMSPREE ---
            const formData = new FormData(contactForm);

            try {
                const response = await fetch(contactForm.action, {
                    method: contactForm.method,
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                // --- 4. HANDLE RESPONSE ---
                if (response.ok) {
                    // Formspree successfully processed the form
                    showFormMessage('Message sent successfully! Thank you.', 'success');
                    contactForm.reset();
                } else {
                    // Formspree returned an error
                    const data = await response.json();
                    if (data.errors) {
                        showFormMessage(data.errors.map(err => err.message).join(', '), 'error');
                    } else {
                        showFormMessage('Oops! There was a problem submitting your form.', 'error');
                    }
                }
            } catch (error) {
                // A network error occurred
                console.error('Fetch error:', error);
                showFormMessage('A network error occurred. Please try again.', 'error');
            } finally {
                // --- 5. CLEANUP ---
                button.disabled = false; // Re-enable the button
            }
        });
    }

    function showFormMessage(message, type) {
        if (formMessage) {
            formMessage.textContent = message;
            formMessage.className = type;
        }
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    // 10. Home Particles BG
    if (document.getElementById('particles-js')) {
        particlesJS("particles-js", {
            "particles": {
                "number": { "value": 60, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": "#00ffff" }, /* MODIFIED: Set to accent-cyan */
                "shape": { "type": "circle" },
                "opacity": { "value": 0.5, "random": true },
                "size": { "value": 3, "random": true },
                "line_linked": { "enable": true, "distance": 150, "color": "#00ffff", "opacity": 0.3, "width": 1 }, /* MODIFIED: Set to accent-cyan and 0.3 opacity */
                "move": { "enable": true, "speed": 2, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
                "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 1 } }, "push": { "particles_nb": 4 } }
            },
            "retina_detect": true
        });
    }
});