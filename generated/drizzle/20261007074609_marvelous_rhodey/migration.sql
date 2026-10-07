CREATE SCHEMA "outbox";
--> statement-breakpoint
ALTER TABLE "outbox_dead_letters" SET SCHEMA "outbox";
--> statement-breakpoint
ALTER TABLE "outbox_inbox" SET SCHEMA "outbox";
--> statement-breakpoint
ALTER TABLE "outbox_messages" SET SCHEMA "outbox";
