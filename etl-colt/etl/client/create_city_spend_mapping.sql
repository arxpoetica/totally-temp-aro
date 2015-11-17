ALTER TABLE client.spend ADD COLUMN city_id int;

UPDATE client.spend SET 
	city_id = (SELECT c.id FROM aro.cities c WHERE c.country_name = 'Germany' AND c.city_name = 'Frankfurt')::int
WHERE 
	country = 'Germany' AND city = 'Frankfurt';

UPDATE client.spend SET 
	city_id = (SELECT c.id FROM aro.cities c WHERE c.country_name = 'France' AND c.city_name = 'Paris')::int
WHERE 
	country = 'France' AND city = 'Paris';
