package com.altvil.aro.service.roic.analysis.model.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.registry.DefaultContainerRegistry;
import com.altvil.utils.StreamUtil;

public class RoicNetworkModelImpl extends DefaultContainerRegistry implements
		RoicNetworkModel {

	private NetworkAnalysisType type;
	private Map<ComponentType, RoicComponent> map;
	private RoicComponent networkCurves;

	private Collection<RoicNetworkModel> baseModels;

	public RoicNetworkModelImpl(NetworkAnalysisType type,
			Map<ComponentType, RoicComponent> map, RoicComponent networkCurves,
			Collection<RoicNetworkModel> baseModels) {
		super(type.name());
		this.type = type;
		this.map = map;
		this.networkCurves = networkCurves;
		this.baseModels = baseModels;

		add(map.values());
		add(networkCurves);
		// add(baseModels);

	}

	public RoicNetworkModelImpl(NetworkAnalysisType type,
			Map<ComponentType, RoicComponent> map, RoicComponent networkCurves) {
		this(type, map, networkCurves, new ArrayList<>());
	}
	
	

	@Override
	public Collection<RoicComponent> getRoicComponents() {
		return map.values() ;
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
				return new RoicNetworkModelImpl(type, sumComponents(models),
						sumNetworkCurves(models), getSources());
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

				return new RoicNetworkModelImpl(type, result,
						networkCurves.minus(models.iterator().next()
								.getNetworkCurves()), getSources());
			}
		};
	}

	private abstract class AbstractTransformerImpl implements Transformer {

		protected NetworkAnalysisType type;
		protected List<RoicNetworkModel> models = new ArrayList<RoicNetworkModel>();
		protected Set<CurveIdentifier> ids;

		@Override
		public Transformer setType(NetworkAnalysisType type) {
			this.type = type;
			return this;
		}

		protected List<RoicNetworkModel> getSources() {
			java.util.List<RoicNetworkModel> sources = new ArrayList<>();
			sources.add(RoicNetworkModelImpl.this);
			sources.addAll(models);
			return sources;
		}

		@Override
		public Transformer addModel(RoicNetworkModel model) {
			models.add(model);
			return this;
		}

		@Override
		public Transformer setModel(RoicNetworkModel model) {
			models.clear();
			models.add(model);
			return this;
		}

		@Override
		public Transformer setCurveIds(Collection<CurveIdentifier> ids) {
			this.ids = new HashSet<>(ids);
			return this;
		}

	}

}
