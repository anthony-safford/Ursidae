CREATE TABLE `task_questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`taskId` integer NOT NULL,
	`text` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `__new_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parentId` integer,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'discovery' NOT NULL,
	`positionX` real DEFAULT 0 NOT NULL,
	`positionY` real DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`parentId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_tasks`("id", "parentId", "title", "description", "status", "positionX", "positionY", "createdAt", "updatedAt") SELECT "id", "parentId", "title", "description", "status", "positionX", "positionY", "createdAt", "updatedAt" FROM `tasks`;
--> statement-breakpoint
DROP TABLE `tasks`;
--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;
