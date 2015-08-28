package com.altvil.aro.service.graph.transform.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.node.FDTNode;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.node.RoadNode;
import com.altvil.aro.util.geometry.GeometryUtil;
import com.vividsolutions.jts.algorithm.CentroidPoint;
import com.vividsolutions.jts.geom.LineSegment;
import com.vividsolutions.jts.geom.Point;

public class SimpleFdtBuilder extends DepthFirstTransform<Collection<FDTNode>> {

	
	private static final Logger log = LoggerFactory
			.getLogger(SimpleFdtBuilder.class.getName());
	
	private FDTBuilder fdtBuilder ;
	

	public SimpleFdtBuilder(GraphNodeFactory factory, int maxCount) {
		this.fdtBuilder = new FDTBuilder(factory, maxCount) ;
		
	}
	
	@Override
	protected Collection<FDTNode> build() {
		return fdtBuilder.build() ;
	}
	
	@Override
	protected void add(GraphNode node) {
		node.accept(fdtBuilder) ;
	}
	
	
	public class FDTBuilder extends DefaultGraphNodeVisitor {
		
		private GraphNodeFactory nodeFactory;
		private int maxCount;

		private List<RoadNode> nodes = new ArrayList<>();

		private List<FDTNode> result = new ArrayList<>();

		public FDTBuilder(GraphNodeFactory nodeFactory, int maxCount) {
			super();
			this.nodeFactory = nodeFactory;
			this.maxCount = maxCount;
		}

		@Override
		public void visit(RoadNode node) {

			
			if (node.isConnectedToLocationNode()) {
				
				if( !isLinked(node) ) {
					flush();
				} 
				
				nodes.add(node);
				if (nodes.size() >= maxCount) {
					flush();
				}
				
			} else {
				if( !isStronglyLinked(node) ) {
					flush();
				}
			}
			
			if( log.isDebugEnabled() ) {
				log.debug("Vertix Processed " + node.isLocationNode() + " id=" + node) ;
			}
			
		}
		
		public boolean isLinked(RoadNode node) {
			if ( nodes.size() == 0 ) {
				return true ;
			}
			
			RoadNode rn = nodes.get(nodes.size()-1) ;
			
			//TODO improve linking logic + distance
			return rn.getGid().equals(node.getGid()) ;
		}
		
		public boolean isStronglyLinked(RoadNode node) {
			
			if ( nodes.size() == 0 ) {
				return false ;
			}
			
			RoadNode rn = nodes.get(nodes.size()-1) ;
			
			//TODO improve linking logic + distance
			return rn.getGid().equals(node.getGid()) ;
			
			
		}



		protected void flush() {

			if (nodes.size() > 0) {
				
				Collection<FDTNode> fdts = toFdtNodes(nodes) ;
				result.addAll(fdts);
				
				if( log.isDebugEnabled() ) {
					log.debug("locations sizes " + nodes.size() + " -> FDTSs " + fdts.size());
				}
				
				nodes.clear();
				
			}
		}

		public Collection<FDTNode> build() {
			flush();
			return result;
		}

		private Collection<FDTNode> toFdtNodes(List<RoadNode> nodes) {

			List<FDTNode> result = new ArrayList<>();

			if (nodes.size() == 0) {
				return result;
			}

			long gid = nodes.get(0).getGid();

			if (nodes.size() == 1) {
				result.add(nodeFactory.createFDTNode(null, nodes.get(0).getPoint(),
						gid));
			} else {

				CentroidPoint centroid = new CentroidPoint();
				nodes.stream().map(n -> n.getLocationNode().getPoint())
						.forEach(p -> centroid.add(p));

				LineSegment ls = GeometryUtil.createLineSegment(nodes.get(0)
						.getPoint().getCoordinate(), nodes.get(nodes.size() - 1)
						.getPoint().getCoordinate());

				Point point = GeometryUtil.asPoint(centroid.getCentroid());

				Point fdtPoint = GeometryUtil.factory().createPoint(
						ls.closestPoint(point.getCoordinate()));

				result.add(nodeFactory.createFDTNode(null, fdtPoint, gid));
			}

			return result;

		}

//		private boolean validate(List<GraphNode> nodes,
//				Point locationPoint) {
//			return true;
//		}
	}


}
