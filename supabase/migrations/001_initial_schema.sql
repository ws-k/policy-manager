-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. policy_status enum
CREATE TYPE policy_status AS ENUM ('draft', 'published');

-- 2. policy_domains
CREATE TABLE policy_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO policy_domains (name, slug, sort_order) VALUES
  ('화면·UX 정책', 'screen-ux', 1),
  ('회원 정책', 'membership', 2),
  ('매장 정책', 'store', 3),
  ('약관·법무', 'legal', 4),
  ('운영 정책', 'operations', 5),
  ('데이터 정책', 'data', 6);

-- 3. features
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  screen_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_features_slug ON features(slug);

INSERT INTO features (name, slug, screen_path) VALUES
  ('홈', 'home', '/'),
  ('매장 검색', 'store-search', '/search'),
  ('지도', 'map', '/map'),
  ('길찾기', 'navigation', '/map/route'),
  ('마이페이지', 'mypage', '/mypage'),
  ('회원가입/로그인', 'auth', '/auth'),
  ('매장 상세', 'store-detail', '/stores/:id'),
  ('카테고리 탐색', 'category-browse', '/categories');

-- 4. policy_docs
CREATE TABLE policy_docs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES policy_domains(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status policy_status NOT NULL DEFAULT 'draft',
  content JSONB NOT NULL DEFAULT '{}',
  content_text TEXT NOT NULL DEFAULT '',
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  parent_version_id UUID REFERENCES policy_docs(id),
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_policy_slug_version UNIQUE (slug, version)
);

CREATE INDEX idx_policy_docs_domain ON policy_docs(domain_id);
CREATE INDEX idx_policy_docs_status ON policy_docs(status);
CREATE INDEX idx_policy_docs_slug ON policy_docs(slug);

-- 5. policy_sections (메타데이터만, content 없음)
CREATE TABLE policy_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_doc_id UUID NOT NULL REFERENCES policy_docs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  anchor_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sections_policy_sort ON policy_sections(policy_doc_id, sort_order);

-- 6. feature_policies (N:M)
CREATE TABLE feature_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES policy_sections(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_feature_section UNIQUE (feature_id, section_id)
);

CREATE INDEX idx_fp_feature ON feature_policies(feature_id);
CREATE INDEX idx_fp_section ON feature_policies(section_id);

-- 7. changelogs
CREATE TABLE changelogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_doc_id UUID NOT NULL REFERENCES policy_docs(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  change_type TEXT NOT NULL DEFAULT 'update' CHECK (change_type IN ('create', 'update', 'publish', 'unpublish')),
  summary TEXT NOT NULL,
  detail TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_changelogs_policy ON changelogs(policy_doc_id);
CREATE INDEX idx_changelogs_created ON changelogs(created_at DESC);

-- 8. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_policy_domains_updated BEFORE UPDATE ON policy_domains FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_features_updated BEFORE UPDATE ON features FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_policy_docs_updated BEFORE UPDATE ON policy_docs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_policy_sections_updated BEFORE UPDATE ON policy_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 9. RLS
ALTER TABLE policy_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "domains: authenticated read" ON policy_domains FOR SELECT TO authenticated USING (true);
CREATE POLICY "domains: authenticated manage" ON policy_domains FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "features: authenticated read" ON features FOR SELECT TO authenticated USING (true);
CREATE POLICY "features: authenticated manage" ON features FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "policies: authenticated read" ON policy_docs FOR SELECT TO authenticated USING (true);
CREATE POLICY "policies: authenticated manage" ON policy_docs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "policies: anon read published public" ON policy_docs FOR SELECT TO anon USING (status = 'published' AND is_public = true);

CREATE POLICY "sections: authenticated read" ON policy_sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "sections: authenticated manage" ON policy_sections FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "fp: authenticated read" ON feature_policies FOR SELECT TO authenticated USING (true);
CREATE POLICY "fp: authenticated manage" ON feature_policies FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "changelogs: authenticated read" ON changelogs FOR SELECT TO authenticated USING (true);
CREATE POLICY "changelogs: authenticated manage" ON changelogs FOR ALL TO authenticated USING (true) WITH CHECK (true);
