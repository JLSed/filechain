import type { Session, SupabaseClient, User as UserMetadata } from '@supabase/supabase-js';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<{
				session: Session | null;
				user_metadata: Metadata | null;
				profile: User.Profile | null;
			}>;
		}
		interface PageData {
			session: Session | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
	namespace User {
		type Metadata = UserMetadata;
		type Profile = {
			user_id: string;
			role: string;
			first_name: string;
			last_name: string;
			middle_name?: string;
			is_active: boolean;
		};
	}
}

export {};
