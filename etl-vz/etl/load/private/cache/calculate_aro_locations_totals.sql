-- UPDATE locations l
--   SET total_businesses = GREATEST(0, (SELECT COUNT(*) FROM businesses b WHERE b.location_id = l.id));

-- UPDATE locations l
--   SET total_households = GREATEST(0, (SELECT SUM(LEAST(1, number_of_households)) FROM households h WHERE h.location_id = l.id));

-- UPDATE locations l
--   SET total_towers = GREATEST(0, (SELECT COUNT(*) FROM towers t WHERE t.location_id = l.id));
