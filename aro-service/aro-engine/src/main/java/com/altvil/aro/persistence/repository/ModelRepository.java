package com.altvil.aro.persistence.repository;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import org.springframework.stereotype.Repository;

import com.altvil.aro.persistence.repository.model.AdministrativeOperatingCompanyImpl;
import com.altvil.aro.service.model.AdministrativeOperatingCompany;
import com.altvil.aro.service.model.WireCenter;

@Repository
public class ModelRepository {
	@PersistenceContext private EntityManager em;
	
	public List<AdministrativeOperatingCompany> allAdministrativeOperatingCompanies() {
		final List<?> resultList = em.createNativeQuery("SELECT distinct aocn, aocn_name from aro.wirecenters where aocn <> 'EMB1'").getResultList();
		return resultList.stream().map(ModelRepository::convertToBean).collect(Collectors.toList());
	}
	
private static AdministrativeOperatingCompany convertToBean(Object rec) {
	return  new AdministrativeOperatingCompanyImpl(rec);
}

public Collection<WireCenter> wireCenters(String aocn) {
	return em.createQuery("select new com.altvil.aro.persistence.repository.model.WireCenterImpl(wc.id, wc.gid, wc.state, wc.wireCenter, wc.aocn, wc.aocnName, trim(st_astext(wc.geog)), trim(st_astext(wc.geom))) from com.altvil.aro.model.WireCenter wc where wc.aocn = :aocn", WireCenter.class).setParameter("aocn", aocn).getResultList();
}


}