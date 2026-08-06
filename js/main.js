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
// --- General Contact Form ---
// ============================================================

const generalContactForm = document.getElementById("general-contact-form");

if (generalContactForm) {
  generalContactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Message sent successfully!");
  });
}

// ============================================================
// --- Consultation Form (formerly AI Lead Audit) ---
// ============================================================

// Webhook URL — replace with your live endpoint when ready
const WEBHOOK_URL = "https://your-n8n-domain/webhook/floviq-lead-audit";

const auditForm = document.getElementById("ai-audit-form");
const auditSubmitBtn = document.getElementById("audit-submit-btn");
const formFeedback = auditForm ? auditForm.querySelector(".form-feedback") : null;

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
  if (!auditForm) return;
  auditForm.querySelectorAll(".error-msg").forEach((el) => {
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
  formFeedback.classList.add(type);
  formFeedback.style.display = "block";
  formFeedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Toggle the submit button between idle and loading states.
 * @param {boolean} loading
 */
function setLoadingState(loading) {
  if (!auditSubmitBtn) return;
  auditSubmitBtn.disabled = loading;
  auditSubmitBtn.textContent = loading ? "Submitting..." : "Book a Consultation";
}

/**
 * Validate all required form fields. Returns true if valid.
 * @returns {boolean}
 */
function validateForm() {
  let isValid = true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const name = document.getElementById("audit-name").value.trim();
  if (!name) {
    showFieldError("audit-name");
    isValid = false;
  }

  const businessName = document.getElementById("audit-business").value.trim();
  if (!businessName) {
    showFieldError("audit-business");
    isValid = false;
  }

  const email = document.getElementById("audit-email").value.trim();
  if (!email || !emailRegex.test(email)) {
    showFieldError("audit-email");
    isValid = false;
  }

  const problem = document.getElementById("audit-problem").value.trim();
  if (!problem) {
    showFieldError("audit-problem");
    isValid = false;
  }

  return isValid;
}

/**
 * Collect, trim, and normalize form values into the submission payload.
 * @returns {Object}
 */
function buildPayload() {
  return {
    name:               document.getElementById("audit-name").value.trim(),
    businessName:       document.getElementById("audit-business").value.trim(),
    email:              document.getElementById("audit-email").value.trim(),
    phone:              document.getElementById("audit-phone").value.trim(),
    industry:           document.getElementById("audit-industry").value.trim(),
    serviceInterest:    document.getElementById("audit-service")?.value || "",
    projectDescription: document.getElementById("audit-problem").value.trim(),
    preferredContact:   document.getElementById("audit-contact").value,
    source:             "Floviq Website V2",
    page:               "homepage-consultation",
    submittedAt:        new Date().toISOString(),
  };
}

// Wire up the consultation form submission
if (auditForm) {
  auditForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Prevent rapid duplicate submissions
    if (isSubmitting) return;

    clearAllErrors();

    // Validate — stop early if any field fails
    if (!validateForm()) return;

    // Build and log payload before sending
    const payload = buildPayload();
    console.log("Submitting consultation payload:", payload);

    // Enter loading state
    isSubmitting = true;
    setLoadingState(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      console.log("Consultation request submitted successfully");
      showFeedback(
        "success",
        "Thanks! We've received your request. Our team will review your project and get back to you shortly."
      );
      auditForm.reset();

    } catch (error) {
      console.error("Consultation submission failed:", error);
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
