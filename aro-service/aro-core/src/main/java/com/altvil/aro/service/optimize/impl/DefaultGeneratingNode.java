package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.optimize.impl.DefaultFiberCoverage.Accumulator;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.optimize.model.EquipmentAssignment;
import com.altvil.aro.service.optimize.model.FiberAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.AnalysisContext;
import com.altvil.aro.service.optimize.spi.NetworkAnalysis;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

public class DefaultGeneratingNode implements GeneratingNode {

	private DemandCoverage directCoverage;
	private AnalysisContext ctx;
	private DefaultGeneratingNode parent;
	private boolean junctionNode;
	private DemandCoverage coverage = null;
	private EquipmentAssignment equipmentAssigment;
	private FiberAssignment fiberAssignment = null;
	private double capex;
	private List<GeneratingNode> children;
	private int recalcMode = 0 ;
	

	private int requiredFiberStrands;


	private DefaultGeneratingNode(AnalysisContext ctx,
			EquipmentAssignment equipmentAssigment,
			FiberAssignment fiberAssignment, DefaultGeneratingNode parent,
			List<GeneratingNode> children) {

		this.ctx = ctx;
		this.equipmentAssigment = equipmentAssigment;
		this.fiberAssignment = fiberAssignment;
		this.parent = parent;
		this.children = children;
		this.directCoverage = equipmentAssigment.getDirectCoverage(ctx);

	}

	private DefaultGeneratingNode(AnalysisContext ctx,
			EquipmentAssignment equipmentAssigment, DefaultGeneratingNode parent) {
		this(ctx,
				equipmentAssigment,
				null,
				parent,
				new ArrayList<>());
	}

	public static Builder build(AnalysisContext ctx,
			EquipmentAssignment assignment) {
		return new BuilderImpl(new DefaultGeneratingNode(ctx, assignment, null));
	}

	@Override
	public GeneratingNode relink(GeneratingNode parent, FiberAssignment fiber) {
		DefaultGeneratingNode node = new DefaultGeneratingNode(ctx,
				equipmentAssigment, fiberAssignment.union(fiber),
				(DefaultGeneratingNode) parent, children);
		node._recalc();
		return node;
	}

	protected void init(EquipmentAssignment equipmentAssigment,
			FiberAssignment fiberAssignment) {
		this.equipmentAssigment = equipmentAssigment;
		this.fiberAssignment = fiberAssignment;

	}

	@Override
	public void remove() {
		/*if (getEquipmentAssignment().rebuildNetwork(this, ctx)) {
			ctx.rebuildRequired(this);
		} else {*/
		try {
			recalcMode++ ;
			 new ArrayList<>(children).forEach(GeneratingNode::remove);
			ctx.removeFromAnalysis(this);
			if (parent != null) {
				parent.removeChild(this);
			}
		} finally {
			recalcMode-- ;
		}
		
	}

	private void _recalc() {
		/*
		add required fiber strands to this class
				required fiber strands=
		equipmentAssigment.getRequiredIncomingFiberStrands(sum(children required strands) + Math.ceil(direct coverage.getCoverage().getFiberDemand())
				then change getCapex methods so they take required fiber strands instead of demand coverage
*/
		int childrenFiberStrandsRequirements = getChildren().stream().mapToInt(GeneratingNode::getRequiredFiberStrands).sum();
		int directFiberDemand = (int) Math.ceil(directCoverage.getDemand());
		this.requiredFiberStrands = equipmentAssigment.getRequiredIncomingFiberStrands(ctx, childrenFiberStrandsRequirements + directFiberDemand);

		this.coverage = calcFiberCoverage(children);
		double nodeCapex = calculateNodeCapex(requiredFiberStrands);
		double childrenCapex = getChildren().stream().mapToDouble(GeneratingNode::getCapex).sum();
		this.capex = nodeCapex + childrenCapex;


	}

