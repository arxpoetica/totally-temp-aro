package com.altvil.aro.service.roic.analysis.op;

import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.calc.StreamModel;
import com.altvil.aro.service.roic.analysis.calc.impl.StreamModelImpl;
import com.altvil.aro.service.roic.analysis.model.RoicAnalysis;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.analysis.model.builder.DefaultAnalyisRow;
import com.altvil.aro.service.roic.analysis.model.impl.ComponentModelImpl;
import com.altvil.aro.service.roic.analysis.model.impl.RoicNetworkModelImpl;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;
import com.altvil.utils.StreamUtil;

public class ModelOp {

	public static RoicNetworkModel minus(RoicNetworkModel lhs,
			RoicNetworkModel rhs) {
		Map<ComponentType, RoicComponent> result = new EnumMap<>(
				ComponentType.class);

		return new RoicNetworkModelImpl(NetworkAnalysisType.incremental,
				lhs.getAnalysisPeriod(), result, lhs.getNetworkCurves().minus(
						rhs.getNetworkCurves()));
	}

	public static RoicComponent minus(RoicComponent lhs, RoicComponent rhs) {
		return new ComponentModelImpl(lhs.getAnalysisPeriod(),
				lhs.getComponentType(), minus(lhs.getStreamModel(),
						rhs.getStreamModel()));
	}
	

	public static StreamModel minus(StreamModel lhs, StreamModel rhs) {
		Map<CurveIdentifier, AnalysisRow> result = new HashMap<>();
		for (CurveIdentifier id : lhs.getCurveIdentifiers()) {
			AnalysisRow lhsRow = lhs.getAnalysisRow(id);
			AnalysisRow rhsRow = rhs.getAnalysisRow(id);
			if (rhsRow != null) {
				lhsRow = DefaultAnalyisRow.minus(lhsRow, rhsRow);
			}
			result.put(id, lhsRow);
		}

		return new StreamModelImpl(lhs.getAnalysisPeriod(), result);
	}

	public static StreamModel sumStreams(Collection<StreamModel> others) {
		List<StreamModel> allStreams = new ArrayList<>(others);

		Map<CurveIdentifier, List<AnalysisRow>> arrayMap = new HashMap<>();
		allStreams.forEach(s -> {
			s.getCurveIdentifiers().forEach(id -> {
				List<AnalysisRow> rows = arrayMap.get(id);
				if (rows == null) {
					arrayMap.put(id, rows = new ArrayList<>());
				}
				rows.add(s.getAnalysisRow(id));
			});
		});

		Map<CurveIdentifier, AnalysisRow> result = new HashMap<>();
		arrayMap.entrySet().forEach(e -> {
			result.put(e.getKey(), DefaultAnalyisRow.sum(e.getValue()));
		});
		return new StreamModelImpl(inferAnalysisPeriod(others), result);
	}

	private static AnalysisPeriod inferAnalysisPeriod(
			Collection<? extends RoicAnalysis> others) {
		if (others.size() == 0) {
			return new AnalysisPeriod(0, 0);
		}

		return others.iterator().next().getAnalysisPeriod();
	}

	public static Transformer<RoicComponent> sumRoicComponents(
			ComponentType componentType) {
		return new AbstractTransformer<RoicComponent>() {
			@Override
			protected RoicComponent apply(AnalysisPeriod analysisPeriod,
					Collection<RoicComponent> models) {
				return new ComponentModelImpl(analysisPeriod, componentType,
						sumStreams(StreamUtil.map(models,
								RoicComponent::getStreamModel)));
			}
		};
	}

	public static Map<ComponentType, RoicComponent> sumRoicComponents(
			Collection<RoicComponent> components) {

		Map<ComponentType, List<RoicComponent>> arrayMap = components
				.stream()
				.collect(Collectors.groupingBy(RoicComponent::getComponentType));

		Map<ComponentType, RoicComponent> result = new EnumMap<>(
				ComponentType.class);
		arrayMap.entrySet().forEach(
				e -> {
					result.put(e.getKey(), sumRoicComponents(e.getKey())
							.addAll(e.getValue()).apply());
				});

		return result;

	}

	public static Transformer<RoicNetworkModel> sumRoicNetworkModels(
			NetworkAnalysisType analysisType) {
		return new AbstractTransformer<RoicNetworkModel>() {
			@Override
			protected RoicNetworkModel apply(AnalysisPeriod period,
					Collection<RoicNetworkModel> models) {

				Map<ComponentType, RoicComponent> componentGroups = sumRoicComponents(models
						.stream().flatMap(m -> m.getRoicComponents().stream())
						.collect(Collectors.toList()));

				RoicComponent networkComponent = sumRoicComponents(
						ComponentType.network).addAll(
						models.stream().map(RoicNetworkModel::getNetworkCurves)
								.collect(Collectors.toList())).apply();

				return new RoicNetworkModelImpl(analysisType, period,
						componentGroups, networkComponent, models);

			}
		};
	}

	private static abstract class AbstractTransformer<M extends RoicAnalysis>
			implements Transformer<M> {

		private List<M> models = new ArrayList<>();

		@Override
		public Transformer<M> add(M model) {
			this.models.add(model);
			return this;
		}

		@Override
		public Transformer<M> addAll(Collection<M> models) {
			this.models.addAll(models);
			return this;
		}

		@Override
		public M apply() {
			return apply(inferAnalysisPeriod(models), models);
		}

		protected abstract M apply(AnalysisPeriod period, Collection<M> models);

	}

}
