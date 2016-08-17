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
    JOIN aro.wirecenters w
        ON ((r.wirecenter_id = w.id)))
    JOIN aro.edges a
        ON (ST_Intersects(w.edge_buffer, a.geom)))
    JOIN client.existing_fiber fr
        ON (ST_Intersects(fr.edge_intersect_buffer_geom, a.geom)))
) s;