	private DemandCoverage calcFiberCoverage(Collection<GeneratingNode> children) {

		Accumulator acc = DefaultFiberCoverage.accumulate();

		if (directCoverage != null) {
			acc.add(directCoverage);
		}
		
		if( children.size() > 0 ) {
			int x = 10 ;
		}

        children.forEach(n -> acc.add(n.getFiberCoverage()));

		return acc.getResult();

	}

	public void replace(GeneratingNode original, GeneratingNode newNode) {
		children.remove(original);
		children.add(newNode);
		recalc();
	}
	
	
	private boolean isRecalcMode() {
		return recalcMode == 0 ;
	}

	public void recalc() {

		if( !isRecalcMode() ) {
			return ;
		}
		
		boolean removed = false;

		ctx.changing_start(this);

		if (isJunctionNode() && this.parent != null) {
			if (this.getChildren().size() == 0) {
				this.parent.removeChild(this);
				removed = true;
			} else if (this.getChildren().size() == 1) {
				/*
				GeneratingNode childNode = children.get(0);

				ctx.changing_start(childNode);
				GeneratingNode newNode = childNode.relink(parent,
						fiberAssignment);
				this.parent.replace(this, newNode);
				ctx.changing_end(newNode);

				removed = true;
				*/
			}
		}

		if (!removed) {
			_recalc();

		}
		if (this.parent != null) {
			this.parent.recalc();
		}

		ctx.changing_end(this);

	}

	public void removeChild(GeneratingNode child) {
		if (children.remove(child)) {
			recalc();
		}
	}

	protected double calculateNodeCapex(int requiredFiberStrands) {
		return equipmentAssigment.getCost(ctx, requiredFiberStrands)
				+ fiberAssignment.getCost(ctx, requiredFiberStrands);
	}


	private void _addChild(GeneratingNode child) {
		this.children.add(child);
	}

	@Override
	public double getScore() {
		return ctx.getScoringStrategy().score(this) ;
	}

	@Override
	public FiberAssignment getFiberAssignment() {
		return fiberAssignment;
	}

	@Override
	public EquipmentAssignment getEquipmentAssignment() {
		return equipmentAssigment;
	}

	@Override
	public DemandCoverage getFiberCoverage() {
		return coverage;
	}

	@Override
	public double getCapex() {
		return capex;
	}

	@Override
	public double getSuccessBasedCapex() {
		return 0;
	}

    @Override
    public int compareTo(GeneratingNode o) {
        throw new UnsupportedOperationException();
    }

	@Override
	public NetworkAnalysis getNetworkAnalysis() {
		return ctx.getNetworkAnalysis();
	}

	@Override
	public GeneratingNode getParent() {
		return parent;
	}

	@Override
	public Collection<GeneratingNode> getChildren() {
		if (children == null)
			return Collections.emptyList();
		else
			return children;
	}

	@Override
	public boolean isValueNode() {
		return !isJunctionNode();
	}

	@Override
	public boolean isJunctionNode() {
		return junctionNode;
	}

	@Override
	public int getRequiredFiberStrands() {
		return requiredFiberStrands;
	}

	public static class BuilderImpl implements Builder {

		private DefaultGeneratingNode node;

		public BuilderImpl(DefaultGeneratingNode node) {
			super();
			this.node = node;
		}


        @Override
        public Builder setJunctionNode(boolean junctionNode) {
            node.junctionNode = junctionNode;
            return this;
        }



		@Override
		public Builder setFiber(FiberAssignment fiber) {
			node.fiberAssignment = fiber;
			return this;
		}

		@Override
		public Builder setFiber(FiberType fiberType,
				Collection<AroEdge<GeoSegment>> fiber) {
			return setFiber(new DefaultFiberAssignment(fiberType, fiber));
		}

		@Override
		public GeneratingNode build() {

			node._recalc();

			node.ctx.addToAnalysis(node);

			if (node.parent != null) {
				node.parent._addChild(node);
			}

			return node;
		}

		@Override
		public Builder addChild(EquipmentAssignment equipment) {
			return new BuilderImpl(new DefaultGeneratingNode(node.ctx,
					equipment, node));
		}

	}

}
