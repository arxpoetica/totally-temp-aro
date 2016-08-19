package com.altvil.aro.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.AnalysisArea;

public interface AnalysisAreaRepository extends
		JpaRepository<AnalysisArea, Integer> {

	
	
}