// Firebase (Firestore)
const firebaseConfig = {
    apiKey: "AIzaSyC2cgkuHPXlDxRhTWi2r3Rxek96lW5fX7c",
    authDomain: "foryourinnings-4ae19.firebaseapp.com",
    projectId: "foryourinnings-4ae19",
    storageBucket: "foryourinnings-4ae19.firebasestorage.app",
    messagingSenderId: "291529184288",
    appId: "1:291529184288:web:9d8dc7ee78ae3389571845",
    measurementId: "G-BE4EBQ49FE",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", () => {
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
    const themeBtns = document.querySelectorAll(".theme-btn");
    const body = document.body;

    function updateIcons(isLight) {
        themeBtns.forEach((btn) => {
            btn.title = isLight ? "Switch to Dark Mode" : "Switch to Light Mode";
        });
    }

    const savedTheme = localStorage.getItem("fyi-theme");
    if (savedTheme === "light") body.classList.add("light-mode");
    updateIcons(body.classList.contains("light-mode"));

    themeBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            body.classList.toggle("light-mode");
            const isLight = body.classList.contains("light-mode");
            localStorage.setItem("fyi-theme", isLight ? "light" : "dark");
            updateIcons(isLight);
        });
    });

    // Mobile hamburger -> mobile nav (IMPORTANT: don’t return early)
    const toggleBtn = document.querySelector(".mobile-toggle");
    const mobileNav = document.querySelector(".mobile-nav");
    const icon = toggleBtn ? toggleBtn.querySelector("i") : null;

    if (toggleBtn && mobileNav) {
        toggleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const isOpen = mobileNav.classList.toggle("open");
            mobileNav.style.display = isOpen ? "block" : "none";

            if (icon) {
                icon.classList.toggle("fa-bars", !isOpen);
                icon.classList.toggle("fa-times", isOpen);
            }
        });

        mobileNav.querySelectorAll("a").forEach((a) => {
            a.addEventListener("click", () => {
                mobileNav.classList.remove("open");
                mobileNav.style.display = "none";
                if (icon) {
                    icon.classList.add("fa-bars");
                    icon.classList.remove("fa-times");
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
                container.scrollBy({
                    left: isLeft ? -scrollAmount : scrollAmount,
                    behavior: "smooth",
                });
            });
        });
    });

    // Header CTA: scroll to footer + open inquiry modal (Bootstrap 3)
    const INQUIRY_MODAL_SELECTOR = "#contactModal"; // <-- change if your modal id is different

    document.querySelectorAll(".send-message-link").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();

            // Close mobile nav if it's open (optional nicety)
            const mobileNav = document.querySelector(".mobile-nav");
            if (mobileNav && mobileNav.classList.contains("open")) {
                mobileNav.classList.remove("open");
                mobileNav.style.display = "none";
            }

            // Smooth scroll to footer
            const contact = document.getElementById("contact");
            if (contact) contact.scrollIntoView({ behavior: "smooth", block: "start" });

            // Open modal after a short delay so the scroll starts first
            setTimeout(() => {
                if (window.jQuery && window.jQuery(INQUIRY_MODAL_SELECTOR).length) {
                    window.jQuery(INQUIRY_MODAL_SELECTOR).modal("show");
                }
            }, 450);
        });
    });

    // ---------------------------
    // Contact modal + Firestore
    // ---------------------------
    const contactRecipient = document.getElementById("contactRecipient");
    const contactForm = document.getElementById("contactForm");
    const contactStatus = document.getElementById("contactStatus");
    const contactSubmitBtn = document.getElementById("contactSubmitBtn");

    const setStatus = (msg, type) => {
        if (!contactStatus) return;
        contactStatus.textContent = msg || "";
        contactStatus.className = "contact-status" + (type ? ` ${type}` : "");
    };

    const resetSubmitBtn = () => {
        if (!contactSubmitBtn) return;
        contactSubmitBtn.disabled = false;
        contactSubmitBtn.classList.remove("is-sending", "is-success");
        // If your button uses inner spans, keep the label as-is; no text rewrite needed
    };

    document.querySelectorAll(".contact-open-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const recipient = btn.getAttribute("data-recipient") || "FYI Team";
            if (contactRecipient) contactRecipient.value = recipient;
            setStatus("", "");
            resetSubmitBtn();
        });
    });

    // Reset state whenever modal closes (so next open is clean)
    if (window.jQuery) {
        window.jQuery("#contactModal").on("hidden.bs.modal", function () {
            setStatus("", "");
            resetSubmitBtn();
            if (contactForm) contactForm.reset();
        });
    }

    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Honeypot: if filled, silently ignore (likely bot)
            const hp = document.getElementById("company");
            if (hp && hp.value.trim() !== "") return;

            const name = document.getElementById("contactName")?.value.trim();
            const contact = document.getElementById("contactEmail")?.value.trim();
            const message = document.getElementById("contactMessage")?.value.trim();

            // Validate BEFORE write
            if (!name || !contact || !message) {
                setStatus("Please fill all fields.", "is-error");
                return;
            }

            try {
                if (contactSubmitBtn) {
                    contactSubmitBtn.disabled = true;
                    contactSubmitBtn.classList.remove("is-success");
                    contactSubmitBtn.classList.add("is-sending");
                }
                setStatus("Sending...", "");

                await db.collection("inquiries").add({
                    name,
                    contact,
                    message,
                    recipient: contactRecipient?.value || "FYI Team",
                    pageUrl: window.location.href,
                    userAgent: navigator.userAgent,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });

                // Send email via Cloudflare Worker (token stays server-side)
                const FYI_WORKER_ENDPOINT = "https://fyiinnings.arjunsridhar445.workers.dev/api/contact";

                try {
                    const payload = {
                        name,
                        email: contact,
                        message,
                        recipient: contactRecipient?.value || "FYI Team",
                        pageUrl: window.location.href,
                    };

                    const res = await fetch(FYI_WORKER_ENDPOINT, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });

                    // Optional: if you want to treat email failure as non-fatal, keep this as a soft error
                    if (!res.ok) {
                        throw new Error(await res.text());
                    }

                } catch (err) {
                    setStatus(`Failed to send: ${err.message}`, "is-error");
                    resetSubmitBtn();
                }

                setStatus("Sent successfully.", "is-success");

                // Trigger tick state (CSS anim) and close modal
                if (contactSubmitBtn) {
                    contactSubmitBtn.classList.remove("is-sending");
                    contactSubmitBtn.classList.add("is-success");
                }

                setTimeout(() => {
                    if (window.jQuery) window.jQuery("#contactModal").modal("hide");
                }, 900);
            } catch (err) {
                setStatus("Failed to send. Please try again or use WhatsApp.", "is-error");
                if (contactSubmitBtn) {
                    contactSubmitBtn.disabled = false;
                    contactSubmitBtn.classList.remove("is-sending");
                }
            }
        });
    }
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
