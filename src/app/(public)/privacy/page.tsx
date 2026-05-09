import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | PRFC Connect",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-angkor text-3xl text-prfc-brown">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: May 1, 2026</p>

      <div className="mt-8 space-y-6 text-base leading-relaxed text-foreground">
        <p>
          Paso Robles Food Cooperative, Inc. ("the Co-op") operates PRFC Connect, an internal communication tool for
          co-op members and staff. This policy describes what data the tool collects, how it is used, and how it is
          protected.
        </p>

        <h2 className="font-semibold text-lg text-prfc-brown">Data collected</h2>
        <p>
          PRFC Connect stores member names, email addresses, and phone numbers provided through the co-op's member
          portal. When a member opts in to SMS notifications, the phone number and the date of consent are recorded. The
          tool also stores message history, event data, and group membership.
        </p>

        <h2 className="font-semibold text-lg text-prfc-brown">How data is used</h2>
        <p>
          Member contact information is used to deliver event reminders, group messages, and operational notifications.
          Email addresses are used for email delivery. Phone numbers are used for SMS delivery only when the member has
          opted in. Message delivery status (sent, failed) is tracked for operational monitoring.
        </p>

        <h2 className="font-semibold text-lg text-prfc-brown">Data sharing</h2>
        <p>
          The Co-op does not sell, rent, or share member phone numbers, email addresses, or personal information with
          third parties for marketing purposes. Contact data is shared only with the service providers that deliver
          messages on the Co-op's behalf (Brevo for email, Twilio for SMS). These providers process data solely to
          deliver messages and are bound by their own privacy policies.
        </p>

        <h2 className="font-semibold text-lg text-prfc-brown">Data protection</h2>
        <p>
          Phone numbers and email addresses in the suppression and consent tables are encrypted at rest using
          AES-256-GCM. Blind index hashes allow lookups without decrypting stored values. Authentication uses
          HMAC-signed session tokens transmitted over HTTPS.
        </p>

        <h2 className="font-semibold text-lg text-prfc-brown">Your choices</h2>
        <p>
          Members can opt out of email notifications by clicking the unsubscribe link at the bottom of any email.
          Members can opt out of SMS notifications by replying STOP to any message or toggling the SMS preference off in
          account settings. Opting out takes effect immediately.
        </p>

        <h2 className="font-semibold text-lg text-prfc-brown">Contact</h2>
        <p>
          Paso Robles Food Cooperative, Inc.
          <br />
          P.O. Box 922, Paso Robles, CA 93447
        </p>
      </div>
    </div>
  );
}
