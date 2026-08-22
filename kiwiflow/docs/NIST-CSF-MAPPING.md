# NIST Cybersecurity Framework (CSF 2.0) mapping

This maps KiwiFlow's actual technical controls to the NIST CSF 2.0's six
functions (Govern, Identify, Protect, Detect, Respond, Recover). It's a
voluntary self-assessment, which is the honest thing to call it: **NIST CSF
has no certification body and no certificate to earn** — unlike SOC 2 or ISO
27001, there is nothing to be "NIST certified" in. Some contracts (mostly
U.S. federal or defense-adjacent) require conformance to specific NIST
publications like SP 800-53 or SP 800-171 instead, which are a different,
much heavier undertaking (formal control baselines, a System Security Plan,
often a third-party assessor) — nothing here should be read as meeting those.
If a real customer contract specifies one of those, that needs its own scope
discussion, not this document.

Same rule as `SECURITY.md`: every line below is either something in this
codebase right now, or explicitly marked as a gap. Nothing is described as
"in place" on the strength of intent.

## GOVERN (GV)

The function CSF 2.0 added to cover policy, roles, and risk strategy — and
the one this document can least speak for, since it's organizational, not
code.

| Area | Status |
|---|---|
| Documented security posture | `SECURITY.md` + this file. Real, but self-written, not board-approved policy. |
| Named accountable role/security officer | **Gap.** No designated owner exists in any artifact this repo can see. |
| Risk register / formal risk assessment | **Gap.** The closest thing is the informal gap lists in `SECURITY.md`. |
| Vendor/supply-chain risk management | **Gap** beyond Dependabot tracking direct npm dependencies (see PROTECT). No process for evaluating the hosting provider, email/SMS providers, the Anthropic API (AI grading estimate), or Xero (accounting sync), etc. |
| Data retention policy | **Gap** — noted in `SECURITY.md`: `AuditLog`/`LoginAttempt`/`SignupAttempt` retention is currently unbounded. |

## IDENTIFY (ID)

| Area | Status |
|---|---|
| Asset inventory | Implicit in `prisma/schema.prisma` and `docs/BLUEPRINT.md` — every data asset is a documented model, not a formal inventory artifact. |
| Data classification | Informal. Financial (invoices, Xero sync state), compliance (spray diary, maturity tests, coolstore logs, biosecurity inspections, NZGAP/GLOBALG.A.P. certification records), wage/hours (`TimeEntry`/`PieceRateRecord`/`WageTopUp` — worker PII plus pay data), health & safety (`SafetyIncident` — can include injury/medical detail), and general PII (names/emails/phones) are all identifiable in the schema but not labeled by sensitivity tier anywhere. |
| Tenant/trust boundary mapping | Documented in `SECURITY.md`: application-layer `organizationId` scoping, not database-enforced RLS (the Hatchable deployment differs — real Postgres RLS there). This is the single most important ID-function gap: it means the boundary depends on every query author remembering to scope it. |
| Third-party dependency inventory | `package.json` + `.github/dependabot.yml` (repo root) — real, automated, current. |

## PROTECT (PR)

The strongest-covered function, since most of what's shippable from a
codebase alone lands here.

