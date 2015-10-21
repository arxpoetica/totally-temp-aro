package com.altvil.aro.service.dao.generic.impl;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.hibernate.Query;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.dao.generic.GenericAroDAO;
import com.googlecode.genericdao.dao.hibernate.GenericDAOImpl;
import com.googlecode.genericdao.search.BaseSearchProcessor;
import com.googlecode.genericdao.search.Field;
import com.googlecode.genericdao.search.ISearch;
import com.googlecode.genericdao.search.InternalUtil;
import com.googlecode.genericdao.search.hibernate.HibernateMetadataUtil;

public class DefaultAroDAO<T, ID extends Serializable> extends
		GenericDAOImpl<T, ID> implements GenericAroDAO<T, ID> {

	private DeleteProcessor deleteProcessor;

	public DefaultAroDAO(SessionFactory sessionFactory, Class<T> clz) {
		super.setSessionFactory(sessionFactory);
		super.persistentClass = clz ;
		deleteProcessor = new DeleteProcessor(sessionFactory) ;
	}

	@Override
	public void saveOrUpdate(T update) {
		getSession().saveOrUpdate(update);
	}

	@Override
	public int delete(ISearch search) {
		return deleteProcessor.deleteFilter(getSession(), persistentClass,
				search);
	}

	@Override
	public void saveOrUpdate(Collection<T> updates) {

		Session s = getSession();
		updates.forEach(v -> s.saveOrUpdate(v));
	}

	public static class DeleteProcessor extends BaseSearchProcessor {

		private static final Logger log = LoggerFactory
				.getLogger(DeleteProcessor.class.getName());

		public DeleteProcessor(SessionFactory sessionFactory) {
			super(QLTYPE_HQL, HibernateMetadataUtil
					.getInstanceForSessionFactory(sessionFactory));
		}

		public int deleteFilter(Session session, Class<?> searchClass,
				ISearch search) {
			if (searchClass == null || search == null)
				return 0;

			List<Object> paramList = new ArrayList<Object>();
			String hql = generateQL(searchClass, search, paramList);
			Query query = session.createQuery(hql);
			addParams(query, paramList);

			return query.executeUpdate();
		}

		public String generateQL(Class<?> entityClass, ISearch search,
				List<Object> paramList) {
			if (entityClass == null)
				throw new NullPointerException(
						"The entity class for a search cannot be null");

			SearchContext ctx = new SearchContext(entityClass, rootAlias,
					paramList);

			List<Field> fields = checkAndCleanFields(search.getFields());

			applyFetches(ctx, checkAndCleanFetches(search.getFetches()), fields);

			String where = generateWhereClause(ctx,
					checkAndCleanFilters(search.getFilters()),
					search.isDisjunction());
			String from = generateFromClause(ctx, true);

			StringBuilder sb = new StringBuilder();
			sb.append("delete ");
			sb.append(from);
			sb.append(where);

			String query = sb.toString();
			if (log.isDebugEnabled())
				log.debug("generateQL:\n  " + query);
			return query;
		}

		// ---- SEARCH HELPERS ---- //

		@SuppressWarnings({ "rawtypes" })
		private void addParams(Query query, List<Object> params) {
			StringBuilder debug = null;

			int i = 1;
			for (Object o : params) {
				if (log.isDebugEnabled()) {
					if (debug == null)
						debug = new StringBuilder();
					else
						debug.append("\n\t");
					debug.append("p");
					debug.append(i);
					debug.append(": ");
					debug.append(InternalUtil.paramDisplayString(o));
				}
				if (o instanceof Collection) {
					query.setParameterList("p" + Integer.toString(i++),
							(Collection) o);
				} else if (o instanceof Object[]) {
					query.setParameterList("p" + Integer.toString(i++),
							(Object[]) o);
				} else {
					query.setParameter("p" + Integer.toString(i++), o);
				}
			}
			if (debug != null && debug.length() != 0) {
				log.debug(debug.toString());
			}
		}

	}
}
