-- CreateTable
CREATE TABLE `referral` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `member_name` VARCHAR(255) NOT NULL,
    `member_email` VARCHAR(255) NOT NULL,
    `prospect_name` VARCHAR(255) NOT NULL,
    `prospect_email` VARCHAR(255) NOT NULL,
    `referral_code` VARCHAR(100) NOT NULL,
    `redeemed` BOOLEAN NOT NULL DEFAULT false,

    INDEX `referral_member_email_idx`(`member_email`),
    INDEX `referral_created_at_idx`(`created_at`),
    INDEX `referral_referral_code_idx`(`referral_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
