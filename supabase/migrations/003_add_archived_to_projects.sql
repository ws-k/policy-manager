ALTER TABLE projects ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX idx_projects_archived ON projects(archived);
