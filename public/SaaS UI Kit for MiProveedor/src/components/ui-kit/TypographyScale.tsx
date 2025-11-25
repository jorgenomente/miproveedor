export function TypographyScale() {
  return (
    <div className="flex flex-col gap-6">
      <h3 className="mb-2">Typography</h3>
      
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-[#66707A]">H1 / Inter Bold 28</span>
          <h1>The quick brown fox jumps</h1>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-[#66707A]">H2 / Inter Bold 22</span>
          <h2>The quick brown fox jumps</h2>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-[#66707A]">H3 / Inter Semibold 18</span>
          <h3>The quick brown fox jumps</h3>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-[#66707A]">Body L / Inter Regular 16</span>
          <p style={{ fontSize: '16px' }}>The quick brown fox jumps over the lazy dog</p>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-[#66707A]">Body M / Inter Regular 14</span>
          <p>The quick brown fox jumps over the lazy dog</p>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-[#66707A]">Label / Inter Semibold 12</span>
          <label>THE QUICK BROWN FOX JUMPS</label>
        </div>
      </div>
    </div>
  );
}