| Area | Status |
|---|---|
| Identity management (PR.AA) | Email/password + bcrypt hashing (`lib/auth/password.ts`), optional TOTP MFA with backup codes (`lib/auth/totp.ts`), session as a signed JWT in an `httpOnly`/`secure`/`sameSite=lax` cookie (`lib/auth/session.ts`). |
| Access control (PR.AA) | Role checks (`OWNER`/`MANAGER` vs `FIELD`/`DRIVER`/`VIEWER`) enforced server-side in every Server Action, not just hidden in the UI (`lib/auth/requireRole.ts`). `ADMIN` is a single, deliberate, non-self-serve cross-tenant exception, audit-logged on every access. |
| Rate limiting / brute-force protection | `lib/auth/rateLimit.ts` — 5 failed logins/15min lockout per email, MFA verification rate-limited the same way, signup capped per IP. |
| Data-in-transit protection | HTTPS enforced via `Strict-Transport-Security` (`next.config.ts`); `upgrade-insecure-requests` in the CSP. |
| Platform hardening | CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (`next.config.ts`) — see `SECURITY.md` for the one known, deliberately-accepted gap (`'unsafe-inline'` in the CSP, and exactly why the stricter nonce-based version was reverted after it broke in testing). |
| Secure defaults on new features | Server-side re-validation of client input against the actual authorization state on every mutation (e.g. broadcast recipients re-checked against `ContractorLink`, not trusted from the posted form — `app/(app)/broadcasts/actions.ts`). |
| Secrets management | **Gap** — plain environment variables (`AUTH_SECRET`, `ANTHROPIC_API_KEY` etc.), no secrets manager or rotation policy. Concretely worse for `Organization.xeroAccessToken`/`xeroRefreshToken` (see `SECURITY.md`): those are plain, unencrypted database columns holding a long-lived credential to a customer's real external accounting system, not just app-internal secrets. Adequate for the current single-deployment scale, not for a team of engineers with prod access, and not for Xero sync moving past scaffold status. |
| Dependency/vulnerability management | `.github/dependabot.yml`, weekly. One known current advisory tracked honestly in `SECURITY.md` rather than hidden. |

## DETECT (DE)

| Area | Status |
|---|---|
| Security event logging | `lib/audit.ts` → `AuditLog` table: signup, login success/failure, MFA enable/disable/failed attempts, ADMIN cross-org access, material order and job-driver-assignment mutations, minimum-wage top-up payments, health & safety incident reports, certification status changes, and Xero invoice push attempts. Visible in-app (Settings for org-scoped, Admin overview for cross-org). |
| Domain-event logging | `JobStatusHistory` — a full, timestamped, actor-attributed history independent of `AuditLog`, for the job lifecycle specifically. |
| Automated vulnerability detection | Dependabot (PROTECT and DETECT overlap here — same control, different lens). |
| Centralized monitoring / alerting | **Gap.** No SIEM, no anomaly detection, no paging on suspicious activity (e.g. a spike in failed logins is recorded in `LoginAttempt` but nothing currently reads that table proactively). |
| Anomaly detection | **Gap.** Rate-limit lockouts are a blunt, fixed-threshold control, not adaptive detection. The RSE hours-compliance flag (`lib/payroll.ts`) is the same kind of control applied to a business domain rather than security — a fixed, operator-set threshold checked on page load, not proactive alerting or a legal determination. |

## RESPOND (RS)

| Area | Status |
|---|---|
| Documented incident response plan | **Gap.** Nothing exists — no runbook, no defined severity tiers, no communication plan. |
| Forensic trail to respond with | Real, via `AuditLog` + `JobStatusHistory` + `LoginAttempt`/`SignupAttempt` — the *inputs* an incident response process would use exist; the *process* itself doesn't. |
| Account containment tools | Partial: `disableMfaAction` requires both password and current code (can't be used to lock someone out via a stolen session alone), but there's no admin "force logout everywhere" or "disable this account" action yet. |

## RECOVER (RC)

| Area | Status |
|---|---|
| Backup strategy | **Gap in this document's control.** Dev uses SQLite (`dev.db`, file-based); production database backup/restore is a property of the hosting platform's configuration, not this codebase — not verified or documented here. |
| Tested restore procedure | **Gap.** No evidence of a tested restore in this repo. |
| Defined RTO/RPO | **Gap.** Not defined anywhere. |
| Post-incident review process | **Gap.** No template or process exists. |

## Honest summary

PROTECT and (to a lesser extent) DETECT are where actual engineering effort
has gone, and it shows: authentication, access control, audit logging, and
platform hardening are real and mostly current. GOVERN, RESPOND, and RECOVER
are close to empty — those are organizational processes a codebase can't
supply on its own, and pretending otherwise here would be exactly the kind
of compliance theater this document exists to avoid. If KiwiFlow needs to
credibly claim CSF alignment to a customer, the next real step is GOVERN and
RESPOND: naming an accountable owner and writing an actual incident response
runbook, not more code.
