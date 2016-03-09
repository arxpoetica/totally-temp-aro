package com.altvil.aro.service.graph.transform.ftp.impl;

import java.util.List;

import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.transform.ftp.AssignedEntityDemand;
import com.altvil.aro.service.graph.transform.ftp.EdgeList;
import com.altvil.aro.service.graph.transform.ftp.LocationStreamVisitor;
import com.altvil.aro.service.graph.transform.ftp.tree.AbstractLocationStream;
import com.altvil.aro.service.graph.transform.ftp.tree.EdgeStream;
import com.altvil.aro.service.graph.transform.ftp.tree.VertexStream;

public class DefaultEdgeStream extends AbstractLocationStream implements
		EdgeStream {

	private EdgeList edgeList;
	private VertexStream vertexStream;

	public DefaultEdgeStream(EdgeList edgeList, VertexStream vs) {
		super(vs.getMaxDistancetoEnd() + edgeList.getLength(), vs
				.getLocationCount() + edgeList.getLocationCount(), vs
				.getLocationDemand() + edgeList.getTotalLocationDemand());
		this.edgeList = edgeList;
		this.vertexStream = vs;
	}

	public DefaultEdgeStream(VertexStream vs) {
		super(0, 0, 0);
		this.edgeList = EdgeList.EMPTY_EDGE;
		this.vertexStream = vs;
	}
	
	@Override
	public int indexOfDemand(double demand) {
		double offsetDemand = demand - vertexStream.getLocationDemand();
		return this.edgeList.indexOf(offsetDemand)
				+ vertexStream.getLocationCount();
	}

	@Override
	public EdgeStream truncateTo(int endIndexExc) {

		int offset = endIndexExc - vertexStream.getLocationCount();
		return new DefaultEdgeStream(this.edgeList.subEdge(0, offset),
				this.vertexStream);
	}
	
	@Override
	public EdgeStream truncateFrom(int startIndex) {

		int startOffset = startIndex - this.vertexStream.getLocationCount();
		int endOffset = this.edgeList.getLocationCount();

		if (endOffset - startOffset <= 0) {
			return new DefaultEdgeStream(new DefaultVertexStream(
					this.vertexStream.getVertex()));
		}

		return new DefaultEdgeStream(this.edgeList.subEdge(startOffset,
				endOffset), new DefaultVertexStream(vertexStream.getVertex()));
	}

	@Override
	public GeoSegment getGeoSegment() {
		return edgeList.getGeoSegment();
	}

	@Override
	public void accept(LocationStreamVisitor visitor) {
		visitor.visit(this);
	}

	@Override
	public List<AssignedEntityDemand> getPinnedLocations() {
		return edgeList.getAssignedEntityDemands() ;
	}

	@Override
	public VertexStream getVertexStream() {
		return vertexStream;
	}

	@Override
	public EdgeList getEdgeList() {
		return edgeList;
	}

}
