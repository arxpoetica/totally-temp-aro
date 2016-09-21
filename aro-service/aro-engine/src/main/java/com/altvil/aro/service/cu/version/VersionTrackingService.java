package com.altvil.aro.service.cu.version;

import java.util.Set;

public interface VersionTrackingService {

	Set<VersionType> getVersionTypes() ;
	VersionTracking getVersionTracking(VersionType type);
	
}
