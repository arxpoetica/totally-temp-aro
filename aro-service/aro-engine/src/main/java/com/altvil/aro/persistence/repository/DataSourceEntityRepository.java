package com.altvil.aro.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.altvil.aro.persistence.repository.user_data.DataSourceEntity;

@Repository
public interface DataSourceEntityRepository extends
		JpaRepository<DataSourceEntity, Long> {

}
