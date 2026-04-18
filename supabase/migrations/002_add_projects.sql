-- 1. projects 테이블
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_projects_updated
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. 기존 테이블에 project_id 추가
ALTER TABLE policy_domains ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE features       ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE policy_docs    ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- 3. 기존 데이터를 "기본 프로젝트"로 이관
--    (authenticated 사용자가 없으므로 created_by는 NULL로 두고 나중에 업데이트 가능)
INSERT INTO projects (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', '기본 프로젝트');

UPDATE policy_domains SET project_id = '00000000-0000-0000-0000-000000000001' WHERE project_id IS NULL;
UPDATE features       SET project_id = '00000000-0000-0000-0000-000000000001' WHERE project_id IS NULL;
UPDATE policy_docs    SET project_id = '00000000-0000-0000-0000-000000000001' WHERE project_id IS NULL;

-- 4. NOT NULL 제약 추가 (기존 데이터 이관 후)
ALTER TABLE policy_domains ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE features       ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE policy_docs    ALTER COLUMN project_id SET NOT NULL;

-- 5. 인덱스
CREATE INDEX idx_policy_domains_project ON policy_domains(project_id);
CREATE INDEX idx_features_project       ON features(project_id);
CREATE INDEX idx_policy_docs_project    ON policy_docs(project_id);

-- 6. RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects: authenticated read"   ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects: authenticated manage" ON projects FOR ALL    TO authenticated USING (true) WITH CHECK (true);
