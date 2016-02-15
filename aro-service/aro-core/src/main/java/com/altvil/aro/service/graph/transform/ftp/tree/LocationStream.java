package com.altvil.aro.service.graph.transform.ftp.tree;

import com.altvil.aro.service.graph.transform.ftp.LocationStreamVisitor;


public interface LocationStream {

	public double getMaxDistancetoEnd();

	public int getLocationCount();
	public double getLocationDemand() ;
	
	public void accept(LocationStreamVisitor visitor) ;

	
}
