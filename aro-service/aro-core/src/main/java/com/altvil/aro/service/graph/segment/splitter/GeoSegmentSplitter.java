package com.altvil.aro.service.graph.segment.splitter;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.segment.DefaultSplitSegment;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;
import com.altvil.utils.StreamUtil;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.Point;

public class GeoSegmentSplitter {

	private static final Logger log = LoggerFactory
			.getLogger(GeoSegmentSplitter.class.getName());

	private static final double snapDistanceInMeteres = 1.0;

	/**
	 * 
	 * @param src
	 * @param target
	 * @param geoSgement
	 * @param assignedVertices
	 * @return
	 */
	
	private interface EdgeWeightFunc {
		double computeWeight(GeoSegment segment) ;
	}

	private GraphNodeFactory vertexFactory;
	private EdgeWeightFunc edgeWeightFunction = gs -> gs.getLength();

	public GeoSegmentSplitter(GraphNodeFactory vertexFactory) {
		super();
		this.vertexFactory = vertexFactory;
	
	}
	

	private void assignVertex(SplitAssignments.Builder builder,
			GraphEdgeAssignment va, GraphNode vertex) {
		if (va instanceof SpiCompositeGraphEdgeAssignment) {
			builder.assign(((SpiCompositeGraphEdgeAssignment) va)
					.getGraphEdgeAssignments(), vertex);
		} else {
			builder.assign(va, vertex);
		}
	}

	public SplitAssignments split(GraphNode src, GraphNode target,
			GeoSegment geoSgement,
			Collection<GraphEdgeAssignment> assignedVertices) {

		SplitAssignments.Builder builder = new SplitAssignments.Builder();

		List<GraphEdgeAssignment> sortedAssignments = sort(assignedVertices);

		sortedAssignments = snap(sortedAssignments, snapDistanceInMeteres);

		GraphEdgeAssignment va = sortedAssignments.get(0);
		if (isSnappedAtStart(va.getPinnedLocation())) {
			assignVertex(builder, va, src);
			sortedAssignments.remove(0);
		}

		if (sortedAssignments.size() > 0) {
			va = sortedAssignments.get(sortedAssignments.size() - 1);
			if (isSnappedAtEnd(va.getPinnedLocation())) {
				assignVertex(builder, va, target);
				sortedAssignments.remove(sortedAssignments.size() - 1);
			}
		}

		if (sortedAssignments.size() == 0) { // Very Special Case Snapped to
												// original Segment
			builder.add(new DefaultEdgeAssigment(src, target, geoSgement,
					edgeWeightFunction.computeWeight(geoSgement)));
		} else {

			// TODO Refactor into strategy
			List<GraphNode> veretxAssigments = toVertices(builder, src, target,
					sortedAssignments);
			List<PinnedLocation> pins = toPins(sortedAssignments);

			Collection<GeoSegment> subSegments = geoSgement.split(
					vertexFactory, pins);
			Iterator<GraphNode> vertexItr = veretxAssigments.iterator();

			GraphNode previousVertex = vertexItr.next();
			for (GeoSegment subSegment : subSegments) {
				GraphNode vertex = vertexItr.next();
				builder.add(createEdgeAssigment(previousVertex, vertex,
						subSegment));
				previousVertex = vertex;
			}
		}

		return builder.build();
	}

	private boolean isSnappedAtStart(PinnedLocation pl) {
		return pl.isAtStartVertex()
				|| ((pl.getOffsetFromStartVertex()) < snapDistanceInMeteres);
	}

	private boolean isSnappedAtEnd(PinnedLocation pl) {
		return pl.isAtEndVertex()
				|| (pl.getOffsetFromEndVertex() < snapDistanceInMeteres);
	}

	private List<GraphEdgeAssignment> snap(
			List<GraphEdgeAssignment> assignments, double snapDistance) {

		if (assignments.size() <= 1) {
			return assignments;
		}

		List<GraphEdgeAssignment> result = new ArrayList<>(assignments.size());

		Iterator<GraphEdgeAssignment> itr = assignments.iterator();

		GraphEdgeAssignment previous = itr.next();

		while (itr.hasNext()) {
			GraphEdgeAssignment va = itr.next();
			if (va.getPinnedLocation().getOffsetFromStartVertex()
					- previous.getPinnedLocation().getOffsetFromStartVertex() <= snapDistance) {
				previous = merge(itr, va, previous, result, snapDistance);
			} else {
				result.add(previous);
				previous = va;
			}
		}

		if (previous != null) {
			result.add(previous);
		}

		if (log.isTraceEnabled()) {
			verifySnap(result, snapDistance);
		}

		return result;
	}

