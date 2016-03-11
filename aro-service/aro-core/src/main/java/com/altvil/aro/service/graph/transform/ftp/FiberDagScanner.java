package com.altvil.aro.service.graph.transform.ftp;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.jgrapht.DirectedGraph;

import com.altvil.aro.service.demand.AssignedEntityDemand;
import com.altvil.aro.service.demand.DemandAnalyizer;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.assigment.GraphAssignmentFactory;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.assigment.impl.DefaultGraphMapping;
import com.altvil.aro.service.graph.assigment.impl.FiberSourceMapping;
import com.altvil.aro.service.graph.assigment.impl.GraphAssignmentFactoryImpl;
import com.altvil.aro.service.graph.assigment.impl.RootGraphMapping;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.transform.ftp.assembler.FDHAssembler;
import com.altvil.aro.service.graph.transform.ftp.impl.DefaultEdgeStream;
import com.altvil.aro.service.graph.transform.ftp.impl.DefaultVertexStream;
import com.altvil.aro.service.graph.transform.ftp.tree.EdgeStream;
import com.altvil.aro.service.graph.transform.ftp.tree.LocationStream;
import com.altvil.aro.service.graph.transform.ftp.tree.TerminatedVertex;
import com.altvil.aro.service.graph.transform.ftp.tree.VertexStream;
import com.altvil.aro.util.algo.DefaultValueItem;
import com.altvil.aro.util.algo.Knapsack;
import com.altvil.aro.util.algo.Knapsack.ValuedItem;
import com.altvil.interfaces.Assignment;

public class FiberDagScanner {

	private DemandAnalyizer demandAnalyizer;
	private FtthThreshholds thresholds;

	private GraphAssignmentFactory graphAssignmentFactory = GraphAssignmentFactoryImpl.FACTORY;

	private DAGModel<GeoSegment> graphModel;
	private DirectedGraph<GraphNode, AroEdge<GeoSegment>> graph;

	private Set<GraphNode> visited = new HashSet<GraphNode>();
	private List<GraphMapping> fiberSourceAssignments = new ArrayList<>();

	private List<GraphMapping> feederSinkAssignments = new ArrayList<>();
	
	public FiberDagScanner(DemandAnalyizer demandAnalyizer,
			FtthThreshholds threshholds) {
		super();
		this.demandAnalyizer = demandAnalyizer;
		this.thresholds = threshholds;
	}

	public RootGraphMapping apply(
			DAGModel<GeoSegment> model,
			Collection<? extends Assignment<GraphEdgeAssignment, GraphNode>> targets) {
		this.graphModel = model;
		this.graph = model.getAsDirectedGraph();

		return calculate(targets);
	}

	public RootGraphMapping calculate(
			Collection<? extends Assignment<GraphEdgeAssignment, GraphNode>> targets) {
		targets.forEach(t -> {
			if (this.graph.containsVertex(t.getDomain())) {
				fiberSourceAssignments.add(writeFiberSource(t));
			}
		});

		return new RootGraphMapping(fiberSourceAssignments);
	}

	private FiberSourceMapping writeFiberSource(
			Assignment<GraphEdgeAssignment, GraphNode> target) {
		feederSinkAssignments = new ArrayList<>();
		writeFDH(scanVertex(EdgeList.EMPTY_EDGE, target.getDomain()));
		return new FiberSourceMapping(target.getSource(), feederSinkAssignments);

	}

	private Iterator<AroEdge<GeoSegment>> createItr(
			Collection<AroEdge<GeoSegment>> edges, GeoSegment incommingSeg) {
		return incommingSeg == null ? edges.iterator()
				: new OrderedEdgeIterator(edges, incommingSeg);
	}

	/**
	 * Scan
	 * 
	 * @param outgoingEdge
	 * @param vertex
	 * @return
	 */
	public VertexStream scanVertex(EdgeList outgoingEdge, GraphNode vertex) {

		Set<AroEdge<GeoSegment>> incomingEdges = graph.incomingEdgesOf(vertex);

		if (incomingEdges.size() == 0 || !visited.add(vertex)) {
			return emptyVertex(vertex);
		}

		Iterator<AroEdge<GeoSegment>> itr = createItr(incomingEdges,
				outgoingEdge.getGeoSegment());

		List<EdgeStream> edgeStreams = new ArrayList<>(incomingEdges.size());
		while (itr.hasNext()) {
			AroEdge<GeoSegment> e = itr.next();
			edgeStreams.add(process(e.getSourceNode(), e.getTargetNode(), e));
		}

		StreamAnalysis sa = new StreamAnalysis(vertex, outgoingEdge,
				edgeStreams).analyize();

		if (sa.isTerminated()) {
			TerminatedVertex tv = sa.terminate();
			writeFDH(vertex, tv.getTerminatedStreams());
			return tv.getVertexStream();
		}

		return sa.createVertexStream();

	}

