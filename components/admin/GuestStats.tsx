"use client";

import { CalendarCheck, CircleCheck, Send, Users } from "lucide-react";
import { ColoredStatsGrid, type ColoredStatItem } from "@/components/admin/AdminColoredStats";

export type GuestStatsData = {
  totalPeople: number;
  totalRecords: number;
  activePeople: number;
  inactivePeople: number;
  awaitingPeople: number;
  availablePeople: number;
  notAnsweredPeople: number;
  unavailablePeople: number;
  sent: number;
  notSent: number;
  linked: number;
};

type Props = {
  stats: GuestStatsData;
};

export default function GuestStats({ stats }: Props) {
  const sentProgress =
    stats.sent + stats.notSent > 0 ? Math.round((stats.sent / (stats.sent + stats.notSent)) * 100) : 0;

  const items: ColoredStatItem[] = [
    {
      icon: Users,
      tone: "gold",
      value: stats.totalPeople,
      label: "Total invités",
      sub: `${stats.totalRecords} fiche${stats.totalRecords > 1 ? "s" : ""} · ${stats.linked} appareil${stats.linked > 1 ? "s" : ""} lié${stats.linked > 1 ? "s" : ""}`,
    },
    {
      icon: CircleCheck,
      tone: "green",
      value: stats.activePeople,
      label: "Comptes actifs",
      sub: `${stats.inactivePeople} compte${stats.inactivePeople > 1 ? "s" : ""} non activé${stats.inactivePeople > 1 ? "s" : ""}`,
    },
    {
      icon: CalendarCheck,
      tone: "blue",
      value: stats.awaitingPeople,
      label: "En attente",
      sub: `${stats.availablePeople} disponible${stats.availablePeople > 1 ? "s" : ""} · ${stats.notAnsweredPeople} non répondu${stats.notAnsweredPeople > 1 ? "s" : ""} · ${stats.unavailablePeople} indisponible${stats.unavailablePeople > 1 ? "s" : ""}`,
    },
    {
      icon: Send,
      tone: "purple",
      value: stats.sent,
      label: "Messages envoyés",
      sub: `${stats.notSent} restant${stats.notSent > 1 ? "s" : ""}`,
      progress: sentProgress,
    },
  ];

  return <ColoredStatsGrid items={items} />;
}
