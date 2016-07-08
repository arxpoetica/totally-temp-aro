package com.altvil.aro.service.roic.analysis.builder.config.defaults;

import java.util.EnumMap;
import java.util.Map;

import com.altvil.aro.service.roic.analysis.builder.component.ComponentInput;
import com.altvil.aro.service.roic.analysis.builder.config.ComponentConfig;
import com.altvil.aro.service.roic.analysis.builder.config.RoicConfiguration;
import com.altvil.aro.service.roic.analysis.builder.config.spi.SpiComponentConfig;
import com.altvil.aro.service.roic.analysis.builder.config.spi.SpiComponentRoicRegistry;
import com.altvil.aro.service.roic.analysis.builder.config.spi.SpiRoicConfiguration;
import com.altvil.aro.service.roic.analysis.builder.network.RoicInputs;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;

public class DefaultRoicConfig implements RoicConfiguration,
		SpiRoicConfiguration {

	private NetworkAnalysisType networkAnalysisType;

	private SpiComponentRoicRegistry<ComponentInput> componentRegistry = new Registry<>();
	private SpiComponentRoicRegistry<RoicInputs> networkRegistry = new Registry<>();
	private SpiComponentRoicRegistry<Void> aggregateRegistry = new Registry<>();

	public DefaultRoicConfig(NetworkAnalysisType networkAnalysisType) {
		super();
		this.networkAnalysisType = networkAnalysisType;
	}

	@Override
	public NetworkAnalysisType getNetworkAnalysisType() {
		return networkAnalysisType;
	}

	@Override
	public ComponentConfig<ComponentInput> getComponentConfig(ComponentType ct) {
		return componentRegistry.getConfig(ct);
	}

	@Override
	public SpiComponentRoicRegistry<ComponentInput> getComponentRegistry() {
		return componentRegistry;
	}

	@Override
	public SpiComponentRoicRegistry<Void> getAggregateRegistry() {
		return aggregateRegistry;
	}

	@Override
	public SpiComponentRoicRegistry<RoicInputs> getNetworkRegistry() {
		return networkRegistry;
	}

	public DefaultRoicConfig init() {
		componentRegistry = assembleComponents(new Registry<>());
		networkRegistry = assembleNetwork(new Registry<>());
		aggregateRegistry = assembleAggregates(new Registry<>());
		return this;
	}

	@Override
	public ComponentConfig<Void> getAggregateConfig(ComponentType componentType) {
		return aggregateRegistry.getConfig(componentType);
	}

	@Override
	public ComponentConfig<RoicInputs> getNetworkConfig() {
		return networkRegistry.getConfig(ComponentType.network);
	}

	protected SpiComponentRoicRegistry<ComponentInput> assembleComponents(
			SpiComponentRoicRegistry<ComponentInput> registry) {

		registry.register(new BasicComponentConfig(ComponentType.household));
		registry.register(new BasicComponentConfig(ComponentType.cellTower));
		registry.register(new BasicComponentConfig(ComponentType.smallBusiness));
		registry.register(new BasicComponentConfig(ComponentType.mediumBusiness));
		registry.register(new BasicComponentConfig(ComponentType.largeBusiness));
		
		return registry;
	}

	protected SpiComponentRoicRegistry<RoicInputs> assembleNetwork(
			SpiComponentRoicRegistry<RoicInputs> inputs) {
		inputs.register(new NetworkComponentConfig());
		return inputs;
	}

	protected SpiComponentRoicRegistry<Void> assembleAggregates(
			SpiComponentRoicRegistry<Void> registry) {

		for (ComponentType type : ComponentType.values()) {
			registry.register(new AggregateComponentConfig<Void>(type));
		}

		return registry;
	}

	private static class Registry<T> implements SpiComponentRoicRegistry<T> {

		private Map<ComponentType, SpiComponentConfig<T>> map = new EnumMap<>(
				ComponentType.class);

		@Override
		public void register(SpiComponentConfig<T> config) {
			map.put(config.getComponentType(), config);
		}

		public SpiComponentConfig<T> getConfig(ComponentType type) {
			
			SpiComponentConfig<T> config = map.get(type);
			
			if( config == null ) {
				throw new NullPointerException() ;
			}
			
			return config ;
		}

	}

}