	/**
	 * 
	 * @param src
	 * @param target
	 * @param e
	 * @return
	 */
	private EdgeStream process(GraphNode src, GraphNode target,
			AroEdge<GeoSegment> e) {

		com.altvil.aro.service.demand.EdgeDemand edgeDemand = demandAnalyizer
				.createDemandAnalyis(e.getValue());
		
		writeBulkFiber(e.getValue(), edgeDemand.getBulkFiberAssigments()) ;
		
		EdgeList el = new EdgeList(e, edgeDemand.getFdtAssigments(),
				e.getWeight());

		return toEdgeStream(el, scanVertex(el, src));
	}

	private void writeBulkFiber(GeoSegment geoSegment,
			Collection<AssignedEntityDemand> assigments) {

		if (assigments.size() > 0) {
			this.feederSinkAssignments.addAll(assigments
					.stream()
					.map(aed -> new DefaultGraphMapping(graphAssignmentFactory
							.createEdgeAssignment(aed.getPinnedLocation(),
									aed.getLocationEntity())

					)).collect(Collectors.toList()));
		}
	}

	private VertexStream emptyVertex(GraphNode gn) {
		return new DefaultVertexStream(gn);
	}

	private void writeFDH(GraphNode vertex,
			Collection<LocationStream> vertexStreams) {
		vertexStreams.forEach(v -> writeFDH(v));
	}

	private void writeFDH(LocationStream stream) {
		if (stream.getLocationCount() > 0) {
			FDHAssembler assembler = new FDHAssembler(graphModel,
					this.thresholds);
			feederSinkAssignments.add(assembler.createMapping(stream));
		}
	}

	private EdgeStream toEdgeStream(EdgeList thisEdge, VertexStream vs) {

		// Magic Counting
		if (vs.getLocationDemand() + thisEdge.getTotalLocationDemand() >= thresholds
				.getMaxLocationPerFDH()) {

			double offsetDemand = thresholds.getMaxLocationPerFDH()
					- vs.getLocationDemand();
			int offset = thisEdge.indexOf(offsetDemand);

			this.writeFDH(thisEdge.subEdge(0, offset), vs);

			while (thisEdge.getTotalLocationDemand() - offset >= thresholds
					.getMaxLocationPerFDH()) {

				double nextDemand = offsetDemand
						+ thresholds.getMaxlocationPerFDT();
				int nextOffset = thisEdge.indexOf(nextDemand);

				writeFDH(new DefaultEdgeStream(thisEdge.subEdge(offset,
						nextOffset), emptyVertex(null)));
				offsetDemand += thresholds.getMaxlocationPerFDT();
			}

			thisEdge = thisEdge.subEdgeToEnd(offset);
			vs = emptyVertex(null);
		}

		return new DefaultEdgeStream(thisEdge, vs);

	}

	private void writeFDH(EdgeList edgeList, VertexStream vs) {
		writeFDH(new DefaultEdgeStream(edgeList, vs));
	}

	private static class OrderedEdgeIterator implements
			Iterator<AroEdge<GeoSegment>> {

		private int count = 0;
		private int index;
		private int size;

		private List<AroEdge<GeoSegment>> orderedEdges;

		public OrderedEdgeIterator(Collection<AroEdge<GeoSegment>> edges,
				GeoSegment incommingSegment) {
			orderedEdges = orderByAngle(edges);
			index = indexof(incommingSegment.getAngleRelativetoXAsisInRadians());
			size = orderedEdges.size();
		}

		private static List<AroEdge<GeoSegment>> orderByAngle(
				Collection<AroEdge<GeoSegment>> edges) {

			List<AroEdge<GeoSegment>> result = new ArrayList<>(edges);
			java.util.Collections.sort(result, (o1, o2) -> Double.compare(o1
					.getValue().getAngleRelativetoXAsisInRadians(), o2
					.getValue().getAngleRelativetoXAsisInRadians()));

			return result;

		}

		@Override
		public boolean hasNext() {
			return count < size;
		}

		private int getAndAdvanceIndex() {
			int i = index;
			index++;
			if (index == size) {
				index = 0;
			}
			count++;

			return i;
		}

		@Override
		public AroEdge<GeoSegment> next() {
			return orderedEdges.get(getAndAdvanceIndex());
		}

		private int indexof(double angleRelativeToXAsisInRadians) {
			for (int i = 0; i < orderedEdges.size(); i++) {

				double angle = orderedEdges.get(i).getValue()
						.getAngleRelativetoXAsisInRadians();

				if (Math.abs(angleRelativeToXAsisInRadians - angle) < .0875) { // about
					// 5
					// degrees
					return i;
				}

				if (angleRelativeToXAsisInRadians > angle) {
					return i == 0 ? 0 : i - 1;
				}
			}

			return 0;

		}

	}

	/**
	 *
	 *
	 */
	private class StreamAnalysis {

		private EdgeList outgoingEdge;
		private GraphNode graphNode;
		private List<EdgeStream> streams;

		private int count = 0;
		private double demand = 0;
		private double maxDistanceToEnd = 0;

		public StreamAnalysis(GraphNode vertex, EdgeList outgoingEdge,
				List<EdgeStream> streams) {
			this.graphNode = vertex;
			this.outgoingEdge = outgoingEdge;
			this.streams = streams;
		}

