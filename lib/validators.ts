import { z } from "zod";

export const guestLoginSchema = z.object({
  full_phone: z.string().min(8),
  guest_name: z.string().trim().min(2),
  url_token: z.string().optional(),
});

export const invitationLookupSchema = z.object({
  full_phone: z.string().min(8),
});

export const availabilitySchema = z
  .object({
    availability: z.boolean().optional().default(true),
    outside_usa: z.boolean().optional().default(false),
    people_count: z.number().int().min(1).max(2),
    need_invitation: z.boolean().optional().default(false),
    need_visa_assistance: z.boolean().optional().default(false),
    need_hotel_booking: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      if (!data.outside_usa) return true;
      return data.need_invitation || data.need_visa_assistance || data.need_hotel_booking;
    },
    { message: "Please select at least one option (invitation, visa, or hotel)." }
  );

export const whatsappRecipientSchema = z.object({
  phone: z.string().min(8),
  name: z.string().trim().min(1),
  token: z.string().optional(),
  genre: z.string().optional(),
});

export const whatsappBulkSchema = z.object({
  recipients: z.array(whatsappRecipientSchema).min(1),
});

export const toggleBlockedSchema = z.object({
  phone: z.string().min(8),
  blocked: z.boolean(),
});

export const markSentSchema = z.object({
  all: z.boolean().optional(),
  phones: z.array(z.string().min(8)).optional(),
});

export const createTableSchema = z.object({
  name: z.string().trim().min(1).max(80),
  seatCount: z.number().int().min(1).max(50),
});

export const updateTableSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80).optional(),
  seatCount: z.number().int().min(1).max(50).optional(),
});

export const tableIdSchema = z.object({
  id: z.string().min(1),
});

export const assignGuestSchema = z.object({
  tableId: z.string().min(1),
  guestId: z.string().min(1),
});

export const createGuestAndAssignSchema = z.object({
  tableId: z.string().min(1),
  name: z.string().trim().min(2),
  phone: z.string().min(8),
  genre: z.string().trim().optional(),
});

export const unassignGuestSchema = z.object({
  guestId: z.string().min(1),
});

export const markInvitationSentSchema = z.object({
  guestId: z.string().min(1),
});

export const markInvitationsSentSchema = z.object({
  guestIds: z.array(z.string().min(1)).min(1),
});

export const sendTableInvitationSchema = whatsappRecipientSchema.extend({
  guestId: z.string().min(1),
});

export const sendTableInvitationBulkSchema = z.object({
  recipients: z.array(sendTableInvitationSchema).min(1),
});

export const updatePeopleCountSchema = z.object({
  guestId: z.string().min(1),
  peopleCount: z.number().int().min(1).max(50),
});

export const updateGuestSchema = z.object({
  guestId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  phone: z.string().min(8),
  genre: z.string().trim().min(2).max(40).optional(),
});

/** @deprecated use updateGuestSchema */
export const updateGuestNameSchema = updateGuestSchema;
