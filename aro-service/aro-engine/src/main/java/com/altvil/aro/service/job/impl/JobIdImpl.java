package com.altvil.aro.service.job.impl;

import java.util.Collections;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import com.altvil.aro.service.job.Job;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;

@JsonSerialize(using = JobIdSerializer.class)
class JobIdImpl implements Job.Id {
	private static final AtomicLong	  NEXT_GUID	= new AtomicLong(0);

	private final long				  uid;
	private final Map<String, Object> meta;

	JobIdImpl(long uid, Map<String, Object> meta) {
		this.uid = uid;
		this.meta = (meta == null || meta.isEmpty() ? Collections.emptyMap() : Collections.unmodifiableMap(meta));
	}

	JobIdImpl(Map<String, Object> meta) {
		this(NEXT_GUID.getAndIncrement(), meta);
	}

	@Override
	public long getUid() {
		return uid;
	}

	@Override
	public Object get(String key) {
		return meta.get(key);
	}

	@Override
	public boolean equals(Object obj) {
		if (obj != null && obj instanceof JobIdImpl) {
			return uid == ((JobIdImpl) obj).uid;
		}
		return false;
	}

	long getId() {
		return uid;
	}

	Map<String, Object> getMeta() {
		return meta;
	}

	@Override
	public int hashCode() {
		return (int) (uid ^ (uid >>> 32));
	}
	
	public String toString() {
		if (meta.isEmpty()) {
			return Long.toString(uid);
		}
		
		StringBuilder bldr = new StringBuilder();
		bldr.append("{GUID: ").append(uid);
		for(Map.Entry<String, Object> entry : meta.entrySet()) {
			bldr.append(", ").append(entry.getKey()).append(": ").append(entry.getValue());
		}
		bldr.append("}");
		
		return bldr.toString();
	}
}
