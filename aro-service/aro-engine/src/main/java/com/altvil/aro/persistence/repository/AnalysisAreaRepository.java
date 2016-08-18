package com.altvil.aro.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.altvil.aro.model.AnalysisArea;

public interface AnalysisAreaRepository extends
		JpaRepository<AnalysisArea, Integer> {

}