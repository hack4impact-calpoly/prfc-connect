-- CreateTable
CREATE TABLE `contact_group` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(500) NULL,
    `ownerid` INTEGER NOT NULL,

    INDEX `contact_group_ownerid_idx`(`ownerid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact_group_member` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `group_id` INTEGER NOT NULL,
    `member_id` INTEGER NOT NULL,
    `notify_email` BOOLEAN NOT NULL DEFAULT true,
    `notify_sms` BOOLEAN NOT NULL DEFAULT false,
    `added_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `added_by` INTEGER NOT NULL,
    `unsubscribed_at` DATETIME(3) NULL,
    `unsubscribe_method` VARCHAR(50) NULL,

    INDEX `contact_group_member_group_id_notify_email_idx`(`group_id`, `notify_email`),
    INDEX `contact_group_member_group_id_notify_sms_idx`(`group_id`, `notify_sms`),
    INDEX `contact_group_member_member_id_idx`(`member_id`),
    UNIQUE INDEX `contact_group_member_group_id_member_id_key`(`group_id`, `member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sms_consent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `member_id` INTEGER NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `consented_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `consent_method` VARCHAR(50) NOT NULL,
    `consent_text` TEXT NOT NULL,
    `consent_purpose` VARCHAR(100) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `revoked_at` DATETIME(3) NULL,
    `revoke_method` VARCHAR(50) NULL,
    `revoke_message` VARCHAR(500) NULL,

    INDEX `sms_consent_member_id_idx`(`member_id`),
    INDEX `sms_consent_phone_idx`(`phone`),
    INDEX `sms_consent_consented_at_idx`(`consented_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_suppression` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `reason` ENUM('hard_bounce', 'complaint', 'unsubscribe') NOT NULL,
    `suppressed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `email_suppression_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `group_id` INTEGER NULL,
    `sender_id` INTEGER NOT NULL,
    `subject` VARCHAR(200) NOT NULL,
    `body` TEXT NOT NULL,
    `sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `email_count` INTEGER NOT NULL DEFAULT 0,
    `sms_count` INTEGER NOT NULL DEFAULT 0,
    `failed_count` INTEGER NOT NULL DEFAULT 0,
    `is_blast` BOOLEAN NOT NULL DEFAULT false,

    INDEX `message_group_id_idx`(`group_id`),
    INDEX `message_sender_id_idx`(`sender_id`),
    INDEX `message_sent_at_idx`(`sent_at`),
    INDEX `message_group_id_sent_at_idx`(`group_id`, `sent_at`),
    INDEX `message_is_blast_sent_at_idx`(`is_blast`, `sent_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_recipient` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `message_id` INTEGER NOT NULL,
    `member_id` INTEGER NOT NULL,
    `channel` VARCHAR(10) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `external_id` VARCHAR(100) NULL,
    `sent_at` DATETIME(3) NULL,
    `delivered_at` DATETIME(3) NULL,
    `error` VARCHAR(500) NULL,

    INDEX `message_recipient_message_id_idx`(`message_id`),
    INDEX `message_recipient_member_id_idx`(`member_id`),
    INDEX `message_recipient_message_id_status_idx`(`message_id`, `status`),
    INDEX `message_recipient_member_id_sent_at_idx`(`member_id`, `sent_at`),
    INDEX `message_recipient_external_id_idx`(`external_id`),
    UNIQUE INDEX `message_recipient_message_id_member_id_channel_key`(`message_id`, `member_id`, `channel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contact_group_member` ADD CONSTRAINT `contact_group_member_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `contact_group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `message_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `contact_group`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_recipient` ADD CONSTRAINT `message_recipient_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
