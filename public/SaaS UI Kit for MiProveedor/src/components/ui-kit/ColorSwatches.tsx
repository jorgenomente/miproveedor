export function ColorSwatches() {
  const brandColors = [
    { name: 'Brand Primary', hex: '#5BC7C0', var: '--brand-primary' },
    { name: 'Brand Primary Dark', hex: '#3A9FA1', var: '--brand-primary-dark' },
    { name: 'Brand Deep', hex: '#1F6F75', var: '--brand-deep' },
  ];

  const neutrals = [
    { name: 'Neutral 900', hex: '#111315', var: '--neutral-900' },
    { name: 'Neutral 700', hex: '#444B52', var: '--neutral-700' },
    { name: 'Neutral 500', hex: '#66707A', var: '--neutral-500' },
    { name: 'Neutral 200', hex: '#D8DEE2', var: '--neutral-200' },
    { name: 'Neutral 100', hex: '#EEF1F2', var: '--neutral-100' },
  ];

  const feedback = [
    { name: 'Success', hex: '#1F6F75', var: '--success' },
    { name: 'Success Light', hex: '#E6F4F5', var: '--success-light' },
    { name: 'Warning', hex: '#E8A351', var: '--warning' },
    { name: 'Warning Light', hex: '#FDF3E4', var: '--warning-light' },
    { name: 'Error', hex: '#E96A6A', var: '--error' },
    { name: 'Error Light', hex: '#FBECEC', var: '--error-light' },
    { name: 'Info', hex: '#5BC7C0', var: '--info' },
    { name: 'Info Light', hex: '#E6F7F6', var: '--info-light' },
  ];

  const ColorSwatch = ({ name, hex, var: cssVar }: { name: string; hex: string; var: string }) => (
    <div className="flex flex-col gap-2">
      <div 
        className="w-[120px] h-[120px] rounded-lg border border-[#D8DEE2]"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <div className="flex flex-col">
        <span className="text-[12px] font-semibold text-[#111315]">{name}</span>
        <span className="text-[12px] text-[#66707A]">{hex}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4">Brand Colors</h3>
        <div className="flex gap-4">
          {brandColors.map((color) => (
            <ColorSwatch key={color.var} {...color} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4">Neutrals</h3>
        <div className="flex gap-4">
          {neutrals.map((color) => (
            <ColorSwatch key={color.var} {...color} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4">UI Feedback</h3>
        <div className="flex gap-4 flex-wrap">
          {feedback.map((color) => (
            <ColorSwatch key={color.var} {...color} />
          ))}
        </div>
      </div>
    </div>
  );
}
