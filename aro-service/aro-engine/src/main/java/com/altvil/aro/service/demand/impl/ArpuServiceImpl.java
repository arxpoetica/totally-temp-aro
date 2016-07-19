package com.altvil.aro.service.demand.impl;

import java.util.EnumMap;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.springframework.stereotype.Service;

import com.altvil.aro.service.demand.ArpuService;
import com.altvil.aro.service.demand.analysis.ArpuMapping;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.roic.model.NetworkType;

@Service
public class ArpuServiceImpl implements ArpuService {

	private Map<LocationEntityType, ArpuMapping> arpuMap = new EnumMap<>(
			LocationEntityType.class);

	@PostConstruct
	void postConstruct() {

		arpuMap.put(LocationEntityType.SmallBusiness, ArpuMappingImpl.build()
				.add(NetworkType.Fiber, 108.87)
				.add(NetworkType.Copper, 47.63)
				.build());

		arpuMap.put(LocationEntityType.MediumBusiness, ArpuMappingImpl.build()
				.add(NetworkType.Fiber, Double.NaN)
				.add(NetworkType.Copper, Double.NaN)
				.build());

		arpuMap.put(
				LocationEntityType.LargeBusiness,
				ArpuMappingImpl.build()
					.add(NetworkType.Fiber, Double.NaN)
					.add(NetworkType.Copper, Double.NaN)
					.build());
	
		arpuMap.put(
				LocationEntityType.Household,
				ArpuMappingImpl.build()
						.add(NetworkType.Fiber, 124.12)
						.add(NetworkType.Copper, 40.61).build());

		arpuMap.put(
				LocationEntityType.CellTower,
				ArpuMappingImpl.build()
					.add(NetworkType.Fiber, 500.0)
					.add(NetworkType.Copper, 0.0).build());

	}

	@Override
	public ArpuMapping getArpuMapping(LocationEntityType type) {
		return arpuMap.get(type);
	}

	private static class ArpuMappingImpl implements ArpuMapping {

		public static Builder build() {
			return new Builder();
		}

		public static class Builder {

			private ArpuMappingImpl mapping = new ArpuMappingImpl();

			Builder add(NetworkType type, Double arpu) {
				mapping.networkMap.put(type, arpu);
				return this;
			}

			public ArpuMapping build() {
				return mapping;
			}
		}

		private Map<NetworkType, Double> networkMap = new EnumMap<>(
				NetworkType.class);

		@Override
		public double getArpu(NetworkType type) {

			Double val = networkMap.get(type);
			return val == null ? 0 : val;
		}

	}

}
