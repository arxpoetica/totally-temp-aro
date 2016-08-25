DROP TABLE IF EXISTS client.location_entry_fees;
CREATE TABLE client.location_entry_fees
(
	id serial,
	location_id bigint,
	entry_fee numeric,
	CONSTRAINT client_location_entry_fees_pkey PRIMARY KEY (id)
);

CREATE INDEX client_location_entry_fees_location_index ON client.location_entry_fees(location_id);
