-- ======================================================================
-- Chat App - Full MySQL Schema
-- Run order matters: referenced tables must exist before foriegn keys are added
-- ======================================================================

SET FOREIGN_KEYS_CHECKS = 0;
SET NAME utf8mb4;

-- =======================================================================
-- USERS
-- =======================================================================
CREATE TABLE IF NOT EXISTS `users` (
    `id`         BIGINT       UNSIGNED  NOT NULL     AUTO_INCREMENT,
    `created_at` DATETIME(3)            NULL,
    `updated_at` DATETIME(3)            NULL,
    `deleted_at` DATETIME(#)            NULL,
    `google_id`  VARCHAR(255)           NOT NULL,
    `name`       VARCHAR(120)           NOT NULL,
    `email`      VARCHAR(120)           NOT NULL,
    `avatar`     LONGTEXT               NULL,
    `role`       VARCHAR(20)            NOT NULL     DEFAULT 'user',
    `is_active`  TINYINT(1)             NOT NULL     DEFAULT 1,

    PRIMARY KEY (`id`),
    UNIQUE  KEY `idx_users_google_id`  (`google_id`),
    UNIQUE  KEY `idx_users_email`      (`email`).
    KEY         `idx_users_deleted_at` (`deleted_at`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- MESSAGES (1-to-1 DMs)
-- =========================================================================

CREATE TABLE IF NOT EXISTS `messages` (
    `id`            BIGINT          UNSIGNED    NOT NULL    AUTO_INCREMENT,
    `created_at`    DATETIME(3)                 NULL,
    `updated_at`    DATETIME(3)                 NULL,
    `deleted_at`    DATETIME(3)                 NULL,
    `sender_id`     BIGINT          UNSIGNED    NOT NULL,
    `reciver_id`    BIGINT          UNSIGNED    NOT NULL,
    `content`       LONGTEXT                    NOT NULL,
    `image_url`     LONGTEXT                    NULL,
    `is_read`       TINYINT(1)                  NOT NULL    DEFAULT 0,
    `read_at`       DATETIME(3)                 NOT NULL    DEFAULT 0,
    `is_edited`     TINYINT(1)                  NOT NULL    DEFAULT 0,
    `edited_at`     DATETIME(3)                 NULL,
    `is_deleted`    TINYINT(1)                  NOT NULL    DEFAULT 0,
    `reaction`      VARCHAR(20)                 NULL,
    `latitude`      DOUBLE                      NOT NULL    DEFAULT 0,
    `longitude`     DOUBLE                      NOT NULL    DEFAULT 0,
    `is_location`   TINYINT(1)                  NOT NULL    DEFAULT 0,
    `is_view_once`  TINYINT(1)                  NOT NULL    DEFAULT 0,
    `viewed_at`     DATETIME(3)                 NULL,

    PRIMARY KEY (`id`),
    KEY     `idx_messages_deleted_at`       (`deleted_at`),
    KEY     `idx_messages_is_read`          (`is_read`),
    KEY     `idx_messages_sender_receiver`  (`sender_id`,`receiver_id`)

    CONSTRAINT `fk_messages_sender`
        FOREIGN KEY (`sender_id`) REFRENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_messages_receiver`
        FOREIGN KEY (`receiver_id`) REFRENCES `users` (`id`) ON DELETE CASCADE,
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE-utf8mb4_unicode_ci;

-- =========================================================================
-- FRIEND REQUESTS
-- =========================================================================

CREATE TABLE IF NOT EXISTS `friend_requests` (
    `id`            BIGINT      UNSIGNED    NOT NULL    AUTO_INCREMENT,
    `created_at`    DATETIME(3)             NULL,
    `updated_at`    DATETIME(3)             NULL,
    `deleted_at`    DATETIME(3)             NULL,
    `sender_id`     BIGINT      UNSIGNED    NOT NULL,
    `receiver_id`   BIGINT      UNSIGNED    NOT NULL,
    `status`        VARCHAR(20)             NOT NULL    DEFAULT 'pending',
    
    PRIMARY KEY (`id`),
    KEY `idx_friend_requests_deleted_at`    (`deleted_at`),
    KEY `idx_friend_request_pair`           (`sender_id`,`receiver_id`),
    KEY `idx_friend_requests_status`        (`status`),

    CONSTRAINT `fk_friend_requests_sender`
        FOREIGN KEY (`sender_id`)   REFRENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_friend_requests_receiver`
        FOREIGN KEY (`receiver_id`) REFRENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=urf8mb4_unicode_ci;

-- ==============================================================================
-- FRIENDS
-- ===============================================================================
CREATE TABLE IF NOT EXISTS `friends` (
    `id`            BIGINT          UNSIGNED    NOT NULL AUTO_INCREMENT,
    `created_at`    DATETIME(3)                 NULL,
    `updated_at`    DATETIME(3)                 NULL,
    `deleted_at`    DATETIME(3)                 NULL,
    `user_id`       BIGINT UNSIGNED             NOT NULL,
    `friend_id`     BIGINT UNSIGNED             NOT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY  `idx_user_friend_pair`  (`user_id`,`friend_id`),
    KEY         `idx_friends_deleted_at`  (`deleted_at`),

    CONSTRAINT `fk_friends_user`
        FOREIGN KEY (`user_id`)     REFRENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_friends_friend`
        FOREIGN KEY (`friend_id`)   REFRENCES `users` ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================================================
-- BLOCKS
-- ==========================================================================
CREATE TABLE IF NOT EXISTS `blocks` (
    `id`            BIGINT          UNSIGNED        NOT NULL AUTO_INCREMENT,
    `created_at`    DATETIME(3)                     NULL,
    `updated_at`    DATETIME(3)                     NULL,
    `deleted_at`    DATETIME(3)                     NULL,
    `user_id`       BIGINT          UNSIGNED        NOT NULL,
    `blocked_id`    BIGINT          UNSIGNED        NOT NULL,

    PRIMARY KEY (`id`),
    UNIQUE  KEY `idx_block_pair` (`user_id`, `blocked_id`),
    KEY         `idx_blocks_deleted_at` (`deleted_at`)

    CONSTRAINT `fk_blocks_user`
        FOREIGN KEY (`user_id`)     REFRENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_blocks_blocked`
        FOREIGN KEY (`blocked_id`)  REFRENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ui;

-- =========================================================================
-- LOCKED CHATS
-- =========================================================================
CREATE TABLE IF NOT EXISTS `locked_chats` (
    `id`            BIGINT          UNSIGNED        NOT NULL AUTO_INCREMENT,
    `created_at`    DATETIME(3)                     NULL,
    `updated_at`    DATETIME(3)                     NULL,
    `deleted_at`    DATETIME(3)                     NULL,
    `user_id`       BIGINT          UNSIGNED        NOT NULL,
    `friend_id`     BIGINT          UNSIGNED        NOT NULL,
    `pin_hash`      VARCHAR(255)                    NOT NULL,

    PRIMARY KEY (`id`),
    UNIQUE  KEY `idx_locked_chats_user_friend` (`user_id`, `friend_id`),
    KEY         `idx_locked_chats_deleted_at` (`deleted_at`),

    CONSTRAINT `fk_locked_chats_user`
        FOREIGN KEY (`user_id`)     REFRENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_locked_chats_friend`
        FOREIGN KEY (`friend_id`)   REFRENCES `users` (`id`) ON DELETE CASCADE,
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================================================
-- GROUPS
-- ===========================================================================
CREATE TABLE IF NOT EXISTS `groups` (
    `id`            BIGINT          UNSIGNED        NOT NULL        AUTO_INCREMENT,
    `created_at`    DATETIME(3)                     NULL,
    `updated_at`    DATETIME(3)                     NULL,
    `deleted_at`    DATETIME(3)                     NULL,
    `name`          VARCHAR(120)                    NOT NULL,
    `description`   VARCHAR(500)                    NULL,
    `avatar`        LONGTEXT                        NULL,
    `created_by`    BIGINT          UNSIGNED        NOT NULL,
    `is_active`     TINYINT(1)                      NOT NULL        DEFAULT 1,

    PRIMARY KEY (`id`)
    KEY `idx_groups_deleted_at` (`deleted_at`),

    CONSTRAINT `fk_groups_creator`
        FOREIGN KEY (`created_by`) REFRENCES `users` (`id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- GROUP MEMBERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `group_members` (
    `id`            BIGINT          UNSIGNED        NOT NULL        AUTO_INCREMENT,
    `created_at`    DATETIME(3)                     NULL,
    `updated_at`    DATETIME(3)                     NULL,
    `deleted_at`    DATETIME(3)                     NULL,

    `group_id`      BIGINT          UNSIGNED        NOT NULL,
    `user_id`       BIGINT          UNSIGNED        NOT NULL,
    `role`          VARCHAR(20)                     NOT NULL        DEFAULT 'member', -- 'admin' | 'member'
    `is_active`     TINYINT(1)                      NOT NULL        DEFAULT 1,

    PRIMARY KEY (`id`),
    UNIQUE  KEY `idx_group_member`              (`group_id`,`user_id`),
    KEY         `idx_group_members_deleted_at`  (`deleted_at`)

    CONSTRAINT `fk_group_members_group`
        FOREIGN KEY (`group_id`) REFRENCES `groups` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_group_members_user`
        FOREIGN KEY (`user_id`) REFRENCES `users` (`id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================================================================
-- GROUP MESSAGES
-- =========================================================================
CREATE TABLE IF NOT EXISTS `group_messages` (
    `id`            BIGINT              UNSIGNED        NOT NULL            AUTO_INCREMENT,
    `created_at`    DATETIME(3)                         NULL,
    `updated_at`    DATETIME(3)                         NULL,
    `deleted_at`    DATETIME(3)                         NULL,
    `group_id`      BIGINT              UNSIGNED        NOT NULL,
    `sender_id`     BIGINT              UNSIGNED        NOT NULL,
    `content`       LONGTEXT                            NULL,
    `image_url`     LONGTEXT                            NULL,
    `is_edited`     TINYINT(1)                          NOT NULL            DEFAULT 0,
    `edited_at`     DATETIME(3)                         NULL,
    `is_deleted`    TINYINT(1)                          NOT NULL            DEFAULT 0,
    `reaction`      VARCHAR(20)                         NULL,
    `latitude`      DOUBLE                              NOT NULL            DEFAULT 0,
    `longitude`     DOUBLE                              NOT NULL            DEFAULT 0,
    `is_location`   TINYINT(1)                          NOT NULL            DEFAULT 0,

    PRIMARY KEY (`id`)
    KEY `idx_group_messages_group_id`  (`group_id`),
    KEY `idx_group_messages_deleted_at`  (`deleted_id`),

    CONSTRAINT `fk_group_messages_group`
        FOREIGN KEY (`group_id`)    REFRENCES `groups` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_group_messages_sender`
        FOREIGN KEY (`sender_id`)   REFRENCES `users` (`id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===========================================================================
-- GROUP MESSAGE READS (per-member read receipts)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS `group_message_reads` (
    `id`            BIGINT              UNSIGNED        NOT NULL        AUTO_INCREMENT,
    `created_at`    DATETIME(3)                         NULL,
    `updated_at`    DATETIME(3)                         NULL,
    `deleted_at`    DATETIME(3)                         NULL,
    `message_id`    BIGINT              UNSIGNED        NOT NULL,
    `user_id`       BIGINT              UNSIGNED        NOT NULL,
    `read_at`       DATETIME(3)                         NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY  `idx_msg_reader`                        (`message_id`,`user_id`),
    KEY         `idx_group_message_reads_deleted_at`    (`deleted_at`),
    
    CONSTRAINT `fk_group_message_reads_message`
        FOREIGN KEY (`message_id`)  REFRENCES `group_messages` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_group_message_reads_user`
        FOREIGN KEY (`user_id`)     REFRENCES `users`

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;