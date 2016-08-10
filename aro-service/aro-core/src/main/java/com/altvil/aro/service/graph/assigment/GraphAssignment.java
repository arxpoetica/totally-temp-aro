package com.altvil.aro.service.graph.assigment;

import com.altvil.aro.service.entity.AroEntity;
import com.vividsolutions.jts.geom.Point;

public interface GraphAssignment {

	public Long getId() ;
	public AroEntity getAroEntity();
	public Point getPoint() ;
	
}
