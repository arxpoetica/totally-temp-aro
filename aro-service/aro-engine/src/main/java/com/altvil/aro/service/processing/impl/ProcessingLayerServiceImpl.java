package com.altvil.aro.service.processing.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.persistence.repository.ServiceLayerRepository;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.entity.mapping.LocationEntityTypeMapping;
import com.altvil.aro.service.processing.ProcessingLayerService;
import com.altvil.utils.StreamUtil;

@Service
public class ProcessingLayerServiceImpl implements ProcessingLayerService {

	//private static final String RULE = "system_defaults";

	private ServiceLayerRepository serviceLayerRepository;

	private Map<Integer, ServiceLayer> serviceLayerMap;
	private Map<LocationEntityType, List<ServiceLayer>> entityMap;
	private Comparator<ServiceLayer> serviceLayerComparator;

	@Autowired
	public ProcessingLayerServiceImpl(
			ServiceLayerRepository serviceLayerRepository) {
		super();
		this.serviceLayerRepository = serviceLayerRepository;
	}

	@PostConstruct
	void postConstruct() {
		serviceLayerMap = StreamUtil.hash(serviceLayerRepository.findAll(),
				ServiceLayer::getId);
		entityMap = loadCategoryRules(serviceLayerMap);
		serviceLayerComparator = createComparator(loadPrioityMap(serviceLayerMap));
	}

	private Comparator<ServiceLayer> createComparator(
			Map<ServiceLayer, Integer> priorityMap) {
		return (s1, s2) -> priorityMap.get(s2).compareTo(priorityMap.get(s1));
	}

	private Map<LocationEntityType, List<ServiceLayer>> loadCategoryRules(
			Map<Integer, ServiceLayer> serviceLayerMap) {
		Map<Object, List<Object[]>> objectMap = serviceLayerRepository
				.queryMappedCategories().stream()
				.collect(Collectors.groupingBy(a -> a[1]));

		Map<LocationEntityType, List<ServiceLayer>> result = new EnumMap<>(
				LocationEntityType.class);

		objectMap.entrySet().forEach(
				e -> {

					LocationEntityType type = LocationEntityTypeMapping.MAPPING
							.toLocationEntityType(((Number) e.getKey())
									.intValue());

					List<ServiceLayer> serviceLayers = e.getValue().stream()
							.map(a -> ((Number) a[0]).intValue())
							.map(serviceLayerMap::get)
							.collect(Collectors.toList());

					result.put(type, serviceLayers);

				});

		return result;

	}

	private Map<ServiceLayer, Integer> loadPrioityMap(
			Map<Integer, ServiceLayer> serviceLayerMap) {

		Map<ServiceLayer, Integer> result = new HashMap<>();

		serviceLayerRepository.queryMappedPriorities().forEach(
				a -> {
					result.put(serviceLayerMap.get(((Number) a[0]).intValue()),
							((Number) a[1]).intValue());
				});

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

		Set<ServiceLayer> results = new HashSet<>();
		locationEntityTypes.stream().forEach(e -> {
			List<ServiceLayer> serviceLayers = entityMap.get(e);
			if (e != null) {
				results.addAll(serviceLayers);
			}
		});

		List<ServiceLayer> layers = new ArrayList<>(results);
		Collections.sort(layers, serviceLayerComparator);

		return layers;
	}

}
