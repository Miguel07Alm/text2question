import React from "react";
import Link from "next/link"; // Import Link

export default function TermsOfServicePage() {
    const appName = "Text2Question";
    const companyName = "Text2Question";
    const contactEmail = "miguel07alm@protonmail.com";
    const effectiveDate = "May 4, 2025"; 

    return (
        <div className="min-h-screen p-8 max-w-3xl mx-auto prose dark:prose-invert">
            <h1>{appName} Terms of Service</h1>
            <p>
                <strong>Effective Date:</strong> {effectiveDate}
            </p>

            <p>
                Welcome to {appName}. These Terms of Service ("Terms") govern your
                access to and use of our web application and related services
                (collectively, the "Service"), offered by {companyName}. By
                accessing or using the Service, you agree to be bound by these
                Terms.
            </p>

            <h2>1. Description of Service</h2>
            <p>
                {appName} is a tool that uses artificial intelligence (AI) to
                generate quiz questions from user-provided text. Users can log in
                using their Google account. The Service offers a daily limit of
                free generations. Registered users can purchase additional credits
                ("Credits") to increase their generation limit via our payment
                processor, Stripe.
            </p>

            <h2>2. User Accounts</h2>
            <p>
                To access certain features, such as a higher daily generation
                limit and the ability to purchase Credits, you must register and
                log in using your Google account. You are responsible for
                maintaining the confidentiality of your account and for all
                activities that occur under it. You agree to notify us
                immediately of any unauthorized use of your account.
            </p>

            <h2>3. Purchase and Use of Credits</h2>
            <p>
                Registered users can purchase packages of Credits (currently, 5
                Credits per purchase) through Stripe. Each Credit allows for one
                additional quiz generation beyond the free daily limit.
            </p>
            <ul>
                <li>
                    Payments are processed by Stripe and are subject to their terms
                    and conditions.
                </li>
                <li>
                    Purchased Credits are non-refundable, except where required by
                    law.
                </li>
                <li>Credits do not expire as long as your account is active.</li>
                <li>
                    We reserve the right to change the price and quantity of
                    Credits per package in the future, providing reasonable notice
                    of such changes.
                </li>
            </ul>

            <h2>4. Acceptable Use</h2>
            <p>
                You agree not to use the Service for any unlawful purpose or any
                purpose prohibited by these Terms. You shall not:
            </p>
            <ul>
                <li>
                    Use the Service in any manner that could damage, disable, or
                    overburden our servers or networks.
                </li>
                <li>Attempt to gain unauthorized access to any part of the Service.</li>
                <li>
                    Use the Service to generate illegal, harmful, defamatory, or
                    offensive content.
                </li>
                <li>Resell or sublicense access to the Service or Credits.</li>
            </ul>

            <h2>5. Intellectual Property</h2>
            <p>
                The Service and its original content (excluding user-generated
                content), features, and functionality are and will remain the
                exclusive property of {companyName} and its licensors. The content
                you provide for question generation remains your property, but you
                grant us a limited license to use it for the purpose of providing
                the Service.
            </p>

            <h2>6. AI Disclaimer</h2>
            <p>
                The Service uses AI to generate questions. While we strive for
                accuracy, we do not guarantee that the generated questions will
                always be correct, complete, or suitable for your purposes. AI may
                produce unexpected or inaccurate results. Use the generated content
                at your own risk and discretion.
            </p>

            <h2>7. Limitation of Liability</h2>
            <p>
                To the maximum extent permitted by applicable law, {companyName}
                shall not be liable for any indirect, incidental, special,
                consequential, or punitive damages, including without limitation,
                loss of profits, data, or use, whether in an action in contract,
                tort (including negligence), or otherwise, arising from or in
                connection with your access to or use of the Service.
            </p>

            <h2>8. Changes to Terms</h2>
            <p>
                We reserve the right to modify or replace these Terms at any
                time. If a revision is material, we will try to provide at least
                30 days' notice prior to any new terms taking effect. What
                constitutes a material change will be determined at our sole
                discretion.
            </p>

            <h2>9. Governing Law</h2>
            <p>
                These Terms shall be governed and construed in accordance with the
                laws of [Your Jurisdiction/Country], without regard to its
                conflict of law provisions.
            </p>

            <h2>10. Contact Us</h2>
            <p>
                If you have any questions about these Terms, please contact us at:{" "}
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
            </p>

            <p>
                <strong>
                    Please also review our{" "}
                    <Link href="/privacy-policy">Privacy Policy</Link> to understand
                    how we collect and use your information.
                </strong>
            </p>
        </div>
    );
}
