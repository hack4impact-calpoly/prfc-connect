-- CreateEnum
-- EventType: social, networking, volunteer, meeting
-- RsvpStatus: going, maybe, declined
-- (Prisma handles MySQL enum mapping)

-- CreateTable
CREATE TABLE `event` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `location` VARCHAR(200) NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `rsvp_deadline` DATETIME(3) NULL,
    `event_type` ENUM('social', 'networking', 'volunteer', 'meeting') NOT NULL,
    `ownerid` INTEGER NOT NULL,
    `group_id` INTEGER NULL,

    INDEX `event_ownerid_idx`(`ownerid`),
    INDEX `event_group_id_idx`(`group_id`),
    INDEX `event_start_date_idx`(`start_date`),
    INDEX `event_event_type_idx`(`event_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_rsvp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_id` INTEGER NOT NULL,
    `member_id` INTEGER NOT NULL,
    `status` ENUM('going', 'maybe', 'declined') NOT NULL,
    `responded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `event_rsvp_member_id_idx`(`member_id`),
    UNIQUE INDEX `event_rsvp_event_id_member_id_key`(`event_id`, `member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_preference` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `member_id` INTEGER NOT NULL,
    `notify_email_default` BOOLEAN NOT NULL DEFAULT true,
    `notify_sms_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_preference_member_id_key`(`member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event` ADD CONSTRAINT `event_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `contact_group`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_rsvp` ADD CONSTRAINT `event_rsvp_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
