const leadForm = document.getElementById("leadForm");
const formMessage = document.getElementById("formMessage");
const leadModal = document.getElementById("leadModal");
const closeLeadModalBtn = document.getElementById("closeLeadModal");
const modalLeadForm = document.getElementById("modalLeadForm");
const modalFormMessage = document.getElementById("modalFormMessage");

let lastModalOpener = null;

function getPhoneValue(inputEl) {
  if (!inputEl) return "";
  const intl = window.intlTelInput;
  if (typeof intl !== "function" || !intl.getInstance) {
    return String(inputEl.value || "").trim();
  }
  const iti = intl.getInstance(inputEl);
  if (!iti) return String(inputEl.value || "").trim();

  try {
    const e164 = iti.getNumber();
    if (e164 && e164.replace(/\D/g, "").length >= 7) return e164;
  } catch (_) {
    /* utils still loading */
  }

  const country = iti.getSelectedCountryData?.();
  const digits = String(inputEl.value || "").replace(/\D/g, "");
  if (digits && country?.dialCode) {
    return `+${country.dialCode}${digits}`;
  }
  return String(inputEl.value || "").trim();
}

function clearPhoneInput(inputEl) {
  const intl = window.intlTelInput;
  const iti = intl && intl.getInstance ? intl.getInstance(inputEl) : null;
  if (iti) {
    try {
      iti.setNumber("");
    } catch (_) {
      inputEl.value = "";
    }
  } else if (inputEl) {
    inputEl.value = "";
  }
}

function initPhoneInputs() {
  const intl = window.intlTelInput;
  if (typeof intl !== "function") return;

  const opts = {
    initialCountry: "ae",
    preferredCountries: ["ae", "sa", "gb", "us"],
    nationalMode: true,
    formatOnDisplay: true,
    separateDialCode: true
  };

  const phoneInput = document.getElementById("phone");
  if (phoneInput && !intl.getInstance(phoneInput)) {
    intl(phoneInput, opts);
  }

  const modalPhone = document.getElementById("modalPhone");
  if (modalPhone && !intl.getInstance(modalPhone)) {
    intl(modalPhone, opts);
  }
}

async function postLead(payload, messageEl) {
  messageEl.textContent = "Submitting...";
  messageEl.style.color = "#5b6474";

  const response = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      (data && data.error) || (raw && raw.slice(0, 140)) || "Submission failed."
    );
  }

  return data;
}

async function onHeroSubmit(event) {
  event.preventDefault();
  if (!leadForm || !formMessage) return;

  const phoneEl = document.getElementById("phone");
  const phone = getPhoneValue(phoneEl);

  const payload = {
    name: leadForm.querySelector("#name")?.value?.trim() || "",
    phone,
    email: leadForm.querySelector("#email")?.value?.trim() || "",
    company: "",
    industry: "",
    project: leadForm.querySelector("#project")?.value?.trim() || ""
  };

  if (!payload.name || !phone || !payload.email) {
    formMessage.textContent = "Name, phone, and email are required.";
    formMessage.style.color = "#b91c1c";
    return;
  }

  try {
    const data = await postLead(payload, formMessage);
    leadForm.reset();
    clearPhoneInput(phoneEl);
    formMessage.textContent = (data && data.message) || "Submitted successfully.";
    formMessage.style.color = "#166534";
  } catch (error) {
    formMessage.textContent = error.message || "Something went wrong.";
    formMessage.style.color = "#b91c1c";
  }
}

async function onModalSubmit(event) {
  event.preventDefault();
  if (!modalLeadForm || !modalFormMessage) return;

  const phoneEl = document.getElementById("modalPhone");
  const phone = getPhoneValue(phoneEl);

  const first = modalLeadForm.querySelector("#modalFirstName")?.value?.trim() || "";
  const last = modalLeadForm.querySelector("#modalLastName")?.value?.trim() || "";
  const name = [first, last].filter(Boolean).join(" ").trim();

  const payload = {
    name,
    phone,
    email: modalLeadForm.querySelector("#modalEmail")?.value?.trim() || "",
    company: modalLeadForm.querySelector("#modalCompany")?.value?.trim() || "",
    industry: modalLeadForm.querySelector("#modalServices")?.value?.trim() || "",
    project: modalLeadForm.querySelector("#modalMessage")?.value?.trim() || ""
  };

  if (!payload.name || !phone || !payload.email) {
    modalFormMessage.textContent = "Name, phone, and email are required.";
    modalFormMessage.style.color = "#b91c1c";
    return;
  }

  try {
    const data = await postLead(payload, modalFormMessage);
    modalLeadForm.reset();
    clearPhoneInput(phoneEl);
    modalFormMessage.textContent = (data && data.message) || "Submitted successfully.";
    modalFormMessage.style.color = "#166534";
    setTimeout(() => closeModal(), 1200);
  } catch (error) {
    modalFormMessage.textContent = error.message || "Something went wrong.";
    modalFormMessage.style.color = "#b91c1c";
  }
}

function openModal(fromEvent) {
  if (!leadModal) return;
  lastModalOpener =
    (fromEvent && fromEvent.currentTarget && fromEvent.currentTarget.closest("button, a")) || null;
  leadModal.hidden = false;
  document.body.style.overflow = "hidden";
  initPhoneInputs();
  const first = modalLeadForm?.querySelector("#modalFirstName");
  if (first) first.focus();
}

function closeModal() {
  if (!leadModal) return;
  leadModal.hidden = true;
  document.body.style.overflow = "";
  if (modalFormMessage) modalFormMessage.textContent = "";
  if (lastModalOpener && typeof lastModalOpener.focus === "function") {
    lastModalOpener.focus();
  }
  lastModalOpener = null;
}

function initFaqAccordion() {
  const root = document.getElementById("faqAccordion");
  if (!root) return;

  root.querySelectorAll(".faq-item").forEach((item) => {
    const trigger = item.querySelector(".faq-trigger");
    const panel = item.querySelector(".faq-panel");
    if (!trigger || !panel) return;

    const setOpen = (open) => {
      item.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      panel.hidden = !open;
    };

    if (item.classList.contains("is-open")) {
      setOpen(true);
    } else {
      setOpen(false);
    }

    trigger.addEventListener("click", () => {
      const willOpen = !item.classList.contains("is-open");
      if (willOpen) {
        root.querySelectorAll(".faq-item.is-open").forEach((o) => {
          if (o === item) return;
          o.classList.remove("is-open");
          const t = o.querySelector(".faq-trigger");
          const p = o.querySelector(".faq-panel");
          if (t) t.setAttribute("aria-expanded", "false");
          if (p) p.hidden = true;
        });
      }
      setOpen(willOpen);
    });
  });
}

function boot() {
  initPhoneInputs();
  initFaqAccordion();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

if (leadForm) leadForm.addEventListener("submit", onHeroSubmit);
if (modalLeadForm) modalLeadForm.addEventListener("submit", onModalSubmit);

document.querySelectorAll(".open-contact-modal").forEach((btn) => {
  btn.addEventListener("click", (e) => openModal(e));
});

closeLeadModalBtn?.addEventListener("click", closeModal);

leadModal?.addEventListener("click", (e) => {
  if (e.target === leadModal) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && leadModal && !leadModal.hidden) closeModal();
});
