import type { Metadata } from "next";
import { getSlidePaths } from "@/lib/slides";
import { prisma } from "@/lib/prisma";
import {
  getDeviceId,
  getStdAuthPhone,
} from "@/lib/guest-cookies";
import { normalizePhone } from "@/lib/phone";
import SaveTheDateClient from "@/components/savethedate/SaveTheDateClient";

export const metadata: Metadata = {
  title: "Save The Date",
  description: "Herman & Jennifer — Save the Date",
};

export default async function SaveTheDatePage() {
  const slidePaths = getSlidePaths();
  const deviceId = await getDeviceId();
  const authPhone = await getStdAuthPhone();

  let showExperience = false;
  let alreadySubmitted = false;

  if (deviceId && authPhone) {
    const guest = await prisma.guest.findFirst({
      where: {
        deviceId,
        phone: normalizePhone(authPhone),
      },
    });

    if (guest) {
      showExperience = true;
      alreadySubmitted = guest.availability !== null;
    }
  }

  return (
    <SaveTheDateClient
      slidePaths={slidePaths}
      showExperience={showExperience}
      alreadySubmitted={alreadySubmitted}
    />
  );
}
