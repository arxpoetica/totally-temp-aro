package com.altvil.aro.service.optimize.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import com.altvil.aro.service.entity.FDHEquipment;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.optimize.model.FiberAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.optimize.spi.AnalysisContext;

//TODO: to be removed
@Deprecated
public class FullFdhAssigmnent extends AbstractEquipmentAssignment {

	private FdhAssignment fdhAssignment;
	private FiberAssignment fiberAssignment;
	private Collection<FdtAssignment> fdtAssignments;

	private FullFdhAssigmnent(GraphEdgeAssignment ga) {
		super(ga);
	}

	public static FullFdhAssigmnent create(GraphMapping fdhMapping,
			FiberAssignment fiberAssignment) {

		Builder b = build(fdhMapping.getGraphAssignment()).setFiberAssignment(
				fiberAssignment).setFdhAssignment(
				new FdhAssignment(fdhMapping.getGraphAssignment(),
						(FDHEquipment) fdhMapping.getAroEntity()));

		fdhMapping.getChildren().forEach(m -> {
			b.add(new FdtAssignment(m));
		});

		return b.build();

	}

	public static Builder build(GraphEdgeAssignment ga) {
		return new Builder(new FullFdhAssigmnent(ga));
	}

	public FdhAssignment getFdhAssignment() {
		return fdhAssignment;
	}

	public Collection<FdtAssignment> getFdtAssigmnents() {
		return fdtAssignments;
	}

	@Override
	public double getCost(AnalysisContext ctx, int fiberRequiredStrands) {
		double sum = 0;

		sum += fiberAssignment.getCost(ctx, fiberRequiredStrands);
		sum += fdhAssignment.getCost(ctx, fiberRequiredStrands);

		for (FdtAssignment fdt : fdtAssignments) {
			sum += fdt.getCost(ctx, fiberRequiredStrands);
		}

		return sum;
	}

	public FiberAssignment getFiberAssignment() {
		return fiberAssignment;
	}

	@Override
	public GraphMapping serialize(GeneratingNode node, ModelSerializer serializer) {
		return serializer.serialize(node, this);
	}

	@Override
	public int getRequiredIncomingFiberStrands(AnalysisContext ctx, int requiredOutgoingFiberStrands) {
		return fdhAssignment.getRequiredIncomingFiberStrands(ctx, requiredOutgoingFiberStrands);
	}

	public static class Builder {
		private FullFdhAssigmnent fullFdhAssigmnent;
		private List<FdtAssignment> fdts = new ArrayList<>();

		public Builder(FullFdhAssigmnent fullFdhAssigmnent) {
			super();
			this.fullFdhAssigmnent = fullFdhAssigmnent;
		}

		public Builder setFiberAssignment(FiberAssignment fa) {
			fullFdhAssigmnent.fiberAssignment = fa;
			return this;
		}

		public void add(FdtAssignment fdt) {
			fdts.add(fdt);
		}

		public Builder setFdhAssignment(FdhAssignment fdh) {
			fullFdhAssigmnent.fdhAssignment = fdh;
			return this;
		}

		public FullFdhAssigmnent build() {
			return fullFdhAssigmnent;
		}

	}
}
