CREATE TABLE client.location_entry_fees
(
	id serial,
	location_id bigint,
	entry_fee numeric,
	CONSTRAINT client_location_entry_fees_pkey PRIMARY KEY (id)
);

CREATE INDEX client_location_entry_fees_location_index ON client.location_entry_fees(location_id);


-- Move every location id into the location_entry_fee table
INSERT INTO client.location_entry_fees(location_id)
	SELECT id FROM aro.locations;

-- Set the entry fee for every location to be between $500 and $5000. This is a very rough estimate of cost range.
UPDATE client.location_entry_fees
SET entry_fee = CAST(((random() * 5000) + 500) AS numeric);