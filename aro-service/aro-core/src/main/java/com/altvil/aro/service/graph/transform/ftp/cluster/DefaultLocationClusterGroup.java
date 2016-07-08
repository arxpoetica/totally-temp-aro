package com.altvil.aro.service.graph.transform.ftp.cluster;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
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

	private static final Logger log = LoggerFactory
			.getLogger(DefaultLocationClusterGroup.class.getName());

	public static LocationClusterGroup create(EdgeList edgeList,
			FtthThreshholds thresholds) {
		return new DefaultLocationClusterGroup(edgeList, thresholds,
				thresholds.isClusterMergingSupported());
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
		return supportsIncomingCluster && edgeList != null;
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
			return edgeList.getAssignedEntityDemands();
		} else {

			GeoSegment gs = getGeoSegment();

			List<DefaultAssignedEntityDemand> locations = new ArrayList<>();

			for (LocationCluster cluster : incomingClusters) {
				for (PinnedAssignedEntityDemand a : cluster.getLocations()) {
					DefaultAssignedEntityDemand ald = new DefaultAssignedEntityDemand(
							a.getLocationEntity(), gs.proxyPin(0.0,
									a.getPinnedLocation()));
					locations.add(ald);
				}
			}

			// Sort Assignments By Distance from End Vertex
			// This will force Pins from connecting segments to be placed first
			locations.sort(new Comparator<DefaultAssignedEntityDemand>() {
				@Override
				public int compare(DefaultAssignedEntityDemand o1,
						DefaultAssignedEntityDemand o2) {

					double d1 = o1.getPinnedLocation()
							.getEffectiveOffsetFromEndVertex();
					double d2 = o2.getPinnedLocation()
							.getEffectiveOffsetFromEndVertex();

					return d1 > d2 ? -1 : (d1 == d2) ? 0 : 1;
				}

			});

			locations.addAll(edgeList.getAssignedEntityDemands());
			return locations;
		}

	}

	private List<LocationCluster> recluster() {
		return _reclusterConstrained();
	}

	private List<LocationCluster> _reclusterConstrained() {

		ClusterAssembler assembler = new ClusterAssembler();
		
		Collection<DefaultAssignedEntityDemand> assinged = getLocationAssignments() ;
		
		assinged.forEach(d -> {
			assembler.assign(d);
		});

		return assembler.flush();

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

		private FdtConstrainedAggregate currentCluster = new FdtConstrainedAggregate(
				edgeList.getGeoSegment(), thresholds);

		private void flushCluster() {
			if (!currentCluster.isEmpty()) {
				if (currentCluster.getPinnedLocation() == null) {
					log.error("Failed to assign pin to Cluster");
				} else {
					
					if( currentCluster.getRemainingDemand() >= 6 ) {
						log.trace("assigned locations = " + currentCluster.getLocations().size() + " " + currentCluster.getRemainingDemand()) ;
					}
					
					
					clusters.add(currentCluster);
					currentCluster = new FdtConstrainedAggregate(
							edgeList.getGeoSegment(), thresholds);
				}
			}

		}

		public List<LocationCluster> flush() {
			flushCluster();
			return clusters;
		}

		private void flushAndAssignLocation(PinnedLocation pl) {
			flushCluster();
			currentCluster.assignConstraint(pl);
		}

		private Collection<PinnedAssignedEntityDemand> split(double maxDemand,
				double remainder, PinnedAssignedEntityDemand d) {
			if (d.getAtomicUnits() < remainder) {
				return Collections.singleton(d);
			}

			List<PinnedAssignedEntityDemand> result = new ArrayList<>();

			Pair<PinnedAssignedEntityDemand> pair = d.split(remainder);
			result.add(pair.getHead());
			d = pair.getTail();

			while (d.getAtomicUnits() > maxDemand) {
				pair = d.split(maxDemand);
				result.add(pair.getHead());
				d = pair.getTail();
			}

			if (d.getAtomicUnits() > 0) {
				result.add(d);
			}

			return result;
		}

		private String toDebugInfo(
				Collection<PinnedAssignedEntityDemand> demands) {
			StringBuffer sb = new StringBuffer();

			sb.append("Summed Demand = ");
			sb.append(demands.stream().mapToDouble(d -> d.getAtomicUnits()).sum());
			int index = 0;
			sb.append(" => ");
			for (PinnedAssignedEntityDemand pd : demands) {
				if (index++ > 0) {
					sb.append(", ");
				}
				sb.append(pd.getDemand());
			}

			return sb.toString();
		}

		public void assign(PinnedAssignedEntityDemand d) {

			if( currentCluster.isFull() ) {
				flushCluster();
			}
			
			if( !currentCluster.assignConstraint(d.getPinnedLocation())) {
				flushCluster();
			}
			

			if (d.getAtomicUnits() > currentCluster.getRemainingDemand()) {
				Collection<PinnedAssignedEntityDemand> demands = split(
						thresholds.getMaxlocationPerFDT(),
						currentCluster.getRemainingDemand(), d);
				if (log.isTraceEnabled()) {
					log.trace("Overflowed Demand " + d.getAtomicUnits()
							+ " remainder =  "
							+ currentCluster.getRemainingDemand() + " .... "
							+ toDebugInfo(demands));
				}

				for (PinnedAssignedEntityDemand pd : demands) {

					currentCluster.assignConstraint(pd.getPinnedLocation()) ;
					currentCluster.assign(pd);

					if (currentCluster.isFull()) {
						flushCluster();
					}
				}

			} else {

				//Temp Fix For Alberto
				if( currentCluster.getPinnedLocation() == null ) {
					currentCluster.assignConstraint(d.getPinnedLocation()) ;
				}
				currentCluster.assign(d);
			}

			/*
			 * if( !currentCluster.assignConstraint(d.getPinnedLocation()) ) {
			 * flushAndAssignLocation(d.getPinnedLocation()) ; }
			 *
			 * StringBuffer sb = new StringBuffer() ;
			 *
			 * if( d.getDemand() > currentCluster.getRemainingDemand() ) {
			 * sb.append("Multi Assignment ") ; sb.append(d.getDemand()) ;
			 * sb.append(" ===> ") ; while(d.getDemand() >
			 * currentCluster.getRemainingDemand() ) { sb.append(" | ") ;
			 * sb.append(d.getDemand()) ;
			 *
			 * Pair<PinnedAssignedEntityDemand> pair =
			 * d.split(currentCluster.getRemainingDemand()) ;
			 * currentCluster.assign(pair.getHead()) ;
			 * flushAndAssignLocation(d.getPinnedLocation()) ; d =
			 * pair.getTail() ;
			 *
			 * } sb.append(" remainder = ") ; sb.append(d.getDemand()) ;
			 * sb.append("\n") ; log.info(sb.toString()) ; }
			 *
			 *
			 * if( d.getDemand() > 0 ) {
			 *
			 * currentCluster.assign(d) ; }
			 */

		}

	}

}
