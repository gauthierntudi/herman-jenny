import SiteHeader from "@/components/home/SiteHeader";
import SiteFooter from "@/components/home/SiteFooter";
import LegacyHomeScripts from "@/components/home/LegacyHomeScripts";
import DualCubeSection from "@/components/home/DualCubeSection";
import DressCodeSection from "@/components/home/DressCodeSection";
import GiftUniverseContent from "@/components/gift/GiftUniverseContent";
import { getRandomDualCubeFaces } from "@/lib/dual-cube-faces";
import homeBodyHtml from "@/content/home-body.html";
import "./gift-universe/gift-universe.css";

export const dynamic = "force-dynamic";

const GIFT_MARKER = "<!--GIFT_UNIVERSE-->";
const DUAL_CUBE_MARKER = "<!--DUAL_CUBE-->";

function getHomeBodyParts(): { beforeGift: string; between: string; after: string } {
  const html = homeBodyHtml.trim();
  const [beforeGift = "", afterGift = ""] = html.split(GIFT_MARKER);
  const [between = "", after = ""] = afterGift.split(DUAL_CUBE_MARKER);
  return {
    beforeGift: beforeGift.trim(),
    between: between.trim(),
    after: after.trim(),
  };
}

export default function HomePage() {
  const { beforeGift, between, after } = getHomeBodyParts();
  const cubeFaces = getRandomDualCubeFaces();

  return (
    <>
      <div id="body" className="tp-smooth-scroll">
        <SiteHeader />
        <div id="smooth-wrapper">
          <div id="smooth-content">
            <main suppressHydrationWarning>
              <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: beforeGift }} />
              <GiftUniverseContent variant="section" />
              {between ? (
                <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: between }} />
              ) : null}
              <DualCubeSection faces={cubeFaces} />
              <DressCodeSection />
              <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: after }} />
            </main>
            <SiteFooter />
          </div>
        </div>
      </div>
      <LegacyHomeScripts />
    </>
  );
}
