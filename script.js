// Annu Beauty site behavior.
// Ashayla's public GlossGenius booking page. Every "book" button opens it in a new tab.
// GlossGenius blocks its booking pages from loading inside other sites, so book.html
// links out instead of embedding it.
const BOOKING_URL = "https://annubeauty.glossgenius.com/";
// Studios tenant application (Google Form), from annu-beauty-studios/business.md
const STUDIOS_APPLICATION_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdliWQSTItCp7wikvUxP4TWMgnQ5GjYojZNPTmUUyylLul2nQ/viewform";

// Mailchimp audience signup address: the form "action" URL from Mailchimp's
// Audience → Signup forms → Embedded forms code. It's public, not a secret key.
const MAILCHIMP_FORM_URL = "https://gmail.us21.list-manage.com/subscribe/post?u=8ecefd0f5dcec27b700b1eaef&id=397aca327b";
// Mailchimp tag IDs (the numbers in the embedded form's hidden "tags" field) for each form.
const MAILCHIMP_TAGS = { newsletter: "", product: "", course: "" };

// Sends one email to Mailchimp. Mailchimp's embedded forms only answer cross-site
// requests through JSONP, so this loads its post-json URL as a script.
function subscribe(email, tagId) {
  return new Promise((resolve, reject) => {
    if (!MAILCHIMP_FORM_URL) { resolve(); return; }
    const cb = "mc_cb_" + Date.now();
    const url = new URL(MAILCHIMP_FORM_URL.replace("/post?", "/post-json?"));
    url.searchParams.set("EMAIL", email);
    if (tagId) url.searchParams.set("tags", tagId);
    url.searchParams.set("c", cb);
    const script = document.createElement("script");
    const done = () => { delete window[cb]; script.remove(); };
    window[cb] = (res) => {
      done();
      if (res.result === "success") resolve();
      else if (/already subscribed/i.test(res.msg || "")) resolve();
      else reject("Something went wrong. Please check your email and try again.");
    };
    script.onerror = () => { done(); reject("We couldn't reach our email list. Please try again."); };
    script.src = url.toString();
    document.body.appendChild(script);
  });
}

// Mailing list pop-up (Paper design "Pop-up A · Sunflower Split").
// Shows once after 8 seconds or halfway down the page, then stays away for 14 days
// after it's closed, and for good once the visitor subscribes.
const POPUP_DELAY_MS = 8000;
const POPUP_SNOOZE_DAYS = 14;
const POPUP_SEEN_KEY = "ab_popup_closed_at";
const POPUP_SUBSCRIBED_KEY = "ab_subscribed";

function remember(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
function recall(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

function setupMailingPopup() {
  if (recall(POPUP_SUBSCRIBED_KEY)) return;
  const closedAt = Number(recall(POPUP_SEEN_KEY) || 0);
  if (closedAt && Date.now() - closedAt < POPUP_SNOOZE_DAYS * 864e5) return;

  const wrap = document.createElement("div");
  wrap.className = "mc-popup";
  wrap.setAttribute("role", "dialog");
  wrap.setAttribute("aria-modal", "true");
  wrap.setAttribute("aria-labelledby", "mc-popup-title");
  wrap.innerHTML = `
    <div class="mc-popup-card">
      <div class="mc-popup-photo" aria-hidden="true"><img class="mc-popup-bloom" src="images/sunflower.svg" alt=""></div>
      <div class="mc-popup-body">
        <button class="mc-popup-close" type="button" aria-label="Close">&#x2715;</button>
        <span class="eyebrow">Join the garden</span>
        <h2 id="mc-popup-title">Hey, Beauty. Let's grow together.</h2>
        <p>Loc care tips, new openings, and first dibs on products and Loc Academy classes. Straight to your inbox.</p>
        <form class="signup" data-signup="newsletter" data-popup>
          <input type="email" placeholder="Your email" aria-label="Your email" required>
          <button class="btn btn-ink btn-block" type="submit">Subscribe</button>
        </form>
        <button class="mc-popup-later" type="button">No thanks, maybe later</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  let shown = false;
  const open = () => {
    if (shown) return;
    shown = true;
    wrap.classList.add("open");
    document.body.classList.add("popup-open");
    setTimeout(() => wrap.querySelector("input").focus(), 300);
  };
  const close = () => {
    wrap.classList.remove("open");
    document.body.classList.remove("popup-open");
    remember(POPUP_SEEN_KEY, String(Date.now()));
  };
  wrap.querySelector(".mc-popup-close").addEventListener("click", close);
  wrap.querySelector(".mc-popup-later").addEventListener("click", close);
  wrap.addEventListener("click", (e) => { if (e.target === wrap) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && wrap.classList.contains("open")) close(); });

  const timer = setTimeout(open, POPUP_DELAY_MS);
  const onScroll = () => {
    const depth = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
    if (depth > 0.5) { clearTimeout(timer); open(); window.removeEventListener("scroll", onScroll); }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}

document.addEventListener("DOMContentLoaded", () => {
  setupMailingPopup();

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

  // Email signups go to Mailchimp through the audience's public embedded-form address.
  // Each form's data-signup value picks its tag (see MAILCHIMP_TAGS).
  document.querySelectorAll("form[data-signup]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input[type=email]");
      if (!input.value || !input.checkValidity()) { input.focus(); return; }
      const button = form.querySelector("button");
      if (button) { button.disabled = true; button.textContent = "Sending…"; }
      subscribe(input.value, MAILCHIMP_TAGS[form.dataset.signup])
        .then(() => {
          remember(POPUP_SUBSCRIBED_KEY, "1");
          if (form.hasAttribute("data-popup")) {
            setTimeout(() => { document.querySelector(".mc-popup").classList.remove("open"); document.body.classList.remove("popup-open"); }, 2500);
          }
          form.innerHTML = '<p class="thanks">Thank you, Beauty! You\'re on the list. ✿</p>';
        })
        .catch((msg) => {
          if (button) { button.disabled = false; button.textContent = "Try again"; }
          let note = form.querySelector(".signup-error");
          if (!note) { note = document.createElement("p"); note.className = "signup-error"; form.appendChild(note); }
          note.textContent = msg;
        });
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
