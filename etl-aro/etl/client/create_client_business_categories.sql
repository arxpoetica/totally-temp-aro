/*

Delta script DROP TABLE IF EXISTS client.business_categories ;
*/

-- Create a View on business Categories to maintain existing code
-- NOTE : Business categories extends entity_category which is a more general concept

DROP VIEW IF EXISTS client.business_categories ;
CREATE VIEW client.business_categories AS
select e.id, e.name, e.description, b.min_value, b.max_value
from client.business_category b
join client.entity_category e on e.id = b.id ;