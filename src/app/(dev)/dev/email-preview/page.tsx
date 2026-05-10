import { env } from "@/env";
import { generateReferralEmailHtml, wrapInEmailTemplate } from "@/services/email";
import { plaintextToHtml } from "@/utils/html";

export default function EmailPreviewPage() {
  const unsubscribeUrl = `${env.APP_URL}/api/unsubscribe?token=preview-token`;

  const referralHtml = generateReferralEmailHtml("Jane Doe", "John Smith", "ABC12345", unsubscribeUrl);

  const groupBody =
    "Hi everyone,\n\nWe wanted to let you know that our next monthly meeting is on Wednesday, January 22nd at 6 pm.\n\nWe will be voting on two new local producers to carry in the store. Please come prepared with any questions.\n\nSee you there!";
  const groupBodyHtml = plaintextToHtml(groupBody);
  const groupFooterHtml = `<strong>Paso Robles Food Cooperative, Inc.</strong><br>
            P.O. Box 922, Paso Robles, CA 93447<br>
            <a href="${unsubscribeUrl}" style="color: #831002;">Unsubscribe</a>`;
  const groupHtml = wrapInEmailTemplate(groupBodyHtml, groupFooterHtml);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-3xl space-y-12">
        <div>
          <h1 className="mb-4 text-center text-xl font-bold">Referral Email</h1>
          <div dangerouslySetInnerHTML={{ __html: referralHtml }} />
        </div>
        <div>
          <h1 className="mb-4 text-center text-xl font-bold">Group Message Email</h1>
          <div dangerouslySetInnerHTML={{ __html: groupHtml }} />
        </div>
      </div>
    </div>
  );
}
