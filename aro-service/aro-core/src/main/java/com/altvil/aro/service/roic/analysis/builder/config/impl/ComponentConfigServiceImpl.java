package com.altvil.aro.service.roic.analysis.builder.config.impl;


public class ComponentConfigServiceImpl {
/*
	private interface ComponentConfig {
		void assemble(ComponentAssembler assembler, ComponentInput input);
	}

	private interface DerivedComponentConfig {
		void assemble(AggregateAssembler assembler);
	}
	
	

	private void register(ComponentType ct, ComponentConfig config) {
	}

	private void init() {
		register(ComponentType.household, new BasicComponent() {
			@Override
			protected void assembleOutputs(ComponentAssembler assembler) {
				super.assembleOutputs(assembler);
			}

			@Override
			protected void assembleCurves(ComponentAssembler assembler,
					ComponentInput inputs) {
				super.assembleCurves(assembler, inputs);
			}

		});
		register(ComponentType.business, new BasicComponent() {
			@Override
			protected void assembleOutputs(ComponentAssembler assembler) {
				super.assembleOutputs(assembler);
			}

			@Override
			protected void assembleCurves(ComponentAssembler assembler,
					ComponentInput inputs) {
				super.assembleCurves(assembler, inputs);
			}
		});
		register(ComponentType.cellTower, new BasicComponent() {
			@Override
			protected void assembleOutputs(ComponentAssembler assembler) {
				super.assembleOutputs(assembler);
			}

			@Override
			protected void assembleCurves(ComponentAssembler assembler,
					ComponentInput inputs) {
				super.assembleCurves(assembler, inputs);
			}
		});
	}
	
	
	private void register(ComponentType ct, DerivedComponentConfig config) {
		
	}
	*/
	
//	private void initDerived() {
//		register(ComponentType.network, new DefaultDerivedComponentConfig(){
//
//			@Override
//			protected void assembleOutputs(AggregateAssembler assembler) {
//				// TODO Auto-generated method stub
//				super.assembleOutputs(assembler);
//			}
//
//			@Override
//			protected void assembleCurves(AggregateAssembler assembler) {
//				assembler.add(AnalysisCode.cost,
//						Op.constCurveTruncated(0, 1));
//
//				assembler.add(AnalysisCode.penetration, Op.divide(
//						AnalysisCode.subscribers_penetration,
//						AnalysisCode.houseHolds_global_count));
//
//
//				assembler.add(AnalysisCode.cashflow, Op.cashFlow(
//						AnalysisCode.revenue, 
//						AnalysisCode.maintenance_expenses,
//						AnalysisCode.opex_expenses,
//						AnalysisCode.new_connections_cost,
//						AnalysisCode.cost));
//
//				assembler.addOutput(AnalysisCode.cost);
//			}
//			
//		}) ;
//	}

//	private class DefaultDerivedComponentConfig implements DerivedComponentConfig{
//		
//		@Override
//		public void assemble(AggregateAssembler assembler) {
//			assembleCurves(assembler);
//			assembleOutputs(assembler) ;
//		}
//
//		protected void assembleOutputs(AggregateAssembler assembler) {
//			assembler.sumCurves(assembler.getBaseCurves()) ;
//			
//			assembler.add(AnalysisCode.penetration, Op.divide(
//					AnalysisCode.subscribers_penetration,
//					AnalysisCode.houseHolds_global_count));
//		}
//
//		protected void assembleCurves(AggregateAssembler assembler) {
//			assembler.getBaseCurves().forEach(assembler::addOutput) ;
//		}
//
//	}

//	private class BasicComponent {
//
//		
//
//		protected void assembleOutputs(ComponentAssembler assembler) {
//			assembler.addOutput(AnalysisCode.penetration)
//					.addOutput(AnalysisCode.revenue)
//					.addOutput(AnalysisCode.houseHolds)
//					.addOutput(AnalysisCode.arpu)
//					.addOutput(AnalysisCode.premises_passed)
//					.addOutput(AnalysisCode.subscribers_count)
//					.addOutput(AnalysisCode.subscribers_penetration)
//					.addOutput(AnalysisCode.opex_expenses)
//					.addOutput(AnalysisCode.maintenance_expenses)
//
//					.addOutput(AnalysisCode.new_connections_count)
//					.addOutput(AnalysisCode.new_connections_cost)
//					.addOutput(AnalysisCode.houseHolds_global_count);
//		}
//
//		protected void assembleCurves(ComponentAssembler assembler,
//				ComponentInput inputs) {
//			assembler.add(AnalysisCode.penetration,
//					Op.penetration(inputs.getPenetration()));
//
//			assembler.add(AnalysisCode.premises_passed,
//					Op.constCurve(inputs.getEntityCount()));
//
//			assembler.add(AnalysisCode.subscribers_count, Op.multiply(
//					AnalysisCode.penetration, AnalysisCode.houseHolds));
//
//			assembler.add(AnalysisCode.subscribers_penetration,
//					Op.multiply(AnalysisCode.penetration, 1.0));
//
//			assembler.add(
//					AnalysisCode.houseHolds,
//					Op.growCurve(inputs.getEntityCount(),
//							inputs.getEntityGrowth()));
//
//			assembler.add(AnalysisCode.houseHolds_global_count,
//					Op.ref(AnalysisCode.houseHolds));
//
//			assembler.add(AnalysisCode.revenue, Op.revenue(
//					AnalysisCode.houseHolds, AnalysisCode.penetration,
//					AnalysisCode.arpu));
//
//			assembler.add(AnalysisCode.new_connections_count, Op.constCurve(0));
//
//			assembler.add(AnalysisCode.new_connections_cost, Op.constCurve(0));
//
//			assembler.add(AnalysisCode.arpu, Op.constCurve(inputs.getArpu()));
//
//			assembler.add(AnalysisCode.opex_expenses,
//					Op.multiply(AnalysisCode.revenue, inputs.getOpexPercent()));
//
//			assembler.add(
//					AnalysisCode.maintenance_expenses,
//					Op.multiply(AnalysisCode.revenue,
//							inputs.getMaintenancePercent()));
//
//		}
//
//	}

}
