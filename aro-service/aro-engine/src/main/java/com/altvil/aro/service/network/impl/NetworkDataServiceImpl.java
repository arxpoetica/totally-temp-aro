package com.altvil.aro.service.network.impl;

import java.util.Collection;
import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.demand.AroDemandService;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.demand.mapping.CompetitiveDemandMapping;
import com.altvil.aro.service.demand.mapping.CompetitiveLocationDemandMapping;
import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.network.AnalysisSelectionMode;
import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.network.NetworkDataService;
import com.altvil.aro.service.network.ServiceAreaContext;
import com.altvil.aro.service.plan.NetworkAssignmentModelFactory;
import com.altvil.interfaces.CableConduitEdge;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.NetworkAssignmentModel;
import com.altvil.interfaces.NetworkAssignmentModel.SelectionFilter;
import com.altvil.interfaces.RoadLocation;

@Service
public class NetworkDataServiceImpl implements NetworkDataService {

	// private NetworkDataLoader networkDataLoader ;

	@SuppressWarnings("unused")
	private static final Logger LOG = LoggerFactory
			.getLogger(NetworkDataServiceImpl.class.getName());

	private NetworkQueryService networkDataDAO;
	private AroDemandService aroDemandService;

	private EntityFactory entityFactory = EntityFactory.FACTORY;

	// private Map<Integer, CableConstructionEnum> cableConstructionEnumMap;

	@Autowired
	public NetworkDataServiceImpl(NetworkQueryService networkDataDAO,
			AroDemandService aroDemandService) {
		super();
		this.networkDataDAO = networkDataDAO;
		this.aroDemandService = aroDemandService;
	}

	@Override
	public NetworkData getNetworkData(NetworkDataRequest request) {

		NetworkData networkData = new NetworkData();

		ServiceAreaContext ctx = networkDataDAO.getServiceAreaContext(request
				.getServiceAreaId().get());

		Map<Long, CompetitiveLocationDemandMapping> demandByLocationIdMap = getLocationDemand(
				request, ctx);

		networkData.setCompetitiveDemandMapping(new CompetitiveDemandMapping(
				demandByLocationIdMap));

		// TODO Simplify Locations
		networkData.setRoadLocations(getNetworkLocations(request,
				demandByLocationIdMap, ctx));

		networkData.setFiberSources(networkDataDAO.queryFiberSources(
				request.getPlanId(), ctx));
		networkData.setRoadEdges(networkDataDAO.getRoadEdges(
				request.getServiceAreaId().get(), ctx).getRoadEdges());
		networkData.setCableConduitEdges(queryCableConduitEdges(request));

		return networkData;
	}

	private NetworkAssignmentModel getNetworkLocations(
			NetworkDataRequest request,
			Map<Long, CompetitiveLocationDemandMapping> demandByLocationIdMap,
			ServiceAreaContext ctx) {

		Map<Long, RoadLocation> roadLocationByLocationIdMap = getRoadLocationNetworkLocations(
				request, ctx);

		return networkAssignmentModel(
				createTransform(request.getLocationEntities(),
						demandByLocationIdMap, roadLocationByLocationIdMap),
				roadLocationByLocationIdMap.keySet(),
				() -> networkDataDAO.selectedRoadLocationIds(
						request.getPlanId(), roadLocationByLocationIdMap),
				request.getSelectionMode(), request.getSelectionFilters());
	}

	private class NetworkAssignmentModelBuilder {
		
		private NetworkDataRequest request;
		private ServiceAreaContext ctx;
		private Map<Long, CompetitiveLocationDemandMapping> demandByLocationIdMap;

		public NetworkAssignmentModelBuilder setNetworkDataRequest(
				NetworkDataRequest request) {
			this.request = request;
			return this;
		}

		public NetworkAssignmentModelBuilder setServiceAreaContext(
				ServiceAreaContext ctx) {
			this.ctx = ctx;
			return this;
		}

		private Map<Long, RoadLocation> getRoadLocationNetworkLocations() {
			return networkDataDAO.queryRoadLocations(
					request.getServiceAreaId().get(), ctx).getId2location();
		}

		public NetworkAssignmentModelBuilder setDemandMapping(
				Map<Long, CompetitiveLocationDemandMapping> demandByLocationIdMap) {
			this.demandByLocationIdMap = demandByLocationIdMap;
			return this;
		}

