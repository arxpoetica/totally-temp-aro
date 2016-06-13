package com.altvil.aro.persistence.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.altvil.aro.model.FiberSummaryCost;

@Repository("networkReportRepository")
public interface FiberSummaryCostRepository extends
		JpaRepository<FiberSummaryCost, Long> {
	
	@Query(value = "select c from FiberSummaryCost c where c.networkReportId = :networkReportId")
	public List<FiberSummaryCost> findEquipmentSummaryCosts(
			@Param("networkReportId") long networkReportId);
}
