package com.altvil.aro.service.optimize.impl;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;

@SuppressWarnings("unused")
public class SerializerImpl implements ModelSerializer {

	private NetworkModelSerializer networkModelSerializer;

	private void serialize(AroEntity toNode,
			Predicate<GeneratingNode> predicate,
			Collection<GeneratingNode> nodes) {
		nodes.forEach(n -> n.getEquipmentAssignment().serialize(n, this));
	}
	
	@Override
	public void serialize(GeneratingNode node, RootAssignment root) {
		node.getChildren().forEach(
				n -> n.getEquipmentAssignment().serialize(node, this));
	}

	@Override
	public void serialize(GeneratingNode node, CentralOfficeAssignment co) {
		push(co.getCentralOfficeEquipment(), FiberType.FEEDER);
		serialize(co.getCentralOfficeEquipment(), n -> n.getFiberAssignment()
				.getFiberType() == FiberType.FEEDER, node.getChildren());
		pop(); // Store
	}

	private void push(AroEntity root, FiberType fiberType) {
	}

	private void pop() {
	}

	@Override
	public void serialize(GeneratingNode node,
			SplitterNodeAssignment junctionAssignment) {
		serialize(junctionAssignment.getJunctionNode(), n -> true,
				node.getChildren());
	}

	@Override
	public void serialize(GeneratingNode node, FdhAssignment fdh) {

		networkModelSerializer.add(null, fdh.getFdhEquipment(), node
				.getFiberAssignment().getEdges());

		serialize(fdh.getFdhEquipment(), n -> n.getFiberAssignment()
				.getFiberType() == FiberType.FEEDER, node.getChildren());
		push(fdh.getFdhEquipment(), FiberType.DISTRIBUTION);
		serialize(fdh.getFdhEquipment(), n -> n.getFiberAssignment()
				.getFiberType() == FiberType.DISTRIBUTION, node.getChildren());
		pop(); // Store

	}

	@Override
	public void serialize(GeneratingNode node, FdtAssignment fdt) {
		networkModelSerializer.add(null, fdt.getFdtEquipment(), node
				.getFiberAssignment().getEdges());
	}

	@Override
	public void serialize(GeneratingNode node, BulkFiberTerminalAssignment bft) {
		networkModelSerializer.add(null, bft.getBftEquipment(), node
				.getFiberAssignment().getEdges());
	}

	@Override
	public void serializeJunctionNode(GeneratingNode node,
			SplitterNodeAssignment junctionAssignment) {

		serialize(junctionAssignment.getJunctionNode(), n -> true,
				node.getChildren());

	}

	@Override
	public void serialize(GeneratingNode node, RemoteTerminalAssignment rt) {

	}
	
	
	private void disentangle() {
	}

	@Override
	public void serializeComposite(GeneratingNode node, NoEquipment noEquipment) {
		Map<FiberType, List<GeneratingNode>> map = node
				.getChildren()
				.stream()
				.collect(
						Collectors.groupingBy(n -> node.getFiberAssignment()
								.getFiberType()));
		
		List<GeneratingNode> feeder = map.get(FiberType.FEEDER) ;
		if( feeder != null ) {
			feeder.forEach(f -> {
				f.getEquipmentAssignment().serialize(f, SerializerImpl.this); 
			}) ;
		}
		
		List<GeneratingNode> dist = map.get(FiberType.DISTRIBUTION) ;
		if( dist != null ) {
			dist.forEach(d -> {
				d.getEquipmentAssignment().serialize(d, SerializerImpl.this); 
			}) ;
		}
	}

	@Override
	public void serialize(GeneratingNode node, SplicePointAssignment spa) {
		push(spa.getCentralOfficeEquipment(), FiberType.FEEDER);
		serialize(spa.getCentralOfficeEquipment(), n -> n.getFiberAssignment()
				.getFiberType() == FiberType.FEEDER, node.getChildren());
		pop(); // Store
	}

	private static class FiberSection {
		private List<AroEdge<GraphNode>> edges;
		private AroEntity fromEquipment;
		private AroEntity toEquipment;
		private AroEntity rootEquipment;

		public FiberSection(List<AroEdge<GraphNode>> edges,
				AroEntity fromEquipment, AroEntity toEquipment,
				AroEntity rootEquipment) {
			super();
			this.edges = edges;
			this.fromEquipment = fromEquipment;
			this.toEquipment = toEquipment;
			this.rootEquipment = rootEquipment;
		}

	}

	private class NetworkModelSerializer {

		private AroEntity root;
		private AroEntity previousNode;

		public void add(AroEntity from, AroEntity to,
				Collection<AroEdge<GeoSegment>> edges) {
		}

		public void addFiber() {

		}

	}

}