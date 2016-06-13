package com.altvil.aro.service.graph.node.impl;

import java.util.concurrent.atomic.AtomicLong;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.service.graph.node.GraphNode;
import com.vividsolutions.jts.geom.Point;

public class DefaultVertex implements GraphNode {

	private static final AtomicLong idGen = new AtomicLong();

	private Point point;
	private long id;

	protected DefaultVertex(long id, Point point) {
		this.id = id;
		this.point = point;
	}

	public DefaultVertex(Point point) {
		this(idGen.getAndIncrement(), point);
		this.point = point;
	}

	@Override
	public Point getPoint() {
		return point;
	}

	@Override
	public int hashCode() {
		return Long.hashCode(id);
	}

	@Override
	public boolean equals(Object obj) {
		return (obj instanceof GraphNode) ? ((GraphNode) obj).getId() == id
				: false;
	}

	
	@Override
	public long getId() {
		return id;
	}
	
	public String toString() {
		return new ToStringBuilder(this).append("id", id).append("point", point == null ? null : String.valueOf(point.getY()) + " " + point.getX()).toString();
	}

}
