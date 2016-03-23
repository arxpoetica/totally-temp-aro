package com.altvil.aro.service.graph.transform.ftp.cluster;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.demand.AssignedEntityDemand;
import com.altvil.aro.service.graph.segment.GeoSegment;
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
	
	
	
	private Collection<AssignedEntityDemand> getLocationAssignments() {
		
		LocationDemandBuilder b = new LocationDemandBuilder() ;
		
		if (incomingClusters == null || incomingClusters.size() == 0) {
			b.addAll(edgeList.getAssignedEntityDemands()) ;
		} else {

			GeoSegment gs = getGeoSegment();
	
			List<AssignedEntityDemand> locations = new ArrayList<>();
	
			for (LocationCluster cluster : incomingClusters) {
				for (AssignedEntityDemand a : cluster.getLocations()) {
					AssignedEntityDemand ald = 
							new AssignedEntityDemand(a.getLocationEntity(), gs.proxyPin(0.0, a.getPinnedLocation())) ;
					locations.add(ald);
				}
			}
			
			
			//Sort Assignments By Distance from End Vertex
			//This will force Pins from connecting segments to be placed first 
			locations.sort(new Comparator<AssignedEntityDemand>() {
				@Override
				public int compare(AssignedEntityDemand o1, AssignedEntityDemand o2) {
	
					double d1 = o1.getPinnedLocation()
							.getEffectiveOffsetFromEndVertex();
					double d2 = o2.getPinnedLocation()
							.getEffectiveOffsetFromEndVertex();
	
					return d1 > d2 ? -1 : (d1 == d2) ? 0 : 1;
				}
	
			});
	
			locations.addAll(edgeList.getAssignedEntityDemands());
			b.addAll(locations);
		}

		return b.build() ;

	}
	
	private List<LocationCluster> recluster() {
		return  _reclusterConstrained() ;
	}

	
	
	private List<LocationCluster> _reclusterConstrained() {

		List<LocationCluster> clusters = new ArrayList<LocationCluster>();

		FdtConstrainedAggregate la =
				new FdtConstrainedAggregate(edgeList.getGeoSegment(), thresholds);

		for (AssignedEntityDemand li : getLocationAssignments()) {
			
			if (!la.add(li)) {
				clusters.add(la);
				la = new FdtConstrainedAggregate(edgeList.getGeoSegment(), thresholds);
				la.add(li) ;
			}
		}

		if (!la.isEmpty()) {
			clusters.add(la);
		}

		return clusters;
	}

	@Override
	public void addIncommingCluster(LocationCluster cluster) {

		aggregates = null;

		incomingClusters.add(new RelocatedCluster(cluster.getPinnedLocation()
				.getOffsetFromEndVertex(), cluster, edgeList.getGeoSegment()
				.pinLocation(0)));

	}
	
	private  class LocationDemandBuilder {
		
		private List<AssignedEntityDemand> result = new ArrayList<>() ;
		
		public void addAll(Collection<AssignedEntityDemand> demands) {
			for(AssignedEntityDemand d : demands) {
				add(d) ;
			}
		}
		
		public void add(AssignedEntityDemand demand) {
			if( demand.getTotalDemand() > thresholds.getMaxlocationPerFDT() ) {
				result.addAll(demand.split( thresholds.getMaxlocationPerFDT())) ;
			} else {
				result.add(demand) ;
			}
			
		}
		
		public List<AssignedEntityDemand> build() {
			return result ;
		}
		
	}

}
