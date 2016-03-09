package com.altvil.aro.service.optimize.serialize;

import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.optimize.impl.CentralOfficeAssignment;
import com.altvil.aro.service.optimize.impl.FdhAssignment;
import com.altvil.aro.service.optimize.impl.FdtAssignment;
import com.altvil.aro.service.optimize.impl.RootAssignment;
import com.altvil.aro.service.optimize.impl.SplitterNodeAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;

public interface ModelSerializer {

	public GraphMapping serialize(GeneratingNode node, RootAssignment root);

	public GraphMapping serialize(GeneratingNode node, CentralOfficeAssignment co);

	public GraphMapping serialize(GeneratingNode node,
			SplitterNodeAssignment fiberAssignment);

	
	public GraphMapping serialize(GeneratingNode node, FdhAssignment fdh);


	public GraphMapping serialize(GeneratingNode node, FdtAssignment fdt);

}
