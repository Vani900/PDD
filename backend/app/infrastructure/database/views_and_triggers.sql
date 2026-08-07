-- CharityAI PostgreSQL Materialized Views & Triggers
-- Run against database after Alembic migrations

-- 1. Materialized View: NGO Impact Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS ngo_impact_summary AS
SELECT 
    o.id AS organization_id,
    o.name AS organization_name,
    o.city,
    COUNT(DISTINCT d.id) AS total_donations_received,
    COALESCE(SUM(d.amount), 0) AS total_monetary_donated,
    COUNT(DISTINCT c.id) AS active_campaigns_count,
    COALESCE(AVG(o.rating), 5.0) AS average_rating
FROM organizations o
LEFT JOIN donations d ON d.ngo_id = o.id AND d.is_deleted = FALSE
LEFT JOIN campaigns c ON c.organization_id = o.id AND c.is_deleted = FALSE
WHERE o.is_deleted = FALSE AND o.org_type = 'ngo'
GROUP BY o.id, o.name, o.city;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ngo_impact_summary_org_id ON ngo_impact_summary(organization_id);

-- 2. Materialized View: Platform Daily Analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_platform_analytics AS
SELECT 
    DATE(d.created_at) AS donation_date,
    d.donation_type,
    COUNT(d.id) AS total_count,
    COALESCE(SUM(d.amount), 0) AS total_amount
FROM donations d
WHERE d.is_deleted = FALSE
GROUP BY DATE(d.created_at), d.donation_type;

-- 3. Automatic Updated_At Timestamp Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to core tables
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trg_donations_updated_at ON donations;
CREATE TRIGGER trg_donations_updated_at BEFORE UPDATE ON donations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
