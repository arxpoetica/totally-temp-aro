package com.altvil.aro.service.dao.graph.impl;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.postgresql.geometric.PGpoint;

import com.altvil.aro.service.dao.graph.EdgeType;
import com.altvil.aro.service.dao.graph.EdgeTypeMapping;
import com.altvil.aro.service.dao.graph.GraphEdge;
import com.altvil.aro.util.geometry.GeometryUtil;
import com.vividsolutions.jts.geom.Point;

public class GraphEdgeImpl implements GraphEdge {

	public static GraphEdge create(ResultSet rs) throws SQLException {

		GraphEdgeImpl e = new GraphEdgeImpl();

		e.id = rs.getLong(1);
		e.source = rs.getLong(2);
		e.target = rs.getLong(3);
		e.gid = rs.getLong(4);
		e.edgeType = EdgeTypeMapping.MAPPING.getEdgeType(rs.getInt(5));
		e.edgeLength = rs.getDouble(5);
		// line
		e.sourcePoint = (PGpoint) rs.getObject(8);
		e.targetPoint = (PGpoint) rs.getObject(9);
		e.locationId = rs.getLong(10);

		return e;
	}

	private Long id;
	private Long source;
	private Long target;
	private Long gid;
	private EdgeType edgeType;
	private double edgeLength;
	// line
	private PGpoint sourcePoint;
	private PGpoint targetPoint;
	private long locationId;

	@Override
	public Long getId() {
		return id;
	}

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
	public Object getGeom() {
		return null;
	}

	@Override
	public Point getStartPoint() {
		return GeometryUtil.asPoint(sourcePoint);
	}

	@Override
	public Point getEndPoint() {
		return GeometryUtil.asPoint(targetPoint);
	}

	@Override
	public Long getLocationId() {
		return locationId;
	}

}
