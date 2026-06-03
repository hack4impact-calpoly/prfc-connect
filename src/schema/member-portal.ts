import { z } from "zod";

export const ValidateTokenResponseSchema = z.object({
  ownerid: z.string(),
  secondsleft: z.string(),
  isadmin: z.string(),
});

export const ListMembersResponseSchema = z.array(
  z.object({
    ownerid: z.string(),
    ownername: z.string(),
  }),
);

export const MemberContactsResponseSchema = z.array(
  z.object({
    ownerid: z.string(),
    ownername: z.string(),
    email: z.string(),
    phone: z.string(),
    altphone: z.string(),
  }),
);

export type ValidateTokenResponse = z.infer<typeof ValidateTokenResponseSchema>;
export type ListMembersResponse = z.infer<typeof ListMembersResponseSchema>;
export type MemberContactsResponse = z.infer<typeof MemberContactsResponseSchema>;
