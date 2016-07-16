package com.altvil.aro.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.altvil.aro.model.NetworkReportSummary;

@Repository
public interface NetworkReportSummaryRepository extends
		JpaRepository<NetworkReportSummary, Long> {
	
	@Query(value = "select p from NetworkReportSummary p where p.planId=:planId") 
	NetworkReportSummary queryReportByPlanId(@Param("planId") long planId) ;

}
