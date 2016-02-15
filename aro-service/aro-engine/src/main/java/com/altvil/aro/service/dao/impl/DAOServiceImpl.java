package com.altvil.aro.service.dao.impl;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import org.hibernate.Session;
import org.hibernate.SessionFactory;

import com.altvil.aro.service.AroException;
import com.altvil.aro.service.dao.Accessor;
import com.altvil.aro.service.dao.DAOService;
import com.altvil.aro.service.dao.DAOSession;
import com.altvil.aro.service.dao.Modification;
import com.altvil.aro.service.dao.generic.AroDAO;
import com.altvil.aro.service.dao.generic.impl.AroDAOImpl;
import com.altvil.aro.service.dao.graph.GraphDAO;
import com.altvil.aro.service.dao.graph.impl.GraphDAOImpl;
import com.altvil.aro.service.persistence.PersistenceService;
import com.google.inject.Inject;
import com.google.inject.Singleton;

@Singleton
public class DAOServiceImpl implements DAOService {

	private PersistenceService persistence;
	private Map<Class<?>, Object> map = new HashMap<>();

	@Inject
	public DAOServiceImpl(PersistenceService persistence) {
		this.persistence = persistence;
		map = init(persistence);
	}
	
	
	private Map<Class<?>, Object> init(PersistenceService persistence) {
		Map<Class<?>, Object> map = new HashMap<>();

		map.put(GraphDAO.class,
				new GraphDAOImpl(persistence.getSessionFactory()));

		return Collections.unmodifiableMap(map);
	}
	

	@Override
	public <T> Accessor<AroDAO<T>> generic(Class<T> clz) {
		return createAccess(createGenericDao(clz));
	}


	@Override
	public <T> Accessor<T> dao(Class<T> clz) {
		return createAccess(getDAO(clz)) ;
	}


	@Override
	public Accessor<DAOSession> dao() {
		return createAccess(new DAOSessionImpl(persistence.getSessionFactory())) ;
	}

	
	private <D> Accessor<D> createAccess(D dao) {
		return new AccessImpl<D>(dao) ;
 	}



	@SuppressWarnings("unused")
	private <I, T extends I> I proxy(boolean modified, Class<I> api, T dao) {
		return modified ? ModifyDAO.newInstance(persistence, api, dao)
				: ReadDAO.newInstance(persistence, api, dao);
	}

	

	//
	//
	//

	private <T> T getDAO(Class<T> api) {
		return api.cast(map.get(api));
	}

	private <T> AroDAO<T> createGenericDao(Class<T> clz) {
		return new AroDAOImpl<T>(persistence.getSessionFactory(), clz);
	}


	private  class DAOSessionImpl implements DAOSession {

		private SessionFactory sessionFactory;
		
		public DAOSessionImpl(SessionFactory sessionFactory) {
			super();
			this.sessionFactory = sessionFactory;
		}

		@Override
		public <T> AroDAO<T> generic(Class<T> clz) {
			return new AroDAOImpl<T>(sessionFactory, clz);
		}

		@Override
		public <T> T dao(Class<T> dao) {
			return dao.cast(map.get(dao));
		}

		@Override
		public Session getSession() {
			return sessionFactory.getCurrentSession() ;
		}
	}

	private class AccessImpl<D> implements Accessor<D> {

		private D da;
		
		public AccessImpl(D da) {
			super();
			this.da = da;
		}

		@Override
		public <T> T read(Function<D, T> f) {
			return persistence.read(s -> f.apply(da));
		}

		@Override
		public void modify(Modification<D> mod) {
			persistence.modify(s -> {
				mod.execute(da);
				return true;
			});

		}

		@Override
		public <T> T returnResult(Function<D, T> f) {
			return persistence.modify(s -> f.apply(da));
		}

		@Override
		public D modify() {
			// TODO Auto-generated method stub
			return null;
		}

		@Override
		public D read() {
			// TODO Auto-generated method stub
			return null;
		}
		
		

	}

	private static class ReadDAO<T> implements InvocationHandler {

		private PersistenceService svc;
		private T dao;

		public ReadDAO(PersistenceService svc, T dao) {
			super();
			this.svc = svc;
			this.dao = dao;
		}

		@SuppressWarnings({ "unchecked" })
		public static <I, S extends I> I newInstance(PersistenceService svc,
				Class<I> api, S obj) {
			return (I) Proxy.newProxyInstance(obj.getClass().getClassLoader(),
					new Class[] { api }, new ReadDAO<I>(svc, obj));
		}

		@Override
		public Object invoke(Object proxy, Method method, Object[] args)
				throws Throwable {
			return svc.read(s -> {
				try {
					return method.invoke(dao, args);
				} catch (Exception e) {
					throw new AroException(e.getMessage(), e);
				}
			});

		}

	}

	private static class ModifyDAO<T> implements InvocationHandler {

		private PersistenceService svc;
		private T dao;

		public ModifyDAO(PersistenceService svc, T dao) {
			super();
			this.svc = svc;
			this.dao = dao;
		}

		@SuppressWarnings({ "unchecked" })
		public static <I, S extends I> I newInstance(PersistenceService svc,
				Class<I> api, S obj) {
			return ((I) Proxy.newProxyInstance(obj.getClass().getClassLoader(),
					new Class[] { api }, new ModifyDAO<I>(svc, obj)));
		}

		@Override
		public Object invoke(Object proxy, Method method, Object[] args)
				throws Throwable {
			return svc.modify(s -> {
				try {
					return method.invoke(dao, args);
				} catch (Exception e) {
					throw new AroException(e.getMessage(), e);
				}
			});
		}

	}

}
