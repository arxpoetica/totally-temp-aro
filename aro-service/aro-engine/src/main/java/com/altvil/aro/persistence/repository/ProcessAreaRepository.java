package com.altvil.aro.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.altvil.aro.model.ProcessArea;

@Repository
public interface ProcessAreaRepository extends
		JpaRepository<ProcessArea, Integer> {

}
