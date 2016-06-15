package com.altvil.aro.service.roic.analysis.model.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;

public class RoicNetworkModelImpl implements RoicNetworkModel {

	private NetworkAnalysisType type;
	private Map<ComponentType, RoicComponent> map;
	private RoicComponent networkCurves;

	private Collection<RoicNetworkModel> baseModels;

	public RoicNetworkModelImpl(NetworkAnalysisType type,
			Map<ComponentType, RoicComponent> map,
			RoicComponent networkCurves,
			Collection<RoicNetworkModel> baseModels) {
		super();
		this.type = type;
		this.map = map;
		this.networkCurves = networkCurves;
		this.baseModels = baseModels;
	}

	public RoicNetworkModelImpl(NetworkAnalysisType type,
			Map<ComponentType, RoicComponent> map,
			RoicComponent networkCurves) {
		this(type, map, networkCurves, new ArrayList<>());
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
	public AnalysisRow getAnalysisRow(ComponentType type,
			CurveIdentifier id) {
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

			@Override
			public RoicNetworkModel apply() {
				Map<ComponentType, RoicComponent> result = new EnumMap<>(
						ComponentType.class);

				for (RoicComponent component : map.values()) {
					result.put(
							component.getComponentType(),
							model.getEntityAnalysis(component.getComponentType())
									.add(model.getEntityAnalysis(component
											.getComponentType())));
				}

				return new RoicNetworkModelImpl(type, result,
						networkCurves.add(model.getNetworkCurves()),
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

				return new RoicNetworkModelImpl(type, result,
						networkCurves.minus(model.getNetworkCurves()),
						getSources());
			}
		};
	}

	private abstract class AbstractTransformerImpl implements Transformer {

		protected NetworkAnalysisType type;
		protected RoicNetworkModel model;
		protected Set<CurveIdentifier> ids;

		@Override
		public Transformer setType(NetworkAnalysisType type) {
			this.type = type;
			return this;
		}

		protected List<RoicNetworkModel> getSources() {
			java.util.List<RoicNetworkModel> sources = new ArrayList<>();
			sources.add(RoicNetworkModelImpl.this);
			sources.add(model);
			return sources;
		}

		@Override
		public Transformer setModel(RoicNetworkModel model) {
			this.model = model;
			return this;
		}

		@Override
		public Transformer setCurveIds(Collection<CurveIdentifier> ids) {
			this.ids = new HashSet<>(ids);
			return this;
		}

	}

}
