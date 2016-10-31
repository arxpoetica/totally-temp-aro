DROP TABLE IF EXISTS client.plan_location_link;
CREATE SEQUENCE client.plan_location_link_id_seq
 INCREMENT 1000
 MINVALUE 1
 MAXVALUE 9223372036854775807
 START 1
 CACHE 1;
CREATE TABLE client.plan_location_link
(
    id bigint,
    plan_id bigint references client.plan(id) on delete cascade, 
    location_id bigint,
    state character varying,
    entity_type_id integer,
    linking_state_id integer, 
    attr character varying,
    raw_coverage double precision,
    atomic_units double precision,
    total_revenue double precision,
    monthly_revenue double precision,
    penetration double precision,
    fairshare_demand double precision,
    PRIMARY KEY(id)
);