const header = document.querySelector("[data-header]");
const menuButton = document.querySelector("[data-menu-button]");
const menu = document.querySelector("[data-menu]");
const contactToggle = document.querySelector("[data-contact-toggle]");
const contactPanel = document.querySelector("[data-contact-panel]");
const form = document.querySelector("#contact-form");
const submitButton = document.querySelector("[data-submit]");
const errorMessage = document.querySelector("[data-form-error]");
const successMessage = document.querySelector("[data-success]");
const resetButton = document.querySelector("[data-reset]");

document.documentElement.classList.add("js");

const closeMenu = () => {
  if (!menuButton || !menu) return;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "メニューを開く");
  menu.classList.remove("is-open");
  document.body.classList.remove("menu-open");
};

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "メニューを開く" : "メニューを閉じる");
  menu?.classList.toggle("is-open", !isOpen);
  document.body.classList.toggle("menu-open", !isOpen);
});

menu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

contactToggle?.addEventListener("click", () => {
  const isOpen = contactToggle.getAttribute("aria-expanded") === "true";
  contactToggle.setAttribute("aria-expanded", String(!isOpen));
  contactPanel?.classList.toggle("is-open", !isOpen);

  if (!isOpen) {
    window.setTimeout(() => contactPanel?.querySelector("input")?.focus(), 180);
  }
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!target || reduceMotion) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.pushState(null, "", link.getAttribute("href"));
  });
});

window.addEventListener(
  "scroll",
  () => header?.classList.toggle("is-scrolled", window.scrollY > 12),
  { passive: true },
);

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.12 },
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.hidden = true;

  const invalidFields = [...form.elements].filter(
    (field) => field instanceof HTMLElement && "checkValidity" in field && !field.checkValidity(),
  );

  form.querySelectorAll(".is-invalid").forEach((field) => field.classList.remove("is-invalid"));

  if (invalidFields.length > 0) {
    invalidFields.forEach((field) => field.classList.add("is-invalid"));
    errorMessage.textContent = "必須項目をご確認ください。";
    errorMessage.hidden = false;
    invalidFields[0].focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.classList.add("is-loading");
  submitButton.querySelector("span").textContent = "送信しています";

  // Static prototype behavior. Replace this delay with fetch("/api/contact", ...) in Hono integration.
  await new Promise((resolve) => window.setTimeout(resolve, 900));

  form.hidden = true;
  successMessage.hidden = false;
  successMessage.focus?.();
  submitButton.disabled = false;
  submitButton.classList.remove("is-loading");
  submitButton.querySelector("span").textContent = "入力内容を送信する";
});

resetButton?.addEventListener("click", () => {
  form.reset();
  form.hidden = false;
  successMessage.hidden = true;
  form.querySelector("input")?.focus();
});
