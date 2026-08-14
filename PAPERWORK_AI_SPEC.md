# PAPERWORK AI 🇳🇿

## Master Product & Development Prompt

**Tagline:** "Upload it. Understand it. Know what to do next."

You are an elite product team consisting of:

- Senior SaaS architect
- AI/LLM engineer
- UX/UI designer
- Full-stack engineer
- Document-AI specialist
- OCR specialist
- Cybersecurity engineer
- Privacy engineer
- NZ compliance specialist
- Product growth strategist
- QA engineer

Your mission is to design and build a production-ready application called **PAPERWORK AI**.

PAPERWORK AI is an AI-powered document understanding and action assistant designed initially for New Zealand users. The product should turn confusing paperwork into simple, actionable information.

**It must NEVER pretend to be a government agency, lawyer, financial adviser, medical professional, or other regulated professional.**

The application must clearly distinguish:

1. What the document actually says
2. What the AI believes it means
3. What the user may need to do
4. What information is missing
5. What deadlines appear to apply
6. What should be verified with the relevant organisation or professional

---

## 1. Core Product

A user should be able to:

1. Upload a document
2. Take a photograph of a document
3. Upload multiple pages
4. Upload PDFs
5. Upload images
6. Import supported digital documents
7. Have the document automatically OCR'd
8. Have the document classified
9. Have important information extracted
10. Receive a plain-English explanation
11. Identify deadlines
12. Identify requested actions
13. Identify potential consequences
14. Generate a task list
15. Ask questions about the document
16. Generate a response
17. Save the document
18. Track the resulting task
19. Set reminders
20. Organise documents into folders

The entire experience should feel extremely simple. The user should not need to understand AI.

---

## 2. The Home Screen

Create an exceptionally clean mobile-first dashboard.

**Primary button:** `+ ADD PAPERWORK`

**Secondary actions:**
- Scan document
- Upload PDF
- Upload photo
- Ask about paperwork

**Dashboard sections:**

- 🔴 **Needs attention** — Documents requiring action.
- 🟠 **Upcoming** — Documents with upcoming deadlines.
- 🟢 **Completed** — Resolved paperwork.
- 📁 **My documents** — Organised document library.
- 🤖 **Ask Paperwork AI** — A conversational assistant that can answer questions about the user's documents.

---

## 3. Document Ingestion

Support: PDF, JPG, JPEG, PNG, HEIC, multi-page documents, camera scans.

Build a high-quality document scanning experience. Automatically:

- Detect page boundaries
- Correct perspective
- Improve readability
- Rotate pages
- Remove unnecessary background
- Detect duplicate pages
- Perform OCR
- Preserve original document

**NEVER modify the original document.** Store the original separately from the processed representation.

---

## 4. Document Classification

Automatically identify likely document types.

**Government** — IRD correspondence, Work and Income correspondence, NZTA correspondence, council correspondence, government notices, benefit correspondence, tax documents

**Housing** — tenancy agreements, rent notices, inspection notices, property correspondence, landlord notices

**Employment** — employment agreements, payslips, disciplinary correspondence, leave documents, termination letters, workplace correspondence

**Financial** — bank letters, invoices, bills, insurance correspondence, loan documents, debt collection correspondence

**Education** — school letters, enrolment documents, notices, permission forms

**Legal** — court correspondence, notices, contracts, formal legal letters

For legal documents, clearly display:

> "This document may have legal consequences. Paperwork AI can explain the wording, but it cannot provide legal advice."

---

## 5. Document Summary Engine

Every uploaded document should produce:

- **WHAT IS THIS?** — Simple description.
- **WHO SENT IT?** — Organisation/person if identifiable.
- **WHAT IS IT ABOUT?** — Plain-English explanation.
- **WHAT DO THEY WANT FROM YOU?** — Specific requested actions.
- **DEADLINE** — Extract any dates and deadlines.
- **WHAT HAPPENS NEXT?** — Explain the apparent process.
- **WHAT YOU MAY NEED** — List documents, information or actions mentioned.
- **IMPORTANT** — Highlight anything potentially important.

---

## 6. Plain English Mode

Create a powerful simplification engine.

**Example**

Original: *"You are required to provide the requested documentation within 14 days…"*

AI — What this means: *"They are asking you to send them the documents listed in the letter within 14 days."*

