package com.altvil.aro.service.graph.segment.splitter;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.SpiCompositeGraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.impl.GraphAssignmentFactoryImpl;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.segment.DefaultSplitSegment;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;
import com.altvil.utils.StreamUtil;
import com.vividsolutions.jts.geom.Geometry;

public class GeoSegmentSplitter {

	private static final double snapDistanceInMeteres = 1.0;

	/**
	 * 
	 * @param src
	 * @param target
	 * @param geoSgement
	 * @param assignedVertices
	 * @return
	 */

	private GraphNodeFactory vertexFactory;

	public GeoSegmentSplitter(GraphNodeFactory vertexFactory) {
		super();
		this.vertexFactory = vertexFactory;
	}

	private void assignVertex(SplitAssignments.Builder builder,
			GraphEdgeAssignment va, GraphNode vertex) {
		if (va instanceof SpiCompositeGraphEdgeAssignment) {
			builder.assign(
					((SpiCompositeGraphEdgeAssignment) va).getGraphEdgeAssignments(),
					vertex);
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
					geoSgement.getLength()));
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

		Iterator<GraphEdgeAssignment> itz = result.iterator();
		GraphEdgeAssignment p = itz.next();
		while (itz.hasNext()) {
			GraphEdgeAssignment g1 = itz.next();
			if (g1.getPinnedLocation().getOffsetFromStartVertex()
					- p.getPinnedLocation().getOffsetFromStartVertex() <= snapDistance) {
				throw new RuntimeException("Snap Failed");
			}
		}

		return result;
	}

	private GraphEdgeAssignment merge(Iterator<GraphEdgeAssignment> itr,
			GraphEdgeAssignment current, GraphEdgeAssignment previous,
			List<GraphEdgeAssignment> result, double snapDistance) {

		GraphAssignmentFactoryImpl.FACTORY.createSpiCompositeGraphEdgeAssignment(null, previous.getPinnedLocation()) ;
		
		SpiCompositeGraphEdgeAssignment merged = GraphAssignmentFactoryImpl.FACTORY.createSpiCompositeGraphEdgeAssignment(null, previous.getPinnedLocation()) ;
		
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
		return DefaultSplitSegment.split(seg, splitPoints, geom).getSubSegments() ;
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
				segment.getLength());
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


	
}
