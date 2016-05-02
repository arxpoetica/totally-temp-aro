package com.altvil.aro.service.roic.fairshare.impl;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import com.altvil.aro.service.roic.fairshare.FairShareInputs;
import com.altvil.aro.service.roic.fairshare.FairShareModel;
import com.altvil.aro.service.roic.fairshare.spi.FairShareModelFactory;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.utils.calc.CalcRow;
import com.altvil.utils.calc.CalcSheet;

public class SimpleFairShareModelFactory implements FairShareModelFactory {

	@Override
	public FairShareModel createModel(FairShareInputs inputs) {

		NetworkStrength providerStrength = CodeMapping.MAPPING
				.getNetworkStrength(inputs.getProviderCapability()
						.getNetworkTypes());

		double competitorSupply = inputs
				.getCompetitorNetworkCapabilities()
				.stream()
				.mapToDouble(
						c -> CompetitorEncoding.ENCODING.getStrength(
								providerStrength,
								CodeMapping.MAPPING.getNetworkStrength(c
										.getNetworkTypes()))).sum();

		double totalFairShare = providerStrength == NetworkStrength.none ? 0 : 1 / (1 + competitorSupply*inputs.getCompetitorWeighting());

		CalcSheet<NetworkType> calcSheet = new CalcSheet<>(inputs
				.getNetworkTypeShare().getNetworkTypes());

		CalcRow<NetworkType, Double> fairShareRow = calcSheet.calcDouble(
				t -> inputs.getNetworkTypeShare().getValue(t) * totalFairShare,
				v -> totalFairShare);

		return new DefaultFairShareModel(null, inputs.getNetworkTypeShare(),
				fairShareRow);

	}

	private static enum NetworkStrength {

		none(EnumSet.noneOf(NetworkType.class)), copper(EnumSet
				.of(NetworkType.Copper)), fiber(EnumSet.of(NetworkType.Fiber)), fiber_copper(
				EnumSet.of(NetworkType.Fiber, NetworkType.Copper))

		;

		private NetworkStrength(EnumSet<NetworkType> networkTypes) {
			this.networkTypes = networkTypes;
		}

		private EnumSet<NetworkType> networkTypes;

		public EnumSet<NetworkType> getNetworkTypes() {
			return networkTypes;
		}

	}

	private static class CompetitorEncoding {

		public static CompetitorEncoding ENCODING = new CompetitorEncoding();

		private Map<NetworkStrength, NetworkStrength> canonicalMap = new EnumMap<>(
				NetworkStrength.class);
		private Map<NetworkStrength, Map<NetworkStrength, Integer>> strengthMap = new EnumMap<>(
				NetworkStrength.class);

		private CompetitorEncoding() {
			init();
		}

		private void init() {

			// Define Canonical Mapping
			canonicalMap.put(NetworkStrength.fiber_copper,
					NetworkStrength.fiber);
			canonicalMap.put(NetworkStrength.fiber, NetworkStrength.fiber);
			canonicalMap.put(NetworkStrength.copper, NetworkStrength.copper);
			canonicalMap.put(NetworkStrength.none, NetworkStrength.none);

			// init maps
			for (NetworkStrength ns : NetworkStrength.values()) {
				strengthMap.put(ns, new EnumMap<>(NetworkStrength.class));
			}

			add(NetworkStrength.fiber_copper, NetworkStrength.fiber_copper, 2);
			add(NetworkStrength.fiber_copper, NetworkStrength.fiber, 2);
			add(NetworkStrength.fiber_copper, NetworkStrength.copper, 1);
			add(NetworkStrength.fiber_copper, NetworkStrength.none, 0);

			add(NetworkStrength.fiber, NetworkStrength.fiber_copper, 2);
			add(NetworkStrength.fiber, NetworkStrength.fiber, 2);
			add(NetworkStrength.fiber, NetworkStrength.copper, 1);
			add(NetworkStrength.fiber, NetworkStrength.none, 0);

			add(NetworkStrength.copper, NetworkStrength.fiber_copper, 3);
			add(NetworkStrength.copper, NetworkStrength.fiber, 3);
			add(NetworkStrength.copper, NetworkStrength.copper, 2);
			add(NetworkStrength.copper, NetworkStrength.none, 0);
			
			add(NetworkStrength.none, NetworkStrength.fiber_copper, 3);
			add(NetworkStrength.none, NetworkStrength.fiber, 3);
			add(NetworkStrength.none, NetworkStrength.copper, 1);
			add(NetworkStrength.none, NetworkStrength.none, 0);

		}

		private NetworkStrength getCanaonicalStrength(NetworkStrength strength) {
			return canonicalMap.get(strength);
		}

		private void add(NetworkStrength providerStrength,
				NetworkStrength competitorStrength, Integer strength) {
			strengthMap.get(providerStrength).put(
					getCanaonicalStrength(competitorStrength), strength);
		}

		public int getStrength(NetworkStrength providerStrength,
				NetworkStrength cometitorStrength) {
			
			Object o = strengthMap.get(providerStrength) ;
			Object cs = getCanaonicalStrength(cometitorStrength) ;
			
			return strengthMap.get(providerStrength).get(
					getCanaonicalStrength(cometitorStrength));
		}

	}

	private static class CodeMapping {

		public static CodeMapping MAPPING = new CodeMapping();

		private Set<NetworkType> supportedTypes = EnumSet.of(NetworkType.Copper, NetworkType.Fiber) ;
		private Map<EnumSet<NetworkType>, NetworkStrength> encodedMap = new HashMap<>();

		private CodeMapping() {
			init();
		}

		private void init() {
			for (NetworkStrength ns : NetworkStrength.values()) {
				encodedMap.put(ns.getNetworkTypes(), ns);
			}
		}

		public NetworkStrength getNetworkStrength(Set<NetworkType> set) {
			return encodedMap.get(and(set, supportedTypes));
		}

		private EnumSet<NetworkType> and(Set<NetworkType> set,
				Set<NetworkType> types) {
			EnumSet<NetworkType> result = EnumSet.noneOf(NetworkType.class);
			for (NetworkType nt : set) {
				if (types.contains(nt)) {
					result.add(nt);
				}
			}

			return result;
		}

	}

}
