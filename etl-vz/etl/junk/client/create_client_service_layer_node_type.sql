-- ----------------------------
--  Table structure for service_layer_node_type
-- ----------------------------
DROP TABLE IF EXISTS "client"."service_layer_node_type";
CREATE TABLE "client"."service_layer_node_type" (
	service_layer_id int4 NOT NULL REFERENCES client.service_layer ON DELETE CASCADE,
	network_node_type_id int4 NOT NULL REFERENCES client.network_node_types ON DELETE CASCADE,
	code varchar(64),
	name varchar(64),
	description varchar,
	is_displayed boolean  default true,
	UNIQUE(service_layer_id, network_node_type_id, code), 
	UNIQUE(service_layer_id, code),
	CONSTRAINT client_service_layer_node_type_pkey PRIMARY KEY (service_layer_id, network_node_type_id)
);
ALTER TABLE "client"."service_layer_node_type" OWNER TO "aro";

--wire center

INSERT INTO client.service_layer_node_type
	(service_layer_id, network_node_type_id, code, name, description)
VALUES (
	(SELECT id FROM client.service_layer where name = 'wirecenter'),
	(SELECT id FROM client.network_node_types where name = 'central_office'),
	'wirecenter_central_office',
	'Central Office',
	'Central Office'
) ;

INSERT INTO client.service_layer_node_type
	(service_layer_id, network_node_type_id, code, name, description)
VALUES (
	(SELECT id FROM client.service_layer where name = 'wirecenter'),
	(SELECT id FROM client.network_node_types where name = 'splice_point'),
	'wirecenter_splice_point',
	'Splice Point',
	'Splice Point'
) ;

INSERT INTO client.service_layer_node_type
	(service_layer_id, network_node_type_id, code, name, description)
VALUES (
	(SELECT id FROM client.service_layer where name = 'wirecenter'),
	(SELECT id FROM client.network_node_types where name = 'fiber_distribution_hub'),
	'wirecenter_fiber_distribution_hub',
	'FDH',
	'FDH'
) ;


INSERT INTO client.service_layer_node_type
	(service_layer_id, network_node_type_id, code, name, description)
VALUES (
	(SELECT id FROM client.service_layer where name = 'wirecenter'),
	(SELECT id FROM client.network_node_types where name = 'fiber_distribution_terminal'),
	'wirecenter_fiber_distribution_terminal',
	'FDT',
	'FDT'
) ;


INSERT INTO client.service_layer_node_type
	(service_layer_id, network_node_type_id, code, name, description)
VALUES (
	(SELECT id FROM client.service_layer where name = 'wirecenter'),
	(SELECT id FROM client.network_node_types where name = 'bulk_distrubution_terminal'),
	'wirecenter_bulk_distrubution_terminal',
	'bulk_distrubution_terminal',
	'bulk_distrubution_terminal'
) ;

INSERT INTO client.service_layer_node_type
	(service_layer_id, network_node_type_id, code, name, description)
VALUES (
	(SELECT id FROM client.service_layer where name = 'wirecenter'),
	(SELECT id FROM client.network_node_types where name = 'bulk_distribution_consumer'),
	'wirecenter_bulk_distribution_consumer',
	'bulk_distribution_consumer',
	'bulk_distribution_consumer'
) ;

-- cran


INSERT INTO client.service_layer_node_type
	(service_layer_id, network_node_type_id, code, name, description)
VALUES (
	(SELECT id FROM client.service_layer where name = 'cran'),
	(SELECT id FROM client.network_node_types where name = 'central_office'),
	'cran_central_office',
	'Central Office',
	'Central Office'
) ;

INSERT INTO client.service_layer_node_type
	(service_layer_id, network_node_type_id, code, name, description)
VALUES (
	(SELECT id FROM client.service_layer where name = 'cran'),
	(SELECT id FROM client.network_node_types where name = 'splice_point'),
	'cran_splice_point',
	'Splice Point',
	'Splice Point'
) ;

