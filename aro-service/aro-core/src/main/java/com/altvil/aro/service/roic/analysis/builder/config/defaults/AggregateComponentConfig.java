package com.altvil.aro.service.roic.analysis.builder.config.defaults;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.builder.config.AnalysisCode;
import com.altvil.aro.service.roic.analysis.builder.config.impl.AbstractConfig;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.op.Op;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;
import com.altvil.utils.StreamUtil;

public class AggregateComponentConfig<T> extends AbstractConfig<T> {

	public AggregateComponentConfig(ComponentType componentType) {
		super(componentType);
	}

	@Override
	public Collection<CurveIdentifier> getGroupByCurves(
			Collection<CurveIdentifier> existingCurves) {
		return StreamUtil.filter(existingCurves,
				id -> !id.equals(AnalysisCode.penetration) || !id.equals(AnalysisCode.subscribers_penetration));
	}

	@Override
	protected AbstractConfig<T>.OutputRegistry assemble(
			AbstractConfig<T>.OutputRegistry registry) {
		return super.assemble(registry);
	}

	@Override
	protected CurveRegistry<T> assemble(CurveRegistry<T> assembler) {
		super.assemble(assembler);

		assembler.add(AnalysisCode.penetration, (inputs) -> Op.divide(
				AnalysisCode.subscribers_penetration,
				AnalysisCode.houseHolds_global_count));
		
		assembler.add(AnalysisCode.subscribers_penetration, (inputs) -> Op.divide(
				AnalysisCode.subscribers_count,
				AnalysisCode.houseHolds_global_count));


		return assembler;
	}
	

}
