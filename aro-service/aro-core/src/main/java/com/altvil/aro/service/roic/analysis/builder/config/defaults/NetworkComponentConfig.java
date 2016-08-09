package com.altvil.aro.service.roic.analysis.builder.config.defaults;

import java.util.Collection;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

import com.altvil.aro.service.roic.analysis.builder.config.AnalysisCode;
import com.altvil.aro.service.roic.analysis.builder.config.impl.AbstractConfig;
import com.altvil.aro.service.roic.analysis.builder.network.RoicInputs;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.op.Op;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public class NetworkComponentConfig extends AbstractConfig<RoicInputs> {

	private Set<? extends CurveIdentifier> excludedGroupBy;

	public NetworkComponentConfig() {
		super(ComponentType.network);
		this.excludedGroupBy =  EnumSet.of(AnalysisCode.penetration, AnalysisCode.subscribers_penetration) ;
	}

	@Override
	public Collection<CurveIdentifier> getGroupByCurves(
			Collection<CurveIdentifier> existingCurves) {
		return existingCurves.stream()
				.filter(id -> !excludedGroupBy.contains(id))
				.collect(Collectors.toList());
	}

	@Override
	protected CurveRegistry<RoicInputs> assemble(
			CurveRegistry<RoicInputs> assembler) {
		super.assemble(assembler);

		assembler.add(AnalysisCode.cost,
				(inputs) -> Op.constCurveTruncated(inputs.getFixedCost(), 1));

		assembler.add(AnalysisCode.subscribers_penetration, (inputs) -> Op.divide(
				AnalysisCode.subscribers_count,
				AnalysisCode.houseHolds_global_count));

		
		assembler.add(AnalysisCode.penetration, (inputs) -> Op.divide(
				AnalysisCode.subscribers_count,
				AnalysisCode.houseHolds_global_count));
		
		assembler.add(AnalysisCode.penetration, (inputs) -> Op.constCurve(666.0))  ;
		
		assembler.add(AnalysisCode.subscribers_penetration, (inputs) -> Op.constCurve(666.0))  ;
		

		assembler.add(AnalysisCode.cashflow, (inputs) -> Op.cashFlow(
				AnalysisCode.revenue, AnalysisCode.maintenance_expenses,
				AnalysisCode.opex_expenses, AnalysisCode.new_connections_cost,
				AnalysisCode.cost));

		return assembler;
	}

	@Override
	protected OutputRegistry assemble(OutputRegistry registry) {

		super.assemble(registry);

		registry.add(AnalysisCode.penetration).add(AnalysisCode.revenue)
				.add(AnalysisCode.houseHolds).add(AnalysisCode.arpu)
				.add(AnalysisCode.premises_passed)
				.add(AnalysisCode.subscribers_count)
				.add(AnalysisCode.subscribers_penetration)
				.add(AnalysisCode.opex_expenses)
				.add(AnalysisCode.maintenance_expenses)

				.add(AnalysisCode.new_connections_count)
				.add(AnalysisCode.new_connections_cost)
				.add(AnalysisCode.houseHolds_global_count)
				.add(AnalysisCode.cost)

				.add(AnalysisCode.cashflow);

		return registry;
	}
}
