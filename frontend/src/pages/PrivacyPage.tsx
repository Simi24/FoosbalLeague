import { Link } from "react-router-dom";

import { Footer } from "@/components/layout";

const h2 = "mb-3 mt-8 text-xl font-bold tracking-tight text-ink";
const p = "mb-3 text-sm leading-relaxed text-ink-soft";
const ul = "mb-3 ml-5 list-disc space-y-1 text-sm leading-relaxed text-ink-soft";
const strong = "font-bold text-ink";

export const PrivacyPage = () => (
  <div className="flex min-h-screen flex-col bg-paper">
    <main className="mx-auto w-full max-w-3xl flex-1 p-4 md:p-8">
      <Link
        to="/"
        className="mb-6 inline-block text-xs font-bold uppercase tracking-wide text-ink-soft hover:text-ink"
      >
        ← Back
      </Link>

      <h1 className="mb-2 text-3xl font-bold tracking-tight text-ink md:text-4xl">
        Privacy Policy
      </h1>
      <p className="mb-6 text-xs font-mono uppercase tracking-wider text-ink-muted">
        Last updated: 05-05-2026
      </p>

      <p className={p}>
        This Privacy Policy describes how Foosrank ("we", "the Service") collects, uses,
        and protects users' personal data, in compliance with Regulation (EU) 2016/679
        ("GDPR").
      </p>

      <h2 className={h2}>1. Data controller</h2>
      <p className={p}>The data controller is:</p>
      <p className={p}>
        <span className={strong}>Simone Paolo Petta</span>
        <br />
        Natural person, Italy
        <br />
        Contact email: privacy@foosrank.app
      </p>
      <p className={p}>
        For any question, request, or to exercise the rights granted by GDPR, you can
        write to the email above.
      </p>

      <h2 className={h2}>2. Data we collect</h2>
      <p className={p}>Foosrank collects and processes the following personal data:</p>
      <p className={p}>
        <span className={strong}>
          Data provided directly by the user during registration and use of the Service:
        </span>
      </p>
      <ul className={ul}>
        <li>Email address</li>
        <li>Username / display name</li>
        <li>Password (stored in encrypted form via Amazon Cognito)</li>
      </ul>
      <p className={p}>
        <span className={strong}>Data generated through use of the Service:</span>
      </p>
      <ul className={ul}>
        <li>Recorded matches (players involved, result, date, league)</li>
        <li>ELO rating and rating history</li>
        <li>Unlocked achievements</li>
        <li>League membership</li>
        <li>Match confirmations or disputes</li>
      </ul>
      <p className={p}>
        <span className={strong}>Technical data:</span>
      </p>
      <ul className={ul}>
        <li>IP address (at the time of access)</li>
        <li>Authentication and API usage logs</li>
        <li>Refresh token stored in browser localStorage to maintain the active session</li>
      </ul>
      <p className={p}>
        Foosrank <span className={strong}>does not collect</span> special categories of
        data (ethnic origin, political opinions, health data, etc.) or payment data, as
        the Service is free.
      </p>

      <h2 className={h2}>3. Purposes and legal basis for processing</h2>
      <p className={p}>Data is processed for the following purposes:</p>
      <div className="mb-3 overflow-x-auto">
        <table className="brut-border w-full text-left text-sm">
          <thead className="bg-paper-alt">
            <tr>
              <th className="border-b-2 border-ink px-3 py-2 font-bold text-ink">
                Purpose
              </th>
              <th className="border-b-2 border-ink px-3 py-2 font-bold text-ink">
                Legal basis
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-b border-ink/10 px-3 py-2 text-ink-soft">
                Account creation and management
              </td>
              <td className="border-b border-ink/10 px-3 py-2 text-ink-soft">
                Performance of a contract (art. 6.1.b GDPR)
              </td>
            </tr>
            <tr>
              <td className="border-b border-ink/10 px-3 py-2 text-ink-soft">
                Service functionality (match recording, ELO calculation, leaderboard)
              </td>
              <td className="border-b border-ink/10 px-3 py-2 text-ink-soft">
                Performance of a contract (art. 6.1.b GDPR)
              </td>
            </tr>
            <tr>
              <td className="border-b border-ink/10 px-3 py-2 text-ink-soft">
                Sending transactional emails (registration confirmation, match notifications)
              </td>
              <td className="border-b border-ink/10 px-3 py-2 text-ink-soft">
                Performance of a contract (art. 6.1.b GDPR)
              </td>
            </tr>
            <tr>
              <td className="border-b border-ink/10 px-3 py-2 text-ink-soft">
                Security, abuse prevention, Service integrity
              </td>
              <td className="border-b border-ink/10 px-3 py-2 text-ink-soft">
                Legitimate interest (art. 6.1.f GDPR)
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-ink-soft">
                Compliance with legal obligations
              </td>
              <td className="px-3 py-2 text-ink-soft">
                Legal obligation (art. 6.1.c GDPR)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className={h2}>4. Processing methods and service providers (data processors)</h2>
      <p className={p}>
        Data is processed by electronic means, with appropriate technical and
        organizational measures to ensure its security. Data is hosted exclusively on
        cloud infrastructure in the <span className={strong}>Europe (Ireland)</span>{" "}
        region.
      </p>
      <p className={p}>
        To provide the Service, we rely on the following providers, acting as data
        processors pursuant to art. 28 GDPR:
      </p>
      <ul className={ul}>
        <li>
          <span className={strong}>Amazon Web Services EMEA SARL (AWS)</span> —
          infrastructure hosting (Cognito for authentication, DynamoDB for database,
          Lambda and API Gateway for backend, S3 and CloudFront for frontend, SES for
          email delivery). Storage region: EU (Ireland), eu-west-1. CloudFront operates
          as a global CDN; content distributed via CloudFront is static (frontend) and
          contains no personal data.
        </li>
        <li>
          <span className={strong}>Cloudflare, Inc.</span> — DNS management and domain
          protection.
        </li>
      </ul>
      <p className={p}>
        Data Processing Agreements compliant with GDPR are in place with all providers.
      </p>

      <h2 className={h2}>5. Transfer of data outside the EU</h2>
      <p className={p}>
        Personal data is stored in the AWS Europe (Ireland) region and is not
        transferred outside the European Union for storage and primary processing
        purposes.
      </p>
      <p className={p}>
        Cloudflare, as DNS and CDN provider, may process technical metadata (e.g. DNS
        requests, IP addresses) outside the EU. Such processing is covered by Standard
        Contractual Clauses approved by the European Commission.
      </p>

      <h2 className={h2}>6. Data retention period</h2>
      <p className={p}>
        Personal data is retained for the time necessary for the purposes for which it
        was collected:
      </p>
      <ul className={ul}>
        <li>
          Account data: for the duration of use of the Service. Upon account deletion,
          identifying personal data (email, username) is deleted within 30 days;
          historical matches are anonymized to preserve the integrity of leagues in
          which other users participated.
        </li>
        <li>Technical and authentication logs: maximum 12 months.</li>
        <li>System backups: maximum 30 days.</li>
      </ul>

      <h2 className={h2}>7. User rights</h2>
      <p className={p}>
        In accordance with articles 15-22 of GDPR, the user has the right to:
      </p>
      <ul className={ul}>
        <li>
          <span className={strong}>Access</span> their personal data
        </li>
        <li>
          <span className={strong}>Rectification</span> of inaccurate or incomplete data
        </li>
        <li>
          <span className={strong}>Erasure</span> of their data ("right to be
          forgotten")
        </li>
        <li>
          <span className={strong}>Restriction</span> of processing
        </li>
        <li>
          <span className={strong}>Portability</span> of data in structured, readable
          format
        </li>
        <li>
          <span className={strong}>Object</span> to processing for legitimate reasons
        </li>
        <li>
          <span className={strong}>Withdraw consent</span> at any time, where applicable
        </li>
      </ul>
      <p className={p}>
        The right to access and portability can be exercised directly by the user
        through the "Export my data" feature available in account settings.
      </p>
      <p className={p}>
        The right to erasure can be exercised through the "Delete my account" feature
        in settings.
      </p>
      <p className={p}>
        To exercise other rights or for any request, the user can write to{" "}
        <span className={strong}>privacy@foosrank.app</span>. We will respond within 30
        days.
      </p>
      <p className={p}>
        The user also has the right to lodge a complaint with the Italian supervisory
        authority, the{" "}
        <span className={strong}>
          Garante per la protezione dei dati personali
        </span>{" "}
        (www.garanteprivacy.it), or with the supervisory authority of their country of
        residence within the EU.
      </p>

      <h2 className={h2}>8. Cookies and similar technologies</h2>
      <p className={p}>Foosrank exclusively uses:</p>
      <ul className={ul}>
        <li>
          <span className={strong}>Technical session cookies</span> managed by Amazon
          Cognito, necessary to keep the user authenticated. These cookies do not
          require consent under applicable law.
        </li>
        <li>
          <span className={strong}>Refresh token</span> stored in browser localStorage,
          used to renew the session without requiring a new login. This is also
          considered strictly necessary for Service functionality.
        </li>
      </ul>
      <p className={p}>
        Foosrank <span className={strong}>does not use</span> profiling cookies,
        third-party cookies, analytics tools, or advertising trackers.
      </p>

      <h2 className={h2}>9. Minimum age</h2>
      <p className={p}>
        The Service is intended for users who are at least{" "}
        <span className={strong}>16 years old</span>. We do not knowingly collect data
        from minors under 16. If we become aware that we have collected data from a
        minor under 16 without parental or guardian consent, we will proceed with its
        deletion.
      </p>

      <h2 className={h2}>10. Changes to this policy</h2>
      <p className={p}>
        We reserve the right to modify this Privacy Policy at any time. Changes will be
        published on this page with the date of last update indicated. In case of
        substantial changes, the user will be informed via email or notice within the
        Service.
      </p>

      <h2 className={h2}>11. Contact</h2>
      <p className={p}>
        For any question relating to this Privacy Policy or to the processing of
        personal data:
      </p>
      <p className={p}>
        <span className={strong}>Email:</span> privacy@foosrank.app
      </p>
    </main>
    <Footer />
  </div>
);
