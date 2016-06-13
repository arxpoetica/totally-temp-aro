package com.altvil.aro.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.altvil.aro.model.EquipmentSummaryCost;

@Repository("networkReportRepository")
public interface EquipmentSummaryCostRepository extends JpaRepository<EquipmentSummaryCost, Long> {
}
