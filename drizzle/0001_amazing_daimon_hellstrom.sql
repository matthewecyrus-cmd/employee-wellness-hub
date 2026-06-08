CREATE TABLE `hub_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectionKey` varchar(64) NOT NULL,
	`contentType` varchar(64) NOT NULL DEFAULT 'text',
	`title` varchar(255) NOT NULL DEFAULT '',
	`body` text DEFAULT (''),
	`url` varchar(512) DEFAULT '',
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hub_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hub_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`label` varchar(128) NOT NULL,
	`icon` varchar(64) NOT NULL DEFAULT 'circle',
	`color` varchar(32) NOT NULL DEFAULT '#3B82F6',
	`route` varchar(128) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hub_sections_id` PRIMARY KEY(`id`),
	CONSTRAINT `hub_sections_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `hub_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(128) NOT NULL,
	`settingValue` text NOT NULL DEFAULT (''),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hub_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `hub_settings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
CREATE TABLE `tableside_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`location` varchar(255) NOT NULL DEFAULT '',
	`description` text DEFAULT (''),
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tableside_sessions_id` PRIMARY KEY(`id`)
);
