package com.altvil.aro.service.entity;

public interface AroEntityVisitor {

	
	public void visit(CentralOfficeEquipment node);

	public void visit(FDTEquipment node);

	public void visit(FDHEquipment node);
	
	public void visit(LocationEntity node);
	
	public void visit(RemoteTerminal node) ;
	
	public void visit(SplicePoint node) ;
	
	public void visit(RootEntity node) ;
	
	public void visit(BulkFiberTerminal fiberTerminal) ;
	
	public void visit(LocationDropAssignment node) ;
	
	public void visit(JunctionNode node) ;


}
