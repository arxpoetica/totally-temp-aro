CREATE TABLE client.network_node_types
(
	id serial,
	name varchar(64),
	description varchar(128),
	CONSTRAINT network_node_types_pkey PRIMARY KEY (id)
);  

insert into client.network_node_types (name, description) values('central_office','Central Office') ;
insert into client.network_node_types (name, description) values('splice_point','Splice Point') ;
insert into client.network_node_types (name, description) values('fiber_distribution_hub','Fiber Distribution Hub') ;
insert into client.network_node_types (name, description) values('fiber_distribution_terminal','Fiber Distribution Terminal') ;
