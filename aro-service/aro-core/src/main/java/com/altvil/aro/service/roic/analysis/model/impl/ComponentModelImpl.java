package com.altvil.aro.service.roic.analysis.model.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.calc.StreamModel;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.registry.CurvePath;
import com.altvil.aro.service.roic.analysis.registry.impl.AbstractCurveRegistry;
import com.altvil.utils.StreamUtil;

public class ComponentModelImpl extends AbstractCurveRegistry implements
		RoicComponent {

	private AnalysisPeriod analysisPeriod;
	private ComponentType type;
	private StreamModel streamModel;

	public ComponentModelImpl(AnalysisPeriod analysisPeriod,
			ComponentType type, StreamModel streamModel) {
		super(type.name());

		if (type == null || analysisPeriod == null) {
			throw new NullPointerException();
		}

		this.analysisPeriod = analysisPeriod;
		this.type = type;
		this.streamModel = streamModel;
	}

	@Override
	public String getNameSpace() {
		return super.getNameSpace();
	}

	@Override
	public RoicComponent and(Set<CurveIdentifier> ids) {
		return new ComponentModelImpl(analysisPeriod, type,
				streamModel.mask(ids));
	}

	@Override
	public AnalysisRow getAnalysisRow(CurvePath path) {
		return getAnalysisRow(path.nextCurveIdentifier());
	}

	@Override
	public StreamModel getStreamModel() {
		return streamModel;
	}

	@Override
	public Collection<CurveIdentifier> getCurveIdentifiers() {
		return streamModel.getCurveIdentifiers();
	}

	@Override
	public ComponentType getComponentType() {
		return type;
	}

	@Override
	public AnalysisRow getAnalysisRow(CurveIdentifier id) {
		return streamModel.getAnalysisRow(id);
	}

	@Override
	public AnalysisPeriod getAnalysisPeriod() {
		return analysisPeriod;
	}

	@Override
	public RoicComponent add(RoicComponent other) {
		return new ComponentModelImpl(analysisPeriod, type,
				streamModel.add(other.getStreamModel()));
	}

	@Override
	public RoicComponent minus(RoicComponent other) {
		return new ComponentModelImpl(analysisPeriod, type,
				streamModel.minus(other.getStreamModel()));
	}

	@Override
	public RoicComponent add(Collection<RoicComponent> others) {
		List<RoicComponent> allComponents = new ArrayList<>(others) ;
		allComponents.add(this) ;
		return new ComponentModelImpl(analysisPeriod, ComponentType.network,
				streamModel.add(StreamUtil.map(allComponents,
						RoicComponent::getStreamModel)));
	}
}
