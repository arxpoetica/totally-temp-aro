package com.altvil.aro.service.roic.analysis.builder.impl;

import java.util.Collection;
import java.util.Map;

import com.altvil.aro.service.roic.StreamModel;
import com.altvil.aro.service.roic.analysis.AnalysisCode;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.AnalysisService;
import com.altvil.aro.service.roic.analysis.RowReference;
import com.altvil.aro.service.roic.analysis.builder.AnalysisBuilder;
import com.altvil.aro.service.roic.analysis.builder.ComponentBuilder;
import com.altvil.aro.service.roic.analysis.builder.NetworkAnalysisBuilder;
import com.altvil.aro.service.roic.analysis.impl.DefaultAnalyisRow;
import com.altvil.aro.service.roic.analysis.impl.DefaultRowReference;
import com.altvil.aro.service.roic.analysis.impl.StreamAssemblerImpl;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.spi.StreamAssembler;
import com.altvil.utils.StreamUtil;

public class NetworkAnalysisBuilderImpl implements NetworkAnalysisBuilder {

	private Map<ComponentType, RoicComponent> roicComponents;

	private int startYear;
	private int period;
	private double fixedCost;
	private AnalysisService analysisService;

	@Override
	public ComponentBuilder entityAnalysisBuilder(ComponentType ct) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public AnalysisBuilder resolve() {
		
		RowReference costCurve = createCostRow() ;
		RowReference revenueCurve = sumCurves(AnalysisCode.revenue) ;
		
		return null;
	}

	private RowReference createCostRow() {
		StreamAssembler assembler = new StreamAssemblerImpl();
		StreamModel sm = assembler.setPeriod(period).setStartYear(startYear)
				.add(AnalysisCode.cost, analysisService.createCost(fixedCost))
				.addOutput(AnalysisCode.cost).resolveAndBuild();
		return new DefaultRowReference(AnalysisCode.cost,
				sm.getAnalysisRow(AnalysisCode.cost));
	}

	private RowReference sumCurves(CurveIdentifier id) {

		Collection<AnalysisRow> rows = StreamUtil.map(roicComponents.values(),
				c -> c.getNetworkAnalysis(id).getAnalysisRow());

		return new DefaultRowReference(id, DefaultAnalyisRow.sum(period, rows));

	}

	public void resolve(ComponentBuilder builder) {
		RoicComponent component = null;
		roicComponents.put(component.getComponentType(), component);

	}

}