	private void verifySnap(Collection<GraphEdgeAssignment> result,
			double snapDistance) {
		Iterator<GraphEdgeAssignment> itz = result.iterator();
		GraphEdgeAssignment p = itz.next();
		while (itz.hasNext()) {
			GraphEdgeAssignment g1 = itz.next();
			if (g1.getPinnedLocation().getOffsetFromStartVertex()
					- p.getPinnedLocation().getOffsetFromStartVertex() <= snapDistance) {
				throw new RuntimeException("Snap Failed");
			}
		}

	}

	private GraphEdgeAssignment merge(Iterator<GraphEdgeAssignment> itr,
			GraphEdgeAssignment current, GraphEdgeAssignment previous,
			List<GraphEdgeAssignment> result, double snapDistance) {

		SpiCompositeGraphEdgeAssignment merged = new CompositeVertexAssignment(
				previous.getPinnedLocation());

		merged.add(previous);
		merged.add(current);
		result.add(merged);

		double startDistance = previous.getPinnedLocation()
				.getOffsetFromStartVertex();
		while (itr.hasNext()) {
			GraphEdgeAssignment va = itr.next();
			if (va.getPinnedLocation().getOffsetFromStartVertex()
					- startDistance <= snapDistance) {
				merged.add(va);
			} else {
				return va;
			}

		}

		return null;
	}

	/**
	 * 
	 * @param seg
	 * @param splitPoints
	 * @param geom
	 * @return
	 */
	public List<GeoSegment> split(GeoSegment seg,
			Collection<PinnedLocation> splitPoints, Geometry geom) {
		return DefaultSplitSegment.split(seg, splitPoints, geom)
				.getSubSegments();
	}

	private List<PinnedLocation> toPins(
			Collection<GraphEdgeAssignment> assignments) {
		return StreamUtil.map(assignments, v -> v.getPinnedLocation());
	}

	private List<GraphNode> toVertices(SplitAssignments.Builder builder,
			GraphNode start, GraphNode end,
			Collection<GraphEdgeAssignment> assignments) {

		List<GraphNode> result = new ArrayList<GraphNode>(
				assignments.size() + 2);
		result.add(start);
		for (GraphEdgeAssignment va : assignments) {
			GraphNode vertex = vertexFactory.createGraphNode(va
					.getPinnedLocation().getIntersectionPoint());
			result.add(vertex);
			assignVertex(builder, va, vertex);
		}
		result.add(end);
		return result;
	}

	private EdgeAssignment createEdgeAssigment(GraphNode src, GraphNode target,
			GeoSegment segment) {
		return new DefaultEdgeAssigment(src, target, segment,
				edgeWeightFunction.computeWeight(segment)) ;
	}

	private List<GraphEdgeAssignment> sort(
			Collection<GraphEdgeAssignment> assignedVertices) {

		List<GraphEdgeAssignment> sortedAssignments = new ArrayList<>(
				assignedVertices);

		Collections.sort(sortedAssignments, (a1, a2) -> a1.getPinnedLocation()
				.compareTo(a2.getPinnedLocation()));

		return sortedAssignments;

	}

	//
	//
	//

	private interface SpiCompositeGraphEdgeAssignment extends
			GraphEdgeAssignment {
		void add(GraphEdgeAssignment assignemnt);

		Collection<GraphEdgeAssignment> getGraphEdgeAssignments();

	}

	private static class CompositeVertexAssignment implements
			SpiCompositeGraphEdgeAssignment {

		private PinnedLocation pinnedLocation;
		private List<GraphEdgeAssignment> vertexAssignments = new ArrayList<>();
		
		public CompositeVertexAssignment(PinnedLocation pinnedLocation) {
			this.pinnedLocation = pinnedLocation;
		}

		@Override
		public Long getId() {
			throw new RuntimeException("Operation not supported");
		}

		@Override
		public AroEntity getAroEntity() {
			throw new RuntimeException("Operation not supported");
		}

		@Override
		public Collection<GraphEdgeAssignment> getGraphEdgeAssignments() {
			return vertexAssignments;
		}

		@Override
		public Point getPoint() {
			return pinnedLocation.getIntersectionPoint();
		}

		public void add(GraphEdgeAssignment va) {
			vertexAssignments.add(va);
		}

		@Override
		public GraphEdgeAssignment getAsRootEdgeAssignment() {
			return this;
		}

		@Override
		public PinnedLocation getPinnedLocation() {
			return pinnedLocation;
		}

		@Override
		public GeoSegment getGeoSegment() {
			return pinnedLocation.getGeoSegment();
		}

	}

}
