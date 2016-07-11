package com.altvil.aro.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.altvil.aro.model.NetworkReportSummary;

@Repository
public interface NetworkReportSummaryRepository extends
		JpaRepository<NetworkReportSummary, Long> {

}
