package com.altvil.aro.service.optimize.impl;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.utils.StreamUtil;

public class UnresolvedGeneratingNode {
	
	public interface Resolver {
		AroEntity getParent(AroEntity aroEntity) ;
	}
	
	public static class Builder {
		
		private Resolver resolver ;
		private Map<GraphEdgeAssignment, UnresolvedGeneratingNode> resolvedMap ;
		private Map<AroEntity, GraphEdgeAssignment> entityMap ;
		
		
		public Collection<UnresolvedGeneratingNode> resolveRoots(Collection<GraphEdgeAssignment> assignments) {
			assignments.forEach(a -> {
				entityMap.put(a.getAroEntity(), a) ;
			});
			
			Set<GraphEdgeAssignment> visited = new HashSet<>() ;
			assignments.forEach(a -> {
				resolve(visited, a) ;
			});
			
			return StreamUtil.filter(resolvedMap.values(), p -> p.parent == null) ;
		}
		
		private GraphEdgeAssignment getParentAssignment(GraphEdgeAssignment assignment) {
			AroEntity parentEntity = resolver.getParent(assignment.getAroEntity()) ;
			if( parentEntity != null ) {
				return entityMap.get(parentEntity) ;
			}
			
			return null ;
		}
		
		private UnresolvedGeneratingNode resolve(Set<GraphEdgeAssignment> visited, GraphEdgeAssignment a) {
			if( !visited.contains(a) ) {
				
				UnresolvedGeneratingNode node = new UnresolvedGeneratingNode(a) ;
				resolvedMap.put(a, node) ;
				
				GraphEdgeAssignment parentAssignment = getParentAssignment(a) ;
				if( parentAssignment != null ) {
					UnresolvedGeneratingNode parentNode = resolve(visited, parentAssignment) ;
					parentNode.addChild(node) ;
					node.parent = parentNode ;
				}
				
				return node ;
			}
			
			return resolvedMap.get(a) ;
		}
		
	}
	
	
	private UnresolvedGeneratingNode parent ;
	private GraphAssignment graphAssignment ;
	private Collection<UnresolvedGeneratingNode> children = new HashSet<>();
	private List<GeneratingNode> generatingNodes ;
	
	public UnresolvedGeneratingNode(GraphAssignment graphAssignment) {
		super();
		this.graphAssignment = graphAssignment;
	}
	
	public UnresolvedGeneratingNode getParent() {
		return parent;
	}

	public GraphAssignment getGraphAssignment() {
		return graphAssignment;
	}
	
	public void addChild(GeneratingNode.Builder node) {
		
	}

	public Collection<UnresolvedGeneratingNode> getChildren() {
		return children;
	}

	public void addChild(UnresolvedGeneratingNode child) {
		children.add(child) ;
	}

}
