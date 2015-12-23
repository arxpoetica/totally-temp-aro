ALTER TABLE client.spend ADD COLUMN city_id int;

UPDATE client.spend SET city_id = (SELECT c.id FROM aro.cities c)::int;
