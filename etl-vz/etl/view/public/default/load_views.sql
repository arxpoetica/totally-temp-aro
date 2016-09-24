-- client.conduit_edge_segments
DROP VIEW IF EXISTS client.conduit_edge_segments CASCADE ;
CREATE VIEW client.conduit_edge_segments AS 
SELECT 
    s.tlid AS gid,
    s.plan_id,
    6 AS construction_type,
    ST_Length((s.edge)::geography) AS edge_length,
    ST_Length((s.segment)::geography) AS segment_length,
    ST_Line_Locate_Point(s.edge, st_startpoint(s.segment)) AS start_ratio,
    ST_Line_Locate_Point(s.edge, st_endpoint(s.segment)) AS end_ratio
FROM ( 
    SELECT 
        a.tlid,
        r.id AS plan_id,
        ST_LineMerge(a.geom) AS edge,
        ST_Intersection(fr.edge_intersect_buffer_geom, a.geom) AS segment
    FROM (((client.plan r
    JOIN client.service_area w 
        ON ((r.wirecenter_id = w.id)))
    JOIN aro.edges a 
        ON (ST_Intersects(w.edge_buffer, a.geom)))
    JOIN client.existing_fiber fr 
        ON (ST_Intersects(fr.edge_intersect_buffer_geom, a.geom)))
) s ;

--business_categories
-- Create a View on business Categories to maintain existing code
-- NOTE : Business categories extends entity_category which is a more general concept
DROP VIEW IF EXISTS client.business_categories CASCADE ;
CREATE VIEW client.business_categories AS
SELECT e.id, e.name, e.description, b.min_value, b.max_value
FROM client.business_category b
JOIN client.entity_category e 
	ON e.id = b.id ;

-- classified_business
DROP VIEW IF EXISTS client.classified_business CASCADE ;
CREATE VIEW client.classified_business AS 
SELECT 
b.*, 
c.id AS entity_type,
e.id AS employee_count_id,
m.industry_id AS industry_cat_id
FROM aro.businesses b
JOIN client.business_categories c 
	ON b.number_of_employees >= c.min_value
	AND  b.number_of_employees < c.max_value
JOIN client.employees_by_location e 
	ON (b.number_of_employees >= e.min_value) 
	AND (b.number_of_employees <= e.max_value) 
JOIN client.industry_mapping m 
	ON m.sic4 = b.industry_id ;

-- spend_summary
DROP VIEW IF EXISTS client.spend_summary CASCADE ;
CREATE VIEW client.spend_summary AS
SELECT city_id, year, s.industry_id, s.employees_by_location_id, sum(monthly_spend) / 4 as monthly_spend
FROM client.spend s
GROUP BY city_id, year, industry_id, employees_by_location_id ;

--business_summary
DROP VIEW IF EXISTS client.business_summary CASCADE ;
CREATE VIEW client.business_summary as 
SELECT 
	city_id,
	year,
	state,
	b.location_id, b.entity_type,
	sum(s.monthly_spend) AS monthly_spend,
	count(1) AS count,
	sum(case when monthly_recurring_cost is NULL then 0 else monthly_recurring_cost end) AS monthly_recurring_cost
FROM client.classified_business b
JOIN client.spend_summary s 
	ON s.employees_by_location_id = b.employee_count_id
	AND s.industry_id = b.industry_cat_id
GROUP BY city_id, year, b.location_id, b.entity_type, b.state ;

-- households_summary
DROP VIEW IF EXISTS client.households_summary ;
CREATE VIEW client.households_summary AS 
SELECT
	location_id,
	sum(case when h.number_of_households is NULL then 1 else h.number_of_households end) AS count
FROM aro.households h
GROUP BY location_id ;


-- celltower_summary
DROP VIEW IF EXISTS client.celltower_summary ;
CREATE VIEW client.celltower_summary AS
SELECT
	t.parcel_state as state,
	location_id,
	sum(1) as count
FROM aro.towers t
GROUP BY location_id, t.parcel_state ;

-- location_competitors 
DROP VIEW IF EXISTS client.location_competitors CASCADE ;
CREATE VIEW client.location_competitors AS
SELECT
	l.id AS location_id, 
	b.entity_type, r.carrier_id,
	1.0 AS strength,
	b.state as state
FROM client.classified_business b
JOIN aro.locations l
	ON l.id = b.location_id AND b.state = l.state
JOIN geotel.buffered_routes r 
	ON st_contains(r.geom, l.geom)
GROUP BY l.id, b.entity_type, carrier_id, b.state ;

--summarized_competitors_strength
DROP VIEW IF EXISTS client.summarized_competitors_strength CASCADE ;
CREATE VIEW client.summarized_competitors_strength AS
SELECT 
	c.location_id,
	c.entity_type,
	sum(strength) as strength,
	c.state
FROM client.location_competitors c
GROUP BY  c.entity_type, c.location_id, c.state;

-- selection_areas
DROP VIEW IF EXISTS client.selection_areas ;
CREATE VIEW client.selection_areas AS
SELECT  plan_id, 
		a.code AS region_name,
		a.id AS region_id, 
		CASE WHEN a.service_type = 'S' THEN 'super_service_area' ELSE 'service_area' END AS region_type,
		a.geom
FROM client.selected_service_area s
JOIN client.service_area a ON a.id = s.service_area_id

UNION

SELECT  plan_id, 
		a.code AS region_name,
		a.id AS region_id, 
		'analysis_area' AS region_type,
		a.geom
FROM client.selected_analysis_area s
JOIN client.analysis_area a ON a.id = s.analysis_area_id ;
