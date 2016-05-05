package com.altvil.aro.service.model;

import java.util.Collection;

public interface ModelService {
	Collection<AdministrativeOperatingCompany> allAdministrativeOperatingCompanies();

	Collection<WireCenter> wireCenters(String aoc);
}
