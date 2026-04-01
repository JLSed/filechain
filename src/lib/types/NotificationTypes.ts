import * as z from 'zod';

export const NotificationSchema = z.object({
	id: z.uuid(),
	user_id: z.uuid(),
	actor_id: z.uuid().nullable(),
	title: z.string(),
	message: z.string(),
	link: z.string().nullable(),
	is_read: z.boolean(),
	created_at: z.string()
});

export type Notification = z.infer<typeof NotificationSchema>;
