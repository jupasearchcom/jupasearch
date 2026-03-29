ALTER TABLE `courses` ADD `jupasUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `courses` ADD `flexibleAdmission` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `courses` ADD `acceptMultipleSittings` enum('yes_no_penalty','yes_with_penalty','no');--> statement-breakpoint
ALTER TABLE `courses` ADD `acceptAppliedLearning` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `courses` ADD `acceptOtherLanguage` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `courses` ADD `scoreFormula` json;