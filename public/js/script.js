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
const privacyCheckbox = form?.elements.namedItem("privacy");

document.documentElement.classList.add("js");

const setSubmitAvailability = () => {
  if (!submitButton || !(privacyCheckbox instanceof HTMLInputElement)) return;
  submitButton.disabled = !privacyCheckbox.checked;
};

const resetTurnstile = () => {
  if (typeof window.turnstile !== "undefined") window.turnstile.reset();
};

window.onTurnstileError = () => {
  resetTurnstile();
  if (!errorMessage) return;
  errorMessage.textContent = "セキュリティ確認を完了できませんでした。再度お試しください。";
  errorMessage.hidden = false;
};

window.onTurnstileExpired = resetTurnstile;

privacyCheckbox?.addEventListener("change", setSubmitAvailability);
setSubmitAvailability();

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

  const formData = new FormData(form);
  const turnstileToken = formData.get("turnstileToken");
  if (typeof turnstileToken !== "string" || turnstileToken.length === 0) {
    errorMessage.textContent = "セキュリティ確認が完了するまでお待ちください。";
    errorMessage.hidden = false;
    return;
  }

  const optionalValue = (name) => {
    const value = formData.get(name);
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  };

  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    category: String(formData.get("category") ?? ""),
    message: String(formData.get("message") ?? "").trim(),
    privacy: privacyCheckbox instanceof HTMLInputElement && privacyCheckbox.checked,
    turnstileToken,
  };
  const company = optionalValue("company");
  const phone = optionalValue("phone");
  if (company) payload.company = company;
  if (phone) payload.phone = phone;

  submitButton.disabled = true;
  submitButton.classList.add("is-loading");
  submitButton.querySelector("span").textContent = "送信しています";

  try {
    const response = await fetch(form.action, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || result?.success !== true) {
      result?.fieldErrors?.forEach(({ field }) => {
        const input = form.elements.namedItem(field);
        if (input instanceof HTMLElement) input.classList.add("is-invalid");
      });
      throw new Error(result?.error?.message || "お問い合わせを送信できませんでした。");
    }

    form.hidden = true;
    successMessage.hidden = false;
    successMessage.focus();
  } catch (error) {
    errorMessage.textContent = error instanceof Error
      ? error.message
      : "お問い合わせを送信できませんでした。時間をおいて再度お試しください。";
    errorMessage.hidden = false;
    resetTurnstile();
  } finally {
    submitButton.classList.remove("is-loading");
    submitButton.querySelector("span").textContent = "入力内容を送信する";
    setSubmitAvailability();
  }
});

resetButton?.addEventListener("click", () => {
  form.reset();
  form.querySelectorAll(".is-invalid").forEach((field) => field.classList.remove("is-invalid"));
  errorMessage.hidden = true;
  form.hidden = false;
  successMessage.hidden = true;
  resetTurnstile();
  setSubmitAvailability();
  form.querySelector("input")?.focus();
});
