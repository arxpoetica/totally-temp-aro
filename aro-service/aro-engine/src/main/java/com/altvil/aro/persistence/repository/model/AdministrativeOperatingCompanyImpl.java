package com.altvil.aro.persistence.repository.model;

import com.altvil.aro.service.model.AdministrativeOperatingCompany;

public class AdministrativeOperatingCompanyImpl implements AdministrativeOperatingCompany {
	private final String aocn;
	private final String fullname;

	public AdministrativeOperatingCompanyImpl(Object rec) {
		Object[] record = (Object[]) rec;

		aocn = record[0].toString();
		fullname = record[1].toString();
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.model.AdministrativeOperatingCompany#getAocn()
	 */
	@Override
	public String getAocn() {
		return aocn;
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.model.AdministrativeOperatingCompany#getFullname()
	 */
	@Override
	public String getFullname() {
		return fullname;
	}
}
