package com.altvil.aro.service.roic.analysis.builder.impl;

import java.util.Collection;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;

import com.altvil.aro.service.roic.AnalysisPeriod;
import com.altvil.aro.service.roic.StreamModel;
import com.altvil.aro.service.roic.analysis.AnalysisCode;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.AnalysisService;
import com.altvil.aro.service.roic.analysis.builder.NetworkAnalysisBuilder;
import com.altvil.aro.service.roic.analysis.impl.DefaultAnalyisRow;
import com.altvil.aro.service.roic.analysis.impl.StreamAssemblerImpl;
import com.altvil.aro.service.roic.analysis.impl.StreamModelImpl;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.analysis.model.impl.ComponentModelImpl;
import com.altvil.aro.service.roic.analysis.model.impl.RoicNetworkModelImpl;
import com.altvil.aro.service.roic.analysis.spi.StreamAssembler;
import com.altvil.utils.StreamUtil;

public class NetworkAnalysisBuilderImpl implements NetworkAnalysisBuilder {

	private Map<ComponentType, RoicComponent> roicComponents = new EnumMap<>(
			ComponentType.class);

	private AnalysisService analysisService;

	private NetworkAnalysisType type = NetworkAnalysisType.undefined;

	private double fixedCost = 0;

	private boolean assigned = false;
	private AnalysisPeriod analysisPeriod;

	public NetworkAnalysisBuilderImpl(AnalysisService analysisService) {
		super();
		this.analysisService = analysisService;
	}

	@Override
	public NetworkAnalysisBuilder setAnalysisPeriod(AnalysisPeriod period) {
		this.analysisPeriod = period;
		this.assigned = true;
		return this;
	}

	@Override
	public NetworkAnalysisBuilder setNetworkAnalysisType(
			NetworkAnalysisType type) {
		this.type = type;
		return this;
	}

	@Override
	public NetworkAnalysisBuilder addRoicComponent(RoicComponent component) {

		if (!assigned) {
			assigned = true;
			this.analysisPeriod = component.getAnalysisPeriod();
		}

		roicComponents.put(component.getComponentType(), component);
		return this;
	}

	@Override
	public NetworkAnalysisBuilder setFixedCosts(double costs) {
		this.fixedCost = costs;
		return this;
	}

	@Override
	public RoicNetworkModel build() {
		return new RoicNetworkModelImpl(type, roicComponents,
				createNetworkComponent());
	}

	private RoicComponent createNetworkComponent() {

		Map<CurveIdentifier, AnalysisRow> result = new HashMap<>();
		result.put(AnalysisCode.cost, createCostRow());
		result.put(AnalysisCode.revenue, sumCurves(AnalysisCode.revenue));

		return new ComponentModelImpl(analysisPeriod, ComponentType.undefined,
				new StreamModelImpl(analysisPeriod, result));

	}

	private AnalysisRow createCostRow() {
		StreamAssembler assembler = new StreamAssemblerImpl();
		StreamModel sm = assembler.setAnalysisPeriod(analysisPeriod)
				.add(AnalysisCode.cost, analysisService.createCost(fixedCost))
				.addOutput(AnalysisCode.cost).resolveAndBuild();
		return sm.getAnalysisRow(AnalysisCode.cost);
	}

	private AnalysisRow sumCurves(CurveIdentifier id) {

		Collection<AnalysisRow> rows = StreamUtil.map(roicComponents.values(),
				c -> c.getAnalysisRow(id));

		return DefaultAnalyisRow.sum(analysisPeriod.getPeriods(), rows);

	}

}