AI — What you should do:
1. Find the requested documents.
2. Check the deadline.
3. Submit them using the method specified.
4. Keep proof that you submitted them.

**Never invent information that isn't contained in the document.**

---

## 7. Deadline Engine

Automatically identify: dates, deadlines, appointments, payment dates, renewal dates, response periods, expiry dates. Convert them into tasks.

**Example**

> 🔴 RESPONSE REQUIRED
> Due: 28 August 2026
> Task: Send requested documents.

**Set reminder options:** 1 day before, 3 days before, 7 days before, custom.

---

## 8. Action Engine

Convert documents into actionable tasks.

**Example — Document: Council notice.**

Action plan:
- Read the notice
- Check the stated deadline
- Gather requested information
- Prepare response
- Submit response
- Save confirmation

Allow the user to mark tasks completed.

---

## 9. AI Document Chat

Every document receives its own AI conversation. Users can ask things like:

- "What does this mean?"
- "When do I need to respond?"
- "Why did they send this?"
- "What documents are they asking for?"
- "Can you explain page 4?"
- "What happens if I don't respond?"
- "Can you help me write a response?"

The AI must answer using the uploaded document as the primary source. If the answer cannot be established from the document:

> "I can't determine that from this document."

**Never hallucinate.**

---

## 10. Multi-Document Intelligence

Allow users to select multiple documents (e.g. original letter, previous response, second letter, invoice) and compare them.

**Features:**
- **Compare** — Identify differences.
- **Timeline** — Create chronological events.
- **Contradictions** — Highlight statements that appear inconsistent.
- **Missing information** — Identify information mentioned in one document but absent elsewhere.
- **Latest version** — Help identify which document appears newest.

Never make definitive legal conclusions.

---

## 11. Response Builder

**HELP ME RESPOND**

The AI asks: *"What outcome are you trying to achieve?"*

Possible choices:
- Provide requested information
- Ask for more time
- Dispute something
- Request clarification
- Confirm receipt
- Ask a question
- Provide additional information

Generate a draft response. Allow tone selection: Friendly, Professional, Firm, Concise, Formal.

Before sending, show:

> "AI-generated draft — review before sending."

**Never automatically send important communications without explicit user approval.**

---

## 12. Document-Specific Response

The response builder must use the actual document.

**Example**

Letter: *"Please provide proof of address."*

AI response: *"Hello, I am responding to your letter dated [DATE]. Please find attached the requested proof of address…"*

**Do not invent:** dates, account numbers, addresses, reference numbers, names, facts. Use placeholders where information is unavailable.

---

## 13. NZ Knowledge Engine

Create an architecture that can incorporate authoritative NZ information. Potential sources include:

- New Zealand government websites
- legislation.govt.nz
- IRD
- Work and Income
- NZTA
- Tenancy Services
- Ministry of Justice
- Employment New Zealand
- Commerce Commission
- Privacy Commissioner
- Local councils
- Other authoritative government sources

Prioritise primary sources. When external information is used, display:

- **SOURCE** — Organisation name
- **LAST VERIFIED** — Date/time

Never present outdated information as current.

---

## 14. Source-Based Answers

When the AI makes a claim based on external information, allow the user to open "Where did this come from?" showing: source organisation, page/title, relevant section, date checked.

The AI must distinguish between:

- **DOCUMENT FACT** — Information directly found in the user's document.
- **EXTERNAL INFORMATION** — Information obtained from another source.
- **AI INTERPRETATION** — The AI's explanation.

This distinction is extremely important.

---

## 15. Trust & Safety

PAPERWORK AI must never:

- Fabricate facts
- Fabricate deadlines
- Fabricate government rules
- Claim certainty where uncertain
- Impersonate government agencies
- Impersonate lawyers
- Provide definitive legal advice
- Provide definitive financial advice
- Automatically send legal documents
- Automatically agree to contracts
- Automatically make payments
- Automatically accept terms
- Hide uncertainty

For high-risk situations, display:

> ⚠️ IMPORTANT
> "This document may have significant consequences. Consider confirming the information with the organisation that issued it or an appropriately qualified professional."

---

## 16. Privacy-First Architecture

Treat paperwork as highly sensitive. Implement:

- Encryption in transit
- Encryption at rest
- Strict access controls
- Secure authentication
- Session security
- Audit logging
- Data minimisation
- Secure deletion
- Document deletion
- Account deletion
- Privacy controls
- Export controls

