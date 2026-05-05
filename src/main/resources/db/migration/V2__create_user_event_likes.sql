CREATE TABLE user_event_likes (
    user_id BIGINT NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, event_id),
    CONSTRAINT fk_user_event_likes_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user_event_likes_event
        FOREIGN KEY (event_id) REFERENCES events (id)
        ON DELETE CASCADE,
    INDEX idx_user_event_likes_event_id (event_id)
);
