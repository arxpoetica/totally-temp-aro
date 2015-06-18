ALTER TABLE public.aro_edges ADD COLUMN "source" integer;
ALTER TABLE public.aro_edges ADD COLUMN "target" integer;

-- Need to figure out how to tune the 'precision' argument here (0.00001 is the suggested value in the pgRouting docs)
SELECT pgr_createTopology('aro_edges', 0.00001, 'geom', 'gid');