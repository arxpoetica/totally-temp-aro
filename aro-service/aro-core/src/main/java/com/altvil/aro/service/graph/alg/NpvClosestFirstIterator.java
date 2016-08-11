package com.altvil.aro.service.graph.alg;

import java.util.Collection;

import org.jgrapht.Graph;
import org.jgrapht.Graphs;
import org.jgrapht.WeightedGraph;
import org.jgrapht.traverse.CrossComponentIterator;
import org.jgrapht.util.FibonacciHeap;
import org.jgrapht.util.FibonacciHeapNode;

import com.altvil.aro.service.demand.impl.DefaultLocationDemand;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.SimpleNetworkFinancials;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.utils.func.Aggregator;

/**
 * A closest-first iterator for a directed or undirected graph. For this
 * iterator to work correctly the graph must not be modified during iteration.
 * Currently there are no means to ensure that, nor to fail-fast. The results of
 * such modifications are undefined.
 *
 * <p>
 * The metric for <i>closest</i> here is the Net Present Value from a start
 * vertex transformed to a "weight" using the 'f' function. Optionally, path
 * length may be bounded by a finite radius.
 * </p>
 */
public class NpvClosestFirstIterator<V, E extends AroEdge<?>>
		extends CrossComponentIterator<V, E, FibonacciHeapNode<NpvClosestFirstIterator.QueueEntry<V, E>>>
		implements ClosestFirstSurfaceIterator<V, E> {
	public static class Builder implements ClosestFirstSurfaceBuilder {
		private final double		   discountRate;
		private final int			   years;

		public Builder(double discountRate, int years) {
			this.discountRate = discountRate;
			this.years = years;
		}

		@Override
		public <V, E extends AroEdge<?>> ClosestFirstSurfaceIterator<V, E> build(WeightedGraph<V, E> graph,
				V startVertex) {
			return new NpvClosestFirstIterator<>(new SimpleNetworkFinancials(null, 0, discountRate, years), graph, startVertex);
		}
	}

	/**
	 * Private data to associate with each entry in the priority queue.
	 */
	static class QueueEntry<V, E> {
		// List<Double> cashFlow = Collections.emptyList();
		NpvData	npvData;

		/**
		 * True once spanningTreeEdge is guaranteed to be the true minimum.
		 */
		boolean	frozen;

		/**
		 * Best spanning tree edge to vertex seen so far.
		 */
		E		spanningTreeEdge;

		/**
		 * The vertex reached.
		 */
		V		vertex;

		QueueEntry() {
		}
	}

	/**
	 * Priority queue of fringe vertices.
	 */
	private FibonacciHeap<QueueEntry<V, E>>	heap		= new FibonacciHeap<QueueEntry<V, E>>();

	private boolean							initialized	= false;

	/**
	 * Maximum distance to search.
	 */
	private double							radius		= Double.POSITIVE_INFINITY;

	private SimpleNetworkFinancials financials;
	
	/**
	 * Creates a new closest-first iterator for the specified graph.
	 *
	 * @param g
	 *            the graph to be iterated.
	 */
	public NpvClosestFirstIterator(SimpleNetworkFinancials financials, Graph<V, E> g) {
		this(financials, g, null);
	}

	/**
	 * Creates a new closest-first iterator for the specified graph. Iteration
	 * will start at the specified start vertex and will be limited to the
	 * connected component that includes that vertex. If the specified start
	 * vertex is <code>null</code>, iteration will start at an arbitrary vertex
	 * and will not be limited, that is, will be able to traverse all the graph.
	 *
	 * @param g
	 *            the graph to be iterated.
	 * @param startVertex
	 *            the vertex iteration to be started.
	 */
	public NpvClosestFirstIterator(SimpleNetworkFinancials financials, Graph<V, E> g, V startVertex) {
		this(financials, g, startVertex, Double.POSITIVE_INFINITY);
	}

	/**
	 * Creates a new radius-bounded closest-first iterator for the specified
	 * graph. Iteration will start at the specified start vertex and will be
	 * limited to the subset of the connected component which includes that
	 * vertex and is reachable via paths of weighted length less than or equal
	 * to the specified radius. The specified start vertex may not be <code>
	 * null</code>.
	 *
	 * @param g
	 *            the graph to be iterated.
	 * @param startVertex
	 *            the vertex iteration to be started.
	 * @param radius
	 *            limit on weighted path length, or Double.POSITIVE_INFINITY for
	 *            unbounded search.
	 */
	public NpvClosestFirstIterator(SimpleNetworkFinancials financials, Graph<V, E> g, V startVertex,
			double radius) {
		super(g, startVertex);
		this.financials = financials;
		this.radius = radius;
		checkRadiusTraversal(isCrossComponentTraversal());
		initialized = true;

		}


	/**
	 * Determine weighted path length to a vertex via an edge, using the path
	 * length for the opposite vertex.
	 *
	 * @return calculated path length.
	 */
	private double calculatePathLength(NpvData terminalData) {

		double npv = netPresentValue(terminalData);

		final double f = f(npv);
		return f;
	}

	private double netPresentValue(NpvData data) {
		financials.setLocationDemand(data.demand);
		financials.setFiberLength(data.totalLength);

		return financials.getNpv();
	}

	private static class NpvData {
		LocationDemand demand = DefaultLocationDemand.ZERO_DEMAND;
		double	   totalLength = 0;
	}

	private void checkRadiusTraversal(boolean crossComponentTraversal) {
		if (crossComponentTraversal && (radius != Double.POSITIVE_INFINITY)) {
			throw new IllegalArgumentException("radius may not be specified for cross-component traversal");
		}
	}

	/**
	 * The first time we see a vertex, make up a new heap node for it.
	 *
	 * @param terminal
	 *            a vertex which has just been encountered.
	 * @param base2terminal
	 *            the edge via which the vertex was encountered.
	 *
	 * @return the new heap node.
	 */
	private FibonacciHeapNode<QueueEntry<V, E>> createSeenData(V terminal, E base2terminal) {
		QueueEntry<V, E> terminalEntry = new QueueEntry<V, E>();
		terminalEntry.vertex = terminal;
		terminalEntry.spanningTreeEdge = base2terminal;
		terminalEntry.npvData = createNpvData(terminal, base2terminal);

		return new FibonacciHeapNode<QueueEntry<V, E>>(terminalEntry);
	}

	private NpvData createNpvData(V destination, E source2Destination) {
		final NpvData sourceData;
		final NpvData destinationData = new NpvData();

		if (source2Destination == null) {
			return destinationData;
		}

		V source = Graphs.getOppositeVertex(getGraph(), source2Destination, destination);
		FibonacciHeapNode<QueueEntry<V, E>> sourceNode = getSeenData(source);
		sourceData = sourceNode.getData().npvData;

		// The destination's financial data will be the source's financial data plus the
		// demands and revenues associated with the current edge.
		Aggregator<LocationDemand> demandAggregator = DefaultLocationDemand.demandAggregate();
		demandAggregator.add(sourceData.demand);

		destinationData.totalLength = sourceData.totalLength + source2Destination.getWeight();

		// Include the cost, and revenue, of its assignments in the NPV calculation.
		GeoSegment segment = (GeoSegment) source2Destination.getValue();

		if (segment != null) {
			Collection<GraphEdgeAssignment> assignments = segment.getGeoSegmentAssignments();

			assignments.forEach((assignment) -> {
				LocationEntity le = (LocationEntity) assignment.getAroEntity();
				LocationDemand d = le.getLocationDemand();
				demandAggregator.add(d);
			});
		}
		
		destinationData.demand = demandAggregator.apply();

		return destinationData;
	}

	/**
	 * @see CrossComponentIterator#encounterVertex(Object, Object)
	 */
	@Override
	protected void encounterVertex(V vertex, E edge) {
		FibonacciHeapNode<QueueEntry<V, E>> node = createSeenData(vertex, edge);

		double shortestPathLength;
		if (edge == null) {
			shortestPathLength = 0;
		} else {
			shortestPathLength = calculatePathLength(node.getData().npvData);
		}
		putSeenData(vertex, node);
		heap.insert(node, shortestPathLength);
	}

	/**
	 * Override superclass. When we see a vertex again, we need to see if the
	 * new edge provides a shorter path than the old edge.
	 *
	 * @param vertex
	 *            the vertex re-encountered
	 * @param edge
	 *            the edge via which the vertex was re-encountered
	 */
	@Override
	protected void encounterVertexAgain(V vertex, E edge) {
		FibonacciHeapNode<QueueEntry<V, E>> node = getSeenData(vertex);

		if (node.getData().frozen) {
			// no improvement for this vertex possible
			return;
		}

		NpvData npvData = createNpvData(vertex, edge);

		double candidatePathLength = calculatePathLength(npvData);

		if (candidatePathLength < node.getKey()) {
			node.getData().spanningTreeEdge = edge;
			node.getData().npvData = npvData;
			heap.decreaseKey(node, candidatePathLength);
		}
	}

	/**
	 * An Altvil proprietary algorithm for converting the npv into a value
	 * suitable for a minimization algorithm such as Dijkstra.
	 * 
	 * @param npv
	 * @return
	 */

	private double f(double npv) {
		if (npv > 1) {
			return 100.0 - Math.log(npv);
		} else if (npv > -1) {
			return npv;
		}
		
		return 100.0 + Math.log(-npv);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.altvil.demo.npv.ClosestFirstSurfaceIterator#getShortestPathLength(V)
	 */
	@Override
	public double getShortestPathLength(V vertex) {
		FibonacciHeapNode<QueueEntry<V, E>> node = getSeenData(vertex);

		if (node == null) {
			return Double.POSITIVE_INFINITY;
		}

		return node.getKey();
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.altvil.demo.npv.ClosestFirstSurfaceIterator#getSpanningTreeEdge(V)
	 */
	@Override
	public E getSpanningTreeEdge(V vertex) {
		FibonacciHeapNode<QueueEntry<V, E>> node = getSeenData(vertex);

		if (node == null) {
			return null;
		}

		return node.getData().spanningTreeEdge;
	}

	/**
	 * @see CrossComponentIterator#isConnectedComponentExhausted()
	 */
	@Override
	protected boolean isConnectedComponentExhausted() {
		if (heap.size() == 0) {
			return true;
		}

		if (heap.min().getKey() > radius) {
			heap.clear();

			return true;
		}

		return false;
	}

	/**
	 * @see CrossComponentIterator#provideNextVertex()
	 */
	@Override
	protected V provideNextVertex() {
		FibonacciHeapNode<QueueEntry<V, E>> node = heap.removeMin();
		node.getData().frozen = true;

		return node.getData().vertex;
	}

	// override AbstractGraphIterator
	@Override
	public void setCrossComponentTraversal(boolean crossComponentTraversal) {
		if (initialized) {
			checkRadiusTraversal(crossComponentTraversal);
		}
		super.setCrossComponentTraversal(crossComponentTraversal);
	}

	@Override
	public boolean isGlobalConstraintMet() {
		// TODO Auto-generated method stub
		return false;
	}
}
