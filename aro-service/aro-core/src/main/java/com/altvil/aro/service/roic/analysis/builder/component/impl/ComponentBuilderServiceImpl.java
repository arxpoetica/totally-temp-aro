package com.altvil.aro.service.roic.analysis.builder.component.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.builder.component.ComponentBuilderService;
import com.altvil.aro.service.roic.analysis.builder.component.ComponentInput;
import com.altvil.aro.service.roic.analysis.builder.component.RoicComponentAggregator;
import com.altvil.aro.service.roic.analysis.builder.config.ComponentConfig;
import com.altvil.aro.service.roic.analysis.builder.config.RoicConfigService;
import com.altvil.aro.service.roic.analysis.builder.config.RoicConfiguration;
import com.altvil.aro.service.roic.analysis.builder.impl.AbstractAggregator;
import com.altvil.aro.service.roic.analysis.builder.impl.DefaultDerivedModel;
import com.altvil.aro.service.roic.analysis.builder.network.RoicInputs;
import com.altvil.aro.service.roic.analysis.builder.spi.DerivedModel;
import com.altvil.aro.service.roic.analysis.calc.StreamAssembler;
import com.altvil.aro.service.roic.analysis.calc.impl.StreamAssemblerImpl;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.analysis.model.curve.AnalysisRow;
import com.altvil.aro.service.roic.analysis.model.curve.DefaultAnalyisRow;
import com.altvil.aro.service.roic.analysis.model.impl.ComponentModelImpl;
import com.altvil.aro.service.roic.analysis.model.impl.RoicNetworkModelImpl;
import com.altvil.aro.service.roic.analysis.op.Op;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

@Service
public class ComponentBuilderServiceImpl implements ComponentBuilderService {

	private RoicConfigService configService;
	
	@Autowired
	public ComponentBuilderServiceImpl(RoicConfigService configService) {
		super();
		this.configService = configService;
	}

	@Override
	public RoicNetworkModel createNetworkModel(NetworkAnalysisType type,
			AnalysisPeriod period, RoicInputs roicInputs) {
		return new NetworkAssembler(period,
				configService.getRoicConfiguration(type)).assemble(roicInputs);
	}

	private Function<Collection<RoicComponent>, ComponentConfig<Void>> createBindingConfig(
			NetworkAnalysisType type) {
		RoicConfiguration roicConfiguration = configService
				.getRoicConfiguration(type);
		return (models) -> roicConfiguration.getAggregateConfig(models
				.iterator().next().getComponentType());
	}

	@Override
	public RoicComponentAggregator aggregate(NetworkAnalysisType type) {
		return new DefaultComponentAggregator<Void>(createBindingConfig(type));
	}

	private class DefaultComponentAggregator<T> extends
			AbstractAggregator<CurveIdentifier, AnalysisRow, RoicComponent>
			implements RoicComponentAggregator {

		private Function<Collection<RoicComponent>, ComponentConfig<T>> f;
		private T inputs;

		private ComponentConfig<T> componentConfig;

		public DefaultComponentAggregator(
				Function<Collection<RoicComponent>, ComponentConfig<T>> f,
				T inputs) {
			super();
			this.f = f;
			this.inputs = inputs;
		}

		public DefaultComponentAggregator(
				Function<Collection<RoicComponent>, ComponentConfig<T>> f) {
			this(f, null);
		}

		@Override
		protected void inferState(Collection<RoicComponent> models) {
			super.inferState(models);
			componentConfig = f.apply(models);
		}

		@Override
		protected AnalysisRow reduce(CurveIdentifier key,
				Collection<AnalysisRow> components) {
			return DefaultAnalyisRow.sum(components);
		}

		@Override
		protected DerivedModel<CurveIdentifier, AnalysisRow> transform(
				Collection<RoicComponent> models) {
			return createDerivedModel(models, componentConfig);
		}

		@Override
		protected RoicComponent toRoicModel(AnalysisPeriod period,
				Map<CurveIdentifier, AnalysisRow> componentMap) {

			return new Assembler<T>(period, componentConfig) {
				@Override
				protected void doAssemble(StreamAssembler assembler, T value) {
					super.doAssemble(assembler, value);

					componentConfig.getGroupByCurves(componentMap.keySet())
							.forEach(
									k -> {
										assembler.add(k,
												Op.constCurve(componentMap
														.get(k)));
										assembler.addOutput(k);
									});
				}

			}.assemble(inputs);

		}

	}

