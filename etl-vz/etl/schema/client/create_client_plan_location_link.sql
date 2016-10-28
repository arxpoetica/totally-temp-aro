DROP TABLE IF EXISTS client.plan_location_link;
CREATE TABLE client.plan_location_link
(
    id bigserial,
    plan_id bigint references client.plan(id) on delete cascade, 
    location_id bigint,
    state character varying,
    entity_type_id integer,
    linking_state_id integer, 
    attribute character varying,
    rawCoverage double precision,
    atomicUnits double precision,
    totalRevenue double precision,
    monthlyRevenueImpact double precision,
    penetration double precision,
    fairShareDemand double precision
);