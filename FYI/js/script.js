document.addEventListener('DOMContentLoaded', () => {
    // AOS
    if (window.AOS) {
        AOS.init({ once: true, offset: 100, duration: 800 });
    }

    // Theme toggle
    const themeBtns = document.querySelectorAll('.theme-btn');
    const body = document.body;
    const iconSun = 'fa-sun-o';
    const iconMoon = 'fa-moon-o';

    function updateIcons(isLight) {
        themeBtns.forEach((btn) => {
            const icon = btn.querySelector('i');
            if (!icon) return;

            icon.classList.toggle(iconMoon, isLight);
            icon.classList.toggle(iconSun, !isLight);
            btn.title = isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode';
        });
    }

    const savedTheme = localStorage.getItem('fyi-theme');
    if (savedTheme === 'light') body.classList.add('light-mode');
    updateIcons(body.classList.contains('light-mode'));

    themeBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            body.classList.toggle('light-mode');
            const isLight = body.classList.contains('light-mode');
            localStorage.setItem('fyi-theme', isLight ? 'light' : 'dark');
            updateIcons(isLight);
        });
    });

    // Mobile hamburger -> mobile nav
    const toggleBtn = document.querySelector('.mobile-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    const icon = toggleBtn ? toggleBtn.querySelector('i') : null;

    console.log('[FYI] DOMContentLoaded fired');
    console.log('[FYI] toggleBtn:', toggleBtn);
    console.log('[FYI] mobileNav:', mobileNav);

    if (!toggleBtn || !mobileNav) return;

    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();

        const isOpen = mobileNav.classList.toggle('open');

        // Optional: if you accidentally leave inline display none in HTML, this still forces visibility.
        mobileNav.style.display = isOpen ? 'block' : 'none';

        if (icon) {
            icon.classList.toggle('fa-bars', !isOpen);
            icon.classList.toggle('fa-times', isOpen);
        }

        console.log('[FYI] hamburger click -> open:', isOpen);
        console.log('[FYI] mobileNav class:', mobileNav.className);
        console.log('[FYI] mobileNav computed display:', getComputedStyle(mobileNav).display);
    });

    // Close menu when a link is clicked
    mobileNav.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => {
            mobileNav.classList.remove('open');
            mobileNav.style.display = 'none';

            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        });
    });
});

// Cinematic loader (only once per session)
window.addEventListener('load', () => {
    const loader = document.getElementById('cinematic-loader');
    if (!loader) return;

    const content = loader.querySelector('.loader-content');

    if (sessionStorage.getItem('introShown') === 'true') {
        loader.style.display = 'none';
        if (window.AOS) AOS.refresh();
        return;
    }

    setTimeout(() => {
        if (content) content.classList.add('content-fade-out');

        setTimeout(() => {
            loader.classList.add('curtains-open');
            sessionStorage.setItem('introShown', 'true');

            // Fully hide after the curtain transition ends (prevents any layout/paint weirdness)
            setTimeout(() => {
                loader.style.display = 'none';
                if (window.AOS) AOS.refresh();
            }, 900);
        }, 500);
    }, 2500);
});
