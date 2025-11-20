-- Create flows table
CREATE TABLE IF NOT EXISTS flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenantId" UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "flowData" JSONB NOT NULL,
    "triggerConfig" JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    version INTEGER NOT NULL DEFAULT 1,
    "parentFlowId" UUID,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_flows_tenantId" FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create indexes for flows
CREATE INDEX IF NOT EXISTS "IDX_flows_tenantId" ON flows ("tenantId");
CREATE INDEX IF NOT EXISTS "IDX_flows_tenantId_status" ON flows ("tenantId", status);

-- Create flow_executions table
CREATE TABLE IF NOT EXISTS flow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "flowId" UUID NOT NULL,
    "conversationId" UUID,
    "contactId" UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'running',
    "currentNodeId" VARCHAR(255),
    context JSONB,
    "executionPath" JSONB,
    "errorMessage" TEXT,
    "completedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_flow_executions_flowId" FOREIGN KEY ("flowId") REFERENCES flows(id) ON DELETE CASCADE,
    CONSTRAINT "FK_flow_executions_conversationId" FOREIGN KEY ("conversationId") REFERENCES conversations(id) ON DELETE SET NULL,
    CONSTRAINT "FK_flow_executions_contactId" FOREIGN KEY ("contactId") REFERENCES contacts(id) ON DELETE SET NULL
);

-- Create indexes for flow_executions
CREATE INDEX IF NOT EXISTS "IDX_flow_executions_flowId" ON flow_executions ("flowId");
CREATE INDEX IF NOT EXISTS "IDX_flow_executions_flowId_status" ON flow_executions ("flowId", status);
CREATE INDEX IF NOT EXISTS "IDX_flow_executions_conversationId" ON flow_executions ("conversationId");

-- Insert migration record
INSERT INTO migrations (timestamp, name) 
VALUES (1700000000016, 'CreateFlowsTables1700000000016')
ON CONFLICT DO NOTHING;
