package com.altvil.aro.service.graph.transform.fdtx;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import org.jgrapht.DirectedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.node.RoadNode;
import com.altvil.aro.service.graph.node.SpliceNode;
import com.altvil.aro.service.graph.transform.FDHAssignments;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.graph.transform.impl.DefaultGraphNodeVisitor;
import com.altvil.aro.service.graph.transform.impl.DepthFirstTransform;


public class FTTXScanner extends
		DepthFirstTransform<Long, Collection<FDHAssignments>> {

	private static final Logger log = LoggerFactory
			.getLogger(FTTXScanner.class.getName());

	//private GraphTransformerFactory graphFactory;
	private FDTBuilder fdtBuilder;
	private GraphNodeFactory nodeFactory;

	public FTTXScanner(GraphTransformerFactory graphFactory,
			DirectedGraph<GraphNode, AroEdge<Long>> graph,
			GraphNodeFactory nodeFactory, int maxFDTCount, int maxFDHCount) {

		//this.graphFactory = graphFactory;
		this.nodeFactory = nodeFactory;
		this.fdtBuilder = new FDTBuilder(graph, maxFDTCount, maxFDHCount);

	}

	@Override
	protected Collection<FDHAssignments> build() {
		return fdtBuilder.build();
	}

	@Override
	protected void add(GraphNode node) {
		node.accept(fdtBuilder);
	}

	public class FDTBuilder extends DefaultGraphNodeVisitor {

		private int maxCount;

		private LocationsStream stream;

		private DirectedGraph<GraphNode, AroEdge<Long>> graph;

		// private GraphModelBuilder<LocationsEdge> graphBuilder;
		private Map<AroEdge<Long>, LocationsStream> assemblerMap = new HashMap<>();
		private StreamAggregator streamAggregator;

		public FDTBuilder(DirectedGraph<GraphNode, AroEdge<Long>> graph, int maxFDT,
				int maxFDH) {
			super();
			this.maxCount = maxFDT;
			this.stream = null;

			this.graph = graph;
			// graphBuilder = graphFactory
			// .createBuilder((s, d) -> new LocationsEdge());

			this.streamAggregator = new StreamAggregator(nodeFactory, graph,
					assemblerMap, maxCount, maxFDH);

		}

		public void linkStreams(GraphNode node) {
			streamAggregator.aggregate(node);
		}

		public void flushStream(LocationsStream assembler) {

			if( log.isTraceEnabled() ) {
				log.trace("Flush gid=" + assembler.getGid() + " -> " + assembler.getLocationCount());
			}
			
			for (AroEdge<Long> e : assembler.close()) {
				assemblerMap.put(e, assembler);
			}
		}

		@Override
		public void visit(SpliceNode node) {
			if (stream != null) {
				flushStream(stream);
			}

			linkStreams(node);
			streamAggregator.flush(node);

			if(  assemblerMap.size() > 0 ) {
				log.error("Streams Left =" + assemblerMap.size());
			}
		
		}

		@Override
		public void visit(RoadNode node) {

			if (log.isTraceEnabled()) {
				log.trace("Vertix -> " + graph.incomingEdgesOf(node) + " -> " +  graph.outgoingEdgesOf(node)) ;
			}

			if (stream == null) {
				stream = startStream(node);
			} else {
				if (!stream.groupBy(node)) {
					flushStream(stream);
					linkStreams(node);
					stream = startStream(node);
				}
			}
		}

		private LocationsStream startStream(RoadNode node) {
			LocationsStream assembler = new LocationsStream(graph);
			assembler.init(node);
			return assembler;
		}

		protected void flush() {

		}

		public Collection<FDHAssignments> build() {
			flush();
			return streamAggregator.getAssignments();
		}

	}
}
