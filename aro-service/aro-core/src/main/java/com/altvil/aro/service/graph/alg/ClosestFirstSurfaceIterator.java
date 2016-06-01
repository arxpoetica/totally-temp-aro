package com.altvil.aro.service.graph.alg;

import org.jgrapht.traverse.GraphIterator;

/**
 * A GraphIterator that retains information about every vertex encountered thereby enabling it to provide the minimum path to any vertex rather than limiting itself to vertexes along the minimum path.
 * @author Kevin
 *
 * @param <V>
 * @param <E>
 */

public interface ClosestFirstSurfaceIterator<V, E> extends GraphIterator<V, E> {

	/**
	 * Get the weighted length of the shortest path known to the given vertex.
	 * If the vertex has already been visited, then it is truly the shortest
	 * path length; otherwise, it is the best known upper bound.
	 *
	 * @param vertex
	 *            vertex being sought from start vertex
	 *
	 * @return weighted length of shortest path known, or
	 *         Double.POSITIVE_INFINITY if no path found yet
	 */
	double getShortestPathLength(V vertex);

	/**
	 * Get the spanning tree edge reaching a vertex which has been seen already
	 * in this traversal. This edge is the last link in the shortest known path
	 * between the start vertex and the requested vertex. If the vertex has
	 * already been visited, then it is truly the minimum spanning tree edge;
	 * otherwise, it is the best candidate seen so far.
	 *
	 * @param vertex
	 *            the spanned vertex.
	 *
	 * @return the spanning tree edge, or null if the vertex either has not been
	 *         seen yet or is the start vertex.
	 */
	E getSpanningTreeEdge(V vertex);

	void logWeight(V v);

}
