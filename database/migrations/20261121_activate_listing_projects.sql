-- Активує напрямки, що працюють на єдиному модулі оголошень (additive). Безпечно запускати повторно.
UPDATE projects SET status = 'active' WHERE slug IN ('health', 'sport', 'trade', 'china', 'services', 'jobs') AND status = 'coming_soon';
