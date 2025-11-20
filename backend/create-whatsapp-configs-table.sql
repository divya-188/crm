-- Create whatsapp_configs table
CREATE TABLE IF NOT EXISTS whatsapp_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone_number_id VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  business_account_id VARCHAR(255) NOT NULL,
  webhook_secret VARCHAR(255) NOT NULL,
  webhook_url TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('connected', 'disconnected', 'pending')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_tested_at TIMESTAMP,
  test_result TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_whatsapp_configs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_configs_tenant_id ON whatsapp_configs(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_configs_tenant_id_unique ON whatsapp_configs(tenant_id);

-- Add comment
COMMENT ON TABLE whatsapp_configs IS 'Stores per-tenant WhatsApp Business API configuration';
