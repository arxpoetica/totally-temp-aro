package com.altvil.aro.service.optimize.spi;

import com.altvil.aro.service.optimize.model.GeneratingNode;
public interface ScoringStrategy {

	double score(GeneratingNode node) ;
	
}
