package com.altvil.aro.service.job.impl;

import java.util.Collections;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import com.altvil.aro.service.job.Job;

class JobIdImpl implements Job.Id {
	private static final AtomicLong	  NEXT_GUID	= new AtomicLong(0);

	private final long				  id;
	private final Map<String, Object> meta;

	JobIdImpl(long id, Map<String, Object> meta) {
		this.id = id;
		this.meta = (meta == null || meta.isEmpty() ? Collections.emptyMap() : Collections.unmodifiableMap(meta));
	}

	JobIdImpl(Map<String, Object> meta) {
		this(NEXT_GUID.getAndIncrement(), meta);
	}

	@Override
	public boolean equals(Object obj) {
		if (obj != null && obj instanceof JobIdImpl) {
			return id == ((JobIdImpl) obj).id;
		}
		return false;
	}

	long getId() {
		return id;
	}

	Map<String, Object> getMeta() {
		return meta;
	}

	@Override
	public int hashCode() {
		return (int) (id ^ (id >>> 32));
	}
	
	public String toString() {
		if (meta.isEmpty()) {
			return Long.toString(id);
		}
		
		StringBuilder bldr = new StringBuilder();
		bldr.append("{GUID: ").append(id);
		for(Map.Entry<String, Object> entry : meta.entrySet()) {
			bldr.append(", ").append(entry.getKey()).append(": ").append(entry.getValue());
		}
		bldr.append("}");
		
		return bldr.toString();
	}
}
