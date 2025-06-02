import React from "react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
    const appName = "Text2Question";
    const companyName = "Text2Question";
    const contactEmail = "miguel07alm@protonmail.com";
    const effectiveDate = "May 4, 2025"; 
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return (
        <div className="min-h-screen p-8 max-w-3xl mx-auto prose dark:prose-invert">
            <h1>{appName} Privacy Policy</h1>
            <p>
                <strong>Effective Date:</strong> {effectiveDate}
            </p>

            <p>
                {companyName} ("us", "we", or "our") operates the {appName} website
                ({appUrl}) (the "Service"). This page informs you of our policies
                regarding the collection, use, and disclosure of personal data when
                you use our Service and the choices you have associated with that
                data, in compliance with the General Data Protection Regulation
                (GDPR).
            </p>

            <h2>1. Data Controller</h2>
            <p>The data controller for your personal data is:</p>
            <p>
                {companyName}
                <br />
                Email: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </p>

            <h2>2. Information We Collect</h2>
            <p>
                We collect several different types of information for various
                purposes to provide and improve our Service to you.
            </p>
            <h3>a) Personal Data You Provide:</h3>
            <ul>
                <li>
                    <strong>Account Information (via Google Login):</strong> When
                    you register or log in using Google, we collect basic profile
                    information from your Google account, such as your name, email
                    address, and unique Google identifier. We use this to create
                    and manage your {appName} account.
                </li>
                <li>
                    <strong>Payment Information (via Stripe):</strong> When you
                    purchase Credits, the transaction is processed directly by
                    Stripe. We do not store your full credit or debit card details.
                    Stripe provides us with limited transaction information (like
                    payment success and an identifier) so we can credit your
                    account. Stripe acts as an independent data controller for the
                    payment data it processes. You can review Stripe's privacy
                    policy{" "}
                    <a
                        href="https://stripe.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        here
                    </a>
                    .
                </li>
                <li>
                    <strong>User Content:</strong> The text you provide for question
                    generation.
                </li>
                <li>
                    <strong>Communications:</strong> If you contact us directly
                    (e.g., via email), we may keep a record of that correspondence.
                </li>
            </ul>
            <h3>b) Usage Data (Collected Automatically):</h3>
            <ul>
                <li>
                    <strong>Log and Usage Information:</strong> We collect
                    information on how you access and use the Service, such as your
                    IP address, browser type, pages visited, time spent on pages,
                    number of generations performed (to enforce daily and credit
                    limits), and other diagnostic data. We use Redis (Upstash) to
                    manage usage limits and temporarily store purchased credits
                    associated with your user ID.
                </li>
                {/* Add if using specific cookies beyond session/auth
                <li><strong>Cookies and Similar Technologies:</strong> We use essential cookies for authentication and site operation. [Briefly describe if you use other cookies, e.g., for basic analytics, and how to manage them].</li>
                */}
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information for various purposes:</p>
            <ul>
                <li>
                    To provide and maintain our Service (including question
                    generation and limit/credit management).
                </li>
                <li>To manage your account and authenticate you.</li>
                <li>To process your payments for Credits via Stripe.</li>
                <li>To notify you about changes to our Service.</li>
                <li>To provide customer support.</li>
                <li>
                    To monitor the usage of our Service and detect/prevent
                    technical or security issues.
                </li>
                <li>To comply with legal obligations.</li>
            </ul>

            <h2>4. Legal Basis for Processing (GDPR)</h2>
            <p>
                If you are from the European Economic Area (EEA), our legal basis
                for collecting and using the personal information described in this
                Privacy Policy depends on the Personal Data we collect and the
                specific context in which we collect it:
            </p>
            <ul>
                <li>
                    <strong>Contractual Necessity:</strong> We need to process your
                    information to perform our contract with you (e.g., to provide
                    the Service you requested, manage your account, process Credit
                    purchases).
                </li>
                <li>
                    <strong>Consent:</strong> You have given us consent to do so
                    (e.g., by logging in with Google).
                </li>
                <li>
                    <strong>Legitimate Interests:</strong> The processing is in our
                    legitimate interests and it's not overridden by your rights
                    (e.g., to monitor and improve our Service, prevent fraud).
                </li>
                <li>
                    <strong>Legal Obligations:</strong> To comply with the law.
                </li>
            </ul>

            <h2>5. Data Sharing and Disclosure</h2>
            <p>
                We do not sell your personal data. We may share your information
                with third-party service providers only in the following
                circumstances:
            </p>
            <ul>
                <li>
                    <strong>AI Service Providers (OpenAI/Deepseek):</strong> The
                    text you provide is sent to our AI providers (currently OpenAI
                    and/or Deepseek) to generate the questions. These providers
                    process the data according to their own privacy policies. We do
                    not send your user ID or other personally identifiable
                    information directly to the AI providers along with the text.
                </li>
                <li>
                    <strong>Payment Processor (Stripe):</strong> To process your
                    Credit purchases.
                </li>
                <li>
                    <strong>Authentication (Google):</strong> To enable login via
                    your Google account.
                </li>
                <li>
                    <strong>Storage and Limit Management (Redis/Upstash):</strong>{" "}
                    To manage usage limits and purchased credits.
                </li>
                <li>
                    <strong>Legal Compliance:</strong> If required by law or in
                    response to valid requests by public authorities.
                </li>
            </ul>

            <h2>6. Data Security</h2>
            <p>
                The security of your data is important to us. We use reasonable
                security measures (technical and organizational) to protect your
                personal data against unauthorized access, alteration, disclosure,
                or destruction. However, remember that no method of transmission
                over the Internet or method of electronic storage is 100% secure.
            </p>

            <h2>7. Data Retention</h2>
            <p>
                We will retain your personal data only for as long as is necessary
                for the purposes set out in this Privacy Policy (e.g., while you
                maintain an active account) or as needed to comply with our legal
                obligations, resolve disputes, and enforce our agreements.
            </p>

            <h2>8. Your Data Protection Rights under GDPR</h2>
            <p>
                If you are a resident of the EEA, you have certain data protection
                rights:
            </p>
            <ul>
                <li>
                    The right to access, update, or delete the information we have
                    on you.
                </li>
                <li>The right of rectification.</li>
                <li>The right to object to processing.</li>
                <li>The right of restriction of processing.</li>
                <li>The right to data portability.</li>
                <li>The right to withdraw consent.</li>
            </ul>
            <p>
                You can exercise these rights by contacting us at{" "}
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. Please note
                that we may ask you to verify your identity before responding to
                such requests.
            </p>
            <p>
                You also have the right to complain to a Data Protection Authority
                about our collection and use of your Personal Data.
            </p>

            <h2>9. International Data Transfers</h2>
            <p>
                Your information, including Personal Data, may be transferred to —
                and maintained on — computers located outside of your state,
                province, country, or other governmental jurisdiction where the data
                protection laws may differ from those of your jurisdiction. Our
                service providers (like Google, Stripe, Upstash, OpenAI, Deepseek)
                may operate globally.
            </p>

            <h2>10. Changes to This Privacy Policy</h2>
            <p>
                We may update our Privacy Policy from time to time. We will notify
                you of any changes by posting the new Privacy Policy on this page
                and updating the "effective date" at the top. You are advised to
                review this Privacy Policy periodically for any changes.
            </p>

            <h2>11. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <p>
                By email:{" "}
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </p>

            <p>
                <strong>
                    Please also review our{" "}
                    <Link href="/terms-of-service">Terms of Service</Link>.
                </strong>
            </p>
        </div>
    );
}
