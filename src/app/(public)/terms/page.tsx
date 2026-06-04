import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions | PRFC Outreach",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-angkor text-3xl text-prfc-brown">SMS terms and conditions</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: May 1, 2026</p>

      <div className="mt-8 space-y-6 text-base leading-relaxed text-foreground">
        <h2 className="font-semibold text-lg text-prfc-brown">Program</h2>
        <p>
          Paso Robles Food Cooperative, Inc. ("the Co-op") sends SMS notifications to members through PRFC Outreach, an
          internal communication tool. Messages include event reminders, group messages, and operational notifications.
        </p>

        <h2 className="font-semibold text-lg text-prfc-brown">Message frequency</h2>
        <p>Up to 8 messages per month. Frequency varies based on co-op events and group activity.</p>

        <h2 className="font-semibold text-lg text-prfc-brown">Costs</h2>
        <p>
          Message and data rates may apply. The Co-op does not charge for SMS notifications, but your mobile carrier may
          charge standard messaging fees.
        </p>

        <h2 className="font-semibold text-lg text-prfc-brown">Opt-in</h2>
        <p>
          Members opt in to SMS notifications by toggling the SMS preference in their PRFC Outreach account settings.
          The opt-in screen displays the following disclosure before consent is recorded: "Up to 8 msgs/month. Msg &
          data rates may apply. Reply STOP to cancel."
        </p>

        <h2 className="font-semibold text-lg text-prfc-brown">Opt-out</h2>
        <p>
          Reply <strong>STOP</strong> to any message to unsubscribe from all SMS notifications. You can also toggle the
          SMS preference off in your account settings. Opt-out takes effect immediately.
        </p>

        <h2 className="font-semibold text-lg text-prfc-brown">Help</h2>
        <p>
          Reply <strong>HELP</strong> to any message for support information. You can also contact the Co-op directly at
          the address below.
        </p>

        <h2 className="font-semibold text-lg text-prfc-brown">Privacy</h2>
        <p>
          The Co-op does not sell, rent, or share member phone numbers with third parties for marketing purposes. See
          the full privacy policy at /privacy.
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
