document.addEventListener('DOMContentLoaded', () => {
    // Page fade-in (optional polish)
    document.body.classList.add("preload");
    requestAnimationFrame(() => {
        document.body.classList.remove("preload");
        document.body.classList.add("loaded");
    });

    // AOS
    if (window.AOS) {
        AOS.init({ once: true, offset: 100, duration: 800 });
    }



    // Theme toggle
    const themeBtns = document.querySelectorAll('.theme-btn');
    const body = document.body;

    function updateIcons(isLight) {
        themeBtns.forEach((btn) => {
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

    // Mobile hamburger -> mobile nav (IMPORTANT: don’t return early)
    const toggleBtn = document.querySelector('.mobile-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    const icon = toggleBtn ? toggleBtn.querySelector('i') : null;

    if (toggleBtn && mobileNav) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isOpen = mobileNav.classList.toggle('open');
            mobileNav.style.display = isOpen ? 'block' : 'none';

            if (icon) {
                icon.classList.toggle('fa-bars', !isOpen);
                icon.classList.toggle('fa-times', isOpen);
            }
        });

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
    }

    // Mobile scroll arrows (profiles + testimonials)
    document.querySelectorAll("#testimonials .scroll-controls").forEach((controls) => {
        const container = controls.parentElement.querySelector(".scroll-row");
        if (!container) return;

        controls.querySelectorAll(".scroll-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const isLeft = btn.classList.contains("left");
                const scrollAmount = Math.min(container.clientWidth * 0.85, 420);
                container.scrollBy({ left: isLeft ? -scrollAmount : scrollAmount, behavior: "smooth" });
            });
        });
    });

});


// Cinematic loader only once per session (premium timing)
window.addEventListener("load", () => {
    const loader = document.getElementById("cinematic-loader");
    if (!loader) return;

    const content = loader.querySelector(".loader-content");

    if (sessionStorage.getItem("introShown") === "true") {
        loader.style.display = "none";
        if (window.AOS) AOS.refresh();
        return;
    }

    const MIN_SHOW_MS = 900;
    const CURTAIN_MS = 1050;
    const start = performance.now();

    const runExit = () => {
        if (content) content.classList.add("content-fade-out");
        setTimeout(() => loader.classList.add("curtains-open"), 180);

        setTimeout(() => {
            loader.style.display = "none";
            sessionStorage.setItem("introShown", "true");
            if (window.AOS) AOS.refresh();
        }, CURTAIN_MS + 250);
    };

    const elapsed = performance.now() - start;
    const delay = Math.max(0, MIN_SHOW_MS - elapsed);
    setTimeout(runExit, delay);
});
