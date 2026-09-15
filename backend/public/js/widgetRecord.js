// Fetching and rendering a patient's unified FHIR record: a personal-details
// banner, a chronological timeline (Conditions/Observations, with linked
// medications nested inside), and Allergies as a separate side column —
// deliberately not folded into the timeline, since knowing what a patient is
// allergic to needs to be scannable at a glance, not buried among dates.
const INTERCONNECT_BASE_URL = "http://localhost:4001/sphere/interconnect";

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

  container.innerHTML += renderPatientBanner(patient);

  const allergies = resources.filter((r) => r.resourceType === "AllergyIntolerance");
  const medications = resources.filter((r) => r.resourceType === "MedicationStatement");
  const generalMeds = medications.filter((m) => !m.reasonReference);

  const timelineEntries = resources.filter(
    (r) => !["Patient", "AllergyIntolerance", "MedicationStatement"].includes(r.resourceType)
  );
  timelineEntries.sort((a, b) => getEntryDate(b).localeCompare(getEntryDate(a))); // newest first

  const columns = document.createElement("div");
  columns.className = "record-columns";

  const timelineCol = document.createElement("div");
  timelineCol.className = "record-col-timeline";

  timelineEntries.forEach((resource) => {
    const linkedMeds = resource.resourceType === "Condition"
      ? findLinkedMedications(resource, medications)
      : [];

    const entry = document.createElement("div");
    entry.className = "timeline-entry";
    entry.innerHTML = `
      <div class="timeline-date">${getEntryDate(resource) || "—"}</div>
      <div class="timeline-content">
        ${describeResource(resource, false)}
        ${linkedMeds.length
          ? `<div class="nested-meds">${linkedMeds.map((m) => `
              <div class="med-entry">
                <span class="med-entry-icon">💊</span>
                <div class="med-entry-body">${describeResource(m)}</div>
              </div>
            `).join("")}</div>`
          : ""}
      </div>
    `;
    timelineCol.appendChild(entry);
  });

  if (generalMeds.length) {
    timelineCol.innerHTML += `<h4>💊 Other Medications</h4>`;
    generalMeds.forEach((m) => {
      timelineCol.innerHTML += `<div class="record-entry">${describeResource(m)}</div>`;
    });
  }

  const allergyCol = document.createElement("div");
  allergyCol.className = "record-col-allergies";
  allergyCol.innerHTML = `<h4>⚠️ Allergies</h4>`;
  if (allergies.length === 0) {
    allergyCol.innerHTML += `<p class="empty-note">No known allergies.</p>`;
  } else {
    allergies.forEach((a) => {
      allergyCol.innerHTML += `<div class="record-entry">${describeResource(a)}</div>`;
    });
  }

  columns.appendChild(timelineCol);
  columns.appendChild(allergyCol);
  container.appendChild(columns);
}

// The top banner: name/DOB on the left, other demographics on the right.
// Only shows fields that are actually present in the FHIR data — phone comes
// from `telecom`, PPSN and MRN from `identifier` (matched by system URI),
// address generically if ever populated. No blood group: that isn't a FHIR
// Patient field at all (it would be an Observation), and nothing in the
// pipeline produces one today, so showing a field with no real data behind
// it would be misleading rather than just incomplete.
function renderPatientBanner(patient) {
  if (!patient) return "";

  const name = patient.name?.[0];
  const phone = patient.telecom?.find((t) => t.system === "phone")?.value;
  const ppsn = patient.identifier?.find((id) => id.system === "http://www.hse.ie/ppsn")?.value;
  const mrn = patient.identifier?.find((id) => id.system === "http://epic-hospital-demo.local/mrn")?.value;
  const address = patient.address?.[0];
  const addressText = address
    ? [address.line?.[0], address.city, address.country].filter(Boolean).join(", ")
    : "";

  return `
    <div class="patient-banner">
      <div class="patient-banner-main">
        <h3>${name?.given?.[0] || ""} ${name?.family || ""}</h3>
        <p>DOB: ${patient.birthDate || ""}${patient.gender ? ` &middot; ${patient.gender}` : ""}</p>
      </div>
      <div class="patient-banner-details">
        ${mrn ? `<div>MRN: ${mrn}</div>` : ""}
        ${ppsn ? `<div>PPSN: ${ppsn}</div>` : ""}
        ${phone ? `<div>Phone: ${phone}</div>` : ""}
        ${addressText ? `<div>${addressText}</div>` : ""}
      </div>
    </div>
  `;
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
// `showDate` defaults to true; timeline entries pass false since their date
// already sits on the timeline marker itself — showing it twice would just
// be redundant there, but allergies/nested/general medications (which have
// no separate marker) still need it inline.
function describeResource(r, showDate = true) {
  const label = r.code?.text || r.medicationCodeableConcept?.text || "";
  const value = r.valueQuantity
    ? `${r.valueQuantity.value} ${r.valueQuantity.unit || ""}`
    : (r.valueString || "");
  const date = r.onsetDateTime || r.effectiveDateTime || r.recordedDate || "";
  const note = r.note?.[0]?.text || "";
  const source = r.meta?.source || "";

  return `
    <div class="record-entry-row">
      <div class="record-entry-main">
        <strong>${label}</strong> ${value}
        ${showDate && date ? `<span class="record-entry-date">${date}</span>` : ""}
      </div>
      ${source ? `<span class="source-tag">${source}</span>` : ""}
    </div>
    ${note ? `<em>${note}</em>` : ""}
  `;
}
