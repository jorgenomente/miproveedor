import svgPaths from "./svg-0xedq1169t";

function Relleno() {
  return (
    <div className="absolute contents inset-[3.55%_3.5%_3.56%_3.5%]" data-name="Relleno">
      <div className="absolute inset-[3.56%_72.34%_3.57%_3.5%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 45">
          <path d={svgPaths.p226ff6f0} fill="var(--fill-0, #889E93)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[3.55%_3.5%_69.14%_3.53%]" data-name="Vector_2">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 45 14">
          <path d={svgPaths.p2e70dd00} fill="var(--fill-0, #889E93)" id="Vector_2" />
        </svg>
      </div>
      <div className="absolute inset-[22.07%_3.5%_3.56%_27.64%]" data-name="Vector_3">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 34 36">
          <path d={svgPaths.p23bc540} fill="var(--fill-0, #F4F2ED)" id="Vector_3" />
        </svg>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute bottom-[0.01%] contents left-0 right-[0.01%] top-0" data-name="Group">
      <Relleno />
      <div className="absolute bottom-[0.01%] left-0 right-[0.01%] top-0" data-name="Vector_4">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 48 48">
          <path d={svgPaths.p21f42500} fill="var(--fill-0, #1F6F75)" id="Vector_4" />
        </svg>
      </div>
      <div className="absolute inset-[69.01%_36.49%_27.42%_40.2%]" data-name="linea">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 2">
          <path d={svgPaths.p3c69e200} fill="var(--fill-0, #1F6F75)" id="linea" />
        </svg>
      </div>
      <div className="absolute bottom-[46.44%] left-[40.24%] right-[16.7%] top-1/2" data-name="linea_2">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 2">
          <path d={svgPaths.pf3d7600} fill="var(--fill-0, #1F6F75)" id="linea_2" />
        </svg>
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="h-[47.998px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Group />
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 size-[47.998px] top-0" data-name="Group">
      <Icon />
    </div>
  );
}

function Text() {
  return (
    <div className="absolute h-[27.998px] left-[63.99px] top-[10px] w-[127.607px]" data-name="Text">
      <p className="absolute font-['Poppins:SemiBold',sans-serif] leading-[28px] left-0 not-italic text-[#111315] text-[20px] text-nowrap top-[0.38px] whitespace-pre">MiProveedor</p>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[47.998px] relative shrink-0 w-[191.602px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[47.998px] relative w-[191.602px]">
        <Group1 />
        <Text />
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="backdrop-blur-[18px] h-[41.24px] relative rounded-[2.09715e+07px] shrink-0 w-[78.398px] hover:brightness-105 transition-all duration-300" data-name="Button" style={{
      background: 'rgba(255,255,255,0.55)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }}>
      <div aria-hidden="true" className="absolute border-[1px] border-solid inset-0 pointer-events-none rounded-[2.09715e+07px]" style={{ borderColor: 'rgba(6,182,212,0.25)' }} />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[41.24px] relative w-[78.398px]">
        <p className="absolute font-['Manrope:Regular',sans-serif] font-normal leading-[24px] left-[39.62px] text-[#66707a] text-[16px] text-center text-nowrap top-[8.25px] translate-x-[-50%] whitespace-pre">Entrar</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex h-[71.367px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container />
      <Button />
    </div>
  );
}

export default function Header() {
  return (
    <div className="backdrop-blur-[28px] relative size-full" data-name="Header" style={{
      background: 'rgba(255,255,255,0.6)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.6)'
    }}>
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-solid inset-0 pointer-events-none" style={{ borderColor: 'rgba(255,255,255,0.35)' }} />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col items-start pb-[0.625px] pt-0 px-[90.244px] relative size-full">
          <Container1 />
        </div>
      </div>
    </div>
  );
}