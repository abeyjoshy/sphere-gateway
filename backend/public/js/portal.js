const cached = localStorage.getItem("patientToken");
if (cached) showRecord();

document.getElementById("showRegisterBtn").addEventListener("click", () => {
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("registerSection").style.display = "flex";
});
document.getElementById("showLoginBtn").addEventListener("click", () => {
  document.getElementById("registerSection").style.display = "none";
  document.getElementById("loginSection").style.display = "flex";
});

document.getElementById("loginBtn").addEventListener("click", handleLogin);
document.getElementById("loginPassword").addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleLogin();
});

async function handleLogin() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch("/sphere/api/v1/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    document.getElementById("loginError").textContent = data.message;
    return;
  }

  if (!data.payLoad.user.roles.includes("patient")) {
    document.getElementById("loginError").textContent = "This portal is for patient accounts only.";
    return;
  }

  localStorage.setItem("patientToken", data.payLoad.token);
  showRecord();
}

document.getElementById("registerBtn").addEventListener("click", handleRegister);

async function handleRegister() {
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const dob = document.getElementById("regDob").value;
  const ppsn = document.getElementById("regPpsn").value;

  const res = await fetch("/sphere/api/v1/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, dob, ppsn }),
  });

  const data = await res.json();

  if (!res.ok) {
    document.getElementById("registerError").textContent = data.message;
    return;
  }

  document.getElementById("registerSection").style.display = "none";
  document.getElementById("loginSection").style.display = "flex";
  document.getElementById("loginError").textContent = "Account created — please log in.";
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("patientToken");
  document.getElementById("portalUserInfo").style.display = "none";
  document.getElementById("portalMain").style.display = "none";
  document.getElementById("loginSection").style.display = "flex";
});

async function showRecord() {
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("registerSection").style.display = "none";

  const token = localStorage.getItem("patientToken");

  const res = await fetch("/sphere/api/v1/getMyRecord", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    document.getElementById("loginSection").style.display = "flex";
    document.getElementById("loginError").textContent =
      data.issue?.[0]?.diagnostics || "Could not load your record.";
    return;
  }

  document.getElementById("portalUserInfo").style.display = "flex";
  document.getElementById("portalMain").style.display = "flex";
  renderBundle(data);
  loadAccessRequests();
}

function renderBundle(bundle) {
  const resources = bundle.entry?.map((e) => e.resource) || [];
  const patient = resources.find((r) => r.resourceType === "Patient");

  if (patient) {
    const name = patient.name?.[0];
    document.getElementById("welcomeText").textContent =
      `Welcome, ${name?.given?.[0] || ""} ${name?.family || ""}`;
  }

  document.getElementById("personalDetails").innerHTML = renderPersonalDetails(patient);

  const others = resources.filter((r) => r.resourceType !== "Patient");
  renderHistory(others);
}

function renderPersonalDetails(patient) {
  if (!patient) return `<p class="empty-note">No details on file.</p>`;

  const name = patient.name?.[0];
  const phone = patient.telecom?.find((t) => t.system === "phone")?.value;
  const ppsn = patient.identifier?.find((id) => id.system === "http://www.hse.ie/ppsn")?.value;
  const mrn = patient.identifier?.find((id) => id.system === "http://epic-hospital-demo.local/mrn")?.value;
  const address = patient.address?.[0];
  const addressText = address
    ? [address.line?.[0], address.city, address.country].filter(Boolean).join(", ")
    : "";

  return `
    <ul class="detail-list">
      <li><strong>${name?.given?.[0] || ""} ${name?.family || ""}</strong></li>
      <li>DOB: ${patient.birthDate || ""}</li>
      ${patient.gender ? `<li>Gender: ${patient.gender}</li>` : ""}
      ${mrn ? `<li>MRN: ${mrn}</li>` : ""}
      ${ppsn ? `<li>PPSN: ${ppsn}</li>` : ""}
      ${phone ? `<li>Phone: ${phone}</li>` : ""}
      ${addressText ? `<li>${addressText}</li>` : ""}
    </ul>
  `;
}

