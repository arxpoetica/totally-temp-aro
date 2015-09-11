package com.altvil.aro.service.dao.graph.impl;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.Collection;

import org.hibernate.SessionFactory;

import com.altvil.aro.model.GraphModel;
import com.altvil.aro.service.dao.DAOException;
import com.altvil.aro.service.dao.generic.impl.DefaultAroDAO;
import com.altvil.aro.service.dao.graph.GraphDAO;
import com.altvil.aro.service.dao.graph.GraphEdge;
import com.altvil.aro.service.dao.impl.AbstractQuery;
import com.altvil.aro.util.function.CollectionAggregator;


public class GraphDAOImpl extends DefaultAroDAO<GraphModel, Long> implements GraphDAO {

	private FindGraphNodesByPlanId findGraphNodesByPlanId;


	public GraphDAOImpl(SessionFactory sessionFactory) {
		super(sessionFactory, GraphModel.class) ;
		this.findGraphNodesByPlanId = new FindGraphNodesByPlanId(sessionFactory);
	}

	@Override
	public  Collection<GraphEdge> findNodesForPlanId(long planId) throws DAOException {
		return findGraphNodesByPlanId.query(planId, new CollectionAggregator<GraphEdge>()).result();
	}

	//
	// Supported Queries
	//

	private static class FindGraphNodesByPlanId extends
			AbstractQuery<Long, GraphEdge> {

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
//				+ "select p.id, p.source, p.target, p.gid, p.edge_type, p.edge_length, p.geom, st_endpoint(p.geom)::point, st_endpoint(p.geom)::point as end_point, l.id as location_id\n"
//				+ "from paths p\n"
//				+ "left outer join aro.locations l on l.geom && st_startpoint(p.geom) and p.edge_type = 3\n";
//

		private static final String SQL_QUERY = "with \n"
				+ "paths as (\n"
				+ "SELECT distinct id, id2 source, case when id2 = target then source else target end as target, gid, (case edge_type when 'network_node_link' then 1 when 'road_segment' then 2 when 'location_link' then 3 else 0 end) as edge_type , edge_length, geom\n"
				+ "FROM\n"
				+ "	pgr_kdijkstraPath('SELECT id, source::integer, target::integer, edge_length::double precision AS cost FROM client.graph where source != target',\n"
				+ "	  (select vertex_id from custom.route_sources where route_id=? limit 1)::integer,\n"
				+ "	  array(select vertex_id from custom.route_targets where route_id=?)::integer[],\n"
				+ "	  false, false) AS dk\n"
				+ " JOIN client.graph edge\n"
				+ "	ON edge.id = dk.id3\n"
				+ ")\n"
				+ "select p.id, p.source, p.target, p.gid, p.edge_type, p.edge_length, p.geom, st_endpoint(p.geom)::point, st_endpoint(p.geom)::point as end_point \n"
				+ "from paths p\n"
				;

		
		
		public FindGraphNodesByPlanId(SessionFactory sessionFactory) {
			super(sessionFactory, SQL_QUERY, rs ->  GraphEdgeImpl.create(rs));
		}

		@Override
		protected void applyBinding(PreparedStatement ps, Long args)
				throws SQLException {
			ps.setLong(1, args);
			ps.setLong(2, args);
		}

	}

}
