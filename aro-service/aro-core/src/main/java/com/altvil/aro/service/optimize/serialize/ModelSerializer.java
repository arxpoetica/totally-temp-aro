package com.altvil.aro.service.optimize.serialize;

import com.altvil.aro.service.optimize.impl.BulkFiberTerminalAssignment;
import com.altvil.aro.service.optimize.impl.CentralOfficeAssignment;
import com.altvil.aro.service.optimize.impl.FdhAssignment;
import com.altvil.aro.service.optimize.impl.FdtAssignment;
import com.altvil.aro.service.optimize.impl.NoEquipment;
import com.altvil.aro.service.optimize.impl.RemoteTerminalAssignment;
import com.altvil.aro.service.optimize.impl.RootAssignment;
import com.altvil.aro.service.optimize.impl.SplicePointAssignment;
import com.altvil.aro.service.optimize.impl.SplitterNodeAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;

public interface ModelSerializer {
	
	
	public void serialize(GeneratingNode node, RootAssignment root);

	public void serialize(GeneratingNode node, CentralOfficeAssignment co);

	public void serialize(GeneratingNode node,
			SplitterNodeAssignment fiberAssignment);

	
	public void serialize(GeneratingNode node, FdhAssignment fdh);


	public void serialize(GeneratingNode node, FdtAssignment fdt);
	
	public void serialize(GeneratingNode node, BulkFiberTerminalAssignment bft);
	
	public void serializeJunctionNode(GeneratingNode node, SplitterNodeAssignment junction) ;
	
	public void serializeComposite(GeneratingNode node, NoEquipment noEquipment) ;
	
	
	public void serialize(GeneratingNode node, RemoteTerminalAssignment rt) ;
	
	public void serialize(GeneratingNode node, SplicePointAssignment spa) ;
	
	

}
