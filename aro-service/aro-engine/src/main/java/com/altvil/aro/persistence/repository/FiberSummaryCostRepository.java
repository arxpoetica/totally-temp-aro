package com.altvil.aro.persistence.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.altvil.aro.model.FiberSummaryCost;
import com.altvil.aro.model.ReportType;

@Repository("networkReportRepository")
public interface FiberSummaryCostRepository extends
		JpaRepository<FiberSummaryCost, Long> {

	public List<FiberSummaryCost> findFiberSummaryCost(long planId, ReportType reportType) ;
	
}
