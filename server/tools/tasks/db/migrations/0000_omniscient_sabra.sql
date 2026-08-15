CREATE TABLE `task_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sourceTaskId` integer NOT NULL,
	`targetTaskId` integer NOT NULL,
	`type` text DEFAULT 'related' NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`sourceTaskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`targetTaskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `task_links_sourceTaskId_targetTaskId_type_unique` ON `task_links` (`sourceTaskId`,`targetTaskId`,`type`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parentId` integer,
	`title` text NOT NULL,
	`description` text,
	`questions` text,
	`status` text DEFAULT 'open' NOT NULL,
	`positionX` real DEFAULT 0 NOT NULL,
	`positionY` real DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`parentId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
