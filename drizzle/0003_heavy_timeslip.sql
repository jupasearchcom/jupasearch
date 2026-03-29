CREATE TABLE `dse_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scores` json DEFAULT ('{}'),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dse_scores_id` PRIMARY KEY(`id`),
	CONSTRAINT `dse_scores_userId_unique` UNIQUE(`userId`)
);