		private Collection<Long> getAllLocationIds() {
			return demandByLocationIdMap.keySet();
		}

		// TODO KAMIL (Please simplify networkDataDAO.selectedRoadLocationIds.
		// should only return locations ids)
		private Set<Long> getSelectedLocationIds() {
			networkDataDAO.selectedRoadLocationIds(request.getPlanId());
		}

		private Function<Long, NetworkAssignment> createTransform(
				Map<Long, RoadLocation> roadLocationByLocationIdMap) {

			Set<LocationEntityType> locationEntities = request
					.getLocationEntities();

			return (locationId) -> {
				CompetitiveLocationDemandMapping ldm = demandByLocationIdMap
						.get(locationId);
				if (ldm != null && !ldm.isEmpty()) {
					LocationDemand locationDemand = aroDemandService
							.createFairShareDemandMapping(ldm)
							.getFairShareLocationDemand(SpeedCategory.cat7)
							.createLocationDemand(ldm);

					AroEntity aroEntity = entityFactory.createLocationEntity(
							locationEntities, locationId, ldm.getBlockId(),
							ldm.getCompetitiveStrength(), locationDemand);

					return new DefaultNetworkAssignment(aroEntity,
							roadLocationByLocationIdMap.get(locationId));
				}
				return null;
			};
		}

		public NetworkAssignmentModel build() {

			return TransformerFactory.TRANSFORMER.createTransformer(
					request.getSelectionMode(), request.getSelectionFilters())
					.transform(getAllLocationIds(),
							() -> getSelectedLocationIds(),
							createTransform(getRoadLocationNetworkLocations()));

		}

	}

	private interface Transformer {
		public NetworkAssignmentModel transform(
				Collection<Long> allLocationIds,
				Supplier<Set<Long>> selectedIds,
				Function<Long, NetworkAssignment> f);
	}

	private static class TransformerFactory {

		public static final TransformerFactory TRANSFORMER = new TransformerFactory();

		private Map<AnalysisSelectionMode, Map<Set<SelectionFilter>, Strategy>> map = new EnumMap<>(
				AnalysisSelectionMode.class);

		private TransformerFactory() {
			for (AnalysisSelectionMode am : AnalysisSelectionMode.values()) {
				map.put(am, new HashMap<>());
			}
			init();
		}

		public Transformer createTransformer(
				AnalysisSelectionMode analysisMode, Set<SelectionFilter> filters) {
			return new TransformContext(map.get(analysisMode).get(filters));
		}

		private static class TransformContext implements Transformer {

			private Strategy strategy;

			private Collection<Long> allLocationIds;
			private Supplier<Set<Long>> selectedIds;
			private Function<Long, NetworkAssignment> f;

			private Map<SelectionFilter, Collection<NetworkAssignment>> map = new EnumMap<>(
					SelectionFilter.class);

			public TransformContext(Strategy strategy) {
				super();
				this.strategy = strategy;
			}

			@Override
			public NetworkAssignmentModel transform(
					Collection<Long> allLocationIds,
					Supplier<Set<Long>> selectedIds,
					Function<Long, NetworkAssignment> f) {
				this.allLocationIds = allLocationIds;
				this.selectedIds = selectedIds;
				this.f = f;

				strategy.assemble(this);

				// TODO wire up return new NetworkAssignmentModel(map) ;
				return null;
			}

			public Collection<NetworkAssignment> getNetworkAssignment(
					SelectionFilter filter) {
				return map.get(filter);
			}

			public TransformContext assign(SelectionFilter filter,
					Collection<NetworkAssignment> assignments) {
				map.put(filter, assignments);
				return this;
			}

			public Collection<NetworkAssignment> toNetworkAssignments(
					Collection<Long> ids) {
				return ids.stream().map(f).filter(na -> na != null)
						.collect(Collectors.toList());
			}

			public Collection<Long> getAllIds() {
				return allLocationIds;
			}

			public Set<Long> getSelectedIds() {
				return selectedIds.get();
			}

		}

		private interface Strategy {
			public TransformContext assemble(TransformContext ctx);
		}

		private void register(AnalysisSelectionMode selectionMode,
				Set<SelectionFilter> filters, Strategy strategy) {
			map.get(selectionMode).put(filters, strategy);
		}

