package com.altvil.aro.service.graph.transform;

import java.util.Collection;
import java.util.function.Predicate;

import org.jgrapht.EdgeFactory;
import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.transform.ftp.FiberDagScanner;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.graph.transform.network.GraphRenoder;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;

public interface GraphTransformerFactory {

	
	/**
	 * 
	 * @param model
	 * @return
	 */
	public  <T> GraphModelBuilder<T> modifyModel(GraphModel<T> model) ;
	
	/**
	 * 
	 * @param threshhold
	 * @return
	 */
	public FiberDagScanner createWirecenterTransformer(FtthThreshholds threshhold);

	
	/**
	 * 
	 * @param edgeFactory
	 * @return
	 */
	public <T> GraphModelBuilder<T> createDAGBuilder();

	/**
	 * 
	 * @param edgeFactory
	 * @return
	 */
	public <T> GraphModelBuilder<T> createBuilder(
			WeightedGraph<GraphNode, AroEdge<T>> graph);
	
	
	/**
	 * 
	 * @return
	 */
	public GraphModelBuilder<GeoSegment> createGraphBuilder();

	/**
	 * 
	 * @return
	 */
	public <T> GraphModelBuilder<T> createDagBuilder();
	
	/**
	 * 
	 * @param srcNode
	 * @param selectedEdges
	 * @return
	 */
	public <T> DAGModel<T> createDAG(GraphModel<T> graphModel, 
			GraphNode srcNode, Predicate<AroEdge<T>> predicate);

	/**
	 * 
	 * @param edges
	 * @param networkAssignments
	 * @param fToAroEntity
	 * @return
	 */
	public GraphNetworkModel createGraphNetworkModel(
			Collection<RoadEdge> edges,
			Collection<NetworkAssignment> networkAssignments);

		
	public GraphRenoder createNetworkBuilder(
			GraphModelBuilder<GeoSegment> builder);
}
