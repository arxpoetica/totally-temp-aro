UPDATE locations l
  SET total_businesses = (SELECT COUNT(*) FROM businesses b WHERE b.location_id = l.id);

UPDATE locations l
  SET total_households = (SELECT COUNT(*) FROM households h WHERE h.location_id = l.id);

UPDATE locations l
  SET total_towers = (SELECT COUNT(*) FROM towers t WHERE t.location_id = l.id);