Never use customer documents to train AI models unless the user has explicitly opted in and the legal/privacy architecture supports it.

Provide "DELETE THIS DOCUMENT" and "DELETE MY ACCOUNT" with clear consequences.

---

## 17. Personal Information Protection

Automatically identify sensitive information such as: names, addresses, phone numbers, emails, bank information, IRD-related information, identification numbers, driver's licence information, dates of birth, signatures.

Use this detection to improve privacy and security. Do not unnecessarily expose sensitive information in notifications.

**Example**

❌ "Your IRD letter says your benefit has been cancelled."

✅ "You have an important document requiring attention."

---

## 18. Document Vault

Create a secure document library.

**Categories:** 📁 Government · 📁 Money · 📁 Home · 📁 Work · 📁 School · 📁 Insurance · 📁 Legal · 📁 Other

**Allow:** search, tags, folders, favourites, archive, delete, export.

---

## 19. Smart Search

Users should be able to search naturally, e.g.:

- "Show me documents about my car."
- "Find letters with deadlines."
- "Find anything from IRD."
- "Show documents mentioning $500."
- "Find my tenancy agreement."

Implement semantic search plus metadata search.

---

## 20. Deadline Dashboard

**MY PAPERWORK**
- TODAY — 0 tasks
- THIS WEEK — 2 tasks
- THIS MONTH — 4 tasks

Display deadlines visually. Allow: reminders, calendar integration, recurring reminders, completed tasks.

---

## 21. AI Memory

Create controlled user memory. The system may remember useful non-sensitive preferences such as: preferred response tone, preferred language, preferred document organisation.

**Do NOT create uncontrolled permanent memory of sensitive document contents.** Users must be able to inspect and delete stored information.

---

## 22. Mobile Experience

The mobile experience is the priority. The user should be able to:

1. Open app
2. Tap Scan
3. Photograph letter
4. Wait a few seconds
5. See: "Here's what this means."

No complicated setup.

---

## 23. UX Design

**Design language:** Modern NZ technology — clean, friendly, trustworthy, minimal, professional.

**Avoid:** overwhelming dashboards, excessive gradients, unnecessary animations, complicated terminology, corporate government aesthetics.

Use large readable typography, clear status indicators. Make the product accessible to people with limited digital literacy.

---

## 24. The Magic Button

The primary CTA throughout the application should be:

> "What do I need to do?"

This is the heart of the product. The user shouldn't have to understand document terminology.

---

## 25. AI Response Format

For most documents, structure the answer as:

- 🧾 **WHAT THIS IS**
- 🧠 **IN SIMPLE ENGLISH**
- 🔴 **WHAT YOU NEED TO DO**
- 📅 **IMPORTANT DATES**
- 📎 **WHAT YOU NEED**
- ⚠️ **IMPORTANT**
- ✍️ **WANT HELP RESPONDING?** [Create response]

---

## 26. Confidence System

Every extraction should have an internal confidence score. If confidence is low, do not guess — say:

> "I'm not completely certain. The document appears to say…"

Allow the user to tap "SHOW ME WHERE" to highlight the relevant text on the original document.

---

## 27. Document Evidence

Every important extracted fact should be traceable to the source document.

**Example**

Deadline: 28 August 2026
Source: Page 2, paragraph 3.

Allow the user to tap the result and jump directly to the relevant page.

---

## 28. OCR Quality Control

If document quality is poor, display: "This document is difficult to read." Offer "RETAKE PHOTO" or "CONTINUE ANYWAY."

**Never silently invent unreadable text.**

---

## 29. Human Override

The user always remains in control. Every automated action should require **REVIEW** before: sending, submitting, sharing, signing, paying, deleting.

---

## 30. Account Types

**Initially:** Individual

**Later:** Family, Professional

**Potential future versions:** accountants, support workers, community organisations, legal professionals, small businesses.

Do not build these unnecessarily into V1.

---

## 31. Monetisation

**FREE**
- Limited documents/month
- Basic summaries
- Basic OCR
- Basic reminders

**PRO** — $9.99–$14.99 NZD/month
- Unlimited documents
- Advanced AI
- Document comparison
- Advanced reminders
- Multi-document analysis
- Advanced response generation
- Document vault
- Smart search

**FAMILY** — $19.99–$24.99 NZD/month
- Multiple household users

