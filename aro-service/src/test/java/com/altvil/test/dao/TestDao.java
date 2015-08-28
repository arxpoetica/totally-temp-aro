package com.altvil.test.dao;

import java.util.Collection;

import org.junit.Test;

import com.altvil.aro.service.MainEntry;
import com.altvil.aro.service.dao.DAOService;
import com.altvil.aro.service.dao.graph.GraphDAO;
import com.altvil.aro.service.dao.graph.GraphEdge;
import com.altvil.aro.service.persistence.PersistenceService;

public class TestDao {

	@Test
	public void testDaoService() {
		try {
			Collection<GraphEdge> edges = MainEntry.service(DAOService.class)
					.dao(GraphDAO.class).read(s -> s.findNodesForPlanId(4));
			edges.forEach(e -> System.out.println(e));

		} catch (Throwable err) {
			err.printStackTrace();
		}

	}

	

	public void testDao() {
		try {

			MainEntry.service(PersistenceService.class).getSessionFactory();

			MainEntry
					.service(DAOService.class)
					.dao(GraphDAO.class)
					.read(s -> s.findNodesForPlanId(4))
					.forEach(
							e -> System.out.println(e.getSource() + " - > "
									+ e.getTarget() + " type "
									+ e.getEdgeType()));

		} catch (Throwable err) {
			err.printStackTrace();
		}

	}

}
