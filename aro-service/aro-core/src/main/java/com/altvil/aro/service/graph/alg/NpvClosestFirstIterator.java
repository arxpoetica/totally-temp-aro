package com.altvil.aro.service.graph.alg;

import java.util.Collection;

import org.jgrapht.Graph;
import org.jgrapht.Graphs;
import org.jgrapht.traverse.CrossComponentIterator;
import org.jgrapht.util.FibonacciHeap;
import org.jgrapht.util.FibonacciHeapNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.segment.GeoSegment;

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
	private static final double	MAX_NPV		 = 1.0E7;

	private final Logger		log			 = LoggerFactory.getLogger(NpvClosestFirstIterator.class);

	private static final int	FDT_PER_UNIT = 200;

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

	private final double					discountRate;
	private final int						years;

	/**
	 * Priority queue of fringe vertices.
	 */
	private FibonacciHeap<QueueEntry<V, E>>	heap		= new FibonacciHeap<QueueEntry<V, E>>();

	private boolean							initialized	= false;

	/**
	 * Maximum distance to search.
	 */
	private double							radius		= Double.POSITIVE_INFINITY;
	private double							budget		= Double.POSITIVE_INFINITY;

	/**
	 * Creates a new closest-first iterator for the specified graph.
	 *
	 * @param g
	 *            the graph to be iterated.
	 */
	public NpvClosestFirstIterator(double discountRate, int years, double budget, Graph<V, E> g) {
		this(discountRate, years, budget, g, null);
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
	public NpvClosestFirstIterator(double discountRate, int years, double budget, Graph<V, E> g, V startVertex) {
		this(discountRate, years, budget, g, startVertex, Double.POSITIVE_INFINITY);
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
	public NpvClosestFirstIterator(double discountRate, int years, double budget, Graph<V, E> g, V startVertex,
			double radius) {
		super(g, startVertex);
		this.budget = budget;
		this.discountRate = discountRate;
		this.years = years;
		this.radius = radius;
		checkRadiusTraversal(isCrossComponentTraversal());
		initialized = true;
		ONCE = true;
	}

	/**
	 * Determine weighted path length to a vertex via an edge, using the path
	 * length for the opposite vertex.
	 *
	 * @param terminal
	 *            the vertex for which to calculate the path length.
	 * @param base2terminal
	 *            the edge via which the path is being extended.
	 *
	 * @return calculated path length.
	 */
	private double calculatePathLength(V terminal, E base2terminal) {
		NpvData terminalData = createNpvData(terminal, base2terminal);

		double npv = netPresentValue(terminalData);

		final double f = f(npv);
		if (ONCE) {
			log.trace(
					"|Source Vertex, Target Vertex, Edge Length, Path Cost, Path Revenue, Path Length, Path Locations, Path FDT, NPV, F");
			ONCE = false;
		}

		if (log.isTraceEnabled()) {
			log.trace("|" + base2terminal.getTargetNode().getId() + "," + base2terminal.getSourceNode().getId() + ","
					+ base2terminal.getWeight() + "," + terminalData.cost + "," + terminalData.revenue + ","
					+ terminalData.totalLength + "," + terminalData.locations + "," + terminalData.fdt + "," + npv + ","
					+ f);
		}

		return f;
	}

	private double netPresentValue(NpvData data) {
		double npv = -data.cost;

		// if the cost of this plan does NOT exceed the budget then include the
		// revenue in the NPV calculation otherwise return NPV with no revenue
		// to make this plan highly undesirable.
		// NOTE: Do NOT return a constant value when the budget is exceeded as
		// the plan's npv must get worse each time it is extended.
		if (data.cost < budget) {
			// NOTE: Assumes fixed revenue for every year INCLUDING THE FIRST
			// YEAR.
			for (int t = 1; t <= years; t++) {
				npv += data.revenue / Math.pow(1 + discountRate, t);
			}
		}

		return npv;
	}

	private static boolean ONCE = false;

	private static class NpvData {
		double	   cost		   = 0;
		double	   revenue	   = 0;
		double	   totalLength = 0;
		public int locations   = 0;
		public int fdt		   = 0;

		@Override
		public String toString() {
			return "NpvData [cost=" + cost + ", revenue=" + revenue + ", totalLength=" + totalLength + ", locations="
					+ locations + ", fdt=" + fdt + "]";
		}
	}

	private static final double	M_PER_FT	= 0.3048;
	private static final double	FIBER_PER_M	= 1.68 / M_PER_FT;
	private static final double	LABOR_PER_M	= 3.5 / M_PER_FT;

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

	private NpvData createNpvData(V terminal, E base2terminal) {
		final NpvData baseData;
		final NpvData terminalData = new NpvData();

		if (base2terminal == null) {
			return terminalData;
		}

		V base = Graphs.getOppositeVertex(getGraph(), base2terminal, terminal);
		FibonacciHeapNode<QueueEntry<V, E>> baseNode = getSeenData(base);
		baseData = baseNode.getData().npvData;

		terminalData.totalLength = baseData.totalLength + base2terminal.getWeight();

		GeoSegment segment = (GeoSegment) base2terminal.getValue();
		if (segment != null) {
			Collection<GraphEdgeAssignment> assignments = segment.getGeoSegmentAssignments();

			assignments.forEach((assignment) -> {
				LocationEntity le = (LocationEntity) assignment.getAroEntity();
				LocationDemand d = le.getLocationDemand();
				terminalData.locations++;
				terminalData.revenue += d.getMonthlyRevenueImpact() * 12;
				// # FDT to support this location
				int fdt = (int) ((d.getDemand() + 12) / 12);
				terminalData.fdt += fdt;
				// Cost of distribution fiber (1 per FDT) from start of path
				// to this location
				terminalData.cost += (baseData.totalLength
						+ assignment.getPinnedLocation().getEffectiveOffsetFromStartVertex()) * fdt * FIBER_PER_M;
				// Cost of FDTs at this location
				terminalData.cost += fdt * FDT_PER_UNIT;
				// Labor cost for this edge (Assumes that the edge is not
				// the terminal edge of the entire path)
				terminalData.cost += base2terminal.getWeight() * LABOR_PER_M;
				// NOTE: Cost of terminal fiber not included.
				// NOTE: Presently assumes that the FDT is located on the
				// edge rather than at the location.
			});
		}

		return terminalData;
	}

	/**
	 * @see CrossComponentIterator#encounterVertex(Object, Object)
	 */
	@Override
	protected void encounterVertex(V vertex, E edge) {
		double shortestPathLength;
		if (edge == null) {
			shortestPathLength = 0;
		} else {
			shortestPathLength = calculatePathLength(vertex, edge);
		}
		FibonacciHeapNode<QueueEntry<V, E>> node = createSeenData(vertex, edge);
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

		double candidatePathLength = calculatePathLength(vertex, edge);

		if (candidatePathLength < node.getKey()) {
			node.getData().spanningTreeEdge = edge;
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
		double normalized = MAX_NPV - npv;

		assert (normalized >= 0.0);

		return normalized;
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

	@Override
	public void logWeight(V vertex) {
		FibonacciHeapNode<QueueEntry<V, E>> node = getSeenData(vertex);
		NpvData d = node.getData().npvData;

		System.err.println("|" + vertex + "," + netPresentValue(d));
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
}
