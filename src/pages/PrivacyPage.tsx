import InfoPage from "@/components/InfoPage";

const PrivacyPage = () => (
  <InfoPage title="Privacy Policy" subtitle="Last updated: 2026">
    <p>APPAREL Co. respects your privacy. This policy explains what data we collect and how we use it.</p>

    <h2 className="font-display text-xl tracking-wide uppercase">What We Collect</h2>
    <ul>
      <li>Account details (name, email, shipping address)</li>
      <li>Order history and payment confirmation data (we do not store card details)</li>
      <li>Basic site analytics (anonymous)</li>
    </ul>

    <h2 className="font-display text-xl tracking-wide uppercase">How We Use It</h2>
    <ul>
      <li>To process and ship your orders</li>
      <li>To send order confirmations and shipping updates</li>
      <li>To send marketing emails (only if you opt in)</li>
    </ul>

    <h2 className="font-display text-xl tracking-wide uppercase">Your Rights</h2>
    <p>You can request a copy of your data, or request deletion, by emailing <a href="mailto:privacy@apparelco.co.za" className="underline">privacy@apparelco.co.za</a>.</p>
  </InfoPage>
);

export default PrivacyPage;
