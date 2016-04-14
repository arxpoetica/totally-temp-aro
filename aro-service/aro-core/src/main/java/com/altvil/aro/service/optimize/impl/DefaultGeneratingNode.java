package com.altvil.aro.service.optimize.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.optimize.impl.DefaultFiberCoverage.Accumulator;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.optimize.model.EquipmentAssignment;
import com.altvil.aro.service.optimize.model.FiberAssignment;
import com.altvil.aro.service.optimize.model.FiberConsumer;
import com.altvil.aro.service.optimize.model.FiberProducer;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.AnalysisContext;
import com.altvil.aro.service.optimize.spi.NetworkAnalysis;

public class DefaultGeneratingNode implements GeneratingNode {

	private DemandCoverage directCoverage;
	private AnalysisContext ctx;
	private DefaultGeneratingNode parent;
	private DemandCoverage coverage = null;
	private EquipmentAssignment equipmentAssigment;
	private FiberAssignment fiberAssignment = null;
	private double capex;
	private FiberConsumer fiberConsumer;
	private FiberProducer fiberProducer;
	private List<GeneratingNode> children;
	private int recalcMode = 0;

	protected DefaultGeneratingNode(AnalysisContext ctx,
			EquipmentAssignment equipmentAssigment,
			FiberAssignment fiberAssignment,
			DefaultGeneratingNode parent,
			List<GeneratingNode> children) {

		this.ctx = ctx;
		this.equipmentAssigment = equipmentAssigment;
		this.fiberAssignment = fiberAssignment;
		this.parent = parent;
		this.children = children;
		this.directCoverage = equipmentAssigment.getDirectCoverage(ctx);

	}
	
	

	@Override
	public AnalysisContext getAnalysisContext() {
		return ctx ;
	}

	@Override
	public FiberProducer getFiberProducer() {
		return fiberProducer;
	}

	@Override
	public FiberConsumer getFiberConsumer() {
		return fiberConsumer;
	}

	public DefaultGeneratingNode(AnalysisContext ctx,
			EquipmentAssignment equipmentAssigment, FiberAssignment fiberAssignment, DefaultGeneratingNode parent) {
		this(ctx, equipmentAssigment, fiberAssignment, parent, new ArrayList<>());
	}

	public static Builder build(AnalysisContext ctx,
			EquipmentAssignment assignment, FiberAssignment fiberAssignment) {
		return new BuilderImpl(new DefaultGeneratingNode(ctx, assignment,fiberAssignment,   null));
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
		/*
		 * if (getEquipmentAssignment().rebuildNetwork(this, ctx)) {
		 * ctx.rebuildRequired(this); } else {
		 */
		try {
			recalcMode++;
			new ArrayList<>(children).forEach(GeneratingNode::remove);
			ctx.removeFromAnalysis(this);
			if (parent != null) {
				parent.removeChild(this);
			}
		} finally {
			recalcMode--;
		}

	}

	private void _recalc() {
		/*
		 * add required fiber strands to this class required fiber strands=
		 * equipmentAssigment.getRequiredIncomingFiberStrands(sum(children
		 * required strands) + Math.ceil(direct
		 * coverage.getCoverage().getFiberDemand()) then change getCapex methods
		 * so they take required fiber strands instead of demand coverage
		 */
		this.fiberConsumer = this.aggregateIncomingFiberStrands(directCoverage);
		this.fiberProducer = this.equipmentAssigment.createFiberProducer(ctx,
				this.getFiberAssignment().getFiberType(), fiberConsumer);

		this.coverage = calcFiberCoverage(children);
		double nodeCapex = calculateNodeCapex(fiberConsumer, fiberProducer,
				this.coverage);

		double childrenCapex = getChildren().stream()
				.mapToDouble(GeneratingNode::getCapex).sum();

		System.out
				.println("Capex " + nodeCapex + " => "
						+ (nodeCapex + childrenCapex) + " coverage = "
						+ coverage.getDemand() + " fc="
						+ fiberProducer.getFiberCount());

		this.capex = nodeCapex + childrenCapex;

	}

