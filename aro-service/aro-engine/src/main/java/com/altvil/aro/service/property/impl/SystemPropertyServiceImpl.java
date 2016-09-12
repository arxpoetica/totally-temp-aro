package com.altvil.aro.service.property.impl;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.property.PropertyConfiguration;
import com.altvil.aro.service.property.SymbolRef;
import com.altvil.aro.service.property.SystemProperty;
import com.altvil.aro.service.property.SystemPropertyEnum;
import com.altvil.aro.service.property.SystemPropertyService;
import com.altvil.aro.service.reference.ReferenceType;
import com.altvil.aro.service.reference.VolatileReferenceService;
import com.altvil.utils.reference.VolatileReference;

@Service
public class SystemPropertyServiceImpl implements SystemPropertyService {

	private static final Logger log = LoggerFactory
			.getLogger(SystemPropertyServiceImpl.class.getName());

	private VolatileReferenceService volatileReferenceService;
	private NetworkPlanRepository networkPlanRepository;

	private VolatileReference<PropertyConfiguration> ref;

	@Autowired
	public SystemPropertyServiceImpl(
			VolatileReferenceService volatileReferenceService,
			NetworkPlanRepository networkPlanRepository) {
		super();
		this.volatileReferenceService = volatileReferenceService;
		this.networkPlanRepository = networkPlanRepository;
	}

	@PostConstruct
	void postConstruct() {
		ref = volatileReferenceService.createVolatileReference(
				ReferenceType.SYSTEM_PROPERTIES,
				() -> loadPropertyConfiguration());
	}

	@Override
	public PropertyConfiguration getConfiguration() {
		return ref.get();
	}

	private SystemProperty toSystemProperty(String key, Object value) {

		try {

			SymbolRef ref = SystemPropertyEnum.valueOf(key);

			String s = null;
			if (value instanceof String) {
				s = (String) value;
			}

			return new SystemPropertyImpl(ref, s);
		} catch (Throwable err) {
			log.error(err.getMessage(), err);
			return null;
		}
	}

	private PropertyConfiguration loadPropertyConfiguration() {
		Map<SymbolRef, SystemProperty> map = networkPlanRepository
				.querySystemProperties()
				.stream()
				.map(r -> this.toSystemProperty(r[0].toString(), r[1]))
				.filter(p -> p != null)
				.collect(Collectors.toMap(SystemProperty::getSymbolRef, p -> p));

		return new PropertyConfigurationImpl(map);
	}

	private static class PropertyConfigurationImpl implements
			PropertyConfiguration {

		private Map<SymbolRef, SystemProperty> map;

		public PropertyConfigurationImpl(Map<SymbolRef, SystemProperty> map) {
			super();
			this.map = map;
		}

		@Override
		public Set<SymbolRef> getSymbolReferences() {
			return map.keySet();
		}

		@Override
		public SystemProperty getSystemProperty(SymbolRef id) {
			return map.get(id);
		}

	}

	private static class SystemPropertyImpl implements SystemProperty {

		private SymbolRef symbolRef;
		private String value;

		public SystemPropertyImpl(SymbolRef symbolRef, String value) {
			super();
			this.symbolRef = symbolRef;
			this.value = value;
		}

		@Override
		public SymbolRef getSymbolRef() {
			return symbolRef;
		}

		@Override
		public String asString() {
			return value;
		}

		private boolean isValid() {
			return value != null && !value.isEmpty();
		}

		@Override
		public Double asDouble() {
			if (!isValid()) {
				return null;
			}
			try {
				return Double.parseDouble(value);
			} catch (Throwable err) {
				log.error(err.getMessage(), err);
				return null;
			}
		}

	}

}
