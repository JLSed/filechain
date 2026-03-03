import type {User  } from '@supabase/supabase-js';
import * as z from "zod";

export const UserProfileSchema = z.object({
    user_id: z.uuid(),
    role: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    middle_name: z.string().optional(),
    is_active: z.boolean(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserMetadata = User;

export const UserSecretSchema = z.object({
    user_id: z.uuid(),
    encrypted_private_key: z.string(),
    public_key: z.string(),
    pk_salt: z.string(),
    pk_nonce: z.string(),
    created_at: z.string()
});

export type UserSecret = z.infer<typeof UserSecretSchema>;