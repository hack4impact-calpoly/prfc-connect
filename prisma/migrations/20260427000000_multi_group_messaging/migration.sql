-- CreateTable
CREATE TABLE `message_group` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `message_id` INTEGER NOT NULL,
    `group_id` INTEGER NOT NULL,

    INDEX `message_group_message_id_idx`(`message_id`),
    INDEX `message_group_group_id_idx`(`group_id`),
    UNIQUE INDEX `message_group_message_id_group_id_key`(`message_id`, `group_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- MigrateData: copy existing group associations to join table
INSERT INTO `message_group` (`message_id`, `group_id`)
SELECT `id`, `group_id` FROM `message` WHERE `group_id` IS NOT NULL;

-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `message_group_id_fkey`;

-- DropIndex
DROP INDEX `message_group_id_idx` ON `message`;
DROP INDEX `message_group_id_sent_at_idx` ON `message`;

-- AlterTable
ALTER TABLE `message` DROP COLUMN `group_id`;

-- AddForeignKey
ALTER TABLE `message_group` ADD CONSTRAINT `message_group_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `message_group` ADD CONSTRAINT `message_group_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `contact_group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
