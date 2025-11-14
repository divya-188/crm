-- Seed Agent User for Testing
-- This script creates an agent user for the test tenant

-- First, get the test tenant ID
DO $$
DECLARE
    v_tenant_id UUID;
    v_user_exists BOOLEAN;
BEGIN
    -- Find the test tenant
    SELECT id INTO v_tenant_id
    FROM tenants
    WHERE slug = 'test-company'
    LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Test tenant not found. Please create a tenant first.';
        RETURN;
    END IF;

    RAISE NOTICE 'Found tenant ID: %', v_tenant_id;

    -- Check if agent user already exists
    SELECT EXISTS(
        SELECT 1 FROM users WHERE email = 'agent@test.com'
    ) INTO v_user_exists;

    IF v_user_exists THEN
        -- Update existing agent user
        UPDATE users
        SET 
            "passwordHash" = '$2b$10$YourHashedPasswordHere',
            "firstName" = 'Test',
            "lastName" = 'Agent',
            role = 'agent',
            status = 'active',
            "tenantId" = v_tenant_id,
            "updatedAt" = NOW()
        WHERE email = 'agent@test.com';
        
        RAISE NOTICE 'Agent user updated successfully';
    ELSE
        -- Create new agent user
        INSERT INTO users (
            id,
            email,
            "passwordHash",
            "firstName",
            "lastName",
            role,
            status,
            "tenantId",
            "isOwner",
            "createdAt",
            "updatedAt"
        ) VALUES (
            gen_random_uuid(),
            'agent@test.com',
            '$2b$10$YourHashedPasswordHere',  -- Password: Agent123!
            'Test',
            'Agent',
            'agent',
            'active',
            v_tenant_id,
            false,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Agent user created successfully';
    END IF;

    RAISE NOTICE 'Agent Credentials:';
    RAISE NOTICE '  Email: agent@test.com';
    RAISE NOTICE '  Password: Agent123!';
    RAISE NOTICE '  Role: agent';
END $$;
