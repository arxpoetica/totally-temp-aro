package com.altvil.aro.service.processing.impl;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collector;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.persistence.repository.ServiceLayerRepository;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.entity.mapping.LocationEntityTypeMapping;
import com.altvil.aro.service.processing.ProcessingLayerService;
import com.altvil.aro.service.reference.ReferenceType;
import com.altvil.aro.service.reference.VolatileReferenceService;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.reference.VolatileReference;

import static java.util.function.Function.identity;

@Service
public class ProcessingLayerServiceImpl implements ProcessingLayerService {

	// private static final String RULE = "system_defaults";

	private VolatileReferenceService volatileReferenceService;
	private ServiceLayerRepository serviceLayerRepository;
	private VolatileReference<SystemRule> systemRuleRef;

	@Autowired
	public ProcessingLayerServiceImpl(
			ServiceLayerRepository serviceLayerRepository,
			VolatileReferenceService volatileReferenceService) {
		super();
		this.serviceLayerRepository = serviceLayerRepository;
		this.volatileReferenceService = volatileReferenceService;
	}

	@Override
	public Set<LocationEntityType> getSupportedEntityTypes(
			ServiceLayer serviceLayer) {
		return systemRuleRef.get().getSupportedEntityTypes(serviceLayer);
	}

	private SystemRule loadSystemRule() {
		return new SystemRule().construct();
	}

	@PostConstruct
	void postConstruct() {
		systemRuleRef = volatileReferenceService.createVolatileReference(
				ReferenceType.SERVICE_LAYER_INPUTS, this::loadSystemRule);
	}

	@Override
	public Collection<ServiceLayer> inferServiceLayers(
			Collection<LocationEntityType> locationEntityTypes) {
		return systemRuleRef.get().inferServiceLayers(locationEntityTypes);
	}

	@Override
	public Collection<ServiceLayer> getServiceLayers(
			Collection<Integer> serviceLayersIds) {
		Collection<ServiceLayer> cachedLayers = systemRuleRef.get().getServiceLayers(serviceLayersIds);

		Set<Integer> cachedIds = cachedLayers
				.stream()
				.filter(sl -> sl != null)
				.map(ServiceLayer::getId)
				.collect(Collectors.toSet());

		Set<Integer> missingIds = serviceLayersIds.stream()
				.filter(id -> !cachedIds.contains(id))
				.collect(Collectors.toSet());

		Collection<ServiceLayer> missingLayers = serviceLayerRepository.getByIds(missingIds);

		Map<Integer, ServiceLayer> map = Stream.concat(cachedLayers.stream(), missingLayers.stream())
				.collect(Collectors.toMap(ServiceLayer::getId, identity()));

		return serviceLayersIds
				.stream()
				.map(map::get)
				.collect(Collectors.toList());



	}
	

	private class SystemRule implements ProcessingLayerService {

		private Map<Integer, ServiceLayer> serviceLayerMap;
		private LinkedHashMap<ServiceLayer, Set<LocationEntityType>> layerAssignmentMap;

		public SystemRule construct() {
			serviceLayerMap = StreamUtil.hash(serviceLayerRepository.findByUserDefined(false),
					ServiceLayer::getId);

			layerAssignmentMap = createLayerAssignmentMap(
					createOrderedLayers(serviceLayerMap.values(),
							createComparator(loadPrioityMap(serviceLayerMap))),
					loadCategoryRules(serviceLayerMap));

			return this;
		}

		@Override
		public Set<LocationEntityType> getSupportedEntityTypes(
				ServiceLayer serviceLayer) {
			return layerAssignmentMap.get(serviceLayer);
		}

		private LinkedHashMap<ServiceLayer, Set<LocationEntityType>> createLayerAssignmentMap(
				Collection<ServiceLayer> orderedLayers,
				Map<ServiceLayer, Set<LocationEntityType>> map) {
			LinkedHashMap<ServiceLayer, Set<LocationEntityType>> result = new LinkedHashMap<>();

			orderedLayers.forEach(l -> {
				result.put(l, map.get(l));
			});

			return result;
		}

		private Collection<ServiceLayer> createOrderedLayers(
				Collection<ServiceLayer> layers,
				Comparator<ServiceLayer> serviceLayerComparator) {
			List<ServiceLayer> result = new ArrayList<>();
			result.addAll(layers);
			Collections.sort(result, serviceLayerComparator);
			return result;
		}

		private Comparator<ServiceLayer> createComparator(
				Map<ServiceLayer, Integer> priorityMap) {
			return (s1, s2) -> priorityMap.get(s2).compareTo(
					priorityMap.get(s1));
		}

		private Map<ServiceLayer, Set<LocationEntityType>> loadCategoryRules(
				Map<Integer, ServiceLayer> serviceLayerMap) {

			Map<Object, List<Object[]>> objectMap = serviceLayerRepository
					.queryMappedCategories().stream()
					.collect(Collectors.groupingBy(a -> a[0]));

			Map<ServiceLayer, Set<LocationEntityType>> result = new HashMap<>();

			objectMap
					.entrySet()
					.forEach(
							e -> {

								ServiceLayer sl = serviceLayerMap
										.get(((Number) e.getKey()).intValue());

								Set<LocationEntityType> entityTypes = e
										.getValue()
										.stream()
										.map(a -> ((Number) a[1]).intValue())
										.map(LocationEntityTypeMapping.MAPPING::toLocationEntityType)
										.collect(Collectors.toSet());

								// Speed and size
								Set<LocationEntityType> enumEntityTypes = EnumSet
										.noneOf(LocationEntityType.class);
								enumEntityTypes.addAll(entityTypes);

								result.put(sl, enumEntityTypes);

							});

			return result;

		}

		private Map<ServiceLayer, Integer> loadPrioityMap(
				Map<Integer, ServiceLayer> serviceLayerMap) {

			Map<ServiceLayer, Integer> result = new HashMap<>();

			serviceLayerRepository.queryMappedPriorities()
					.forEach(
							a -> {
								result.put(serviceLayerMap.get(((Number) a[0])
										.intValue()), ((Number) a[1])
										.intValue());
							});

			int priroty = 40;
			for (ServiceLayer sl : serviceLayerMap.values()) {
				if (result.get(sl) == null) {
					result.put(sl, priroty++);
				}
			}

			return result;
		}

		@Override
		public Collection<ServiceLayer> getServiceLayers(
				Collection<Integer> serviceLayersIds) {
			return StreamUtil.map(serviceLayersIds, serviceLayerMap::get);
		}

		@Override
		public Collection<ServiceLayer> inferServiceLayers(
				Collection<LocationEntityType> locationEntityTypes) {

			Set<LocationEntityType> set = EnumSet
					.noneOf(LocationEntityType.class);
			set.addAll(locationEntityTypes);

			final LinkedHashSet<ServiceLayer> selectedLayers = new LinkedHashSet<>();
			layerAssignmentMap.entrySet().forEach(e -> {

				Set<LocationEntityType> matchSet = e.getValue();

				if (matchSet != null) {
					matchSet.forEach(entity -> {
						if (set.contains(entity)) {
							set.remove(entity);
							selectedLayers.add(e.getKey());
						}
					});
				}

			});

			return selectedLayers;
		}

	}

	
}
