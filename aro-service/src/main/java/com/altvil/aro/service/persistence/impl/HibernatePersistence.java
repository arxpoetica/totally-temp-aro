package com.altvil.aro.service.persistence.impl;

import javax.persistence.EntityManagerFactory;
import javax.persistence.Persistence;

import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.hibernate.context.internal.ManagedSessionContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.config.ConfigService;
import com.altvil.aro.service.persistence.PersistenceService;
import com.altvil.aro.service.persistence.SessionAction;
import com.google.inject.Inject;
import com.google.inject.Singleton;

@Singleton
public class HibernatePersistence implements PersistenceService {

	private static final Logger log = LoggerFactory
			.getLogger(HibernatePersistence.class.getName());

	private EntityManagerFactory factory;
	private SessionFactory sessionFactory;

	@Inject
	public HibernatePersistence(ConfigService config) {
		try {
			log.info("HibernatePersistence initializing");

			factory = Persistence.createEntityManagerFactory(
					"com.altvil.aro.persistence.postgis",
					config.getProperties());

			sessionFactory = factory.unwrap(SessionFactory.class);

			log.info("HibernatePersistence completed.");
		} catch (Exception e) {
			log.error("Hibernate FAILED to initialize factory: ", e);
		}
	}

	@Override
	public SessionFactory getSessionFactory() {
		return sessionFactory;
	}

	@Override
	public <T> T read(SessionAction<T> action) {
		Session session = sessionFactory.openSession();
		ManagedSessionContext.bind(session);

		try {
			return action.apply(session);
		} finally {
			ManagedSessionContext.unbind(sessionFactory);
			session.close(); 
		}
	}

	@Override
	public <T> T modify(SessionAction<T> action) {
		Session session = sessionFactory.openSession();
		ManagedSessionContext.bind(session);

		Transaction tx = null;
		boolean success = false;
		try {
			tx = session.beginTransaction();
			T value = action.apply(session);
			success = true;
			return value;
		} finally {
			ManagedSessionContext.unbind(sessionFactory);
			if (success) {
				tx.commit();
			} else {
				tx.rollback();
			}
			session.close(); 
		}
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.altvil.aro.service.persistence.impl.PersistenceService#doAction(com
	 * .altvil.aro.service.persistence.Action)
	 */
	// @Override
	// public void doAction(Action action) {
	//
	// EntityManager mgr = factory.createEntityManager();
	// mgr.getTransaction().begin();
	// Session session = mgr.unwrap(Session.class);
	//
	// boolean success = false;
	//
	// try {
	// action.execute(session);
	// mgr.getTransaction().commit();
	// success = true;
	// } finally {
	//
	// if (!success) {
	// mgr.getTransaction().rollback();
	// }
	// mgr.close();
	// }
	//
	// }

	// @Override
	// public <T> T doReadAction(ReadAction<T> action) {
	// EntityManager mgr = factory.createEntityManager();
	// Session session = mgr.unwrap(Session.class);
	//
	// try {
	// T result = action.execute(session);
	// return result;
	// } catch (Throwable err) {
	// throw new AroException(err.getMessage(), err);
	// } finally {
	// mgr.close();
	// }
	//
	// }

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.altvil.aro.service.persistence.impl.PersistenceService#doAction(com
	 * .altvil.aro.service.persistence.ResultAction)
	 */
	// @Override
	// public <T> T doResultAction(ResultAction<T> action) {
	//
	// EntityManager mgr = factory.createEntityManager();
	// mgr.getTransaction().begin();
	// Session session = mgr.unwrap(Session.class);
	//
	// boolean success = false;
	//
	// try {
	// T result = action.execute(session);
	// mgr.getTransaction().commit();
	// success = true;
	// return result;
	// } finally {
	//
	// if (!success) {
	// mgr.getTransaction().rollback();
	// }
	//
	// mgr.close();
	// }
	//
	// }

}
