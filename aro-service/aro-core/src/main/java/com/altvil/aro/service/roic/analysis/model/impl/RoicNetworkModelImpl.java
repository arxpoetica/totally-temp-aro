package com.altvil.aro.service.roic.analysis.model.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.op.ModelOp;
import com.altvil.aro.service.roic.analysis.op.Transformer;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.registry.impl.DefaultContainerRegistry;

public class RoicNetworkModelImpl extends DefaultContainerRegistry implements
		RoicNetworkModel {

	private NetworkAnalysisType type;
	private AnalysisPeriod analysisPeriod;
	private Map<ComponentType, RoicComponent> map;
	private RoicComponent networkCurves;

	private Collection<RoicNetworkModel> baseModels;

	public RoicNetworkModelImpl(NetworkAnalysisType type,
			AnalysisPeriod analysisPeriod,
			Map<ComponentType, RoicComponent> map, RoicComponent networkCurves,
			Collection<RoicNetworkModel> baseModels) {
		super(type.name());
		this.type = type;
		this.analysisPeriod = analysisPeriod;
		this.map = map;
		this.networkCurves = networkCurves;
		this.baseModels = baseModels;

		add(map.values());
		add(networkCurves);
		// add(baseModels);

	}

	@Override
	public AnalysisPeriod getAnalysisPeriod() {
		return analysisPeriod;
	}

	public RoicNetworkModelImpl(NetworkAnalysisType type,
			AnalysisPeriod analysisPeriod,
			Map<ComponentType, RoicComponent> map, RoicComponent networkCurves) {
		this(type, analysisPeriod, map, networkCurves, new ArrayList<>());
	}

	@Override
	public Collection<RoicComponent> getRoicComponents() {
		return map.values();
	}

	@Override
	public Collection<RoicNetworkModel> getBaseModels() {
		return baseModels;
	}

	@Override
	public NetworkAnalysisType getNetworkAnalysisType() {
		return type;
	}

	@Override
	public RoicComponent getEntityAnalysis(ComponentType type) {
		return map.get(type);
	}

	@Override
	public AnalysisRow getAnalysisRow(ComponentType type, CurveIdentifier id) {
		return map.get(type).getAnalysisRow(id);
	}

	@Override
	public AnalysisRow getAnalysisRow(CurveIdentifier id) {
		return networkCurves.getAnalysisRow(id);
	}

	@Override
	public RoicComponent getNetworkCurves() {
		return networkCurves;
	}
	
	
	
	
	
/*
	@Override
	public Transformer add() {
		return new AbstractTransformerImpl() {

			private Map<ComponentType, RoicComponent> sumComponents(
					Collection<RoicNetworkModel> models) {

				List<RoicNetworkModel> allComponents = new ArrayList<>(models);
				allComponents.add(RoicNetworkModelImpl.this);

				Map<ComponentType, List<RoicComponent>> arrayMap = allComponents
						.stream()
						.flatMap(c -> c.getRoicComponents().stream())
						.collect(
								Collectors.groupingBy(c -> c.getComponentType()));

				Map<ComponentType, RoicComponent> result = new EnumMap<>(
						ComponentType.class);

				arrayMap.entrySet().forEach(
						e -> {
							List<RoicComponent> list = e.getValue();
							result.put(
									e.getKey(),
									list.get(0).add(
											list.subList(1, list.size())));
						});

				return result;
			}

			private RoicComponent sumNetworkCurves(
					Collection<RoicNetworkModel> models) {

				return networkCurves.add(StreamUtil.map(models,
						RoicNetworkModel::getNetworkCurves));

			}

			@Override
			public RoicNetworkModel apply() {
				return new RoicNetworkModelImpl(type, analysisPeriod,
						sumComponents(models), sumNetworkCurves(models),
						getSources());
			}
		};
	}

	@Override
	public Transformer difference() {
		return new AbstractTransformerImpl() {
			@Override
			public RoicNetworkModel apply() {
				Map<ComponentType, RoicComponent> result = new EnumMap<>(
						ComponentType.class);

				return new RoicNetworkModelImpl(type, analysisPeriod, result,
						networkCurves.minus(models.iterator().next()
								.getNetworkCurves()), getSources());
			}
		};
	}
	*/

	@Override
	public Transformer<RoicNetworkModel> add(NetworkAnalysisType type) {
		return ModelOp.sumRoicNetworkModels(type).add(this) ;
		
	}

	@Override
	public RoicNetworkModel minus(RoicNetworkModel other) {
		return ModelOp.minus(this, other) ;
	}

}
