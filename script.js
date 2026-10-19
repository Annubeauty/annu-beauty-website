// Annu Beauty site behavior.
// Ashayla's public GlossGenius booking page. Every "book" button opens it in a new tab.
// GlossGenius blocks its booking pages from loading inside other sites, so book.html
// links out instead of embedding it.
const BOOKING_URL = "https://annubeauty.glossgenius.com/";
// Studios tenant application (Google Form), from annu-beauty-studios/business.md
const STUDIOS_APPLICATION_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdliWQSTItCp7wikvUxP4TWMgnQ5GjYojZNPTmUUyylLul2nQ/viewform";

document.addEventListener("DOMContentLoaded", () => {
  // Phone menu
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
  }

  // Book buttons
  document.querySelectorAll("[data-book]").forEach((el) => {
    el.setAttribute("href", BOOKING_URL || "book.html#book-online");
    if (BOOKING_URL) { el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener"); }
  });
  document.querySelectorAll("[data-apply]").forEach((el) => {
    el.setAttribute("href", STUDIOS_APPLICATION_URL);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });

  // Email signups. Mailchimp isn't connected yet, so this only thanks the visitor.
  document.querySelectorAll("form[data-signup]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input[type=email]");
      if (!input.value || !input.checkValidity()) { input.focus(); return; }
      form.innerHTML = '<p class="thanks">Thank you, Beauty! You\'re on the list. ✿</p>';
    });
  });

  // Fade sections in as they scroll into view
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.15 });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add("in"));
  }
});
