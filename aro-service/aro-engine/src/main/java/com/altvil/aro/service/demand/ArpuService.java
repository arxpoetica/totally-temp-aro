package com.altvil.aro.service.demand;

import com.altvil.aro.service.demand.analysis.ArpuMapping;
import com.altvil.aro.service.entity.LocationEntityType;

public interface ArpuService {
	
	ArpuMapping getArpuMapping(LocationEntityType type) ;

}
