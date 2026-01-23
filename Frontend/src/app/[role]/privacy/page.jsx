import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Privacy Policy - Payment Module',
  description:
    'Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="text-accent-foreground pt-8 mt-3">
        <div className=" mx-auto md:px-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">
              Privacy Policy
            </h1>
            {/* <p className="text-lg opacity-90">Last updated: November 2025</p> */}
          </div>

          <Link href="/admin/setting" className="inline-block ml-4">
            <Button>Back</Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto px-4 py-6 mb-6">
        <div className="prose prose-invert max-w-none space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              1. Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We are committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your
              information when you use our Payment Module, including any other
              media form, media channel, mobile website, or mobile application
              related or connected to it.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              2. Information We Collect
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Personal Information
                </h3>
                <p>
                  We may collect personal information including but not limited
                  to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li>Your name and email address</li>
                  <li>Billing and shipping address</li>
                  <li>Payment card information</li>
                  <li>Phone number</li>
                  <li>Account credentials and preferences</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Automatic Information
                </h3>
                <p>
                  When you use our Payment Module, we may automatically collect
                  certain information including:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li>Your IP address and browser type</li>
                  <li>Pages visited and time spent on our module</li>
                  <li>Device information and operating system</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use the information we collect for various purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li>Processing transactions and sending related information</li>
              <li>Providing customer support and responding to inquiries</li>
              <li>Sending promotional communications (with your consent)</li>
              <li>Improving and optimizing our Payment Module</li>
              <li>
                Detecting, preventing, and addressing fraud or security issues
              </li>
              <li>Complying with legal obligations and disputes resolution</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              4. Data Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement comprehensive security measures to protect your
              personal information, including encryption, secure servers, and
              restricted access controls. However, no method of transmission
              over the Internet or electronic storage is 100% secure. While we
              strive to use commercially acceptable means to protect your
              personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              5. Sharing Your Information
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We do not sell, trade, or rent your personal information to third
              parties. We may share your information with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li>
                Service providers who assist us in operating our Payment Module
                and conducting our business
              </li>
              <li>
                Legal authorities when required by law or to protect our rights
              </li>
              <li>Business partners with your consent</li>
              <li>Professional advisors including lawyers and accountants</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              6. Cookies and Tracking
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Payment Module uses cookies and similar tracking technologies
              to enhance your experience. Cookies help us remember your
              preferences and understand how you use our service. You can
              control cookie settings through your browser, though this may
              affect the functionality of our module.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              7. Your Rights and Choices
            </h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Access and review your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of marketing communications</li>
                <li>Data portability in supported formats</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us using the
                information provided below.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              8. Children's Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Payment Module is not intended for children under 13 years of
              age. We do not knowingly collect personal information from
              children under 13. If we become aware that we have collected
              personal information from a child under 13, we will take steps to
              delete such information promptly.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              9. Changes to This Privacy Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time to reflect
              changes in our practices, technology, legal requirements, or other
              factors. We will notify you of any material changes by posting the
              updated policy on our Payment Module and updating the "Last
              updated" date at the top of this policy.
            </p>
          </section>

          {/* Section 10 */}
          {/* <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              10. Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have questions about this Privacy Policy or our privacy
              practices, please contact us:
            </p>
            <div className="bg-secondary text-secondary-foreground p-6 rounded-lg">
              <p className="font-semibold">Privacy Department</p>
              <p>Email: privacy@paymentmodule.com</p>
              <p>Phone: +1 (555) 123-4567</p>
              <p className="text-sm mt-2">
                Address: 123 Business Street, Suite 100, City, State 12345
              </p>
            </div>
          </section> */}

          {/* GDPR Compliance */}
          <section className="border-t border-border pt-8 mt-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              GDPR & Data Protection
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              For users in the European Union, we comply with the General Data
              Protection Regulation (GDPR). We process personal data on the
              basis of legitimate interests, contractual necessity, or explicit
              consent. You have the right to lodge a complaint with a
              supervisory authority in your jurisdiction if you believe your
              rights have been violated.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
