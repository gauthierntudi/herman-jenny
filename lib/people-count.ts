import { Guest } from "@prisma/client";

type GuestPeopleCount = Pick<Guest, "peopleCount">;

export function getPeopleCount(guest: GuestPeopleCount): number {
  return guest.peopleCount ?? 1;
}

export function sumTableOccupied(assignments: { guest: GuestPeopleCount }[]): number {
  return assignments.reduce((sum, a) => sum + getPeopleCount(a.guest), 0);
}

export function sumPeopleCount(guests: GuestPeopleCount[]): number {
  return guests.reduce((sum, g) => sum + getPeopleCount(g), 0);
}