INSERT INTO client.service_layer_node_type
	(service_layer_id, network_node_type_id, code, name, description)
VALUES (
	(SELECT id FROM client.service_layer where name = 'cran'),
	(SELECT id FROM client.network_node_types where name = 'fiber_distribution_hub'),
	'cran_fiber_distribution_hub',
	'FDH',
	'FDH'
) ;


INSERT INTO client.service_layer_node_type
	(service_layer_id, network_node_type_id, code, name, description)
VALUES (
	(SELECT id FROM client.service_layer where name = 'cran'),
	(SELECT id FROM client.network_node_types where name = 'fiber_distribution_terminal'),
	'cran_fiber_distribution_terminal',
	'FDT',
	'FDT'
) ;


INSERT INTO client.service_layer_node_type
	(service_layer_id, network_node_type_id, code, name, description)
VALUES (
	(SELECT id FROM client.service_layer where name = 'cran'),
	(SELECT id FROM client.network_node_types where name = 'bulk_distrubution_terminal'),
	'cran_bulk_distrubution_terminal',
	'bulk_distrubution_terminal',
	'bulk_distrubution_terminal'
) ;

INSERT INTO client.service_layer_node_type
	(service_layer_id, network_node_type_id, code, name, description)
VALUES (
	(SELECT id FROM client.service_layer where name = 'cran'),
	(SELECT id FROM client.network_node_types where name = 'bulk_distribution_consumer'),
	'cran_bulk_distribution_consumer',
	'bulk_distribution_consumer',
	'bulk_distribution_consumer'
) ;


-- directional_facality df


INSERT INTO client.service_layer_node_type
	(service_layer_id, network_node_type_id, code, name, description)
VALUES (
	(SELECT id FROM client.service_layer where name = 'directional_facility'),
	(SELECT id FROM client.network_node_types where name = 'central_office'),
	'df_cran_central_office',
	'Central Office',
	'Central Office'
) ;

INSERT INTO client.service_layer_node_type
	(service_layer_id, network_node_type_id, code, name, description)
VALUES (
	(SELECT id FROM client.service_layer where name = 'directional_facility'),
	(SELECT id FROM client.network_node_types where name = 'splice_point'),
	'df_splice_point',
	'Splice Point',
	'Splice Point'
) ;

INSERT INTO client.service_layer_node_type
	(service_layer_id, network_node_type_id, code, name, description)
VALUES (
	(SELECT id FROM client.service_layer where name = 'directional_facility'),
	(SELECT id FROM client.network_node_types where name = 'fiber_distribution_hub'),
	'df_fiber_distribution_hub',
	'FDH',
	'FDH'
) ;


INSERT INTO client.service_layer_node_type
	(service_layer_id, network_node_type_id, code, name, description)
VALUES (
	(SELECT id FROM client.service_layer where name = 'directional_facility'),
	(SELECT id FROM client.network_node_types where name = 'fiber_distribution_terminal'),
	'df_fiber_distribution_terminal',
	'FDT',
	'FDT'
) ;


INSERT INTO client.service_layer_node_type
	(service_layer_id, network_node_type_id, code, name, description)
VALUES (
	(SELECT id FROM client.service_layer where name = 'directional_facility'),
	(SELECT id FROM client.network_node_types where name = 'bulk_distrubution_terminal'),
	'df_bulk_distrubution_terminal',
	'bulk_distrubution_terminal',
	'bulk_distrubution_terminal'
) ;

INSERT INTO client.service_layer_node_type
	(service_layer_id, network_node_type_id, code, name, description)
VALUES (
	(SELECT id FROM client.service_layer where name = 'directional_facility'),
	(SELECT id FROM client.network_node_types where name = 'bulk_distribution_consumer'),
	'df_bulk_distribution_consumer',
	'bulk_distribution_consumer',
	'bulk_distribution_consumer'
) ;