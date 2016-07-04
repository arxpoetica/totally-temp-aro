package com.altvil.aro.service.roic.analysis.builder.config.impl;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

import com.altvil.aro.service.roic.analysis.builder.config.CurveConfig;
import com.altvil.aro.service.roic.analysis.builder.config.spi.SpiComponentConfig;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public class AbstractConfig<T> implements SpiComponentConfig<T> {

	private ComponentType componentType;

	private CurveRegistry<T> curveRegistry;
	private OutputRegistry outputRegistry;

	public AbstractConfig(ComponentType componentType) {
		super();
		this.componentType = componentType;
		assembleDefinition();
	}

	@Override
	public void add(CurveIdentifier id, Function<T, StreamFunction> f) {
		curveRegistry.add(id, f);
	}

	@Override
	public void addOutput(CurveIdentifier id) {
		outputRegistry.add(id);
	}

	@Override
	public Collection<CurveConfig<T>> getCurveConfigurations() {
		return curveRegistry.getCurveConfigs();
	}

	@Override
	public ComponentType getComponentType() {
		return componentType;
	}

	@Override
	public Collection<CurveIdentifier> getExportedCurves() {
		return outputRegistry.getCurveIdentifiers();
	}

	@Override
	public Collection<CurveIdentifier> getGroupByCurves(
			Collection<CurveIdentifier> existingCurves) {
		return null;
	}

	public void assembleDefinition() {
		curveRegistry = assemble(new CurveRegistry<T>());
		outputRegistry = assemble(new OutputRegistry());
	}

	protected CurveRegistry<T> assemble(CurveRegistry<T> registry) {
		return registry;
	}

	protected OutputRegistry assemble(OutputRegistry registry) {
		return registry;
	}

	protected class OutputRegistry {

		private Set<CurveIdentifier> ids = new LinkedHashSet<>();

		public OutputRegistry add(CurveIdentifier id) {
			ids.add(id);
			return this;
		}

		public Collection<CurveIdentifier> getCurveIdentifiers() {
			return ids;
		}

	}

	protected static class CurveRegistry<T> {

		private Map<CurveIdentifier, CurveConfig<T>> map = new LinkedHashMap<>();

		public CurveRegistry<T> add(CurveIdentifier id,
				Function<T, StreamFunction> f) {
			return add(new DefaultCurveConfig<T>(id, f));
		}

		public CurveRegistry<T> add(CurveConfig<T> config) {
			map.put(config.getCurveIdentifier(), config);
			return this;
		}

		public Collection<CurveConfig<T>> getCurveConfigs() {
			return map.values();
		}

	}

}
