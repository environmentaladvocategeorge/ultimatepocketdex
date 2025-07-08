CREATE TABLE "User" (
    user_id UUID PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    gender VARCHAR(50),
    age_range VARCHAR(50) NOT NULL,
    create_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE PersonalityTrait (
    personality_trait_id UUID PRIMARY KEY,
    personality_trait_name VARCHAR(255) UNIQUE NOT NULL,
    personality_trait_category VARCHAR(255) NOT NULL
);

CREATE TABLE Assistant (
    assistant_id UUID PRIMARY KEY,
    name VARCHAR(24) NOT NULL,
    description VARCHAR(150),
    biography TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_by UUID REFERENCES "User" (user_id) ON DELETE SET NULL,
    message_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    birthplace VARCHAR(24),
    age INT NULL,
    gender VARCHAR(24),
    create_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE AssistantPersonalityTraitBridge (
    assistant_id UUID NOT NULL REFERENCES Assistant(assistant_id) ON DELETE CASCADE,
    personality_trait_id UUID NOT NULL REFERENCES PersonalityTrait(personality_trait_id) ON DELETE CASCADE,
    PRIMARY KEY (assistant_id, personality_trait_id)
);

CREATE TABLE ChatSession (
    chat_session_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    assistant_id UUID NOT NULL,
    last_message_text TEXT,
    last_message_ts TIMESTAMPTZ,
    create_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "User" (user_id) ON DELETE CASCADE,
    FOREIGN KEY (assistant_id) REFERENCES Assistant(assistant_id) ON DELETE CASCADE
);

CREATE TABLE Message (
    message_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    chat_session_id UUID,
    sender_id UUID NOT NULL,
    role VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    create_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_session_id) REFERENCES ChatSession(chat_session_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES "User" (user_id) ON DELETE CASCADE
);

CREATE TABLE AssistantLike (
    like_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    assistant_id UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    create_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "User" (user_id) ON DELETE CASCADE,
    FOREIGN KEY (assistant_id) REFERENCES Assistant (assistant_id) ON DELETE CASCADE,
    UNIQUE (user_id, assistant_id)
);

CREATE OR REPLACE FUNCTION update_message_count() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'assistant' THEN
        UPDATE Assistant 
        SET message_count = message_count + 1,
            updated_ts = CURRENT_TIMESTAMP
        WHERE assistant_id = NEW.sender_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_message_insert
AFTER INSERT ON Message
FOR EACH ROW
EXECUTE FUNCTION update_message_count();

CREATE OR REPLACE FUNCTION update_last_message_text()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ChatSession
    SET 
        last_message_text = NEW.message,
        last_message_ts = NEW.create_ts,
        updated_ts = CURRENT_TIMESTAMP
    WHERE chat_session_id = NEW.chat_session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_last_message_text_trigger
AFTER INSERT ON Message
FOR EACH ROW
EXECUTE FUNCTION update_last_message_text();

CREATE OR REPLACE FUNCTION update_last_message_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ChatSession cs
    SET 
        last_message_text = (
            SELECT message
            FROM Message m
            WHERE m.chat_session_id = OLD.chat_session_id
            ORDER BY create_ts DESC
            LIMIT 1
        ),
        last_message_ts = (
            SELECT create_ts
            FROM Message m
            WHERE m.chat_session_id = OLD.chat_session_id
            ORDER BY create_ts DESC
            LIMIT 1
        ),
        updated_ts = CURRENT_TIMESTAMP
    WHERE cs.chat_session_id = OLD.chat_session_id;
    
    UPDATE ChatSession
    SET 
        last_message_text = NULL,
        last_message_ts = NULL,
        updated_ts = CURRENT_TIMESTAMP
    WHERE chat_session_id = OLD.chat_session_id
      AND NOT EXISTS (
          SELECT 1
          FROM Message
          WHERE chat_session_id = OLD.chat_session_id
      );
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_delete_trigger
AFTER DELETE ON Message
FOR EACH ROW
EXECUTE FUNCTION update_last_message_on_delete();

CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.is_active = TRUE) OR 
       (TG_OP = 'UPDATE' AND NEW.is_active = TRUE AND OLD.is_active = FALSE) THEN
        UPDATE Assistant 
        SET like_count = like_count + 1,
            updated_ts = CURRENT_TIMESTAMP
        WHERE assistant_id = NEW.assistant_id;
    ELSIF (TG_OP = 'UPDATE' AND NEW.is_active = FALSE AND OLD.is_active = TRUE) THEN
        UPDATE Assistant 
        SET like_count = GREATEST(like_count - 1, 0),
            updated_ts = CURRENT_TIMESTAMP
        WHERE assistant_id = NEW.assistant_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_assistant_like_insert
AFTER INSERT ON AssistantLike
FOR EACH ROW
EXECUTE FUNCTION update_like_count();

CREATE TRIGGER after_assistant_like_update
AFTER UPDATE ON AssistantLike
FOR EACH ROW
WHEN (NEW.is_active IS DISTINCT FROM OLD.is_active)
EXECUTE FUNCTION update_like_count();