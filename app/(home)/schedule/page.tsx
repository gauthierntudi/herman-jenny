import type { Metadata } from "next";
import SiteHeader from "@/components/home/SiteHeader";
import SiteFooter from "@/components/home/SiteFooter";
import LegacyHomeScripts from "@/components/home/LegacyHomeScripts";
import ScheduleContent from "@/components/schedule/ScheduleContent";
import { getSlidePaths } from "@/lib/slides";
import "./schedule.css";

export const metadata: Metadata = {
  title: "Schedule — Herman & Jennifer",
  description: "Celebration day schedule — Blessing Ceremony and Grand Reception Party.",
};

const BLESSING = {
  title: "Blessing Ceremony",
  time: "12:30 PM",
  detail: "A sacred moment of prayer as we begin our forever together.",
};

const RECEPTION_PRELUDE = {
  time: "6:00 PM",
  title: "Guests Seated",
  lines: [
    "Please take your seats as soft instrumental music fills the room.",
    "The bridal party prepares for the grand entrance.",
  ],
};

const RECEPTION_TIMELINE = [
  { time: "6:30 PM", title: "Grand Opening" },
  { time: "6:50 PM", title: "Opening Prayer" },
  {
    time: "7:00 PM",
    title: "Bridal Party Entrance",
    detail: "Groomsmen, bridesmaids, then Jennifer & Herman",
  },
  {
    time: "7:30 PM",
    title: "First Dance & Presentation",
    detail: "The newlyweds share their first dance",
  },
  { time: "7:40 PM", title: "A Romantic Moment" },
  { time: "7:50 PM", title: "Gift Presentation" },
  { time: "8:15 PM", title: "Couples’ Dances" },
  { time: "8:30 PM", title: "Dinner Service", detail: "Buffet is served" },
  { time: "9:00 PM", title: "Toast & Cake Ceremony" },
  {
    time: "9:40 PM",
    title: "Second Entry & Dance Floor",
    detail: "The celebration continues on the dance floor",
  },
  {
    time: "11:00 PM",
    title: "Closing Prayer",
    detail: "End of celebration",
  },
];

export default function SchedulePage() {
  const slideImages = getSlidePaths();

  return (
    <>
      <div id="body" className="tp-smooth-scroll">
        <SiteHeader showPreloader={false} />
        <div id="smooth-wrapper">
          <div id="smooth-content">
            <ScheduleContent
              blessing={BLESSING}
              prelude={RECEPTION_PRELUDE}
              timeline={RECEPTION_TIMELINE}
              slideImages={slideImages}
            />
            <SiteFooter />
          </div>
        </div>
      </div>
      <LegacyHomeScripts />
    </>
  );
}
