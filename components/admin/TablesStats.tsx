"use client";

import { Armchair, UserCheck, Users, UtensilsCrossed } from "lucide-react";
import { ColoredStatsGrid, type ColoredStatItem } from "@/components/admin/AdminColoredStats";

type Props = {
  totalPeople: number;
  assignedPeople: number;
  unassignedPeople: number;
  tableCount: number;
  totalSeats: number;
  totalAssigned: number;
};

export default function TablesStats({
  totalPeople,
  assignedPeople,
  unassignedPeople,
  tableCount,
  totalSeats,
  totalAssigned,
}: Props) {
  const freeSeats = Math.max(0, totalSeats - totalAssigned);
  const occupancy = totalSeats > 0 ? Math.round((totalAssigned / totalSeats) * 100) : 0;
  const avgSeats = tableCount > 0 ? Math.round(totalSeats / tableCount) : 0;

  const items: ColoredStatItem[] = [
    {
      icon: Users,
      tone: "purple",
      value: totalPeople,
      label: "Invités",
      sub: `${assignedPeople} à une table · ${unassignedPeople} sans table`,
    },
    {
      icon: UtensilsCrossed,
      tone: "gold",
      value: tableCount,
      label: "Tables",
      sub: tableCount > 0 ? `Moyenne ${avgSeats} place${avgSeats > 1 ? "s" : ""} / table` : "Aucune table créée",
    },
    {
      icon: Armchair,
      tone: "blue",
      value: totalSeats,
      label: "Places totales",
      sub: `${freeSeats} place${freeSeats > 1 ? "s" : ""} libre${freeSeats > 1 ? "s" : ""}`,
    },
    {
      icon: UserCheck,
      tone: "green",
      value: totalAssigned,
      label: "Places assignées",
      sub: `${occupancy}% de remplissage`,
      progress: occupancy,
    },
  ];

  return <ColoredStatsGrid items={items} />;
}
