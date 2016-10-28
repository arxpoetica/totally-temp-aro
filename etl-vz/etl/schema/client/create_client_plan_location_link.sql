DROP TABLE IF EXISTS client.plan_location_link;
CREATE TABLE client.plan_location_link
(
    id bigserial,
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
    fairshare_demand double precision
);