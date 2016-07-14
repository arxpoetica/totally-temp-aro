package com.altvil.aro.service.demand.impl;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.altvil.aro.service.demand.DefaultAssignedEntityDemand;
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
		return new DemandAnalysisImpl(constraints.getLocationBulkThreshhold()) ;
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
			EdgeDemandAnalyisImpl.Builder b = EdgeDemandAnalyisImpl.build();

			if (geoSegment != null) {
				geoSegment.getGeoSegmentAssignments().forEach(a -> {
					assemble(a, b);
				});
			}

			return b.build();
		}

		private void assemble(GraphEdgeAssignment locationAssignment,
				EdgeDemandAnalyisImpl.Builder builder) {

			LocationEntity entity = (LocationEntity) locationAssignment
					.getAroEntity();

			PinnedLocation pl = locationAssignment.getPinnedLocation();
			LocationDemand locationDemand = entity.getLocationDemand();

			double totalDemand = locationDemand.getAtomicUnits();

			if (totalDemand != 0) {
				
				DefaultAssignedEntityDemand ad = new DefaultAssignedEntityDemand(entity, pl, entity.getLocationDemand());

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
			
			public void addFdtDemand(DefaultAssignedEntityDemand demand) {
				demandAnalysis.fdtAssigments.add(demand) ;
			}

			public void addBulkDemand(DefaultAssignedEntityDemand demand) {
				demandAnalysis.bulkFiberAssigments.add(demand);
			}
			
			public EdgeDemand build() {
				return demandAnalysis ;
			}
		}

		private List<DefaultAssignedEntityDemand> fdtAssigments = new ArrayList<>();
		private List<DefaultAssignedEntityDemand> bulkFiberAssigments = new ArrayList<>();

		private EdgeDemandAnalyisImpl() {
			super();
		}

		public List<DefaultAssignedEntityDemand> getFdtAssigments() {
			return fdtAssigments;
		}

		public List<DefaultAssignedEntityDemand> getBulkFiberAssigments() {
			return bulkFiberAssigments;
		}

	}

}
