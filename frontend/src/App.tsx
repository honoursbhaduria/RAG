import { useState } from 'react';
import TextFlippingBoardDemo from '@/components/text-flipping-board-demo';
import KeyboardDemo from '@/components/keyboard-demo';
import BrandTimeline from '@/components/brand-timeline';
import RippleGrid from '@/components/ui/RippleGrid';
import LogoLoop, { type LogoItem } from '@/components/ui/LogoLoop';
import Loader from '@/components/ui/astronaut-loader';
import DraggableCardDemo from '@/components/ui/draggable-card-demo-2';
import {
  IconCompass,
  IconCircleDotted,
  IconBolt,
  IconLeaf,
  IconWorld,
  IconSparkles,
  IconTriangle,
  IconCube,
} from '@tabler/icons-react';
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from '@/components/ui/resizable-navbar';

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Product", link: "#product" },
    { name: "Solutions", link: "#solutions" },
    { name: "Security", link: "#security" },
  ];

  const partnerLogos: LogoItem[] = [
    {
      node: (
        <div className="flex items-center gap-3 text-neutral-600 hover:text-black transition-colors duration-200 select-none cursor-pointer">
          <IconCompass className="w-6 h-6 stroke-[1.75]" />
          <span className="font-h3 text-2xl md:text-3xl font-semibold tracking-tight">Northline</span>
        </div>
      ),
      title: "Northline",
    },
    {
      node: (
        <div className="flex items-center gap-3 text-neutral-600 hover:text-black transition-colors duration-200 select-none cursor-pointer">
          <IconCircleDotted className="w-6 h-6 stroke-[1.75]" />
          <span className="font-h3 text-2xl md:text-3xl font-semibold tracking-tight">Arcform</span>
        </div>
      ),
      title: "Arcform",
    },
    {
      node: (
        <div className="flex items-center gap-3 text-neutral-600 hover:text-black transition-colors duration-200 select-none cursor-pointer">
          <IconBolt className="w-6 h-6 stroke-[1.75]" />
          <span className="font-h3 text-2xl md:text-3xl font-semibold tracking-tight">Velo Group</span>
        </div>
      ),
      title: "Velo Group",
    },
    {
      node: (
        <div className="flex items-center gap-3 text-neutral-600 hover:text-black transition-colors duration-200 select-none cursor-pointer">
          <IconLeaf className="w-6 h-6 stroke-[1.75]" />
          <span className="font-h3 text-2xl md:text-3xl font-semibold tracking-tight">Juniper</span>
        </div>
      ),
      title: "Juniper",
    },
    {
      node: (
        <div className="flex items-center gap-3 text-neutral-600 hover:text-black transition-colors duration-200 select-none cursor-pointer">
          <IconWorld className="w-6 h-6 stroke-[1.75]" />
          <span className="font-h3 text-2xl md:text-3xl font-semibold tracking-tight">Meridian</span>
        </div>
      ),
      title: "Meridian",
    },
    {
      node: (
        <div className="flex items-center gap-3 text-neutral-600 hover:text-black transition-colors duration-200 select-none cursor-pointer">
          <IconSparkles className="w-6 h-6 stroke-[1.75]" />
          <span className="font-h3 text-2xl md:text-3xl font-semibold tracking-tight">Lumio</span>
        </div>
      ),
      title: "Lumio",
    },
    {
      node: (
        <div className="flex items-center gap-3 text-neutral-600 hover:text-black transition-colors duration-200 select-none cursor-pointer">
          <IconTriangle className="w-6 h-6 stroke-[1.75]" />
          <span className="font-h3 text-2xl md:text-3xl font-semibold tracking-tight">Vertex</span>
        </div>
      ),
      title: "Vertex",
    },
    {
      node: (
        <div className="flex items-center gap-3 text-neutral-600 hover:text-black transition-colors duration-200 select-none cursor-pointer">
          <IconCube className="w-6 h-6 stroke-[1.75]" />
          <span className="font-h3 text-2xl md:text-3xl font-semibold tracking-tight">Kube</span>
        </div>
      ),
      title: "Kube",
    },
  ];

  return (
    <div className="text-text font-body-lg min-h-screen antialiased selection:bg-black selection:text-white bg-page-bg">
      {/* 1. Dynamic Resizable Navbar */}
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo logoText="3AM DEVS" />
          <NavItems items={navItems} />
          <div className="flex items-center gap-3 relative z-20 shrink-0">
            <NavbarButton variant="secondary" href="#contact">Login</NavbarButton>
            <NavbarButton variant="primary" href="#demo">Book a demo</NavbarButton>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo logoText="3AM DEVS" />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative py-1 text-sm font-medium text-neutral-700 hover:text-black transition-colors"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-3 pt-2 border-t border-neutral-300">
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="secondary"
                className="w-full"
              >
                Login
              </NavbarButton>
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full"
              >
                Book a demo
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <main>
        {/* 1. Hero */}
        <section className="min-h-[1000px] pt-[200px] md:pt-[240px] px-margin max-w-[1728px] mx-auto flex flex-col items-center text-center relative overflow-visible bg-page-bg">
          <div className="relative w-full max-w-5xl flex flex-col items-center justify-center">
            {/* Grid Design with Depth (No Ripples) */}
            <div className="absolute -inset-x-8 md:-inset-x-24 -top-16 md:-top-24 h-[440px] md:h-[520px] overflow-hidden rounded-3xl pointer-events-auto -z-0">
              <RippleGrid
                enableRainbow={false}
                gridColor="#8C8880"
                rippleIntensity={0.0}
                perspective={0.5}
                gridSize={12}
                gridThickness={15}
                fadeDistance={1.4}
                vignetteStrength={2.2}
                mouseInteraction={true}
                mouseInteractionRadius={1.2}
                opacity={0.4}
                glowIntensity={0}
              />
            </div>

            <h1 className="relative z-10 font-display text-4xl sm:text-6xl md:text-[82px] leading-[1.05] tracking-[-0.04em] text-balance max-w-4xl mb-lg text-text font-semibold pointer-events-none select-none">
              Bring every team into focus
            </h1>
          </div>
          <p className="font-body-lg text-body-lg text-muted max-w-2xl mb-lg hidden">
            Decode your lorem ipsum DNA. Bring absolute clarity to your organization's most critical assets with a platform designed for deep focus.
          </p>
          <button className="bg-black text-page-bg font-label text-label px-8 py-4 rounded-full hover:bg-black/90 transition-opacity mb-[80px] hidden">
            Get started
          </button>
          {/* Interactive Keyboard */}
          <div className="w-full max-w-[1492px] flex items-center justify-center relative z-10 py-6 md:py-10">
            <KeyboardDemo />
          </div>
        </section>

        {/* 2. Trust Strip with LogoLoop */}
        <section className="py-12 md:py-16 px-4 md:px-margin border-t border-line/30 max-w-[1728px] mx-auto flex flex-col items-center bg-page-bg relative z-0 overflow-hidden">
          <p className="font-label text-xs uppercase tracking-[0.2em] text-muted mb-8 text-center font-medium">
            Built with modern leaders from
          </p>
          <div className="w-full overflow-hidden">
            <LogoLoop
              logos={partnerLogos}
              speed={60}
              direction="left"
              logoHeight={36}
              gap={72}
              hoverSpeed={0}
              scaleOnHover
              fadeOut
              fadeOutColor="#FAF9F5"
              ariaLabel="Partner brand logos"
            />
          </div>
        </section>

        {/* 3. Floating Visual Collage */}
        <section className="h-[1200px] w-full max-w-[1728px] mx-auto relative overflow-hidden bg-page-bg hidden md:block">
          {/* Central Anchor - 3D Astronaut */}
          <div
            className="absolute z-10 select-none flex items-center justify-center pointer-events-none"
            style={{ left: '50%', top: '430px', transform: 'translate(-50%, -50%)' }}
          >
            <Loader size={360} />
          </div>

          {/* 1. Top-left */}
          <div
            className="absolute rounded-[12px] overflow-hidden bg-panel-bg shadow-md hover:scale-105 transition-transform duration-500"
            style={{ left: '8%', top: '10px', width: '270px', height: '210px' }}
          >
            <img
              alt="Collage piece 1"
              className="w-full h-full object-cover opacity-90 mix-blend-luminosity"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9Eu4GHa4HcZNOEEtD99nwhNeXd_r6nKvv_j-kmlyfpOyJ-agnnRp8TCFPCgxdmD063zG5H55vS7Kl1Fm1sa9rmyTM9H3hRcnl-D5Zb0eM1q5MOIhGcoP5fBjbboQd42gVrYWS7IwChMh9jwlEuFS1h5yuxlC2yNp9NKbUvPtq9tivKTbQprQKWaoDn7DyXOB_4V4q7jLHjD5qwHUrh7dg3YLwxOBg1Y-Bb78Zfdo8lA8jinqJAf3YY4dB38_tyfPXzAqQvCH558H0"
            />
          </div>

          {/* 2. Top-right */}
          <div
            className="absolute rounded-[12px] overflow-hidden bg-panel-bg shadow-md hover:scale-105 transition-transform duration-500"
            style={{ right: '8%', top: '0px', width: '290px', height: '260px' }}
          >
            <img
              alt="Collage piece 2"
              className="w-full h-full object-cover grayscale opacity-80"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_ukkwXMpdu6e3ppYpH6BD1_-rNjOtPCNphQxqVAwibL3vPsIFhdrTseYbg_mFXNV8wfdsFKJzdM1llH6-3Ooyb7rnKK_W8wdU3JdsbBHv2HrWRub1BwUXCUCdBesVtKBjoukKmMwaO8GJlVfL0k97LJYVNEWn-F5r7fMIF99qrQvBhQ8XkttAku39rNe6s8MSlCCLLtFq1abMNKcy0UL1LSTGpVO3OuoWhVmIpJSWLHJ_CtFnzwnzLrDDvHxCf-x1SgnOeGrX9egf"
            />
          </div>

          {/* 3. Left-middle */}
          <div
            className="absolute rounded-[12px] overflow-hidden bg-panel-bg relative shadow-md hover:scale-105 transition-transform duration-500"
            style={{ left: '9%', top: '470px', width: '330px', height: '200px' }}
          >
            <img
              alt="Collage piece 3"
              className="w-full h-full object-cover grayscale opacity-90"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNavYRwMD7oKvwrejumqeVb5grj3c2x3jtZ_PV3sqY6_I8rnCesfQjvsgf3d0ic5jzrqvRjRUJsvDz2Aa58Ef6HgAHAjafCFs5AD0fXSd6qzZ1F1ICCMQT6xGCK2NrdWf9d1hghSt4P3uIDyDROe56ggPg0WoKH5Yxlisxx5X2dbPfsoQxdeC8qJdHMmdqHMjwjD_YxQWvXfqy2N4mGSwR6Icu8dAelCZkrUJsJoRVETkQ9G3YDvp9AsjQkNWULBEOonPtST81DFgJ"
            />
            <div className="absolute top-4 left-4 bg-white-card/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
              <span className="font-label text-xs font-semibold text-text">Content Guidelines</span>
            </div>
          </div>

          {/* 4. Right-middle */}
          <div
            className="absolute rounded-[12px] overflow-hidden bg-panel-bg shadow-md hover:scale-105 transition-transform duration-500"
            style={{ right: '5%', top: '270px', width: '250px', height: '330px' }}
          >
            <img
              alt="Collage piece 4"
              className="w-full h-full object-cover grayscale opacity-90"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrpaFvvF7en0CGZX5ONntjNihYUq1Z_-_LbaQTubxafa9z3gPDG-EfHCHkWFqm3LoWth700qlDOvMW4CxRKoWinMdIbqdTLps1ehsQRniSSZvH6Vy8POjGKYMEKa1b0zM7_uWkKso-6aAIy8u8gkh6mExdkSBT0EpauryhquZA61p-lUkG0o_3WNHybUWjx7lBJVs4TWOfs4NuVQ_-l7LSS5Xi_KK5UFPYtTpoBmD1mqjcNDuGKIFSVdPeh-Wyf7P9_aun3Nm_-33h"
            />
          </div>

          {/* 5. Center-lower */}
          <div
            className="absolute rounded-[12px] overflow-hidden bg-black z-0 shadow-md hover:scale-105 transition-transform duration-500"
            style={{ left: '50%', top: '560px', width: '370px', height: '250px', transform: 'translateX(-20%)' }}
          >
            <img
              alt="Collage piece 5"
              className="w-full h-full object-cover grayscale opacity-80"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCuhoApO9ae7ghimBcn9BPPTivJNd8wXOAIlaBLHDjnY0LOBt1RHjXYED1Gw1k4OyBVX3nzpsadBgr-PkaPpGOJ0Ncc2keoy5bLdbRaUvdWsd2X6nZ_UwN59sHVVMUbjVXvmErTc4-n1u6JeMz4cafAxh1LxhuDPmvZcT3i3-fY80U46x98ScklqvNEI4Wt8VJat6ztpSjUy_xxi-OjErnKcXbrBwC80xptX0SEljn5YieZtAok8butz8WHELTCCOUxSxCHtEYn9QbT"
            />
          </div>

          {/* 6. Floating Comment */}
          <div
            className="absolute bg-panel-bg rounded-full flex items-center gap-3 px-4 py-3 shadow-lg border border-line/50 z-20 hover:shadow-xl transition-shadow"
            style={{ left: '42%', top: '800px', width: '305px', height: '62px' }}
          >
            <div className="w-8 h-8 rounded-full bg-soft-card overflow-hidden shrink-0">
              <img
                alt="User avatar"
                className="w-full h-full object-cover grayscale"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBq41uinHeBiMX-cglCA0RPd-Gyi7Rea3rfHcMQV30zxatLeEEwcA1Gv4dfpSOhjgbvrMTveFXAmVVgoZk51Wf-QIyxv1-btaTdygIk8IZ48U3e6MXY_1PXUu7DfIVQHMHK9Nd0bWUFXOqUWQX0kJEvX-ILe7j8VRfCWN8QnKWMeE4-oWrrvqyNExjMAYu89BGzhItmJddqUphk5I39JN8ewkBKrzmCHfVTrmlKWYfX2JLwl-z5KPudJOAGiuxOQqyXJzbJ2lxQ4YM"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-label text-[10px] text-text font-bold">lorem_d</span>
              <span className="font-body-md text-[13px] text-muted leading-tight">so so good!!!! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 1h</span>
            </div>
          </div>

          {/* 7. Bottom-left */}
          <div
            className="absolute rounded-[12px] overflow-hidden bg-panel-bg relative shadow-md hover:scale-105 transition-transform duration-500"
            style={{ left: '3%', top: '880px', width: '340px', height: '250px' }}
          >
            <img
              alt="Collage piece 7"
              className="w-full h-full object-cover grayscale opacity-90"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKsFrFItneuA8Y9MCUadGUZWuA8x4TxgTrVsbJtlXSr36Gjarjn1Q6nKVJ6RanXBHEaJp6wyn3rg4iiOCyihHaczxitcDA1ojzOjUxdaB6xi_cFk9TtDMImaj1XTF1VpvY2cpvlqSqHwim5KQ7ZVm6QeYoA-FWtKYpOVqlHvR1-hRKmoQLKfXRiCVY36O8PBMeaG3G2Lz4MtpjgukZ-8cdPI3gyhHTs0wU8fgENhE5rKff4nq4oVXF4ZGWph8qiihyLXBoVG1mdfCR"
            />
            <div className="absolute bottom-4 left-4 bg-white-card/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
              <span className="font-label text-xs font-semibold text-text">Brand Voice</span>
            </div>
          </div>

          {/* 8. Bottom-right */}
          <div
            className="absolute rounded-[12px] overflow-hidden bg-panel-bg shadow-md hover:scale-105 transition-transform duration-500"
            style={{ right: '6%', top: '840px', width: '410px', height: '300px' }}
          >
            <img
              alt="Collage piece 8"
              className="w-full h-full object-cover mix-blend-luminosity opacity-80"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa-91Ro6EFVsdJZTyq2p_PBpy5-VPNrqP0-UG3SMytUgShIhaUyJ-uZ9kwySXw7RYWEhwPzBeUADFyDiJGZdM9diqei2CFJIQXGRHOnCFOXlfrwaGRruPnmIuehjcickYw8LpYdNHni5Tm6RhU_SEMxaEsLDMlzdWh_hXysftIEsoY6HD29HrcGC7lvi9reR6YdbjNNSFJloHpd39n_Dx1cqNKFwbQ3SISEHA6xZJk4JktqjYCXZ5ZdxGQJBnijlL_Yukxahb8nvyV"
            />
          </div>
        </section>

        {/* 4. Manifesto */}
        <section className="py-[120px] md:py-[200px] px-margin max-w-[1728px] mx-auto relative flex flex-col items-center text-center bg-page-bg">
          <div className="absolute top-0 right-[10%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] opacity-10 pointer-events-none">
            <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="0.5" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48"></circle>
              <ellipse cx="50" cy="50" rx="24" ry="48"></ellipse>
              <ellipse cx="50" cy="50" rx="48" ry="24"></ellipse>
              <line x1="2" x2="98" y1="50" y2="50"></line>
              <line x1="50" x2="50" y1="2" y2="98"></line>
            </svg>
          </div>
          <h2 className="font-display text-2xl sm:text-4xl md:text-[49px] leading-[1.15] md:leading-[1.1] text-balance max-w-[1200px] font-semibold text-text relative z-10">
            As intelligent agents expand across the enterprise, the need for a singular source of truth has never been more critical. Lumio unifies your strategy.
          </h2>
        </section>

        {/* 5. Brand OS Timeline */}
        <section id="product" className="py-[40px] md:py-[80px] px-margin max-w-[1728px] mx-auto bg-page-bg">
          <BrandTimeline />
        </section>

        {/* 6. Team Use Cases */}
        <section id="solutions" className="py-[100px] md:py-[160px] px-margin max-w-[1728px] mx-auto flex flex-col items-center bg-page-bg">
          <h2 className="font-display text-2xl md:text-h2 mb-12 md:mb-16 font-semibold text-center text-text">
            Built for every team.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {/* Card 1 */}
            <div className="bg-panel-bg h-[400px] rounded-[32px] p-8 flex flex-col justify-between group overflow-hidden relative border border-line/10 hover:shadow-lg transition-all duration-300">
              <div className="relative z-10">
                <h4 className="font-h3 text-xl font-semibold mb-2 text-text">Campaign Briefs</h4>
                <p className="font-body-md text-muted">Generate comprehensive briefs aligned with brand strategy.</p>
              </div>
              <div className="absolute bottom-[-20px] right-[-20px] w-2/3 h-2/3 bg-white-card rounded-tl-3xl shadow-lg border border-line/20 p-6 transform group-hover:-translate-y-2 group-hover:-translate-x-2 transition-transform duration-500">
                <div className="h-3 w-1/2 bg-line rounded-full mb-4"></div>
                <div className="h-2 w-full bg-line/50 rounded-full mb-3"></div>
                <div className="h-2 w-5/6 bg-line/50 rounded-full mb-3"></div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-soft-card h-[400px] rounded-[32px] p-8 flex flex-col justify-between group overflow-hidden relative border border-line/10 hover:shadow-lg transition-all duration-300">
              <div className="relative z-10">
                <h4 className="font-h3 text-xl font-semibold mb-2 text-text">Social Assets</h4>
                <p className="font-body-md text-muted">Ensure visual consistency across all channels.</p>
              </div>
              <div className="absolute bottom-[-20px] right-[-20px] w-2/3 h-2/3 bg-panel-bg rounded-tl-3xl shadow-lg border border-line/20 overflow-hidden transform group-hover:-translate-y-2 group-hover:-translate-x-2 transition-transform duration-500">
                <img
                  alt="Social asset graphic"
                  className="w-full h-full object-cover grayscale opacity-60"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOekHNw8ykdxPIkY24QzUwgPTWLmPyAXcPqZs-jYR1BrA_Ju27EGXtJe3Kuyg0CLmCM1UFUIWc67BAmYrlQXhsBlLS0IUBzfmB_FNQI61JTbt-DC1OgYKX64mvDQgENGsi4nGTf45BtJMbUIQd4pBoSS0UPWMrgTZt-SZdh8DBqu8Teo87JSRvOevY1DDz9By1ZC4GOxGohkBHKwyKfPzqD9B7mHf2qCwU9X8Nv9G8hZhRDGkfnhotflcGFJ19WHSYNpulNEcNwN-Q"
                />
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white-card h-[400px] rounded-[32px] p-8 flex flex-col justify-between group overflow-hidden relative border border-line/20 hover:shadow-lg transition-all duration-300">
              <div className="relative z-10">
                <h4 className="font-h3 text-xl font-semibold mb-2 text-text">Sales Decks</h4>
                <p className="font-body-md text-muted">Empower reps with up-to-date, on-brand messaging.</p>
              </div>
              <div className="absolute bottom-[-20px] right-[-20px] w-2/3 h-2/3 bg-page-bg rounded-tl-3xl shadow-lg border border-line/20 p-6 transform group-hover:-translate-y-2 group-hover:-translate-x-2 transition-transform duration-500 flex flex-col gap-3">
                <div className="w-full h-1/2 bg-soft-card rounded-lg"></div>
                <div className="w-full h-1/2 bg-soft-card rounded-lg flex gap-2">
                  <div className="w-1/2 h-full bg-line/30 rounded-md"></div>
                  <div className="w-1/2 h-full bg-line/30 rounded-md"></div>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-panel-bg h-[400px] rounded-[32px] p-8 flex flex-col justify-between group overflow-hidden relative border border-line/10 hover:shadow-lg transition-all duration-300">
              <div className="relative z-10">
                <h4 className="font-h3 text-xl font-semibold mb-2 text-text">Voice Guidelines</h4>
                <p className="font-body-md text-muted">Codify your brand's unique tone and terminology.</p>
              </div>
              <div className="absolute bottom-[20px] right-[20px] w-1/2 h-1/2 bg-black rounded-2xl shadow-xl p-6 transform group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-page-bg text-[48px]">record_voice_over</span>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Testimonial */}
        <section className="py-[100px] md:py-[160px] px-margin max-w-[1400px] mx-auto flex flex-col items-center text-center bg-page-bg">
          <div className="mb-8 opacity-30">
            <span className="material-symbols-outlined text-[64px] text-muted">format_quote</span>
          </div>
          
          {/* Split-Flap Interactive Quote Board */}
          <div className="w-full max-w-5xl mb-12">
            <TextFlippingBoardDemo />
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="w-14 h-14 rounded-full bg-line overflow-hidden border border-line/40 shadow-sm">
              <img
                alt="Alex Morgan, VP of Brand"
                className="w-full h-full object-cover grayscale"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1VIcb_dh48u8vUQuC7XZTgj7oB_3w3BskgDGqYgkBlYd2P672QeJNyH1IwFQaDx68BXSs_NFT0BRY0Qm8PyTYkQNcW_inCFD5lVmD9hnJRdcHbWVrKNRSYBgj2UegNx6F-Gqt4ji-jfUhSzOL0Kr8XslosIJfEpOMZ5EaFgBLAB0YZ_OzrUErFWwfLYRJ1UABvEUMpumJA3oayLtZ64tgEUE7W5LkZOJKQj7NyZIZjhSjHrzCF20-FxFA1DJGbNNuPwKeeTO3Kuck"
              />
            </div>
            <div className="text-left">
              <p className="font-label text-sm font-bold text-text">Alex Morgan</p>
              <p className="font-label text-xs text-muted">VP of Brand, Northline</p>
            </div>
          </div>
        </section>

        {/* 9. Updates */}
        <section id="blog" className="py-[80px] md:py-[120px] px-margin max-w-[1728px] mx-auto bg-page-bg">
          <div className="flex justify-between items-end mb-12">
            <h2 className="font-display text-2xl md:text-h2 font-semibold text-text">Latest Updates</h2>
            <button className="font-label text-sm font-bold border-b border-black text-text pb-1 hover:text-muted hover:border-muted transition-colors cursor-pointer">
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group cursor-pointer">
              <div className="w-full h-[380px] md:h-[450px] bg-panel-bg rounded-[32px] mb-6 overflow-hidden border border-line/20 shadow-sm">
                <img
                  alt="Update 1 thumbnail"
                  className="w-full h-full object-cover grayscale opacity-80 group-hover:scale-105 transition-transform duration-700"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBH43H6AQKssKrW-JNz_6bTSCRB11JHvJSTJfoMeTce8WOcUe7J3G-wvRtEYFDoN_HyqoVFM46zpRnKmRNIDizPMcW-cgH3ZTdjN86P9bkAVrDvTr6KhnvpuU4HmuaxxxdkKlAZQjm9KduNLD42amyGdF5SyMPYygRx6JKR-Me9Rtb2geiapBtNUIKZolpO5aQDi0qYOfLRQ72VYUQ87lGlR9S-ka8mqqO_MBASyv4mPduXpu20PURQRhMDHzYu8ho2yps1V4ALFZYE"
                />
              </div>
              <p className="font-label text-xs text-muted mb-3">Product Update • Oct 12</p>
              <h4 className="font-h3 text-xl font-semibold text-text group-hover:text-muted transition-colors">
                Introducing Lumio Studio Analytics
              </h4>
            </div>

            <div className="group cursor-pointer">
              <div className="w-full h-[380px] md:h-[450px] bg-soft-card rounded-[32px] mb-6 overflow-hidden border border-line/20 shadow-sm">
                <img
                  alt="Update 2 thumbnail"
                  className="w-full h-full object-cover grayscale opacity-80 group-hover:scale-105 transition-transform duration-700"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuADz9LW9HvfLVEe_I21nEVa4CLnkpZCr8Bgk70c2xyov3xgZeLdZSAPNjhhb0fHH4BnSUSssw5IFJkyANuAMXUOZqeh7zz1U3P8KdKwkD2Z5Ccf1FaU1GJQK8bA5IhSc_X3sdb5HojmJ8YLBfRAQnUzzeUJaCVOVIV4m9Pn4WqF_0o9ePR18DMzxkOF-ebPSTOPvHek99rCjsYVuQ5SuQrEj7jQu06la9v1EE7gPJlbsGo8eb7i5F-gJ94k0CDmnBWYnDgcxCL6YRI1"
                />
              </div>
              <p className="font-label text-xs text-muted mb-3">Guide • Sep 28</p>
              <h4 className="font-h3 text-xl font-semibold text-text group-hover:text-muted transition-colors">
                The Modern Brand Architecture
              </h4>
            </div>

            <div className="group cursor-pointer">
              <div className="w-full h-[380px] md:h-[450px] bg-panel-bg rounded-[32px] mb-6 overflow-hidden border border-line/20 shadow-sm">
                <img
                  alt="Update 3 thumbnail"
                  className="w-full h-full object-cover grayscale opacity-80 group-hover:scale-105 transition-transform duration-700"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDct5kTYgop_t8S6JmJtOmgiz1hNX2UvSLdGT2dBhBQNPgK5qKA8ZCJPceU2332pg1ob4ZNasV5TQXEkAOmkfBIpwkmdPDeET1K0lhjlk6MntDCRVUanq67fElMoyCLd6XOD0j3-gAWBGvQyJ8LsHf_D3qMboq2buFlvUNxdeqxH7UbzYSzjjm5InxR0bV1pO9TLBoHJxJ2kphS0sstx7HPAAA7Oc93mMsc7BMCicUGfnf-50gK-_6_xhIpXjOcUbGvbwkUZj_Q2fbN"
                />
              </div>
              <p className="font-label text-xs text-muted mb-3">Company • Sep 15</p>
              <h4 className="font-h3 text-xl font-semibold text-text group-hover:text-muted transition-colors">
                Lumio raises Series B to expand AI
              </h4>
            </div>
          </div>
        </section>

        {/* 10. Draggable Cards */}
        <section className="w-full relative overflow-clip">
          <DraggableCardDemo />
        </section>
      </main>

      {/* 11. Dark Footer */}
      <footer className="bg-black text-page-bg font-body-md text-body-md w-full pt-12 md:pt-16 pb-4 px-margin flex flex-col items-center rounded-t-[32px] md:rounded-t-[40px] mt-section">
        <div className="max-w-[1728px] mx-auto w-full">
          {/* Subheader info bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between w-full pb-8 text-neutral-500 text-xs font-mono tracking-wider uppercase">
            <span>Engineering modern digital systems since 2024</span>
            <div className="flex items-center gap-4 mt-2 sm:mt-0">
              <span>© {new Date().getFullYear()} 3AM DEVS</span>
              <span>•</span>
              <span>All rights reserved</span>
            </div>
          </div>

          {/* Massive 3AM DEVS Wordmark in clean black shade */}
          <div className="w-full overflow-hidden flex justify-center items-center pt-4 sm:pt-6 pb-2 select-none border-t border-neutral-800">
            <svg
              viewBox="0 0 1200 240"
              className="w-full h-auto select-none pointer-events-auto transition-colors duration-500"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <text
                x="50%"
                y="62%"
                dominantBaseline="middle"
                textAnchor="middle"
                textLength="1160"
                lengthAdjust="spacingAndGlyphs"
                fill="#262626"
                className="hover:fill-[#3a3a3a] transition-colors duration-300"
                style={{
                  fontFamily: "'Archivo Black', sans-serif",
                  fontSize: "190px",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                }}
              >
                3AM DEVS
              </text>
            </svg>
            <h1 className="sr-only">3AM DEVS</h1>
          </div>
        </div>
      </footer>
    </div>
  );
}
