-- Create contact_segments table
CREATE TABLE IF NOT EXISTS contact_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL,
  "contactCount" INTEGER DEFAULT 0,
  "lastCalculatedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_contact_segments_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "IDX_contact_segments_tenantId" ON contact_segments("tenantId");
CREATE INDEX IF NOT EXISTS "IDX_contact_segments_tenantId_name" ON contact_segments("tenantId", name);

-- Add comment
COMMENT ON TABLE contact_segments IS 'Stores contact segmentation criteria for filtering and organizing contacts';
