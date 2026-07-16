import type { Metadata } from "next";
import SiteHeader from "@/components/home/SiteHeader";
import SiteFooter from "@/components/home/SiteFooter";
import LegacyHomeScripts from "@/components/home/LegacyHomeScripts";
import GiftUniverseContent from "@/components/gift/GiftUniverseContent";
import "./gift-universe.css";

export const metadata: Metadata = {
  title: "Gift Universe — Herman & Jennifer",
  description: "Gift ideas for Herman & Jennifer — shop selected pieces on Amazon.",
};

export default function GiftUniversePage() {
  return (
    <>
      <div id="body" className="tp-smooth-scroll">
        <SiteHeader showPreloader={false} />
        <div id="smooth-wrapper">
          <div id="smooth-content">
            <GiftUniverseContent />
            <SiteFooter />
          </div>
        </div>
      </div>
      <LegacyHomeScripts />
    </>
  );
}