		private void init() {

			register(AnalysisSelectionMode.SELECTED_LOCATIONS,
					EnumSet.of(SelectionFilter.SELECTED), new Strategy() {
						@Override
						public TransformContext assemble(TransformContext ctx) {
							return ctx.assign(SelectionFilter.SELECTED, ctx
									.toNetworkAssignments(ctx.getSelectedIds()));
						}
					});

			register(AnalysisSelectionMode.SELECTED_LOCATIONS,
					EnumSet.of(SelectionFilter.ALL), new Strategy() {
						@Override
						public TransformContext assemble(TransformContext ctx) {
							return ctx.assign(SelectionFilter.ALL,
									ctx.toNetworkAssignments(ctx.getAllIds()));
						}
					});

			register(AnalysisSelectionMode.SELECTED_LOCATIONS,
					EnumSet.of(SelectionFilter.ALL, SelectionFilter.SELECTED),
					new Strategy() {
						@Override
						public TransformContext assemble(TransformContext ctx) {
							Set<Long> ids = ctx.getSelectedIds();
							return ctx
									.assign(SelectionFilter.ALL,
											ctx.toNetworkAssignments(ctx
													.getAllIds()))
									.assign(SelectionFilter.SELECTED,
											ctx.getNetworkAssignment(
													SelectionFilter.ALL)
													.stream()
													.filter(na -> ids
															.contains(na
																	.getSource()
																	.getObjectId()))
													.collect(
															Collectors.toList()));

						}
					});

			register(AnalysisSelectionMode.SELECTED_AREAS,
					EnumSet.of(SelectionFilter.SELECTED), new Strategy() {
						@Override
						public TransformContext assemble(TransformContext ctx) {
							return ctx.assign(SelectionFilter.SELECTED,
									ctx.toNetworkAssignments(ctx.getAllIds()));
						}
					});
			register(AnalysisSelectionMode.SELECTED_AREAS,
					EnumSet.of(SelectionFilter.ALL), new Strategy() {
						@Override
						public TransformContext assemble(TransformContext ctx) {
							return ctx.assign(SelectionFilter.ALL,
									ctx.toNetworkAssignments(ctx.getAllIds()));
						}
					});

			register(AnalysisSelectionMode.SELECTED_AREAS,
					EnumSet.of(SelectionFilter.ALL, SelectionFilter.SELECTED),
					new Strategy() {
						@Override
						public TransformContext assemble(TransformContext ctx) {
							return ctx
									.assign(SelectionFilter.ALL,
											ctx.toNetworkAssignments(ctx
													.getAllIds()))
									.assign(SelectionFilter.SELECTED,
											ctx.getNetworkAssignment(SelectionFilter.ALL));
						}
					});
		}

	}

	Function<Long, NetworkAssignment> createTransform(
			Set<LocationEntityType> locationEntities,
			Map<Long, CompetitiveLocationDemandMapping> demandByLocationIdMap,
			Map<Long, RoadLocation> roadLocationByLocationIdMap) {
		return (locationId) -> {
			CompetitiveLocationDemandMapping ldm = demandByLocationIdMap
					.get(locationId);
			if (ldm != null && !ldm.isEmpty()) {
				LocationDemand locationDemand = aroDemandService
						.createFairShareDemandMapping(ldm)
						.getFairShareLocationDemand(SpeedCategory.cat7)
						.createLocationDemand(ldm);

				AroEntity aroEntity = entityFactory.createLocationEntity(
						locationEntities, locationId, ldm.getBlockId(),
						ldm.getCompetitiveStrength(), locationDemand);

				return new DefaultNetworkAssignment(aroEntity,
						roadLocationByLocationIdMap.get(locationId));
			}
			return null;
		};
	}

	private NetworkAssignmentModel networkAssignmentModel(
			Function<Long, NetworkAssignment> transform,
			Set<Long> allLocationIds,
			Supplier<List<Long>> selectedLocationsSupplier,
			AnalysisSelectionMode selectionMode,
			Set<NetworkAssignmentModel.SelectionFilter> selectionFilters) {
		NetworkAssignmentModel.Builder factory = new NetworkAssignmentModelFactory();

		return getSelectionStrategy(selectionMode).getFilterSelectionStrategy(
				selectionFilters).getAssignmentModel(transform);

		roadLocationByLocationIdMap
				.keySet()
				.stream()
				.forEach(
						locationId -> {
							factory.add(transform.apply(locationId),
									selectedLocationsSupplier
											.contains(locationId));
						});

		return factory.build();
	}

