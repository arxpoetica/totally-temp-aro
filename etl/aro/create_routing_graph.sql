-- After all edges and vertices have been added to the graph, we use pgRouting to create a topology:
-- Need to figure out how to tune the 'precision' argument here (0.00001 is the suggested value in the pgRouting docs)
SELECT pgr_createTopology('aro.graph', 0.00001, 'geom', 'id');