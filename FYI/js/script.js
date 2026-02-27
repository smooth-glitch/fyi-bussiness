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

function track(eventName, params = {}) {
    if (typeof window.gtag === "function") window.gtag("event", eventName, params);
}

document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a");
    if (!a) return;

    const href = a.getAttribute("href") || "";
    if (href.includes("wa.me/")) {
        track("whatsapp_click", {
            link_url: href,
            link_text: (a.textContent || "").trim().slice(0, 80),
            page: window.location.pathname
        });
    }
});

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

    // Track profile expands (Bootstrap collapse)
    if (window.jQuery) {
        window.jQuery(".profile-details").on("shown.bs.collapse", function () {
            track("profile_expand", {
                profile_id: this.id,
                page: window.location.pathname
            });
        });
    }

    var rotators = document.querySelectorAll(".js-rotate-images");

    rotators.forEach(function (wrap) {
        var imgs = wrap.querySelectorAll("img");
        if (!imgs || imgs.length < 2) return;

        var dots = wrap.querySelectorAll(".img-dot"); // if present
        var interval = parseInt(wrap.getAttribute("data-interval") || "2500", 10);
        var index = 0;

        imgs.forEach((img, i) => img.classList.toggle("is-active", i === 0));
        if (dots && dots[0]) dots[0].classList.add("is-active");

        setInterval(function () {
            imgs[index].classList.remove("is-active");
            if (dots && dots[index]) dots[index].classList.remove("is-active");

            index = (index + 1) % imgs.length;

            imgs[index].classList.add("is-active");
            if (dots && dots[index]) dots[index].classList.add("is-active");
        }, interval);
    });

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
            const mNav = document.querySelector(".mobile-nav");
            if (mNav && mNav.classList.contains("open")) {
                mNav.classList.remove("open");
                mNav.style.display = "none";
                if (icon) {
                    icon.classList.add("fa-bars");
                    icon.classList.remove("fa-times");
                }
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
        console.log("contactForm found:", !!contactForm);
        contactForm.addEventListener("submit", () => console.log("CONTACT SUBMIT FIRED"));

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

                // 1) Save to Firestore (primary)
                await db.collection("inquiries").add({
                    name,
                    contact,
                    message,
                    recipient: contactRecipient?.value || "FYI Team",
                    source: "contact_modal",
                    createdAtIso: new Date().toISOString(),
                    pagePath: window.location.pathname,
                    referrer: document.referrer || "",
                    userAgent: navigator.userAgent,
                    utm: (() => {
                        const p = new URLSearchParams(location.search);
                        const utm = {};
                        ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach(k => {
                            const v = p.get(k);
                            if (v) utm[k] = v;
                        });
                        return utm;
                    })()
                });


                track("generate_lead", { method: "contact_modal" });

                // 2) Send email via Cloudflare Worker (secondary; non-fatal if fails)
                const FYI_WORKER_ENDPOINT = "https://fyiinnings.arjunsridhar445.workers.dev/api/contact";
                let emailOk = true;

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

                    if (!res.ok) {
                        emailOk = false;
                    }
                } catch {
                    emailOk = false;
                }

                if (emailOk) {
                    setStatus("Sent successfully.", "is-success");
                } else {
                    setStatus("Saved inquiry. Email send failed (we'll still contact you).", "is-error");
                }

                // Trigger tick state (CSS anim) and close modal
                if (contactSubmitBtn) {
                    contactSubmitBtn.classList.remove("is-sending");
                    contactSubmitBtn.classList.add("is-success");
                }

                setTimeout(() => {
                    if (window.jQuery) window.jQuery("#contactModal").modal("hide");
                }, 900);
            } catch (err) {
                console.error("CONTACT SUBMIT ERROR:", err);
                setStatus(`Failed: ${err?.message || err}`, "is-error");
                if (contactSubmitBtn) {
                    contactSubmitBtn.disabled = false;
                    contactSubmitBtn.classList.remove("is-sending");
                }
            }
        });
    }

    // ---------------------------------------------------------
    // Currency picker (searchable dropdown + auto + live FX INR)
    // Expects:
    //   - spans: .money[data-inr="10000"]
    //   - UI ids: currency-picker, currency-trigger, currency-popover,
    //             currency-search, currency-options, currency-selected-label,
    //             currency-auto, currency-status
    // ---------------------------------------------------------
    const CURRENCY_STORAGE_KEY = "fyi-currency";
    const FX_STORAGE_KEY = "fyi-fx-INR";

    const moneyEls = document.querySelectorAll(".money[data-inr]");

    const picker = document.getElementById("currency-picker");
    const trigger = document.getElementById("currency-trigger");
    const popover = document.getElementById("currency-popover");
    const searchInput = document.getElementById("currency-search");
    const optionsEl = document.getElementById("currency-options");
    const selectedLabelEl = document.getElementById("currency-selected-label");
    const autoBtn = document.getElementById("currency-auto");
    const statusEl = document.getElementById("currency-status");

    function getSupportedCurrencies() {
        if (typeof Intl.supportedValuesOf === "function") return Intl.supportedValuesOf("currency");
        return ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "SGD", "AED"];
    }

    const displayNames =
        typeof Intl.DisplayNames === "function"
            ? new Intl.DisplayNames([navigator.language], { type: "currency" })
            : null;

    function getCurrencyName(code) {
        try {
            return displayNames ? displayNames.of(code) : code;
        } catch {
            return code;
        }
    }

    function formatMoney(amount, currency) {
        return new Intl.NumberFormat(navigator.language, {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
        }).format(amount);
    }

    async function detectCurrencyByIP() {
        try {
            const res = await fetch("https://ipapi.co/json/");
            if (!res.ok) return null;
            const data = await res.json();
            return data && data.currency ? String(data.currency).toUpperCase() : null;
        } catch {
            return null;
        }
    }

    async function getFxRatesFromINR() {
        // cache 12h
        try {
            const cached = JSON.parse(localStorage.getItem(FX_STORAGE_KEY) || "null");
            if (cached && cached.rates && cached.savedAt && Date.now() - cached.savedAt < 12 * 60 * 60 * 1000) {
                return cached.rates;
            }
        } catch { }

        const res = await fetch("https://open.er-api.com/v6/latest/INR");
        const data = await res.json();
        if (!data || data.result !== "success" || !data.rates) throw new Error("FX fetch failed");

        localStorage.setItem(FX_STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), rates: data.rates }));
        return data.rates;
    }

    function applyCurrency(code, rates) {
        if (!moneyEls.length) return;

        const wanted = String(code || "").trim().toUpperCase();
        const effective = wanted && rates && rates[wanted] ? wanted : "INR";

        moneyEls.forEach((el) => {
            const inr = Number(el.dataset.inr || "0");
            const converted = effective === "INR" ? inr : Math.round(inr * rates[effective]);
            el.textContent = formatMoney(converted, effective);
        });

        if (statusEl) statusEl.textContent = effective === "INR" ? "(INR)" : `(~${effective})`;
        if (selectedLabelEl) selectedLabelEl.textContent = `${effective} — ${getCurrencyName(effective)}`;
    }

    function openPopover() {
        if (!popover || !trigger) return;
        popover.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        if (searchInput) {
            searchInput.value = "";
            renderOptions("");
            setTimeout(() => searchInput.focus(), 0);
        }
    }

    function closePopover() {
        if (!popover || !trigger) return;
        popover.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
    }

    function buildCurrencyList() {
        const codes = getSupportedCurrencies();
        const items = codes.map((code) => ({ code, name: getCurrencyName(code) }));
        items.sort((a, b) => (a.name || a.code).localeCompare(b.name || b.code));
        return items;
    }

    const ALL_CURRENCIES = buildCurrencyList();
    let activeIndex = -1;

    function renderOptions(query) {
        if (!optionsEl) return;

        const q = (query || "").trim().toLowerCase();
        const filtered = !q
            ? ALL_CURRENCIES
            : ALL_CURRENCIES.filter(({ code, name }) => {
                return code.toLowerCase().includes(q) || String(name).toLowerCase().includes(q);
            });

        optionsEl.innerHTML = "";
        activeIndex = filtered.length ? 0 : -1;

        // Limit DOM for perf; typing + scroll still works fine
        filtered.slice(0, 250).forEach((item, idx) => {
            const li = document.createElement("li");
            li.dataset.code = item.code;
            if (idx === activeIndex) li.classList.add("is-active");

            li.innerHTML = `
          <span class="currency-code">${item.code}</span>
          <span class="currency-name">${item.name}</span>
        `;

            li.addEventListener("click", () => selectCurrency(item.code, "manual"));
            optionsEl.appendChild(li);
        });
    }

    async function selectCurrency(code, mode) {
        const picked = String(code || "").trim().toUpperCase();
        if (!picked) return;

        if (mode === "manual") localStorage.setItem(CURRENCY_STORAGE_KEY, picked);

        try {
            const rates = await getFxRatesFromINR();
            applyCurrency(picked, rates);
        } catch {
            applyCurrency("INR", { INR: 1 });
        }

        closePopover();
    }

    async function initCurrencyPicker() {
        if (!picker || !trigger || !popover || !searchInput || !optionsEl || !moneyEls.length) return;

        // initial choice: saved -> IP -> INR
        const saved = (localStorage.getItem(CURRENCY_STORAGE_KEY) || "").toUpperCase();
        let initial = saved;

        if (!initial) {
            initial = (await detectCurrencyByIP()) || "INR";
        }

        let rates;
        try {
            rates = await getFxRatesFromINR();
        } catch {
            rates = { INR: 1 };
        }

        applyCurrency(initial, rates);

        trigger.addEventListener("click", () => {
            if (!popover.hidden) closePopover();
            else openPopover();
        });

        autoBtn?.addEventListener("click", async () => {
            localStorage.removeItem(CURRENCY_STORAGE_KEY);
            let detected = (await detectCurrencyByIP()) || "INR";

            try {
                const r = await getFxRatesFromINR();
                applyCurrency(detected, r);
            } catch {
                applyCurrency("INR", { INR: 1 });
            }
        });

        searchInput.addEventListener("input", () => renderOptions(searchInput.value));

        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closePopover();

            if (e.key === "Enter") {
                e.preventDefault();
                const typed = String(searchInput.value || "").trim().toUpperCase();
                const exists = ALL_CURRENCIES.some((x) => x.code === typed);
                if (exists) selectCurrency(typed, "manual");
            }
        });

        // Click outside closes
        document.addEventListener("click", (e) => {
            if (popover.hidden) return;
            const target = e.target;
            if (!(target instanceof Node)) return;
            if (!picker.contains(target)) closePopover();
        });
    }

    initCurrencyPicker().catch(() => {
        if (statusEl) statusEl.textContent = "(INR)";
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