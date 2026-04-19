import InfoPage from "@/components/InfoPage";

const TermsPage = () => (
  <InfoPage title="Terms of Service" subtitle="Last updated: 2026">
    <p>By using apparelco.co.za you agree to these terms.</p>

    <h2 className="font-display text-xl tracking-wide uppercase">Orders</h2>
    <p>All orders are subject to availability. We reserve the right to cancel any order at our discretion, in which case you'll receive a full refund.</p>

    <h2 className="font-display text-xl tracking-wide uppercase">Pricing</h2>
    <p>Prices are listed in South African Rand (ZAR) and include VAT. We may update prices at any time without notice.</p>

    <h2 className="font-display text-xl tracking-wide uppercase">Intellectual Property</h2>
    <p>All product designs, photography, and content on this site are the property of APPAREL Co. and may not be reproduced without written permission.</p>

    <h2 className="font-display text-xl tracking-wide uppercase">Liability</h2>
    <p>Our liability is limited to the value of your order. We are not liable for any indirect or consequential losses.</p>

    <h2 className="font-display text-xl tracking-wide uppercase">Contact</h2>
    <p>Questions? Email <a href="mailto:hello@apparelco.co.za" className="underline">hello@apparelco.co.za</a>.</p>
  </InfoPage>
);

export default TermsPage;
