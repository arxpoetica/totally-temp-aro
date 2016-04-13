package com.altvil.aro.service.optimize.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.optimize.model.EquipmentAssignment;
import com.altvil.aro.service.optimize.model.FiberAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;

public class ClusterNodeBuilder implements GeneratingNode.Builder {

	private GeneratingNode.Builder nodeBuilder;
	private FiberType fiberType;
	private List<GeneratingNode.Builder> children = new ArrayList<>();

	public ClusterNodeBuilder(GeneratingNode.Builder nodeBuilder) {
		super();
		this.nodeBuilder = nodeBuilder;
	}

	@Override
	public GeneratingNode.Builder setFiber(FiberAssignment fiber) {
		nodeBuilder.setFiber(fiber);
		this.fiberType = fiber.getFiberType();
		return this;
	}

	@Override
	public GeneratingNode.Builder setFiber(FiberType fiberType,
			Collection<AroEdge<GeoSegment>> fiber) {
		nodeBuilder.setFiber(fiberType, fiber);
		this.fiberType = fiberType;
		return this;
	}

	@Override
	public GeneratingNode.Builder addChild(EquipmentAssignment equipment) {
		GeneratingNode.Builder builder = nodeBuilder.addChild(equipment);
		builder.setFiber(fiberType, new ArrayList<AroEdge<GeoSegment>>());
		children.add(builder);
		return builder;
	}

	@Override
	public GeneratingNode build() {
		children.forEach(GeneratingNode.Builder::build);
		return nodeBuilder.build();
	}

	@Override
	public GeneratingNode.Builder setJunctionNode(boolean juntionNode) {
		nodeBuilder.setJunctionNode(juntionNode);
		return this;
	}

	/*
	public static class Builder {

		private Resolver resolver;
		private GeneratingNode.Builder nodeBuilder;
		
		private Map<GraphEdgeAssignment, GeneratingNode.Builder> resolvedMap;
		private Map<AroEntity, GeneratingNode.Builder> entityMap;
		
		
		public Collection<GeneratingNode.Builder> resolveRoots(
				Collection<GraphEdgeAssignment> assignments) {
			assignments.forEach(a -> {
				entityMap.put(a.getAroEntity(), a);
			});

			Set<GraphEdgeAssignment> visited = new HashSet<>();
			assignments.forEach(a -> {
				resolve(visited, a);
			});

			return StreamUtil.filter(resolvedMap.values(),
					p -> p.parent == null);
		}

		private GraphEdgeAssignment getParentAssignment(
				GraphEdgeAssignment assignment) {
			AroEntity parentEntity = resolver.getParent(assignment
					.getAroEntity());
			if (parentEntity != null) {
				return entityMap.get(parentEntity);
			}

			return null;
		}

		private UnresolvedGeneratingNode resolve(
				Set<GraphEdgeAssignment> visited, GraphEdgeAssignment a) {
			if (!visited.contains(a)) {

				UnresolvedGeneratingNode node = new UnresolvedGeneratingNode(a);
				resolvedMap.put(a, node);

				GraphEdgeAssignment parentAssignment = getParentAssignment(a);
				if (parentAssignment != null) {
					UnresolvedGeneratingNode parentNode = resolve(visited,
							parentAssignment);
					parentNode.addChild(node);
					node.parent = parentNode;
				}

				return node;
			}

			return resolvedMap.get(a);
		}

	}*/

}
