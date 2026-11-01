-- Migration : Ajout edition_id dans cp2i_messages et chat_conversations
USE u122559880_form_contact;

ALTER TABLE cp2i_messages
    ADD COLUMN IF NOT EXISTS edition_id INT NOT NULL DEFAULT 4;

ALTER TABLE chat_conversations
    ADD COLUMN IF NOT EXISTS edition_id INT NOT NULL DEFAULT 4;

-- Rattacher les anciens messages/conversations à l'édition 3 (créés avant 2026)
UPDATE cp2i_messages SET edition_id = 3 WHERE created_at < '2026-01-01' AND edition_id = 4;
UPDATE chat_conversations SET edition_id = 3 WHERE created_at < '2026-01-01' AND edition_id = 4;

CREATE INDEX IF NOT EXISTS idx_messages_edition ON cp2i_messages(edition_id);
CREATE INDEX IF NOT EXISTS idx_chat_edition ON chat_conversations(edition_id);

SELECT 'cp2i_messages' as tbl, edition_id, COUNT(*) as total FROM cp2i_messages GROUP BY edition_id
UNION
SELECT 'chat_conversations', edition_id, COUNT(*) FROM chat_conversations GROUP BY edition_id;
