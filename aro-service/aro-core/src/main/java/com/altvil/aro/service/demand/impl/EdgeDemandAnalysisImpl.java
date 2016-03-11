package com.altvil.aro.service.demand.impl;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.altvil.aro.service.demand.AssignedEntityDemand;
import com.altvil.aro.service.demand.DemandAnalyizer;
import com.altvil.aro.service.demand.EdgeDemand;
import com.altvil.aro.service.demand.EntityDemandService;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;

@Service
public class EdgeDemandAnalysisImpl implements EntityDemandService {

	

	@Override
	public DemandAnalyizer createDemandAnalyizer(FtthThreshholds constraints) {
		return new DemandAnalysisImpl(0) ;
	}

	private class DemandAnalysisImpl implements DemandAnalyizer {

		// private FtthThreshholds constraints;
		private double bulkFiberThreshold;
		
		public DemandAnalysisImpl(double bulkFiberThreshold) {
			super();
			this.bulkFiberThreshold = bulkFiberThreshold;
		}
		

		@Override
		public EdgeDemand createDemandAnalyis(GeoSegment geoSegment) {
			EdgeDemandAnalyisImpl.Builder b = EdgeDemandAnalyisImpl.build() ;
			
			geoSegment.getGeoSegmentAssignments().forEach(a -> {
				assemble(a, b) ;
			});
			return b.build() ;
		}


		private void assemble(GraphEdgeAssignment locationAssignment,
				EdgeDemandAnalyisImpl.Builder builder) {

			LocationEntity entity = (LocationEntity) locationAssignment
					.getAroEntity();

			PinnedLocation pl = locationAssignment.getPinnedLocation();
			LocationDemand locationDemand = entity.getLocationDemand();

			double totalDemand = locationDemand.getTotalDemand();

			if (totalDemand != 0) {

				AssignedEntityDemand ad = new AssignedEntityDemand(entity, pl);

				if (totalDemand >= bulkFiberThreshold) {
					builder.addBulkDemand(ad);
				} else {
					builder.addFdtDemand(ad);
				}
			}

		}
	}

	private static class EdgeDemandAnalyisImpl implements EdgeDemand {

		public static Builder build() {
			return new Builder() ;
		}
		
		public static class Builder {
			
			private EdgeDemandAnalyisImpl demandAnalysis = new EdgeDemandAnalyisImpl() ;
			
			public void addFdtDemand(AssignedEntityDemand demand) {
				demandAnalysis.fdtAssigments.add(demand) ;
			}

			public void addBulkDemand(AssignedEntityDemand demand) {
				demandAnalysis.bulkFiberAssigments.add(demand);
			}
			
			public EdgeDemand build() {
				return demandAnalysis ;
			}
		}

		private List<AssignedEntityDemand> fdtAssigments = new ArrayList<>();
		private List<AssignedEntityDemand> bulkFiberAssigments = new ArrayList<>();

		private EdgeDemandAnalyisImpl() {
			super();
		}

		public List<AssignedEntityDemand> getFdtAssigments() {
			return fdtAssigments;
		}

		public List<AssignedEntityDemand> getBulkFiberAssigments() {
			return bulkFiberAssigments;
		}

	}

}
