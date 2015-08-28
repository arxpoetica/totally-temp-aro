package com.altvil.test.graph;


import org.jgrapht.event.ConnectedComponentTraversalEvent;
import org.jgrapht.event.EdgeTraversalEvent;
import org.jgrapht.event.TraversalListener;
import org.jgrapht.event.VertexTraversalEvent;
import org.jgrapht.traverse.GraphIterator;
import org.junit.Test;

import com.altvil.aro.service.MainEntry;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.GraphService;
import com.altvil.aro.service.graph.node.GraphNode;

public class TestGraph {
	
	@Test
	public void testGraph() {
		try {
			GraphModel m = MainEntry.service(GraphService.class).getGraphForPlanId(4) ;
			
			GraphIterator<GraphNode, AroEdge> itr = m.depthFirstItr() ;
			
			itr.addTraversalListener(new TraversalListener<GraphNode, AroEdge>() {
				
				@Override
				public void vertexTraversed(VertexTraversalEvent<GraphNode> e) {
					//System.out.println("traversedVertex " + e.getVertex()) ;
				}
				
				@Override
				public void vertexFinished(VertexTraversalEvent<GraphNode> e) {
					System.out.println("finishedVertex " + e.getVertex()) ;
				}
				
				@Override
				public void edgeTraversed(EdgeTraversalEvent<GraphNode, AroEdge> e) {
					System.out.println("Edge Traversed src " + " edge " + e.getEdge()) ;
				}
				
				@Override
				public void connectedComponentStarted(ConnectedComponentTraversalEvent e) {
					System.out.println("Started " + e.getSource()) ;
				}
				
				@Override
				public void connectedComponentFinished(ConnectedComponentTraversalEvent e) {
					System.out.println("FinishedComponent " + e.getSource()) ;
				}
			});
			
			
			while(itr.hasNext()) {
				itr.next();
				//System.out.println(node.getClass().getSimpleName() + " " + node.getId()) ;
			}
					
			
		} catch (Throwable err) {
			err.printStackTrace();
		}
	}

}
