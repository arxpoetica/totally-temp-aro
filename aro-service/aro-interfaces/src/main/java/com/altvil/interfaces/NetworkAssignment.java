package com.altvil.interfaces;

import com.altvil.aro.service.entity.AroEntity;

public interface NetworkAssignment extends
		Assignment<AroEntity, RoadLocation> {

	Long getRoadSegmentId();

}
