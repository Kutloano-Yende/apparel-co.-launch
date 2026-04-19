import InfoPage from "@/components/InfoPage";

const tshirts = [
  { size: "XS", chest: "86-91", length: "66" },
  { size: "S", chest: "91-96", length: "69" },
  { size: "M", chest: "96-101", length: "72" },
  { size: "L", chest: "101-106", length: "74" },
  { size: "XL", chest: "106-111", length: "76" },
  { size: "XXL", chest: "111-116", length: "78" },
];

const shorts = [
  { size: "XS", waist: "71-76", hip: "86-91" },
  { size: "S", waist: "76-81", hip: "91-96" },
  { size: "M", waist: "81-86", hip: "96-101" },
  { size: "L", waist: "86-91", hip: "101-106" },
  { size: "XL", waist: "91-96", hip: "106-111" },
];

const SizeGuidePage = () => (
  <InfoPage title="Size Guide" subtitle="All measurements in centimetres. When in doubt, size up.">
    <h2 className="font-display text-xl tracking-wide uppercase">T-Shirts</h2>
    <div className="overflow-x-auto not-prose">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-foreground">
            <th className="text-left py-3 font-display tracking-wider uppercase text-xs">Size</th>
            <th className="text-left py-3 font-display tracking-wider uppercase text-xs">Chest (cm)</th>
            <th className="text-left py-3 font-display tracking-wider uppercase text-xs">Length (cm)</th>
          </tr>
        </thead>
        <tbody>
          {tshirts.map((row) => (
            <tr key={row.size} className="border-b border-border">
              <td className="py-3 font-medium">{row.size}</td>
              <td className="py-3 text-muted-foreground">{row.chest}</td>
              <td className="py-3 text-muted-foreground">{row.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <h2 className="font-display text-xl tracking-wide uppercase mt-10">Shorts</h2>
    <div className="overflow-x-auto not-prose">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-foreground">
            <th className="text-left py-3 font-display tracking-wider uppercase text-xs">Size</th>
            <th className="text-left py-3 font-display tracking-wider uppercase text-xs">Waist (cm)</th>
            <th className="text-left py-3 font-display tracking-wider uppercase text-xs">Hip (cm)</th>
          </tr>
        </thead>
        <tbody>
          {shorts.map((row) => (
            <tr key={row.size} className="border-b border-border">
              <td className="py-3 font-medium">{row.size}</td>
              <td className="py-3 text-muted-foreground">{row.waist}</td>
              <td className="py-3 text-muted-foreground">{row.hip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <h2 className="font-display text-xl tracking-wide uppercase mt-10">How to Measure</h2>
    <ul>
      <li><strong>Chest:</strong> Measure around the fullest part, keeping the tape horizontal.</li>
      <li><strong>Waist:</strong> Measure around your natural waistline.</li>
      <li><strong>Hip:</strong> Measure around the fullest part of your hips.</li>
      <li><strong>Length:</strong> Measured from the highest point of the shoulder to the bottom hem.</li>
    </ul>
  </InfoPage>
);

export default SizeGuidePage;
