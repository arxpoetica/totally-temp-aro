DELETE FROM client.plan WHERE plan_type = 'H';
TRUNCATE client.existing_fiber CASCADE;
