import InfoPage from "@/components/InfoPage";

const ShippingPage = () => (
  <InfoPage title="Shipping Info" subtitle="Fast, reliable delivery across South Africa.">
    <h2 className="font-display text-xl tracking-wide uppercase">Delivery Times</h2>
    <ul>
      <li><strong>Major centres</strong> (Johannesburg, Pretoria, Cape Town, Durban): 2-4 business days</li>
      <li><strong>Regional areas:</strong> 4-7 business days</li>
      <li><strong>Outlying areas:</strong> 5-10 business days</li>
    </ul>

    <h2 className="font-display text-xl tracking-wide uppercase">Shipping Costs</h2>
    <ul>
      <li><strong>Free standard shipping</strong> on orders over R 800</li>
      <li>Standard shipping: R 80 flat rate</li>
      <li>Express shipping: R 150 flat rate (1-2 business days, major centres only)</li>
    </ul>

    <h2 className="font-display text-xl tracking-wide uppercase">Order Processing</h2>
    <p>
      Orders are processed within 1 business day of payment confirmation. You'll receive a tracking
      number by email once your order ships. You can also track your order anytime on our{" "}
      <a href="/track-order" className="underline">track order page</a>.
    </p>

    <h2 className="font-display text-xl tracking-wide uppercase">International Shipping</h2>
    <p>
      We currently ship within South Africa only. International shipping is coming soon — subscribe
      to our newsletter to be notified.
    </p>
  </InfoPage>
);

export default ShippingPage;