	private static DerivedModel<CurveIdentifier, AnalysisRow> createDerivedModel(
			Collection<RoicComponent> components,
			ComponentConfig<?> componentConfig) {

		Map<CurveIdentifier, List<AnalysisRow>> result = new HashMap<>();

		components
				.stream()
				.map(RoicComponent::getStreamModel)
				.forEach(
						m -> {
							componentConfig.getGroupByCurves(
									m.getCurveIdentifiers()).forEach(id -> {
								List<AnalysisRow> array = result.get(id);
								if (array == null) {
									result.put(id, array = new ArrayList<>());
								}
								array.add(m.getAnalysisRow(id));
							});
						});

		return new DefaultDerivedModel<CurveIdentifier, AnalysisRow>(result);

	}

	//
	// Assembler Classes
	//

	protected static class Assembler<S> {

		protected AnalysisPeriod period;
		protected ComponentConfig<S> componentConfig;

		public Assembler(AnalysisPeriod period,
				ComponentConfig<S> componentConfig) {
			super();
			this.period = period;
			this.componentConfig = componentConfig;
		}

		private void validate() {
			if (componentConfig == null) {
				throw new RuntimeException("ComponentConfig not defined");
			}

			if (period == null) {
				throw new RuntimeException("AnalysisPeriod not defined");
			}
		}

		public RoicComponent assemble(S value) {

			validate();

			StreamAssembler assembler = StreamAssemblerImpl.create()
					.setAnalysisPeriod(period);
			doAssemble(assembler, value);

			return new ComponentModelImpl(period,
					componentConfig.getComponentType(),
					assembler.resolveAndBuild());
		}

		protected void doAssemble(StreamAssembler assembler, S value) {
			componentConfig.getCurveConfigurations().forEach(c -> {
				assembler.add(c.getCurveIdentifier(), c.bindFunction(value));
			});

			componentConfig.getExportedCurves().forEach(assembler::addOutput);
		}

	}

	private class NetworkAssembler {
		private Map<ComponentType, RoicComponent> roicComponents = new EnumMap<>(
				ComponentType.class);

		private AnalysisPeriod period;
		private RoicConfiguration roicConfiguration;

		public NetworkAssembler(AnalysisPeriod period,
				RoicConfiguration roicConfiguration) {
			super();
			this.period = period;
			this.roicConfiguration = roicConfiguration;
			
			if( this.period == null || this.roicConfiguration == null ) {
				throw new NullPointerException() ;
			}
		}

		protected void add(RoicComponent component) {
			roicComponents.put(component.getComponentType(), component);
		}

		public RoicNetworkModel assemble(RoicInputs roicInputs) {
			Collection<RoicComponent> baseComponents = roicInputs
					.getComponentInputs().stream().map(this::createComponent)
					.collect(Collectors.toList());

			baseComponents.forEach(this::add);
			add(createNetworkComponent(roicInputs, baseComponents));

			return new RoicNetworkModelImpl(roicInputs.getType(), period,
					roicComponents);
		}

		protected RoicComponent createComponent(ComponentInput inputs) {
			return new Assembler<ComponentInput>(period,
					roicConfiguration.getComponentConfig(inputs
							.getComponentType())).assemble(inputs);
		}

		protected RoicComponent createNetworkComponent(RoicInputs roicInputs,
				Collection<RoicComponent> components) {

			return new DefaultComponentAggregator<RoicInputs>(
					(models) -> roicConfiguration.getNetworkConfig(),
					roicInputs).addAll(components).sum();

		}

	}

}
