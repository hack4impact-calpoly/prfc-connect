-- CreateTable
CREATE TABLE `event_invitee` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_id` INTEGER NOT NULL,
    `member_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `event_invitee_event_id_idx`(`event_id`),
    INDEX `event_invitee_member_id_idx`(`member_id`),
    UNIQUE INDEX `event_invitee_event_id_member_id_key`(`event_id`, `member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event_invitee` ADD CONSTRAINT `event_invitee_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
