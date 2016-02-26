package com.altvil.aro.service.network.impl;

import java.util.Collection;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.NetworkPlanRepository;
import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.CoverageAggregateStatistic;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.network.NetworkRequest;
import com.altvil.aro.service.network.NetworkService;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;
import com.altvil.interfaces.RoadLocation;

@Service
public class NetworkServiceImpl implements NetworkService {

	private static final Logger log = LoggerFactory
			.getLogger(NetworkServiceImpl.class.getName());

	
	@Autowired
	private NetworkPlanRepository planRepository;

	private EntityFactory entityFactory = EntityFactory.FACTORY;

	
	@Override
	public NetworkData getNetworkData(NetworkRequest networkRequest) {

		NetworkData networkData = new NetworkData();

		networkData.setFiberSources(getFiberSources(networkRequest));
		networkData.setRoadLocations(getLocations(networkRequest));
		networkData.setRoadEdges(getRoadEdges(networkRequest));

		return networkData;
	}

	

	private Collection<NetworkAssignment> toValidAssignments(
			Stream<NetworkAssignment> stream) {
		return stream.filter((na) -> na != null).collect(Collectors.toList());
	}

	private enum LocationMap {
		id, gid, tlid, point, ratio, intersect_point, distance 
	}
	
	private Collection<NetworkAssignment> getLocations(
			NetworkRequest networkRequest) {

		return toValidAssignments(planRepository
				.queryLinkedLocations(networkRequest.getPlanId())
				.stream()
				.map(result -> {
					try {

						long tlid = ConversionUtil.asLong(result.get(LocationMap.tlid.ordinal()));

						AroEntity aroEntity = entityFactory
								.createLocationEntity(ConversionUtil.asLong(result.get(LocationMap.id.ordinal())),
										ConversionUtil.asLong(tlid), CoverageFactory.FACTORY.getDefaultCoverage());

						RoadLocation rl = RoadLocationImpl
								.build()
								.setTlid(tlid)
								.setLocationPoint(ConversionUtil.asPoint(result.get(LocationMap.point.ordinal())))
								.setRoadSegmentPositionRatio(
										ConversionUtil.asDouble(result.get(LocationMap.ratio.ordinal())))
								.setRoadSegmentClosestPoint(
										ConversionUtil.asPoint(result.get(LocationMap.intersect_point.ordinal())))
								.setDistanceFromRoadSegmentInMeters(ConversionUtil.asDouble(LocationMap.distance.ordinal()))
								.build();

						return new DefaultNetworkAssignment(aroEntity, rl);
					} catch (Throwable err) {
						log.error(err.getMessage(), err);
						return null;
					}
				}));
	}
	
	private AroEntity createAroNetworkNode(long id, int type) {
		return entityFactory.createCentralOfficeEquipment(id) ;
	}

	
	private enum FiberSourceMap {
		id, gid, tlid, point, ratio, intersect_point, distance, node_type 
	}
	
	private Collection<NetworkAssignment> getFiberSources(
			NetworkRequest networkRequest) {
		planRepository.querySourceLocations(networkRequest.getPlanId());
		return toValidAssignments(
				planRepository.querySourceLocations(networkRequest.getPlanId())
				.stream()
				.map(result -> {
					try {

						long tlid = ConversionUtil.asLong(result.get(FiberSourceMap.tlid.ordinal()));

						AroEntity aroEntity = createAroNetworkNode(ConversionUtil.asLong(result.get(0)), ConversionUtil.asInteger(result.get(7))) ;
						RoadLocation rl = RoadLocationImpl
								.build()
								.setTlid(tlid)
								.setLocationPoint(ConversionUtil.asPoint(result.get(FiberSourceMap.point.ordinal())))
								.setRoadSegmentPositionRatio(
										ConversionUtil.asDouble(result.get(FiberSourceMap.ratio.ordinal())))
								.setRoadSegmentClosestPoint(
										ConversionUtil.asPoint(result.get(FiberSourceMap.intersect_point.ordinal())))
								.setDistanceFromRoadSegmentInMeters(ConversionUtil.asDouble(FiberSourceMap.distance.ordinal()))
								.build();

						return new DefaultNetworkAssignment(aroEntity, rl);
					} catch (Throwable err) {
						log.error(err.getMessage(), err);
						return null;
					}
				}));
	}

	
	private enum  RoadEdgeMap {
		gid, tlid, tnidf, tnidt, shape, edge_length
	}
	
	private Collection<RoadEdge> getRoadEdges(NetworkRequest networkRequest) {
		planRepository.queryRoadEdgesbyPlanId(networkRequest.getPlanId()).stream().map(result -> {
			try {
				return new RoadEdgeImpl(
						ConversionUtil.asLong(result.get(RoadEdgeMap.tlid.ordinal())),
						ConversionUtil.asLong(result.get(RoadEdgeMap.tlid.ordinal())), 
						ConversionUtil.asLong(result.get(RoadEdgeMap.tlid.ordinal())), 
						ConversionUtil.asGeometry(result.get(RoadEdgeMap.shape.ordinal())), 
						ConversionUtil.asDouble(result.get(RoadEdgeMap.tlid.ordinal()))) ;
			} catch (Exception err) {
				log.error(err.getMessage(), err);
				return null;
			}
		});
		return null;
	}
	
	private static class CoverageAggregateStatisticImpl implements CoverageAggregateStatistic {

		/**
		 * 
		 */
		private static final long serialVersionUID = 1L;
		private double demand ;
		
		public CoverageAggregateStatisticImpl(double demand) {
			super();
			this.demand = demand;
		}

		@Override
		public double getFiberDemand() {
			return demand ;
		}

		@Override
		public double getScore(double capex) {
			return capex ;
		}

		@Override
		public void add(CoverageAggregateStatistic other) {
		}

		@Override
		public double getMonthlyCashFlowImpact() {
			return 0 ;
		}

		@Override
		public double getDemandCoverage() {
			return demand ;
		}
		
	}

	private static class CoverageFactory {
		
		private static CoverageFactory FACTORY = new CoverageFactory() ;
		
		private CoverageAggregateStatistic defaultCoverage = new CoverageAggregateStatisticImpl(1.0) ;
		
		public CoverageAggregateStatistic getDefaultCoverage() {
			return defaultCoverage ;
		}

	}

	

}
