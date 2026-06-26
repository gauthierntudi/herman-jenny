import { readFileSync } from "fs";
import { join } from "path";
import SiteHeader from "@/components/home/SiteHeader";
import LegacyHomeScripts from "@/components/home/LegacyHomeScripts";

function getHomeBodyHtml(): string {
  const filePath = join(process.cwd(), "content", "home-body.html");
  return readFileSync(filePath, "utf-8").trim();
}

export default function HomePage() {
  const bodyHtml = getHomeBodyHtml();

  return (
    <>
      <div id="body" className="tp-smooth-scroll">
        <SiteHeader />
        <div id="smooth-wrapper">
          <div id="smooth-content">
            <main suppressHydrationWarning dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          </div>
        </div>
      </div>
      <LegacyHomeScripts />
    </>
  );
}
