-- 1. Add tombstone metadata columns
ALTER TABLE feature_policies
  ADD COLUMN deleted_section_title TEXT,
  ADD COLUMN policy_doc_id UUID REFERENCES policy_docs(id) ON DELETE SET NULL;

-- 2. Backfill policy_doc_id from existing section relationships
UPDATE feature_policies fp
SET policy_doc_id = ps.policy_doc_id
FROM policy_sections ps
WHERE fp.section_id = ps.id;

-- 3. Trigger to preserve section title before SET NULL
CREATE OR REPLACE FUNCTION on_section_delete_preserve_title()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE feature_policies
  SET deleted_section_title = OLD.title,
      policy_doc_id = OLD.policy_doc_id
  WHERE section_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_preserve_section_title
  BEFORE DELETE ON policy_sections
  FOR EACH ROW
  EXECUTE FUNCTION on_section_delete_preserve_title();

-- 4. Make section_id nullable and change FK to SET NULL
ALTER TABLE feature_policies
  ALTER COLUMN section_id DROP NOT NULL;

ALTER TABLE feature_policies
  DROP CONSTRAINT feature_policies_section_id_fkey,
  ADD CONSTRAINT feature_policies_section_id_fkey
    FOREIGN KEY (section_id) REFERENCES policy_sections(id)
    ON DELETE SET NULL;

-- 5. Replace unique constraint to exclude NULLs
ALTER TABLE feature_policies
  DROP CONSTRAINT IF EXISTS uq_feature_section;

CREATE UNIQUE INDEX uq_feature_section_active
  ON feature_policies (feature_id, section_id)
  WHERE section_id IS NOT NULL;

-- 6. Index for tombstone queries
CREATE INDEX idx_fp_tombstone ON feature_policies (feature_id) WHERE section_id IS NULL;
