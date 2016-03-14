package com.altvil.aro.service.graph.alg;

import java.util.List;

import org.jgrapht.Graph;


public interface DAGPath<V, E>
{
    

    /**
     * Returns the graph over which this path is defined. The path may also be
     * valid with respect to other graphs.
     *
     * @return the containing graph
     */
    public Graph<V, E> getGraph();

    /**
     * Returns the start vertex in the path.
     *
     * @return the start vertex
     */
    public V getStartVertex();

    /**
     * Returns the end vertex in the path.
     *
     * @return the end vertex
     */
    public V getEndVertex();

    /**
     * Returns the edges making up the path. The first edge in this path is
     * incident to the start vertex. The last edge is incident to the end
     * vertex. The vertices along the path can be obtained by traversing from
     * the start vertex, finding its opposite across the first edge, and then
     * doing the same successively across subsequent edges; {@link
     * Graphs#getPathVertexList} provides a convenience method for this.
     *
     * <p>Whether or not the returned edge list is modifiable depends on the
     * path implementation.
     *
     * @return list of edges traversed by the path
     */
    public List<PathEdge<V, E>> getPathEdges();

    /**
     * Returns the weight assigned to the path. Typically, this will be the sum
     * of the weights of the edge list entries (as defined by the containing
     * graph), but some path implementations may use other definitions.
     *
     * @return the weight of the path
     */
    public double getWeight();
}
