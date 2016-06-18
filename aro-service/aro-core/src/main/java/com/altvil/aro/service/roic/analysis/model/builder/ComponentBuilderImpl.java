package com.altvil.aro.service.roic.analysis.model.builder;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.AnalysisService;
import com.altvil.aro.service.roic.analysis.calc.AnalysisCode;
import com.altvil.aro.service.roic.analysis.calc.StreamAssembler;
import com.altvil.aro.service.roic.analysis.calc.impl.StreamAssemblerImpl;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.impl.ComponentModelImpl;
import com.altvil.aro.service.roic.analysis.op.Op;
import com.altvil.aro.service.roic.model.NetworkType;

public class ComponentBuilderImpl implements ComponentBuilder {

	
	private StreamAssembler roicAssembler;

	private ComponentType componentType = ComponentType.undefined;
	private ComponentInput inputs;
	private AnalysisPeriod analysisPeriod;
	private NetworkType networkType;

	public ComponentBuilderImpl(AnalysisService analysisService,
			NetworkType networkType) {
		super();
		roicAssembler = new StreamAssemblerImpl();
		this.networkType = networkType;
	}

	@Override
	public ComponentBuilder setAnalysisPeriod(AnalysisPeriod period) {
		roicAssembler.setAnalysisPeriod(analysisPeriod = period);
		return this;
	}

	@Override
	public ComponentBuilder setRoicModelInputs(ComponentInput inputs) {
		this.inputs = inputs;
		return this;
	}

	@Override
	public ComponentBuilder setComponentType(ComponentType type) {

		if (type == null) {
			throw new NullPointerException();
		}

		this.componentType = type;
		return this;
	}

	@Override
	public RoicComponent build() {

		assemble(inputs);
		assignOutputs();

		return new ComponentModelImpl(analysisPeriod, componentType,
				roicAssembler.resolveAndBuild());

	}

	// Revenue By Network By LocationType
	// Premises Passed Locations connected By LocationType
	// Subscribers By EntityType ( Penetration * Location )
	// Subscribers By EntityType ( Penetration )

	// CAPEX (2016)
	// Network Deployment
	// Connect Crazy Formula By Year
	// Revenue * 4.23%

	private void assignOutputs() {
		roicAssembler.addOutput(AnalysisCode.penetration)
				.addOutput(AnalysisCode.revenue)
				.addOutput(AnalysisCode.houseHolds)
				.addOutput(AnalysisCode.arpu)
				.addOutput(AnalysisCode.premises_passed)
				.addOutput(AnalysisCode.subscribers_count)
				.addOutput(AnalysisCode.subscribers_penetration)
				.addOutput(AnalysisCode.opex_expenses)
				.addOutput(AnalysisCode.maintenance_expenses)

				.addOutput(AnalysisCode.new_connections_count)
				.addOutput(AnalysisCode.new_connections_cost);

	}

	private void assemble(ComponentInput inputs) {
		roicAssembler.add(AnalysisCode.penetration,
				Op.penetration(inputs.getPenetration()));

		roicAssembler.add(AnalysisCode.premises_passed,
				Op.constCurve(inputs.getEntityCount()));

		roicAssembler.add(AnalysisCode.subscribers_count,
				Op.times(AnalysisCode.penetration, AnalysisCode.houseHolds));

		roicAssembler.add(AnalysisCode.subscribers_penetration,
				Op.times(AnalysisCode.penetration, 1.0));

		roicAssembler
				.add(AnalysisCode.houseHolds,
						Op.growCurve(inputs.getEntityCount(),
								inputs.getEntityGrowth()));

		roicAssembler.add(AnalysisCode.revenue, Op.revenue(
				AnalysisCode.houseHolds, AnalysisCode.penetration,
				AnalysisCode.arpu));

		// TODO Move to Strategy
		if (networkType == NetworkType.Fiber) {
			roicAssembler.add(AnalysisCode.new_connections_count, Op
					.connectedHouseHoldsYearly(15, inputs.getPenetration()
							.getEndPenetration(), inputs.getChurnRate(), inputs
							.getEntityCount()));

			roicAssembler.add(
					AnalysisCode.new_connections_cost,
					Op.times(AnalysisCode.new_connections_count,
							inputs.getConnectionCost()));

		} else {
			
			roicAssembler.add(AnalysisCode.new_connections_count,
					Op.constCurve(0));

			roicAssembler.add(AnalysisCode.new_connections_cost,
					Op.constCurve(0));
		}

		roicAssembler.add(AnalysisCode.arpu, Op.constCurve(inputs.getArpu()));

		roicAssembler.add(AnalysisCode.opex_expenses,
				Op.times(AnalysisCode.revenue, inputs.getOpexPercent()));

		roicAssembler.add(AnalysisCode.maintenance_expenses,
				Op.times(AnalysisCode.revenue, inputs.getMaintenancePercent()));

	}
}
