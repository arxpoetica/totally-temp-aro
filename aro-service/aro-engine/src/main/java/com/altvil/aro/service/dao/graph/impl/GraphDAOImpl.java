package com.altvil.aro.service.dao.graph.impl;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

import org.hibernate.SessionFactory;
import org.hibernate.jdbc.Work;
import org.postgresql.geometric.PGpoint;

import com.altvil.aro.service.dao.graph.GraphData;
import com.altvil.aro.service.dao.graph.GraphEdge;
import com.altvil.aro.service.dao.graph.GraphVertex;
import com.altvil.aro.service.dao.graph.LocationVertex;
import com.altvil.aro.service.dao.impl.CollectionSQLQuery;
import com.altvil.aro.service.dao.impl.DefaultSQLQuery;
import com.altvil.aro.service.dao.impl.SQLCommand;
import com.altvil.aro.util.geometry.GeometryUtil;

public class GraphDAOImpl {

	private static class GraphDataQuery {

		private SessionFactory sessionFactory;

		public GraphDataQuery(SessionFactory sessionFactory) {
			super();
			this.sessionFactory = sessionFactory;
		}

		private CollectionSQLQuery<Long, LocationVertex> findLocationVerticesByPlanId = CollectionSQLQuery
				.create(new DefaultSQLQuery<Long, LocationVertex>(
						"select t.vertex_id, t.location_id\n"
								+ "from custom.route_targets t\n"
								+ "join aro.locations l on l.id = t.location_id\n"
								+ "where t.route_id = ?", rs -> {
							Long vid = rs.getLong(1);
							long lid = rs.getLong(2);
							return new LocationVertex(vid, lid);
						}) {

					@Override
					protected void applyBinding(PreparedStatement ps, Long args)
							throws SQLException {
						ps.setLong(1, args);
					}
				});

		private CollectionSQLQuery<String, GraphEdge> findGraphEdges = CollectionSQLQuery
				.create(new DefaultSQLQuery<String, GraphEdge>(
						"select p.source, p.target, p.edge_type, p.edge_length, p.gid from TEMP_DAG p\n",
						rs -> {
							return GraphEdgeImpl.create(rs);
						}) {

					@Override
					protected void applyBinding(PreparedStatement ps,
							String args) throws SQLException {
					}
				});

		private CollectionSQLQuery<String, GraphVertex> findGraphVerticesByPlanId = CollectionSQLQuery
				.create(new DefaultSQLQuery<String, GraphVertex>(
						"select ev.vid, v.the_geom::point from (\n"
								+ "select distinct ev.vid from \n"
								+ "(select source as vid\n"
								+ "from TEMP_DAG\n"
								+ "union \n"
								+ "select target as vid\n"
								+ "from TEMP_DAG\n"
								+ ") ev ) ev\n"
								+ "join client.graph_vertices_pgr v on v.id = ev.vid\n",
						rs -> {
							return new GraphVertex(rs.getLong(1), GeometryUtil
									.asPoint((PGpoint) rs.getObject(2)));
						}) {

					@Override
					protected void applyBinding(PreparedStatement ps,
							String args) throws SQLException {
					}
				});

		private SQLCommand<Long> createTempTable = new SQLCommand<Long>(
				"create temp table TEMP_DAG on commit drop as \n"
						+ "(select distinct p.source, p.target, p.edge_type, p.edge_length, p.gid \n"
						+ "from (\n"
						+ "SELECT distinct id, id2 source, case when id2 = target then source else target end as target, gid, (case edge_type when 'network_node_link' then 1 when 'road_segment' then 2 when 'location_link' then 3 else 0 end) as edge_type , edge_length, geom\n"
						+ "FROM\n"
						+ "	pgr_kdijkstraPath('SELECT id, source::integer, target::integer, edge_length::double precision AS cost FROM client.graph where source != target',\n"
						+ "	  (select vertex_id from custom.route_sources where route_id=? limit 1)::integer,\n"
						+ "	  array(select vertex_id from custom.route_targets where route_id=?)::integer[],\n"
						+ "	  false, false) AS dk\n"
						+ " JOIN client.graph edge\n"
						+ "	ON edge.id = dk.id3\n" + ") p)") {

			@Override
			protected void applyBinding(PreparedStatement ps, Long args)
					throws SQLException {
				ps.setLong(1, args);
				ps.setLong(2, args);
			}

		};

