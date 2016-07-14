package com.altvil.aro.service.roic.analysis.builder.config.impl;

import java.util.EnumMap;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.springframework.stereotype.Service;

import com.altvil.aro.service.roic.analysis.builder.component.ComponentInput;
import com.altvil.aro.service.roic.analysis.builder.config.AnalysisCode;
import com.altvil.aro.service.roic.analysis.builder.config.RoicConfigService;
import com.altvil.aro.service.roic.analysis.builder.config.RoicConfiguration;
import com.altvil.aro.service.roic.analysis.builder.config.defaults.DefaultRoicConfig;
import com.altvil.aro.service.roic.analysis.builder.config.spi.SpiComponentConfig;
import com.altvil.aro.service.roic.analysis.builder.config.spi.SpiComponentRoicRegistry;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.analysis.op.Op;

@Service
public class RoicConfigServiceImpl implements RoicConfigService {

	private Map<NetworkAnalysisType, RoicConfiguration> map = new EnumMap<>(
			NetworkAnalysisType.class);


	@Override
	public RoicConfiguration getRoicConfiguration(
			NetworkAnalysisType analysisType) {
		return map.get(analysisType);
	}

	private void register(NetworkAnalysisType type, DefaultRoicConfig config) {
		config.init() ;
		map.put(type, config);
	}

	@PostConstruct
	void assemble() {
		
		for (NetworkAnalysisType type : NetworkAnalysisType.values()) {
			register(type,  new DefaultRoicConfig(type));
		}

		register(NetworkAnalysisType.fiber,
		new DefaultRoicConfig(NetworkAnalysisType.fiber) {
			void specialize(SpiComponentConfig<ComponentInput> componentConfig) {
		
				componentConfig.add(AnalysisCode.new_connections_count,
						(inputs) -> Op.connectedHouseHoldsYearly(15, inputs
								.getPenetration().getEndPenetration(), inputs
								.getChurnRate(), inputs.getEntityCount()));

				componentConfig.add(AnalysisCode.new_connections_cost,
						(inputs) -> Op.multiply(
								AnalysisCode.new_connections_count,
								inputs.getConnectionCost()));

			}

			void specialize(SpiComponentRoicRegistry<ComponentInput> registry,
					ComponentType ct) {
				specialize(registry.getConfig(ct));
			}

			@Override
			protected SpiComponentRoicRegistry<ComponentInput> assembleComponents(
					SpiComponentRoicRegistry<ComponentInput> registry) {
				super.assembleComponents(registry);

				specialize(registry, ComponentType.household);
				specialize(registry, ComponentType.smallBusiness);
				specialize(registry, ComponentType.mediumBusiness);
				specialize(registry, ComponentType.largeBusiness);
				specialize(registry, ComponentType.cellTower);

				return registry;
			}

		});

		register(NetworkAnalysisType.copper_intersects,
				new DefaultRoicConfig(NetworkAnalysisType.copper_intersects) {
					@Override
					protected SpiComponentRoicRegistry<ComponentInput> assembleComponents(
							SpiComponentRoicRegistry<ComponentInput> registry) {
						super.assembleComponents(registry);

						registry.getConfig(ComponentType.household).add(
								AnalysisCode.houseHolds_global_count,
								(assenbler) -> Op.constCurve(0));

						return registry;
					}

				});

	}

}
