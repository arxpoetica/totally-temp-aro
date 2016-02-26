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
import com.altvil.aro.service.network.NetworkService;
import com.altvil.aro.service.plan.impl.PlanServiceImpl;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;
import com.altvil.interfaces.RoadLocation;
import com.altvil.utils.GeometryUtil;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.io.ParseException;

@Service
public class NetworkServiceImpl implements NetworkService {

	private static final Logger log = LoggerFactory
			.getLogger(NetworkServiceImpl.class.getName());

	
	@Autowired
	private NetworkPlanRepository planRepository;

	private EntityFactory entityFactory = EntityFactory.FACTORY;

	
	@Override
	public NetworkData getNetworkData(int planId) {

		NetworkData networkData = new NetworkData();

		NetworkRequest networkRequest = createRequest(planId);
		networkData.setFiberSources(getFiberSources(networkRequest));
		networkData.setRoadLocations(getLocations(networkRequest));
		networkData.setRoadEdges(getRoadEdges(networkRequest));

		return networkData;
	}

	private NetworkRequest createRequest(int jobId) {
		return null;
	}

	private static long toLong(Object object) {
		return ((Number) object).longValue();
	}

	private static Point toPoint(Object value) throws ParseException {
		return (Point) GeometryUtil.toGeometry(value.toString());
	}

	private static double toDouble(Object value) {
		return ((Number) value).doubleValue();
	}

	private Collection<NetworkAssignment> toValidAssignments(
			Stream<NetworkAssignment> stream) {
		return stream.filter((na) -> na != null).collect(Collectors.toList());
	}

	private Collection<NetworkAssignment> getLocations(
			NetworkRequest networkRequest) {

		return toValidAssignments(planRepository
				.queryLinkedLocations(networkRequest.getPlanId())
				.stream()
				.map(result -> {
					try {

						long tlid = toLong(result.get(2));

						AroEntity aroEntity = entityFactory
								.createLocationEntity(toLong(result.get(0)),
										toLong(tlid), CoverageFactory.FACTORY.getDefaultCoverage());

						RoadLocation rl = RoadLocationImpl
								.build()
								.setTlid(tlid)
								.setLocationPoint(toPoint(result.get(3)))
								.setRoadSegmentPositionRatio(
										toDouble(result.get(4)))
								.setRoadSegmentClosestPoint(
										toPoint(result.get(5)))
								.setDistanceFromRoadSegmentInMeters(toDouble(6))
								.build();

						return new DefaultNetworkAssignment(aroEntity, rl);
					} catch (Throwable err) {
						log.error(err.getMessage(), err);
						return null;
					}
				}));
	}

	private Collection<NetworkAssignment> getFiberSources(
			NetworkRequest networkRequest) {
		planRepository.querySourceLocations(networkRequest.getPlanId());
		return toValidAssignments(
				planRepository.querySourceLocations(networkRequest.getPlanId())
				.stream()
				.map(result -> {
					try {

						long tlid = toLong(result.get(2));

						AroEntity aroEntity = entityFactory
								.createLocationEntity(toLong(result.get(0)),
										toLong(tlid), CoverageFactory.FACTORY.getDefaultCoverage());

						RoadLocation rl = RoadLocationImpl
								.build()
								.setTlid(tlid)
								.setLocationPoint(toPoint(result.get(3)))
								.setRoadSegmentPositionRatio(
										toDouble(result.get(4)))
								.setRoadSegmentClosestPoint(
										toPoint(result.get(5)))
								.setDistanceFromRoadSegmentInMeters(toDouble(6))
								.build();

						return new DefaultNetworkAssignment(aroEntity, rl);
					} catch (Throwable err) {
						log.error(err.getMessage(), err);
						return null;
					}
				}));
	}

	private Collection<RoadEdge> getRoadEdges(NetworkRequest networkRequest) {
		planRepository.queryRoadEdgesbyPlanId(networkRequest.getPlanId());
		return null;
	}
	
	private static class CoverageAggregateStatisticImpl implements CoverageAggregateStatistic {

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

	private static class NetworkRequest {

		public long getPlanId() {
			return 0;
		}

	}

}
