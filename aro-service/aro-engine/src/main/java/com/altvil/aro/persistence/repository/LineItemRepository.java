package com.altvil.aro.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.altvil.aro.model.LineItem;
import com.altvil.aro.model.LineItemKey;

@Repository
public interface LineItemRepository extends
		JpaRepository<LineItem, LineItemKey> {

}
