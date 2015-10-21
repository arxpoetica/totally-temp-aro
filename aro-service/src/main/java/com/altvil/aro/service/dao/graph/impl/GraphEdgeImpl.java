package com.altvil.aro.service.dao.graph.impl;

import java.sql.ResultSet;
import java.sql.SQLException;

import com.altvil.aro.service.dao.graph.EdgeType;
import com.altvil.aro.service.dao.graph.EdgeTypeMapping;
import com.altvil.aro.service.dao.graph.GraphEdge;

public class GraphEdgeImpl implements GraphEdge {

	public static GraphEdge create(ResultSet rs) throws SQLException {

		GraphEdgeImpl e = new GraphEdgeImpl();

		e.source = rs.getLong(2);
		e.target = rs.getLong(1);
		e.edgeType = EdgeTypeMapping.MAPPING.getEdgeType(rs.getInt(3));
		e.edgeLength = rs.getDouble(4);
		e.gid = rs.getLong(5);
		if( rs.wasNull() ) {
			e.gid = null ;
		}
	
		return e;
	}

	private Long source;
	private Long target;
	private Long gid;
	private EdgeType edgeType;
	private double edgeLength;
	

	@Override
	public Long getSource() {
		return source;
	}

	@Override
	public Long getTarget() {
		return target;
	}

	@Override
	public Long getGID() {
		return gid;
	}

	@Override
	public EdgeType getEdgeType() {
		return edgeType;
	}

	@Override
	public double getEdgeLength() {
		return edgeLength;
	}

	
	
	@Override
	public String toString() {
		return "edge " + source + "->" + target + " gid="+ gid + " w=" + edgeLength + " type" + edgeType ; 
	}

}
