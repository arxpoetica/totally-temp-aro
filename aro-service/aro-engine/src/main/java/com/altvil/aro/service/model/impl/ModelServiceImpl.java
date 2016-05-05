package com.altvil.aro.service.model.impl;

import java.util.Collection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.repository.ModelRepository;
import com.altvil.aro.service.model.AdministrativeOperatingCompany;
import com.altvil.aro.service.model.ModelService;
import com.altvil.aro.service.model.WireCenter;

@Service
public class ModelServiceImpl implements ModelService {
@Autowired
private ModelRepository repository;
	@Override
	public Collection<AdministrativeOperatingCompany> allAdministrativeOperatingCompanies() {
		return repository.allAdministrativeOperatingCompanies();
	}
	@Override
	public Collection<WireCenter> wireCenters(String aoc) {
		return repository.wireCenters(aoc);
	}

}
