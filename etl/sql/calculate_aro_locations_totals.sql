UPDATE aro.locations l
  SET total_businesses = GREATEST(0, (SELECT COUNT(*) FROM aro.businesses b WHERE b.location_id = l.id));

UPDATE locations l
  SET total_households = GREATEST(0, (SELECT SUM(LEAST(1, number_of_households)) FROM aro.households h WHERE h.location_id = l.id));

UPDATE locations l
  SET total_towers = GREATEST(0, (SELECT COUNT(*) FROM aro.towers t WHERE t.location_id = l.id));
