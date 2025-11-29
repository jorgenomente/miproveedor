import svgPaths from "./svg-1am2266t8q";

function Group() {
  return (
    <div className="absolute bottom-[0.01%] left-0 right-[0.01%] top-0" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 316 310">
        <g id="Group">
          <g id="Relleno">
            <path d={svgPaths.p5ff8500} fill="var(--fill-0, #889E93)" id="Vector" />
            <path d={svgPaths.p38c9b00} fill="var(--fill-0, #889E93)" id="Vector_2" />
            <path d={svgPaths.p37400600} fill="var(--fill-0, #F4F2ED)" id="Vector_3" />
          </g>
          <path d={svgPaths.p6464380} fill="var(--fill-0, #1F6F75)" id="Vector_4" />
          <path d={svgPaths.p1e99c780} fill="var(--fill-0, #1F6F75)" id="linea" />
          <path d={svgPaths.p32bf9a00} fill="var(--fill-0, #1F6F75)" id="linea_2" />
        </g>
      </svg>
    </div>
  );
}

function Capa() {
  return (
    <div className="absolute bottom-[0.01%] contents left-0 right-[0.01%] top-0" data-name="Capa 12">
      <Group />
    </div>
  );
}

export default function Isotipo() {
  return (
    <div className="relative size-full" data-name="isotipo">
      <Capa />
    </div>
  );
}