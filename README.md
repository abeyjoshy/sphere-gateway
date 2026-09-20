# SPHERE Gateway

**S**ecure **P**atient **HE**alth **R**ecord **E**xchange — the central cloud service in the SPHERE health information exchange prototype.

SPHERE is a conceptual framework, developed through MSc research at the University of Galway, for exchanging patient records across independently-run hospital, GP, and pharmacy systems without replacing any of them. This repository is the cloud repository at the centre of that framework: it stores the aggregated FHIR record, enforces patient consent on every read, and serves the embedded widget that hospital systems use to connect.

Read the full write-up: **https://abeyjoshy.com/sphere.html**

## Role in the SPHERE ecosystem

SPHERE is deliberately split across several independent services, each simulating a real, separately-owned system:

| Repo | Role |
|---|---|
| **sphere-gateway** (this repo) | The cloud FHIR API, consent engine, audit log, and embedded connection widget |
| [epic-hospital-demo](https://github.com/abeyjoshy/epic-hospital-demo) | A mock hospital EHR (MongoDB) |
| [evolve-gp-demo](https://github.com/abeyjoshy/evolve-gp-demo) | A mock GP practice system (PostgreSQL), with deliberately different native data shapes from Epic |
| [sphre-interconnect](https://github.com/abeyjoshy/sphre-interconnect) | The per-hospital translation layer that maps native records to/from HL7 FHIR and syncs them with SPHERE |

Neither mock EHR is ever modified to add SPHERE-specific logic — each interconnect talks to its local system the same way any external client would, over that system's own existing API.

## Architecture

- **FHIR-native storage.** Resources are stored as raw FHIR JSON (`Patient`, `Condition`, `AllergyIntolerance`, `MedicationStatement`), not mapped into a bespoke schema.
- **Push-based sync.** Local systems push data in via a FHIR transaction Bundle; SPHERE never reaches into a hospital's private network to pull it.
- **Consent-gated reads.** Every `$everything` read is checked against a real access-control model: pre-authorised providers read freely, unfamiliar providers need patient approval, and emergency access bypasses consent but is always logged and disclosed to the patient afterward.
- **Credential isolation.** The connection widget (`public/widget.html`) is embedded as an iframe in each hospital's own UI. A doctor's SPHERE login never touches the hospital's own page or backend, the same pattern Stripe Elements uses for card details.
- **Per-user accountability.** Every request is authenticated with a JWT tied to an individual doctor, not a shared hospital-wide credential, so every audit log entry is attributable to a specific clinician.

## API surface

```
POST   /sphere/api/v1/login
POST   /sphere/api/v1/register
GET    /sphere/api/v1/getMyRecord

GET    /sphere/api/v1/consent/requests
POST   /sphere/api/v1/consent/requests/:id/approve
POST   /sphere/api/v1/consent/requests/:id/deny
POST   /sphere/api/v1/consent/requests/:id/revoke
POST   /sphere/api/v1/patients/:id/access-requests
GET    /sphere/api/v1/audit-log

POST   /fhir                          (transaction Bundle push)
GET    /fhir/Patient                  (search, incl. ?identifier=)
GET    /fhir/Patient/:id
GET    /fhir/Patient/:id/$everything  (consent-gated aggregate read)
```

## Tech stack

Node.js · Express · MongoDB / Mongoose · JWT · HL7 FHIR

## Running locally

```bash
npm install
cp .env.example .env   # fill in your own Mongo connection details and JWT secret
npm run seed            # creates an admin user and demo doctor/patient accounts
npm start                # listens on APP_PORT (default 3000)
```

The widget is served statically at `/widget.html`; the patient consent portal at `/portal.html`.

## Status

This is a research prototype, not a production system. It demonstrates the architecture end-to-end locally; formal legal/GDPR review and hardening for production deployment are noted future work. See the [full write-up](https://abeyjoshy.com/sphere.html) for the complete framework, findings, and limitations.