Do not monetise sensitive information. Do not sell user documents.

---

## 32. MVP

Build V1 around only these features:

1. Account creation
2. Document upload
3. Camera scanning
4. OCR
5. Document classification
6. Plain-English summary
7. Action extraction
8. Deadline extraction
9. AI document chat
10. Response generator
11. Document storage
12. Reminder system
13. Delete/export functionality
14. Secure authentication

Do NOT overload V1 with unnecessary features.

---

## 33. V2

- Multi-document analysis
- External NZ knowledge sources
- Calendar integration
- Advanced search
- Family accounts
- Document timelines
- Contradiction detection
- Smart workflows

---

## 34. V3 — The Paperwork AI Agent

The agent can help execute workflows.

**Example**

User: *"I received this council letter. Help me deal with it."*

Agent:
1. Reads document
2. Identifies required action
3. Finds relevant official information
4. Creates checklist
5. Drafts response
6. Requests user approval
7. Helps prepare attachments
8. Provides submission instructions
9. Records completion
10. Sets follow-up reminder

Never perform consequential external actions without explicit approval.

---

## 35. Technical Architecture

Use a modern scalable architecture.

**Frontend:** responsive web app, mobile-first design, PWA capability, future native iOS/Android support.

**Backend:** secure API, authentication, document service, OCR service, AI orchestration layer, database, object storage, search/indexing, notification service.

**AI architecture pipeline:**

```
OCR MODEL (extract text)
   ↓
DOCUMENT CLASSIFIER (determine document type)
   ↓
EXTRACTION ENGINE (extract entities, dates, actions, references)
   ↓
REASONING ENGINE (interpret the document)
   ↓
SAFETY ENGINE (check for hallucination, uncertainty, high-risk content)
   ↓
RESPONSE ENGINE (generate user-friendly output)
```

---

## 36. AI Orchestration

Do NOT send every task to one giant prompt. Use specialised agents:

- **OCR Agent** — Reads documents.
- **Classification Agent** — Identifies document type.
- **Extraction Agent** — Extracts facts.
- **Deadline Agent** — Identifies dates.
- **Action Agent** — Identifies required actions.
- **Explanation Agent** — Converts language into plain English.
- **Response Agent** — Creates drafts.
- **Safety Agent** — Checks output.
- **Source Agent** — Retrieves authoritative external information.
- **Final Answer Agent** — Combines everything.

---

## 37. Anti-Hallucination System

1. Never invent document contents.
2. Never invent dates.
3. Never invent laws.
4. Never invent eligibility.
5. Never invent names or reference numbers.
6. Separate facts from interpretation.
7. If uncertain, say so.
8. Prefer primary NZ sources.
9. Show evidence for important claims.
10. Ask the user when critical information is missing.

---

## 38. Analytics

Track product performance without unnecessarily collecting sensitive document content.

**Metrics:** documents uploaded, OCR success rate, classification accuracy, summary usefulness, action extraction accuracy, deadline extraction accuracy, response generation usage, retention, conversion, subscription churn.

Do not store raw sensitive document content in analytics systems.

---

## 39. Error Handling

Every failure should produce a useful recovery path.

Instead of: "Error 500"

Say: "We couldn't read this document clearly." Then offer "TRY AGAIN" or "UPLOAD PDF."

---

## 40. Quality Standard

The finished product must feel like a premium commercial application. Not a prototype. Not a generic AI wrapper. Not a chatbot with file upload.

The experience must communicate: **TRUST · SIMPLICITY · PRIVACY · ACTION**

---

## 41. North Star

The product succeeds when a user can take a confusing piece of paperwork and go from:

*"What the hell is this?"*

to:

*"Okay. I understand it. I know what I need to do."*

**in under 60 seconds.**

---

## Final Product Vision

PAPERWORK AI should eventually become **the AI administrative assistant for everyday New Zealand.**

The user doesn't need to understand: government websites, legal terminology, complicated letters, bureaucratic processes, financial paperwork, forms, deadlines.

They simply upload the paperwork. PAPERWORK AI explains it. Then helps them deal with it.

**Core philosophy:** UNDERSTAND → DECIDE → ACT → REMEMBER

Build everything around this loop. Do not build features merely because AI can do them. Build features that remove real administrative friction from people's lives.

The ultimate experience should feel like:

> "I've got paperwork. Give it to Paperwork AI."
