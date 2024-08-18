CREATE TABLE `github_user` (
	`user_id` text PRIMARY KEY NOT NULL,
	`github_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`name` text,
	`avatar_url` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_user_github_id_unique` ON `github_user` (`github_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `github_id_index` ON `github_user` (`github_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);