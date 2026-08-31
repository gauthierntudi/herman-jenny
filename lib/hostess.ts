import { Guest, WeddingTable } from "@prisma/client";
import { getPeopleCount } from "@/lib/people-count";

export type HostessGuest = {
  id: string;
  name: string;
  genre: string;
  phone: string;
  token: string;
  peopleCount: number;
  checkedInAt: string | null;
  checkedInCount: number | null;
  table: { id: string; name: string; seatCount: number } | null;
};

type GuestWithTable = Guest & {
  tableAssignment?: { table: WeddingTable } | null;
};

export function serializeHostessGuest(guest: GuestWithTable): HostessGuest {
  const table = guest.tableAssignment?.table ?? null;
  return {
    id: guest.id,
    name: guest.name,
    genre: guest.genre,
    phone: guest.phone,
    token: guest.token,
    peopleCount: getPeopleCount(guest),
    checkedInAt: guest.checkedInAt?.toISOString() ?? null,
    checkedInCount: guest.checkedInCount,
    table: table ? { id: table.id, name: table.name, seatCount: table.seatCount } : null,
  };
}

export const guestTableInclude = {
  tableAssignment: { include: { table: true } },
} as const;
