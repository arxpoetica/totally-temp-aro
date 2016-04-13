package com.altvil.aro.service.graph.transform.ftp.cluster;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.demand.DefaultAssignedEntityDemand;
import com.altvil.aro.service.demand.PinnedAssignedEntityDemand;
import com.altvil.aro.service.entity.Pair;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;
import com.altvil.aro.service.graph.transform.ftp.EdgeList;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;

public class DefaultLocationClusterGroup implements LocationClusterGroup {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(DefaultLocationClusterGroup.class.getName());
	
	public static LocationClusterGroup create(EdgeList edgeList,
			FtthThreshholds thresholds) {
		return new DefaultLocationClusterGroup(edgeList, thresholds, thresholds.isClusterMergingSupported());
	}
	
	private EdgeList edgeList;
	private boolean supportsIncomingCluster;
	
	private List<LocationCluster> aggregates = null;
	private FtthThreshholds thresholds;
	private List<LocationCluster> incomingClusters = new ArrayList<>();

	public static final LocationClusterGroup EMPTY_CLUSTER = new DefaultLocationClusterGroup(
			null, null, false);

	private DefaultLocationClusterGroup(EdgeList edgeList,
			FtthThreshholds thresholds, boolean supportsIncomingCluster) {
		super();
		this.edgeList = edgeList;
		this.thresholds = thresholds;
		this.supportsIncomingCluster = supportsIncomingCluster;
	}

	private void init() {
		if (aggregates == null) {
			aggregates = recluster();
		}
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.altvil.aro.service.graph.transform.ftx.cluster.LocationClusterGroup
	 * #getAggregates()
	 */
	@Override
	public List<LocationCluster> getAggregates() {
		init();
		return aggregates;
	}

	@Override
	public boolean supportsIncommingCluster() {
		return supportsIncomingCluster && edgeList != null ;
	}

	@Override
	public LocationCluster getLastCluster() {
		List<LocationCluster> clusters = getAggregates();
		return (clusters.size()) > 0 ? clusters.get(clusters.size() - 1) : null;
	}

	@Override
	public LocationCluster removePartialCluster() {
		List<LocationCluster> clusters = getAggregates();
		return clusters.remove(clusters.size() - 1);
	}

	private GeoSegment getGeoSegment() {
		return edgeList.getGeoSegment();
	}
	
	
	
	private Collection<DefaultAssignedEntityDemand> getLocationAssignments() {
		
		
		if (incomingClusters == null || incomingClusters.size() == 0) {
			return edgeList.getAssignedEntityDemands()  ;
		} else {

			GeoSegment gs = getGeoSegment();
	
			List<DefaultAssignedEntityDemand> locations = new ArrayList<>();
	
			for (LocationCluster cluster : incomingClusters) {
				for (PinnedAssignedEntityDemand a : cluster.getLocations()) {
					DefaultAssignedEntityDemand ald = 
							new DefaultAssignedEntityDemand(a.getLocationEntity(), gs.proxyPin(0.0, a.getPinnedLocation())) ;
					locations.add(ald);
				}
			}
			
			
			//Sort Assignments By Distance from End Vertex
			//This will force Pins from connecting segments to be placed first 
			locations.sort(new Comparator<DefaultAssignedEntityDemand>() {
				@Override
				public int compare(DefaultAssignedEntityDemand o1, DefaultAssignedEntityDemand o2) {
	
					double d1 = o1.getPinnedLocation()
							.getEffectiveOffsetFromEndVertex();
					double d2 = o2.getPinnedLocation()
							.getEffectiveOffsetFromEndVertex();
	
					return d1 > d2 ? -1 : (d1 == d2) ? 0 : 1;
				}
	
			});
	
			locations.addAll(edgeList.getAssignedEntityDemands());
			return locations ;
		}

	}
	
	private List<LocationCluster> recluster() {
		return  _reclusterConstrained() ;
	}

	
	
	private List<LocationCluster> _reclusterConstrained() {

		ClusterAssembler assembler = new ClusterAssembler() ;
		
		getLocationAssignments().forEach(d -> {
			assembler.assign(d) ;
		});
		
		return assembler.flush() ;
		
	}

	@Override
	public void addIncommingCluster(LocationCluster cluster) {

		aggregates = null;

		incomingClusters.add(new RelocatedCluster(cluster.getPinnedLocation()
				.getOffsetFromEndVertex(), cluster, edgeList.getGeoSegment()
				.pinLocation(0)));

	}
	
	private class ClusterAssembler {
		
		private List<LocationCluster> clusters = new ArrayList<LocationCluster>();
		
		private FdtConstrainedAggregate currentCluster =
				new FdtConstrainedAggregate(edgeList.getGeoSegment(), thresholds);
		
		
		private void flushCluster() {
			if( !currentCluster.isEmpty() ) {
				if( currentCluster.getPinnedLocation() == null ) {
					System.out.println("Failed ") ;
				} else {
					clusters.add(currentCluster) ;
					currentCluster =
							new FdtConstrainedAggregate(edgeList.getGeoSegment(), thresholds);
				}
			}
			
		}
		
		public List<LocationCluster> flush() {
			flushCluster() ;
			return clusters ;
		}
		
		private void flushAndAssignLocation(PinnedLocation pl) {
			flushCluster(); 
			currentCluster.assignConstraint(pl) ;
		}
		
		public void assign(PinnedAssignedEntityDemand d) {
			
			if( currentCluster.isFull() ) {
				flushCluster() ;
			}
			
			if( !currentCluster.assignConstraint(d.getPinnedLocation()) ) {
				flushAndAssignLocation(d.getPinnedLocation()) ;
			}
			
			if( d.getDemand() > currentCluster.getRemainingDemand() ) {
				System.out.print("Multi Assignment ") ;
				while(d.getDemand() > currentCluster.getRemainingDemand() ) {
					System.out.print(" | ") ;
					System.out.print(d.getDemand()) ;
					
					Pair<PinnedAssignedEntityDemand> pair =  d.split(currentCluster.getRemainingDemand()) ;
					currentCluster.assign(pair.getHead()) ;
					flushAndAssignLocation(d.getPinnedLocation()) ;
					d = pair.getTail() ;
					
				}
				System.out.println("") ;
			}
			
			if( d.getDemand() > 0 ) {
				currentCluster.assign(d) ;
			}
			
		}
		
		
	}
	
	

}
