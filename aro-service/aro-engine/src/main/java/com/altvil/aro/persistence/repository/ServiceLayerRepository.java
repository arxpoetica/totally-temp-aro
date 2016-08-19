package com.altvil.aro.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.altvil.aro.model.ServiceLayer;

public interface ServiceLayerRepository extends
		JpaRepository<ServiceLayer, Integer> {

}