	private Map<Long, CompetitiveLocationDemandMapping> getLocationDemand(
			NetworkDataRequest networkConfiguration, ServiceAreaContext ctx) {

		return networkDataDAO
				.queryLocationDemand(
						networkConfiguration.getSelectionMode() == AnalysisSelectionMode.SELECTED_LOCATIONS,
						networkConfiguration.getLocationEntities(),
						networkConfiguration.getServiceAreaId().get(),
						networkConfiguration.getPlanId(),
						networkConfiguration.getYear(),
						networkConfiguration.getMrc(), ctx);

	}

	private Map<Long, RoadLocation> getRoadLocationNetworkLocations(
			NetworkDataRequest networkConfiguration, ServiceAreaContext ctx) {
		return networkDataDAO.queryRoadLocations(
				networkConfiguration.getServiceAreaId().get(), ctx)
				.getId2location();
	}

	// private Collection<RoadEdge> getRoadEdges(
	// NetworkDataRequest networkConfiguration, ServiceAreaContext ctx) {
	// return networkDataDAO
	// .getRoadEdges(networkConfiguration.getServiceAreaId().get(), ctx)
	// .getRoadEdges();
	// }

	// private enum ConduitEdgeMap implements OrdinalAccessor {
	// gid, constructionType, startRatio, endRatio
	// }

	private Collection<CableConduitEdge> queryCableConduitEdges(
			NetworkDataRequest networkConfiguration) {
		Collection<CableConduitEdge> existing = queryExistingCableConduitEdges(networkConfiguration);

		if (networkConfiguration.isQueryPlanConduit()) {
			existing.addAll(queryPlanConditEdges(networkConfiguration));
		}

		return existing;
	}

	private Collection<CableConduitEdge> queryPlanConditEdges(
			NetworkDataRequest networkConfiguration) {
		return networkDataDAO.queryPlanConditEdges(networkConfiguration
				.getPlanId());

	}

	private Collection<CableConduitEdge> queryExistingCableConduitEdges(
			NetworkDataRequest networkConfiguration) {
		return networkDataDAO
				.queryExistingCableConduitEdges(networkConfiguration
						.getServiceAreaId().get());

	}

	// private class LocationDemandAnalysisImpl implements
	// LocationDemandAnalysis {
	//
	// private Map<Long, CompetitiveLocationDemandMapping>
	// locationDemandMappingMap;
	// private LocationDemand selectedDemand;
	//
	// private Map<SpeedCategory, LocationDemand> locationDemandMap = new
	// EnumMap<>(
	// SpeedCategory.class);
	//
	// @Override
	// public CompetitiveDemandMapping getCompetitiveDemandMapping() {
	// return new CompetitiveDemandMapping(locationDemandMappingMap);
	// }
	//
	// public LocationDemandAnalysisImpl(
	// Map<Long, CompetitiveLocationDemandMapping> locationDemandMappingMap,
	// LocationDemand selectedDemand) {
	// super();
	// this.locationDemandMappingMap = locationDemandMappingMap;
	// this.selectedDemand = selectedDemand;
	// }
	//
	// @Override
	// public LocationDemand getSelectedDemand() {
	// return selectedDemand;
	// }
	//
	// @Override
	// public LocationDemand getLocationDemand(SpeedCategory speedCategory) {
	// LocationDemand ld = locationDemandMap.get(speedCategory);
	// if (ld == null) {
	// locationDemandMap.put(speedCategory,
	// ld = aggregateDemandForSpeedCategory(speedCategory));
	// }
	// return ld;
	// }
	//
	// private LocationDemand aggregateDemandForSpeedCategory(
	// SpeedCategory speedCategory) {
	//
	// Aggregator<LocationDemand> aggregator = DefaultLocationDemand
	// .demandAggregate();
	//
	// locationDemandMappingMap
	// .values()
	// .stream()
	// .map(ldm -> aroDemandService
	// .createFairShareDemandMapping(ldm)
	// .getFairShareLocationDemand(speedCategory)
	// .createLocationDemand(ldm)).forEach(ld -> {
	// aggregator.add(ld);
	// });
	//
	// return aggregator.apply();
	//
	// }
	//
	// }

}
