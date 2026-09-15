// Fetching and rendering a patient's unified FHIR record, as a chronological
// timeline — Conditions, AllergyIntolerances and Observations sorted newest
// first, with any medication linked to a Condition (via reasonReference)
// nested inside that Condition's own entry, not listed separately.
const INTERCONNECT_BASE_URL = "http://localhost:4001/sphere/interconnect";

const TYPE_ICONS = {
  Condition: "🩺",
  AllergyIntolerance: "⚠️",
  MedicationStatement: "💊",
  Observation: "🧪",
};

export function initRecordView() {
  const cached = localStorage.getItem("sphereToken");
  const params = new URLSearchParams(window.location.search);
  const mrn = params.get("mrn");

  if (cached && mrn) {
    loadRecord(mrn);
  }
}

async function loadRecord(mrn) {
  const token = localStorage.getItem("sphereToken");

  const res = await fetch(`${INTERCONNECT_BASE_URL}/extract/${mrn}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    document.getElementById("recordView").innerHTML =
      `<p class="empty-note">${data.message || "No SPHERE record found for this patient yet."}</p>`;
    return;
  }

  renderBundle(data);
}

function renderBundle(bundle) {
  const container = document.getElementById("recordView");
  container.innerHTML = "";

  const resources = bundle.entry?.map((e) => e.resource) || [];

  const patient = resources.find((r) => r.resourceType === "Patient");
  if (patient) {
    const name = patient.name?.[0];
    container.innerHTML += `
      <div class="patient-banner">
        <h3>${name?.given?.[0] || ""} ${name?.family || ""}</h3>
        <p>DOB: ${patient.birthDate || ""}</p>
      </div>
    `;
  }

  const medications = resources.filter((r) => r.resourceType === "MedicationStatement");
  const generalMeds = medications.filter((m) => !m.reasonReference);

  const timelineEntries = resources.filter(
    (r) => r.resourceType !== "Patient" && r.resourceType !== "MedicationStatement"
  );
  timelineEntries.sort((a, b) => getEntryDate(b).localeCompare(getEntryDate(a))); // newest first

  const timeline = document.createElement("div");

  timelineEntries.forEach((resource) => {
    const linkedMeds = resource.resourceType === "Condition"
      ? findLinkedMedications(resource, medications)
      : [];

    const entry = document.createElement("div");
    entry.className = "timeline-entry";
    entry.innerHTML = `
      <div class="timeline-icon">${TYPE_ICONS[resource.resourceType] || "📄"}</div>
      <div class="timeline-content">
        ${describeResource(resource)}
        ${linkedMeds.length
          ? `<div class="nested-meds">${linkedMeds.map((m) => `<div class="med-entry">💊 ${describeResource(m)}</div>`).join("")}</div>`
          : ""}
      </div>
    `;
    timeline.appendChild(entry);
  });

  container.appendChild(timeline);

  if (generalMeds.length) {
    container.innerHTML += `<h4>💊 Other Medications</h4>`;
    generalMeds.forEach((m) => {
      container.innerHTML += `<div class="record-entry">${describeResource(m)}</div>`;
    });
  }
}

function findLinkedMedications(condition, medications) {
  const conditionRef = `Condition/${condition.id}`;
  return medications.filter((m) => m.reasonReference?.some((ref) => ref.reference === conditionRef));
}

function getEntryDate(resource) {
  return resource.onsetDateTime || resource.effectiveDateTime || resource.recordedDate || "";
}

// Deliberately generic rather than a branch per resource type — tries the
// common field patterns (code.text for Conditions/Allergies,
// medicationCodeableConcept.text for medications, valueQuantity/valueString
// for Observations) so a resource type nobody's written specific handling for
// yet still renders something, instead of vanishing silently.
function describeResource(r) {
  const label = r.code?.text || r.medicationCodeableConcept?.text || "";
  const value = r.valueQuantity
    ? `${r.valueQuantity.value} ${r.valueQuantity.unit || ""}`
    : (r.valueString || "");
  const date = r.onsetDateTime || r.effectiveDateTime || r.recordedDate || "";
  const note = r.note?.[0]?.text || "";
  const source = r.meta?.source || "";

  return `<strong>${label}</strong> ${value} <span class="muted">(${date}) — from ${source}</span>${note ? `<br><em>${note}</em>` : ""}`;
}
