package com.altvil.aro.persistence.repository;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import org.springframework.stereotype.Repository;

import com.altvil.aro.persistence.repository.model.AdministrativeOperatingCompanyImpl;
import com.altvil.aro.persistence.repository.model.EdgeImpl;
import com.altvil.aro.service.model.AdministrativeOperatingCompany;
import com.altvil.aro.service.model.Edge;
import com.altvil.aro.service.model.WireCenter;
import com.altvil.utils.conversion.OrdinalAccessor;
import com.altvil.utils.conversion.OrdinalEntityFactory;

@Repository
public class ModelRepository {
	@PersistenceContext
	private EntityManager em;

	public List<AdministrativeOperatingCompany> allAdministrativeOperatingCompanies() {
		final List<?> resultList = em
				.createNativeQuery("SELECT distinct aocn, aocn_name from aro.wirecenters where aocn <> 'EMB1'")
				.getResultList();
		return resultList.stream().map(ModelRepository::convertToBean).collect(Collectors.toList());
	}

	private static AdministrativeOperatingCompany convertToBean(Object rec) {
		return new AdministrativeOperatingCompanyImpl(rec);
	}

	public Collection<WireCenter> wireCenters(String aocn) {
		return em.createQuery(
				"select new com.altvil.aro.persistence.repository.model.WireCenterImpl(wc.id, wc.gid, wc.state, wc.wireCenter, wc.aocn, wc.aocnName, trim(st_astext(wc.geog)), trim(st_astext(wc.geom))) from com.altvil.aro.model.WireCenter wc where wc.aocn = :aocn",
				WireCenter.class).setParameter("aocn", aocn).getResultList();
	}

	private enum EdgeColumns implements OrdinalAccessor{GID,TLID, TNIDF, TNIDT, GEOM, GEOG, BUFFER, EDGE_LENGTH};
	@SuppressWarnings("unchecked")
	public Collection<Edge> edgesInWireCenter(String wireCenter) {
		final List<Object[]> resultList = em.createNativeQuery(
				"select edge.gid, edge.tlid, edge.tnidf, edge.tnidt, trim(st_astext(edge.geom)) as geom, "
				+ "trim(st_astext(edge.geog)) as geog, "
				+ "trim(st_astext(edge.buffer)) as buffer, edge_length "
				+ "from aro.wirecenters wc join aro.edges edge on st_intersects(edge_buffer, edge.geom) where wc.aocn = ?1")
//				"select edge.gid, edge.tlid, edge.tnidf, edge.tnidt, trim(st_astext(st_linemerge(edge.geom))) as geom, "
//				+ "trim(st_astext(st_linemerge(edge.geog as Geometry))) as geog, "
//				+ "trim(st_astext(st_linemerge(edge.buffer))) as buffer, edge_length "
//				+ "from aro.wirecenters wc join aro.edges edge on st_intersects(edge_buffer, edge.geom) where wc.aocn = ?1")
				.setParameter(1, wireCenter).getResultList();
		return resultList
				.stream().map(OrdinalEntityFactory.FACTORY::createOrdinalEntity).map(entity -> {return new EdgeImpl()
						.setId(entity.getInteger(EdgeColumns.GID))
						.setTlid(entity.getLong(EdgeColumns.TLID))
						.setTnidf(entity.getLong(EdgeColumns.TNIDF))
						.setTnidt(entity.getLong(EdgeColumns.TNIDT))
						.setGeog(entity.getString(EdgeColumns.GEOG))
						.setGeom(entity.getString(EdgeColumns.GEOM))
						.setBuffer(entity.getString(EdgeColumns.BUFFER))
						.setEdgeLength(entity.getDouble(EdgeColumns.EDGE_LENGTH))
						;}).collect(Collectors.toList());
	}
}
