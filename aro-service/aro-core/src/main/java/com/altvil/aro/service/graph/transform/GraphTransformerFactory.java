package com.altvil.aro.service.graph.transform;

import java.util.function.Predicate;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.transform.ftp.FiberDagScanner;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.graph.transform.network.GraphRenoder;

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

		
	public GraphRenoder createNetworkBuilder(
			GraphModelBuilder<GeoSegment> builder);
}
