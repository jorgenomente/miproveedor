export function SpacingScale() {
  const spacings = [
    { value: 4, label: '4px' },
    { value: 8, label: '8px' },
    { value: 12, label: '12px' },
    { value: 16, label: '16px' },
    { value: 24, label: '24px' },
    { value: 32, label: '32px' },
    { value: 48, label: '48px' },
    { value: 64, label: '64px' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h3>Spacing Scale</h3>
      
      <div className="flex flex-col gap-3">
        {spacings.map((spacing) => (
          <div key={spacing.value} className="flex items-center gap-4">
            <span className="text-[12px] font-semibold text-[#66707A] w-[48px]">{spacing.label}</span>
            <div 
              className="bg-[#5BC7C0] rounded"
              style={{ width: '200px', height: `${spacing.value}px` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