		public StreamAnalysis analyize() {

			streams.forEach(s -> {
				count += s.getLocationCount();
				demand += s.getLocationDemand();
				maxDistanceToEnd = Math.max(maxDistanceToEnd,
						s.getMaxDistancetoEnd());
			});

			return this;

		}

		public VertexStream createVertexStream() {
			return new DefaultVertexStream(maxDistanceToEnd, count, demand,
					graphNode, streams);
		}

		public boolean isSparseOutgoingEdge() {
			return (outgoingEdge.getLocationCount() / outgoingEdge.getLength()) <= thresholds
					.getSparseThreshholdInMetersPerHH();
		}

		public boolean isTerminated() {
			return demand >= thresholds.getMaxLocationPerFDH()
					|| (demand >= thresholds.getLocationPerFDH() && isSparseOutgoingEdge());

		}

		public TerminatedVertex terminate() {
			return new VertexTerminator(graphNode).assignStreams(streams);
		}

	}

	private class VertexTerminator {

		private int remainingCount;
		private double remainingDemand;

		private GraphNode vertex;

		public VertexTerminator(GraphNode vertex) {
			super();
			this.vertex = vertex;
		}

		public TerminatedVertex assignStreams(Collection<EdgeStream> streams) {
			return reduce(keyStreams(streams), TerminatedVertex.build())
					.build();
		}

		private Map<ValuedItem, EdgeStream> keyStreams(
				Collection<EdgeStream> edges) {
			Map<ValuedItem, EdgeStream> map = new HashMap<>();
			edges.forEach(e -> {
				remainingCount += e.getLocationCount();
				remainingDemand += e.getLocationDemand();
				map.put(new DefaultValueItem((int) Math.round(e
						.getLocationDemand())), e);
			});
			return map;
		}

		private VertexStream write(Map<ValuedItem, EdgeStream> map,
				Collection<ValuedItem> keys) {

			List<EdgeStream> streams = new ArrayList<>();

			int count = 0;
			double demand = 0;

			double maxDistance = 0;
			for (ValuedItem k : new ArrayList<>(keys)) {
				EdgeStream es = map.remove(k);
				streams.add(es);
				count += es.getLocationCount();
				demand += es.getLocationDemand();
				maxDistance = Math.max(maxDistance, es.getMaxDistancetoEnd());
			}

			this.remainingCount -= count;
			this.remainingDemand -= demand;

			return new DefaultVertexStream(maxDistance, count, demand, vertex,
					streams);

		}

		private int reduceEdgeStreams(int fdhCount,
				Map<ValuedItem, EdgeStream> map,
				TerminatedVertex.Builder builder) {

			int oldCount = remainingCount;

			map.entrySet()
					.stream()
					.filter(e -> e.getValue().getLocationDemand() >= fdhCount)
					.collect(Collectors.toList())
					.forEach(
							e -> {
								EdgeStream es = map.remove(e.getKey());

								EdgeStream remaining = null;
								LocationStream truncated = null;

								if (es.getVertexStream().getLocationDemand() >= fdhCount) {
									truncated = es.getVertexStream();
									remaining = es.truncateFrom(es
											.getVertexStream()
											.getLocationCount());
								} else {
									int index = es.indexOfDemand(fdhCount);
									truncated = es.truncateTo(index);
									remaining = es.truncateFrom(index);
								}

								builder.add(truncated);
								remainingCount -= truncated.getLocationCount();

								if (remaining != null
										&& remaining.getLocationCount() > 0) {
									map.put(new DefaultValueItem(
											(int) remaining.getLocationDemand()),
											remaining);
								}

							});

			return oldCount - remainingCount;

		}

		public TerminatedVertex.Builder reduce(Map<ValuedItem, EdgeStream> map,
				TerminatedVertex.Builder builder) {

			// Tricky remainder Basis
			if (remainingCount < thresholds.getMinLocationPerFDH()) {
				builder.setRemainder(write(map, map.keySet()));
				return builder;
			}

			//
			// Closed case Basis
			//
			if (remainingCount <= thresholds.getMaxLocationPerFDH()) {
				builder.close(write(map, map.keySet()));
				builder.setRemainder(emptyVertex(vertex));
				return builder;
			}

			//
			// Induction on reduced edge streams
			//
			// TODO convert to dynamic programming form
			if (thresholds.isReduceIncomingStreams()) {
				if (thresholds.isReduceIncomingStreams()
						&& reduceEdgeStreams(thresholds.getLocationPerFDH(),
								map, builder) > 0) {
					return reduce(map, builder);
				} else {
					if (reduceEdgeStreams(thresholds.getMinLocationPerFDH(),
							map, builder) > 0) {
						return reduce(map, builder);
					}
				}
			}

			//
			// Induction on best fill plan
			//
			Knapsack knapsack = new Knapsack(map.keySet(),
					thresholds.getMaxLocationPerFDH());

			builder.close(write(map, knapsack.getSelectedItems()));

			return reduce(map, builder);

		}

	}

}