// Same layout/classes as the doctor-facing widget (widgetRecord.js): a
// chronological timeline with linked medications nested inside, and
// allergies as a separate always-visible side column.
function renderHistory(resources) {
  const container = document.getElementById("recordView");
  container.innerHTML = "";

  if (resources.length === 0) {
    container.innerHTML = `<p class="empty-note">No medical records yet.</p>`;
    return;
  }

  const allergies = resources.filter((r) => r.resourceType === "AllergyIntolerance");
  const medications = resources.filter((r) => r.resourceType === "MedicationStatement");
  const generalMeds = medications.filter((m) => !m.reasonReference);

  const timelineEntries = resources.filter(
    (r) => !["AllergyIntolerance", "MedicationStatement"].includes(r.resourceType)
  );
  timelineEntries.sort((a, b) => getEntryDate(b).localeCompare(getEntryDate(a)));

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

function findLinkedMedications(condition, medications) {
  const conditionRef = `Condition/${condition.id}`;
  return medications.filter((m) => m.reasonReference?.some((ref) => ref.reference === conditionRef));
}

function getEntryDate(resource) {
  return resource.onsetDateTime || resource.effectiveDateTime || resource.recordedDate || "";
}

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
    <button class="delete-record-btn" data-type="${r.resourceType}" data-id="${r.id}">Request deletion</button>
  `;
}

// Deletion request flow: confirm modal -> DELETE call -> stub success toast.
// Expected backend contract (not built yet, to be added separately):
//   DELETE /fhir/:resourceType/:id  — the standard FHIR delete interaction
//   (see hl7.org/fhir/R4/http.html#delete). Auth: Bearer token; the server
//   must verify the resource actually belongs to the calling patient before
//   setting deleted = true, the same ownership check getMyRecord already
//   does via the token rather than trusting a client-supplied id.
let pendingDelete = null;

document.getElementById("recordView").addEventListener("click", (e) => {
  const btn = e.target.closest(".delete-record-btn");
  if (!btn) return;
  pendingDelete = { resourceType: btn.dataset.type, id: btn.dataset.id };
  document.getElementById("deleteModal").style.display = "flex";
});

document.getElementById("deleteCancelBtn").addEventListener("click", closeDeleteModal);
document.getElementById("deleteModalClose").addEventListener("click", closeDeleteModal);

function closeDeleteModal() {
  pendingDelete = null;
  document.getElementById("deleteModal").style.display = "none";
}

document.getElementById("deleteConfirmBtn").addEventListener("click", async () => {
  if (!pendingDelete) return;
  const token = localStorage.getItem("patientToken");

  const res = await fetch(
    `/fhir/${pendingDelete.resourceType}/${pendingDelete.id}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
  );

  closeDeleteModal();

  if (!res.ok) {
    showToast("Could not submit deletion request.", "error");
    return;
  }

  showToast("Your request has been submitted and this record will be deleted soon.", "success");
});

// Notifications panel: pending/approved/rejected access requests for this
// patient. Backend contract (guided separately): GET /consent/requests
// returns { requests: [...] }, each with doctor_id populated to
// { name, email } rather than a bare ObjectId, so the UI can show who's
// asking without a second lookup.
async function loadAccessRequests() {
  const token = localStorage.getItem("patientToken");

  const res = await fetch("/sphere/api/v1/consent/requests", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return;

  const data = await res.json();
  renderNotifications(data.requests);
}

function renderNotifications(requests) {
  const container = document.getElementById("notifications");

  if (!requests || requests.length === 0) {
    container.innerHTML = `<p class="empty-note">No new notifications.</p>`;
    return;
  }

  container.innerHTML = requests.map((r) => {
    const doctorName = r.doctor_id?.name || "A doctor";
    const statusLabel = {
      pending: "requested access to your record",
      approved: "access approved",
      rejected: "access denied",
      revoked: "access revoked",
    }[r.status];

    return `
      <div class="notification-item notification-${r.status}">
        <div class="notification-text">
          <strong>${doctorName}</strong>
          <span class="notification-status">${statusLabel}</span>
          ${r.reason ? `<p class="notification-reason">${r.reason}</p>` : ""}
        </div>
        ${r.status === "pending" ? `
          <div class="notification-actions">
            <button class="approve-btn" data-id="${r._id}">Approve</button>
            <button class="secondary deny-btn" data-id="${r._id}">Deny</button>
          </div>
        ` : ""}
        ${r.status === "approved" ? `
          <div class="notification-actions">
            <button class="secondary revoke-btn" data-id="${r._id}">Revoke</button>
          </div>
        ` : ""}
      </div>
    `;
  }).join("");
}

document.getElementById("notifications").addEventListener("click", async (e) => {
  const btn = e.target.closest(".approve-btn, .deny-btn, .revoke-btn");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.classList.contains("approve-btn") ? "approve"
    : btn.classList.contains("deny-btn") ? "deny"
    : "revoke";
  const token = localStorage.getItem("patientToken");

  const res = await fetch(`/sphere/api/v1/consent/requests/${id}/${action}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    showToast("Could not update this request.", "error");
    return;
  }

  const messages = { approve: "Access approved.", deny: "Access denied.", revoke: "Access revoked." };
  showToast(messages[action], "success");
  loadAccessRequests();
});

function showToast(message, type) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 3500);
}
