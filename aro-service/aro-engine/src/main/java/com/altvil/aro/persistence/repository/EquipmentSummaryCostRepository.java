package com.altvil.aro.persistence.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.altvil.aro.model.EquipmentSummaryCost;

@Repository
public interface EquipmentSummaryCostRepository extends JpaRepository<EquipmentSummaryCost, Long> {
	
	@Query(value = "select c from EquipmentSummaryCost c where c.id.networkReportId = :networkReportId")
	public List<EquipmentSummaryCost> findEquipmentSummaryCost(
			@Param("networkReportId") long networkReportId);
	
}