		public GraphData query(long planId) {

			GraphData.Builder builder = new GraphData.Builder();

			sessionFactory.getCurrentSession().doWork(new Work() {
				@Override
				public void execute(Connection connection) throws SQLException {
					createTempTable.query(connection, planId);

					builder.setEdges(findGraphEdges.query(connection, null));
					builder.setVertices(findGraphVerticesByPlanId.query(
							connection, null));
					builder.setLocations(findLocationVerticesByPlanId.query(
							connection, planId));

				}
			});
			return builder.build();
		}

	}

//	private static class FindLocationVerticesByPlanId extends
//			DefaultSQLQuery<Long, LocationVertex> {
//
//		private static final String SQL_QUERY = "select t.vertex_id, t.location_id\n"
//				+ "from custom.route_targets t\n"
//				+ "join aro.locations l on l.id = t.location_id\n"
//				+ "where t.route_id = ?";
//
//		public FindLocationVerticesByPlanId() {
//			super(SQL_QUERY, rs -> {
//				Long vid = rs.getLong(1);
//				long lid = rs.getLong(2);
//				return new LocationVertex(vid, lid);
//			});
//		}
//
//		@Override
//		protected void applyBinding(PreparedStatement ps, Long args)
//				throws SQLException {
//			ps.setLong(1, args);
//		}
//
//	}

	//
	// Supported Queries
	//

//	private static class FindGraphNodesByPlanId extends
//			AbstractQuery<Long, GraphEdge> {
//
//		// private static final String SQL_QUERY = "with \n"
//		// + "paths as (\n"
//		// +
//		// "SELECT distinct id, id2 source, case when id2 = target then source else target end as target, gid, (case edge_type when 'network_node_link' then 1 when 'road_segment' then 2 when 'location_link' then 3 else 0 end) as edge_type , edge_length, geom\n"
//		// + "FROM\n"
//		// +
//		// "	pgr_kdijkstraPath('SELECT id, source::integer, target::integer, edge_length::double precision AS cost FROM client.graph where source != target',\n"
//		// +
//		// "	  (select vertex_id from custom.route_sources where route_id=? limit 1)::integer,\n"
//		// +
//		// "	  array(select vertex_id from custom.route_targets where route_id=?)::integer[],\n"
//		// + "	  false, false) AS dk\n"
//		// + " JOIN client.graph edge\n"
//		// + "	ON edge.id = dk.id3\n"
//		// + ")\n"
//		// +
//		// "select p.id, p.source, p.target, p.gid, p.edge_type, p.edge_length, p.geom, st_endpoint(p.geom)::point, st_endpoint(p.geom)::point as end_point, l.id as location_id\n"
//		// + "from paths p\n"
//		// +
//		// "left outer join aro.locations l on l.geom && st_startpoint(p.geom) and p.edge_type = 3\n";
//		//
//
//		private static final String SQL_QUERY = "with \n"
//				+ "paths as (\n"
//				+ "SELECT distinct id, id2 source, case when id2 = target then source else target end as target, gid, (case edge_type when 'network_node_link' then 1 when 'road_segment' then 2 when 'location_link' then 3 else 0 end) as edge_type , edge_length, geom\n"
//				+ "FROM\n"
//				+ "	pgr_kdijkstraPath('SELECT id, source::integer, target::integer, edge_length::double precision AS cost FROM client.graph where source != target',\n"
//				+ "	  (select vertex_id from custom.route_sources where route_id=? limit 1)::integer,\n"
//				+ "	  array(select vertex_id from custom.route_targets where route_id=?)::integer[],\n"
//				+ "	  false, false) AS dk\n"
//				+ " JOIN client.graph edge\n"
//				+ "	ON edge.id = dk.id3\n"
//				+ ")\n"
//				+ "select p.id, p.source, p.target, p.gid, p.edge_type, p.edge_length, p.geom, st_endpoint(p.geom)::point, st_endpoint(p.geom)::point as end_point \n"
//				+ "from paths p\n";
//
//		public FindGraphNodesByPlanId(SessionFactory sessionFactory) {
//			super(sessionFactory, SQL_QUERY, rs -> GraphEdgeImpl.create(rs));
//		}
//
//		@Override
//		protected void applyBinding(PreparedStatement ps, Long args)
//				throws SQLException {
//			ps.setLong(1, args);
//			ps.setLong(2, args);
//		}
//
//	}

}
