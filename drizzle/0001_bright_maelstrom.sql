CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jupasCode` varchar(20),
	`nameZhTw` varchar(255) NOT NULL,
	`nameZhCn` varchar(255),
	`nameEn` varchar(255),
	`degreeType` varchar(30),
	`institution` varchar(100) NOT NULL,
	`institutionCode` varchar(20),
	`duration` int,
	`qualification` enum('bachelor','higher_diploma','associate_degree') DEFAULT 'bachelor',
	`scoringMethod` varchar(50),
	`requiredSubjects` json,
	`weightedSubjects` json,
	`minRequirement` varchar(50),
	`interviewArrangement` varchar(100),
	`quota` int,
	`lastYearMedian` decimal(6,2),
	`lastYearQ1` decimal(6,2),
	`lastYearAdmitted` int,
	`lastYearGroupAAdmitted` int,
	`lastYearGroupAApplicants` int,
	`lastYearTotalApplicants` int,
	`groupAOnly` boolean DEFAULT false,
	`scoreGap` enum('above_median','above_q1','below_q1','between_median_q1'),
	`fundingType` enum('ugc','nmtss','sssdp','self_financed'),
	`tuitionFee` int,
	`scoringMethodChanged` boolean DEFAULT false,
	`isNew` boolean DEFAULT false,
	`moduleType` enum('jupas','eapp','mainland') NOT NULL DEFAULT 'jupas',
	`descriptionZhTw` text,
	`descriptionZhCn` text,
	`descriptionEn` text,
	`careerProspectsZhTw` text,
	`careerProspectsZhCn` text,
	`careerProspectsEn` text,
	`websiteUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courses_id` PRIMARY KEY(`id`),
	CONSTRAINT `courses_jupasCode_unique` UNIQUE(`jupasCode`)
);
--> statement-breakpoint
CREATE TABLE `jupas_choices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`choices` json DEFAULT ('[]'),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jupas_choices_id` PRIMARY KEY(`id`),
	CONSTRAINT `jupas_choices_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `saved_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255),
	`courseIds` json,
	`reportUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_favorites_id` PRIMARY KEY(`id`)
);
