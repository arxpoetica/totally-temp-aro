package com.altvil.utils.lock;

import java.util.HashMap;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

public class ResourceLock<T> {

	private HashMap<T,Locker> locks = new HashMap<>();

	public <S> S read(T resource, ResourceAction<S> action) {
		Locker rl = aquire(resource);
		Lock lock = rl.getReadLock();
		try {
			lock.lock() ;
			return action.execute();
		} finally {
			lock.unlock();
			release(resource);
		}
	}
	
	public <S> S modify(T resource, ResourceAction<S> action) {

		Locker rl = aquire(resource);
		Lock lock = rl.getWriteLock();
		try {
			lock.lock() ;
			return action.execute();
		} finally {
			lock.unlock();
			release(resource);
		}
	}

	private synchronized Locker aquire(T resource) {
		Locker rl = locks.get(resource);
		if (rl == null) {
			locks.put(resource, rl = new Locker());
		}

		rl.aquire();

		return rl;
	}

	private synchronized void release(T resource) {

		Locker rl = locks.get(resource);

		if (rl.release()) {
			locks.remove(resource);
		}
	}

	private static class Locker {
		private ReadWriteLock lock = new ReentrantReadWriteLock();
		
		private int count = 0 ;

		public Locker() {
			lock = new ReentrantReadWriteLock();
		}
		
		public boolean release() {
			return --count  == 0;
		}

		public void aquire() {
			count++;
		}

		public Lock getReadLock() {
			return lock.readLock() ;
		}
		
		public Lock getWriteLock() {
			return lock.writeLock() ;
		}

	}

}
