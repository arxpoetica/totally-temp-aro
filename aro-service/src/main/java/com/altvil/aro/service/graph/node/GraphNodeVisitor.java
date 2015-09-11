package com.altvil.aro.service.graph.node;


public interface GraphNodeVisitor {
	
	public void visit(LocationNode node) ;
	public void visit(SpliceNode node) ;
	public void visit(RoadNode node) ;
	public void visit(FDTNode node) ;
	public void visit(FDHNode node) ;
	

}
