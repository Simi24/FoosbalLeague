# Privacy Policy

**Last updated:** 05-05-2026

This Privacy Policy describes how Foosrank ("we", "the Service") collects, uses, and protects users' personal data, in compliance with Regulation (EU) 2016/679 ("GDPR").

## 1. Data controller

The data controller is:

**Simone Paolo Petta**
Natural person, Italy
Contact email: privacy@foosrank.app

For any question, request, or to exercise the rights granted by GDPR, you can write to the email above.

## 2. Data we collect

Foosrank collects and processes the following personal data:

**Data provided directly by the user during registration and use of the Service:**
- Email address
- Username / display name
- Password (stored in encrypted form via Amazon Cognito)

**Data generated through use of the Service:**
- Recorded matches (players involved, result, date, league)
- ELO rating and rating history
- Unlocked achievements
- League membership
- Match confirmations or disputes

**Technical data:**
- IP address (at the time of access)
- Authentication and API usage logs
- Refresh token stored in browser localStorage to maintain the active session

Foosrank **does not collect** special categories of data (ethnic origin, political opinions, health data, etc.) or payment data, as the Service is free.

## 3. Purposes and legal basis for processing

Data is processed for the following purposes:

| Purpose | Legal basis |
|---------|-------------|
| Account creation and management | Performance of a contract (art. 6.1.b GDPR) |
| Service functionality (match recording, ELO calculation, leaderboard) | Performance of a contract (art. 6.1.b GDPR) |
| Sending transactional emails (registration confirmation, match notifications) | Performance of a contract (art. 6.1.b GDPR) |
| Security, abuse prevention, Service integrity | Legitimate interest (art. 6.1.f GDPR) |
| Compliance with legal obligations | Legal obligation (art. 6.1.c GDPR) |

## 4. Processing methods and service providers (data processors)

Data is processed by electronic means, with appropriate technical and organizational measures to ensure its security. Data is hosted exclusively on cloud infrastructure in the **Europe (Ireland)** region.

To provide the Service, we rely on the following providers, acting as data processors pursuant to art. 28 GDPR:

- **Amazon Web Services EMEA SARL (AWS)** — infrastructure hosting (Cognito for authentication, DynamoDB for database, Lambda and API Gateway for backend, S3 and CloudFront for frontend, SES for email delivery). Storage region: EU (Ireland), eu-west-1. CloudFront operates as a global CDN; content distributed via CloudFront is static (frontend) and contains no personal data.
- **Cloudflare, Inc.** — DNS management and domain protection.

Data Processing Agreements compliant with GDPR are in place with all providers.

## 5. Transfer of data outside the EU

Personal data is stored in the AWS Europe (Ireland) region and is not transferred outside the European Union for storage and primary processing purposes.

Cloudflare, as DNS and CDN provider, may process technical metadata (e.g. DNS requests, IP addresses) outside the EU. Such processing is covered by Standard Contractual Clauses approved by the European Commission.

## 6. Data retention period

Personal data is retained for the time necessary for the purposes for which it was collected:

- Account data: for the duration of use of the Service. Upon account deletion, identifying personal data (email, username) is deleted within 30 days; historical matches are anonymized to preserve the integrity of leagues in which other users participated.
- Technical and authentication logs: maximum 12 months.
- System backups: maximum 30 days.

## 7. User rights

In accordance with articles 15-22 of GDPR, the user has the right to:

- **Access** their personal data
- **Rectification** of inaccurate or incomplete data
- **Erasure** of their data ("right to be forgotten")
- **Restriction** of processing
- **Portability** of data in structured, readable format
- **Object** to processing for legitimate reasons
- **Withdraw consent** at any time, where applicable

The right to access and portability can be exercised directly by the user through the "Export my data" feature available in account settings.

The right to erasure can be exercised through the "Delete my account" feature in settings.

To exercise other rights or for any request, the user can write to **privacy@foosrank.app**. We will respond within 30 days.

The user also has the right to lodge a complaint with the Italian supervisory authority, the **Garante per la protezione dei dati personali** (www.garanteprivacy.it), or with the supervisory authority of their country of residence within the EU.

## 8. Cookies and similar technologies

Foosrank exclusively uses:

- **Technical session cookies** managed by Amazon Cognito, necessary to keep the user authenticated. These cookies do not require consent under applicable law.
- **Refresh token** stored in browser localStorage, used to renew the session without requiring a new login. This is also considered strictly necessary for Service functionality.

Foosrank **does not use** profiling cookies, third-party cookies, analytics tools, or advertising trackers.

## 9. Minimum age

The Service is intended for users who are at least **16 years old**. We do not knowingly collect data from minors under 16. If we become aware that we have collected data from a minor under 16 without parental or guardian consent, we will proceed with its deletion.

## 10. Changes to this policy

We reserve the right to modify this Privacy Policy at any time. Changes will be published on this page with the date of last update indicated. In case of substantial changes, the user will be informed via email or notice within the Service.

## 11. Contact

For any question relating to this Privacy Policy or to the processing of personal data:

**Email:** privacy@foosrank.app