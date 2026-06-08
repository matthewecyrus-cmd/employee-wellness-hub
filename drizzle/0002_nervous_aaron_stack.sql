ALTER TABLE `hub_content` MODIFY COLUMN `body` text;--> statement-breakpoint
ALTER TABLE `hub_settings` MODIFY COLUMN `settingValue` text NOT NULL;--> statement-breakpoint
ALTER TABLE `tableside_sessions` MODIFY COLUMN `description` text;