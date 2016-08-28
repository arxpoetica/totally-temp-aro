TRUNCATE client.location_entry_fees CASCADE;

-- Move every location id into the location_entry_fee table
INSERT INTO client.location_entry_fees(location_id)
	SELECT id FROM aro.locations;

-- Set the entry fee for every location to be between $500 and $5000. This is a very rough estimate of cost range.
UPDATE client.location_entry_fees
SET entry_fee = CAST(((random() * 5000) + 500) AS numeric);