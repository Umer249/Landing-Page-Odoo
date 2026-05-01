const form = document.getElementById("leadForm");
const messageEl = document.getElementById("formMessage");

async function submitLead(event) {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  messageEl.textContent = "Submitting...";
  messageEl.style.color = "#5b6474";

  try {
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
        (data && data.error) ||
          (raw && raw.slice(0, 140)) ||
          "Submission failed."
      );
    }

    form.reset();
    messageEl.textContent = (data && data.message) || "Submitted successfully.";
    messageEl.style.color = "#166534";
  } catch (error) {
    messageEl.textContent = error.message || "Something went wrong.";
    messageEl.style.color = "#b91c1c";
  }
}

if (form) form.addEventListener("submit", submitLead);
