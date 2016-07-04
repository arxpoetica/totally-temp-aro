package com.altvil.aro.service.roic.analysis.builder.config.defaults;

import com.altvil.aro.service.roic.analysis.builder.component.ComponentInput;
import com.altvil.aro.service.roic.analysis.builder.config.AnalysisCode;
import com.altvil.aro.service.roic.analysis.builder.config.impl.AbstractConfig;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.op.Op;

public class BasicComponentConfig extends AbstractConfig<ComponentInput> {

	public BasicComponentConfig(ComponentType componentType) {
		super(componentType);
	}

	@Override
	protected AbstractConfig<ComponentInput>.OutputRegistry assemble(
			AbstractConfig<ComponentInput>.OutputRegistry registry) {
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
				.add(AnalysisCode.houseHolds_global_count);

		return registry;
	}

	@Override
	protected CurveRegistry<ComponentInput> assemble(
			CurveRegistry<ComponentInput> assembler) {
		super.assemble(assembler);

		assembler.add(AnalysisCode.penetration,
				(inputs) -> Op.penetration(inputs.getPenetration()));

		assembler.add(AnalysisCode.premises_passed,
				(inputs) -> Op.constCurve(inputs.getEntityCount()));

		assembler.add(AnalysisCode.subscribers_count, (inputs) -> Op.multiply(
				AnalysisCode.penetration, AnalysisCode.houseHolds));

		assembler.add(AnalysisCode.subscribers_penetration,
				(inputs) -> Op.multiply(AnalysisCode.penetration, 1.0));

		assembler.add(
				AnalysisCode.houseHolds,
				(inputs) -> Op.growCurve(inputs.getEntityCount(),
						inputs.getEntityGrowth()));

		assembler.add(AnalysisCode.houseHolds_global_count,
				(inputs) -> Op.ref(AnalysisCode.houseHolds));

		assembler.add(AnalysisCode.revenue, (inputs) -> Op.revenue(
				AnalysisCode.houseHolds, AnalysisCode.penetration,
				AnalysisCode.arpu));

		assembler.add(AnalysisCode.new_connections_count,
				(inputs) -> Op.constCurve(0));

		assembler.add(AnalysisCode.new_connections_cost,
				(inputs) -> Op.constCurve(0));

		assembler.add(AnalysisCode.arpu,
				(inputs) -> Op.constCurve(inputs.getArpu()));

		assembler.add(
				AnalysisCode.opex_expenses,
				(inputs) -> Op.multiply(AnalysisCode.revenue,
						inputs.getOpexPercent()));

		assembler.add(
				AnalysisCode.maintenance_expenses,
				(inputs) -> Op.multiply(AnalysisCode.revenue,
						inputs.getMaintenancePercent()));

		return assembler;

	}

}
