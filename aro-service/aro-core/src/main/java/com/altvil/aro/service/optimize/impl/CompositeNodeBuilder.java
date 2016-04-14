package com.altvil.aro.service.optimize.impl;

import java.util.ArrayList;
import java.util.List;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.optimize.impl.DefaultGeneratingNode.BuilderImpl;
import com.altvil.aro.service.optimize.model.EquipmentAssignment;
import com.altvil.aro.service.optimize.model.FiberAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.model.GeneratingNode.Builder;
import com.altvil.utils.StreamUtil;

public class CompositeNodeBuilder implements Builder {

	
	private CompositeGeneratingNode node ;
	private List<Builder> children = new ArrayList<>();
	private boolean initMode = true ;
	
	public CompositeNodeBuilder(CompositeGeneratingNode node) {
		super();
		this.node = node;
	}
	

	public boolean isInitMode() {
		return initMode;
	}



	public void setInitMode(boolean initMode) {
		this.initMode = initMode;
	}




	@Override
	public GraphEdgeAssignment getParentAssignment() {
		return null;
	}



	@Override
	public GraphEdgeAssignment getAssignment() {
		return null;
	}


	@Override
	public Builder addCompositeChild(FiberAssignment fiberAssignment) {
		return new CompositeNodeBuilder(new CompositeGeneratingNode(
				node.getAnalysisContext(), new NoEquipment(), fiberAssignment, node));
	}


	

	@Override
	public Builder addChild(FiberAssignment fiberAssignment, EquipmentAssignment equipment) {
		
		
		Builder builder =  new BuilderImpl(new DefaultGeneratingNode(node.getAnalysisContext(),
				equipment, fiberAssignment, node));
		
		//TODO HT + KV
		if( initMode ) {
			children.add(builder);
		}
		
		return builder;
	}

	@Override
	public GeneratingNode build() {
		if( children.size() > 20 ) {
			StreamUtil.forEach(children, Builder::build);	
		} else {
			StreamUtil.forEach(children, Builder::build);

		}
		return node.initReclc() ;
	}
	

}
