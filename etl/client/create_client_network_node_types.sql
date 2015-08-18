DROP TABLE IF EXISTS client.network_node_types;

CREATE TABLE client.network_node_types
(
	id serial,
	name varchar(64),
	description varchar(128),
	CONSTRAINT network_node_types_pkey PRIMARY KEY (id)
);  

insert into client.network_node_types (name, description) values('central_office','Central Office') ;
insert into client.network_node_types (name, description) values('splice_point','Splice Point') ;
insert into client.network_node_types (name, description) values('fiber_deployment_hub','Fiber Deployment Hub') ;
insert into client.network_node_types (name, description) values('fiber_deployent_terminal','Fiber Deployment Terminal') ;