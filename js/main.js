// ============================================================
// --- Navigation Logic ---
// ============================================================

const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
    });
  });
}

// ============================================================
// --- Scroll Reveal Animation ---
// ============================================================

const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

revealElements.forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index * 45, 260)}ms`;
  revealObserver.observe(element);
});

// ============================================================
// --- Sticky Header on Scroll ---
// ============================================================

const header = document.querySelector(".site-header");

window.addEventListener(
  "scroll",
  () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 16);
  },
  { passive: true }
);

// ============================================================
// --- Contact & Consultation Form ---
// ============================================================

// Web3Forms API endpoint
const WEB3FORMS_URL = "https://api.web3forms.com/submit";

const contactForm = document.getElementById("general-contact-form");
const contactSubmitBtn = document.getElementById("contact-submit-btn");
const formFeedback = contactForm ? contactForm.querySelector(".form-feedback") : null;

// Guard flag — prevents duplicate rapid submissions
let isSubmitting = false;

/**
 * Show error message for a specific form field.
 * @param {string} inputId - The ID of the input element.
 */
function showFieldError(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const errorSpan = input.nextElementSibling;
  if (errorSpan && errorSpan.classList.contains("error-msg")) {
    errorSpan.style.display = "block";
  }
}

/**
 * Hide all field-level error messages and the feedback banner.
 */
function clearAllErrors() {
  if (!contactForm) return;
  contactForm.querySelectorAll(".error-msg").forEach((el) => {
    el.style.display = "none";
  });
  if (formFeedback) {
    formFeedback.style.display = "none";
    formFeedback.className = "form-group full-width form-feedback";
    formFeedback.textContent = "";
  }
}

/**
 * Display a success or error banner inside the form.
 * @param {"success"|"error"} type
 * @param {string} message
 */
function showFeedback(type, message) {
  if (!formFeedback) return;
  formFeedback.textContent = message;
  formFeedback.className = `form-group full-width form-feedback ${type}`;
  formFeedback.style.display = "block";
  formFeedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Toggle the submit button between idle and loading states.
 * @param {boolean} loading
 */
function setLoadingState(loading) {
  if (!contactSubmitBtn) return;
  contactSubmitBtn.disabled = loading;
  contactSubmitBtn.textContent = loading ? "Sending..." : "Send Message";
}

/**
 * Validate all required form fields. Returns true if valid.
 * @returns {boolean}
 */
function validateForm() {
  let isValid = true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const name = document.getElementById("contact-name").value.trim();
  if (!name) {
    showFieldError("contact-name");
    isValid = false;
  }

  const email = document.getElementById("contact-email").value.trim();
  if (!email || !emailRegex.test(email)) {
    showFieldError("contact-email");
    isValid = false;
  }

  const message = document.getElementById("contact-message").value.trim();
  if (!message) {
    showFieldError("contact-message");
    isValid = false;
  }

  return isValid;
}

/**
 * Collect, trim, and normalize form values into the Web3Forms submission payload.
 * @returns {Object}
 */
function buildPayload() {
  const userKey = window.ENV?.WEB3FORMS_KEY || "";
  
  return {
    access_key:      userKey,
    subject:         "New Lead - Floviq Contact Form",
    from_name:       "Floviq Website",
    name:            document.getElementById("contact-name").value.trim(),
    email:           document.getElementById("contact-email").value.trim(),
    company:         document.getElementById("contact-company").value.trim(),
    serviceInterest: document.getElementById("contact-service")?.value || "General Inquiry",
    message:         document.getElementById("contact-message").value.trim(),
    submittedAt:     new Date().toISOString(),
  };
}

// Wire up the contact form submission
if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Prevent rapid duplicate submissions
    if (isSubmitting) return;

    clearAllErrors();

    // Validate — stop early if any field fails
    if (!validateForm()) return;

    // Check if configuration key is present
    const payload = buildPayload();
    if (!payload.access_key || payload.access_key === "YOUR_ACCESS_KEY_HERE") {
      console.warn("Web3Forms Access Key is missing in config.js");
      showFeedback(
        "error",
        "Form configuration is incomplete. Please add your Web3Forms Access Key to config.js."
      );
      return;
    }

    console.log("Submitting contact payload:", payload);

    // Enter loading state
    isSubmitting = true;
    setLoadingState(true);

    try {
      const response = await fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Server responded with status ${response.status}`);
      }

      console.log("Contact request submitted successfully:", data);
      showFeedback(
        "success",
        "Thanks! Your message has been sent successfully. Our team will get back to you shortly."
      );
      contactForm.reset();

    } catch (error) {
      console.error("Contact submission failed:", error);
      showFeedback(
        "error",
        "Something went wrong while submitting your request. Please try again or contact us directly."
      );
    } finally {
      isSubmitting = false;
      setLoadingState(false);
    }
  });
}