	private DemandCoverage calcFiberCoverage(Collection<GeneratingNode> children) {

		Accumulator acc = DefaultFiberCoverage.accumulate();

		if (directCoverage != null) {
			acc.add(directCoverage);
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
		return recalcMode == 0;
	}

	public void recalc() {

		if (!isRecalcMode()) {
			return;
		}

		boolean removed = false;

		ctx.changing_start(this);

		if (isJunctionNode() && this.parent != null) {
			if (this.getChildren().size() == 0) {
				this.parent.removeChild(this);
				removed = true;
			} else if (this.getChildren().size() == 1) {
				/*
				 * GeneratingNode childNode = children.get(0);
				 * 
				 * ctx.changing_start(childNode); GeneratingNode newNode =
				 * childNode.relink(parent, fiberAssignment);
				 * this.parent.replace(this, newNode);
				 * ctx.changing_end(newNode);
				 * 
				 * removed = true;
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

	public GeneratingNode initReclc() {
		_recalc();

		ctx.addToAnalysis(this);

		if (parent != null) {
			parent._addChild(this);
		}

		return this;
	}

	protected FiberConsumer aggregateIncomingFiberStrands(
			DemandCoverage directCoverage) {

		DefaultFiberConsumer.Builder b = DefaultFiberConsumer.build();

		children.forEach(c -> {
			b.add(c.getFiberProducer());
		});

		b.add(fiberAssignment.getFiberType(), directCoverage
				.getRequiredFiberStrands(fiberAssignment.getFiberType()));

		return b.build();

	}

	protected double calculateNodeCapex(FiberConsumer consumer,
			FiberProducer producer, DemandCoverage coverage) {
		return equipmentAssigment.getCost(ctx, this.fiberConsumer,
				this.fiberProducer, coverage)
				+ fiberAssignment.getCost(ctx, this.fiberConsumer,
						this.fiberProducer, coverage);
	}

	protected void _addChild(GeneratingNode child) {
		if (children.contains(child)) {
			children.remove(child);
			System.out.println("Cloned Children");
		}
		this.children.add(child);
	}

	@Override
	public double getScore() {
		return ctx.getScoringStrategy().score(this);
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
		return equipmentAssigment == null ? false : equipmentAssigment.isJunctionNode();
	}

	public static class BuilderImpl implements Builder {

		private DefaultGeneratingNode node;

		// private List<DefaultGeneratingNode> unresolvedNodes ;

		public BuilderImpl(DefaultGeneratingNode node) {
			super();
			this.node = node;
		}
		
		

		@Override
		public boolean isInitMode() {
			return false;
		}



		@Override
		public void setInitMode(boolean mode) {
		}



		@Override
		public Builder addCompositeChild(FiberAssignment fiberAssignment) {
			return new CompositeNodeBuilder(new CompositeGeneratingNode(
					node.getAnalysisContext(), new NoEquipment(), fiberAssignment, node));
		}

		@Override
		public GraphEdgeAssignment getParentAssignment() {
			GeneratingNode parentNode = node.getParent();
			if (parentNode != null) {
				EquipmentAssignment assignment = parentNode
						.getEquipmentAssignment();
				if (assignment != null) {
					return assignment.getGraphAssignment();
				}
			}
			return null;
		}

		@Override
		public GraphEdgeAssignment getAssignment() {
			EquipmentAssignment assignment = node.getEquipmentAssignment();
			if (assignment != null) {
				return assignment.getGraphAssignment();
			}
			return null;
		}
		
		
		@Override
		public GeneratingNode build() {
			return node.initReclc();
		}
		
		

		@Override
		public Builder addChild(FiberAssignment fiberAssignment,
				EquipmentAssignment equipment) {
			return new BuilderImpl(new DefaultGeneratingNode(node.ctx,
					equipment, fiberAssignment, node));
		}

	}

}
