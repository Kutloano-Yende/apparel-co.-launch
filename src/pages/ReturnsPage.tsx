import InfoPage from "@/components/InfoPage";

const ReturnsPage = () => (
  <InfoPage title="Returns & Exchanges" subtitle="Not quite right? We've got you covered.">
    <h2 className="font-display text-xl tracking-wide uppercase">Our Policy</h2>
    <p>
      We offer a <strong>30-day return policy</strong> from the date your order is delivered. Items
      must be unworn, unwashed, and in original condition with tags attached.
    </p>

    <h2 className="font-display text-xl tracking-wide uppercase">How to Return</h2>
    <ol>
      <li>Email <a href="mailto:returns@apparelco.co.za" className="underline">returns@apparelco.co.za</a> with your order number</li>
      <li>We'll send you a return label and instructions within 24 hours</li>
      <li>Drop the package at any participating courier point</li>
      <li>Refunds are processed within 5-7 business days of receipt</li>
    </ol>

    <h2 className="font-display text-xl tracking-wide uppercase">Exchanges</h2>
    <p>
      Need a different size or colour? Follow the return process and place a new order — we'll
      refund the original purchase as soon as the return arrives.
    </p>

    <h2 className="font-display text-xl tracking-wide uppercase">Non-Returnable Items</h2>
    <ul>
      <li>Sale items marked "final sale"</li>
      <li>Underwear and swimwear (for hygiene reasons)</li>
      <li>Gift cards</li>
    </ul>

    <h2 className="font-display text-xl tracking-wide uppercase">Damaged or Incorrect Items</h2>
    <p>
      If your order arrives damaged or incorrect, contact us within 7 days and we'll make it right
      at no cost to you.
    </p>
  </InfoPage>
);

export default ReturnsPage;
