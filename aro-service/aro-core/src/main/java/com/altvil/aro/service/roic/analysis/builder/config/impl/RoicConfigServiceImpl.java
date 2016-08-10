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
		config.init();
		map.put(type, config);
	}

	@PostConstruct
	void assemble() {

		for (NetworkAnalysisType type : NetworkAnalysisType.values()) {
			register(type, new DefaultRoicConfig(type));
		}

		register(NetworkAnalysisType.fiber, new DefaultRoicConfig(
				NetworkAnalysisType.fiber) {
			@Override
			protected void specialize(ComponentType ct,
					SpiComponentConfig<ComponentInput> componentConfig) {
				super.specialize(ct, componentConfig);
				componentConfig.add(AnalysisCode.new_connections_count,
						(inputs) -> Op.connectedHouseHoldsYearly(15, inputs
								.getPenetration().getEndPenetration(), inputs
								.getChurnRate(), inputs.getEntityCount()));

				componentConfig.add(AnalysisCode.new_connections_cost,
						(inputs) -> Op.multiply(
								AnalysisCode.new_connections_count,
								inputs.getConnectionCost()));

				componentConfig.add(AnalysisCode.premises_passed,
						(inputs) -> Op.growCurve(inputs.getEntityCount(),
								inputs.getEntityGrowth()));
			}
		});

		register(NetworkAnalysisType.copper_intersects, new DefaultRoicConfig(
				NetworkAnalysisType.copper_intersects) {

			@Override
			protected void specialize(ComponentType ct,
					SpiComponentConfig<ComponentInput> component) {
				component.add(
						AnalysisCode.houseHolds_global_count,
						(assenbler) -> Op.constCurve(0));
			}
			
		});

	}

}
