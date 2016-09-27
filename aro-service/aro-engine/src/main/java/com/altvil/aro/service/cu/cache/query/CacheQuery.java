package com.altvil.aro.service.cu.cache.query;

import java.io.Serializable;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.zip.CRC32;
import java.util.zip.Checksum;

import com.altvil.aro.service.cu.cache.impl.AroCacheKey;
import com.altvil.aro.service.cu.key.AroKey;

@SuppressWarnings("serial")
public class CacheQuery implements Serializable {

	private AroKey aroKey;
	private Map<String, Serializable> params;
	private String extentionKey;

	public CacheQuery(AroKey aroKey, Map<String, Serializable> params,
			String extentionKey) {
		super();
		this.aroKey = aroKey;
		this.params = params;
		this.extentionKey = extentionKey;
	}

	public static Builder build(int serviceAreaId) {
		return new Builder(new AroCacheKey(serviceAreaId, -1L));
	}

	public static Builder build(int serviceAreaId, Long deploymentPlanId) {
		return new Builder(new AroCacheKey(serviceAreaId, deploymentPlanId));
	}
	
	public static Builder build(AroKey aroKey) {
		return new Builder(aroKey);
	}

	private static String calcExtentionKey(Map<String, Serializable> params) {
		long crc = calcCrc(params);
		return crc == 0 ? "" : Long.toString(crc);
	}

	private static long calcCrc(Map<String, Serializable> params) {

		if (params.size() == 0) {
			return 0L;
		}

		StringBuilder sb = new StringBuilder();
		try {

			params.entrySet()
					.stream()
					.sorted((o1, o2) -> o1.getKey().compareTo(o2.getKey()))
					.map(Map.Entry::getValue)
					.forEachOrdered(
							val -> {
								if (val instanceof Fingerprintable) {
									((Fingerprintable) val)
											.appendFingerprint(sb::append);
								} else if (val instanceof Object[]) {
									sb.append(Arrays
											.deepToString((Object[]) val));

								} else if (val != null) {
									sb.append(val.toString());
								} else {
									sb.append("NULL");
								}

							});

		} catch (Throwable err) {
			throw new RuntimeException(err.getMessage(), err);
		}

		byte[] results = sb.toString().getBytes();
		Checksum checksum = new CRC32();
		checksum.update(results, 0, results.length);

		return checksum.getValue();

	}

	public AroKey getAroKey() {
		return aroKey;
	}

	public Map<String, Serializable> getParams() {
		return params;
	}

	public <T> T getParam(String key, Class<T> clz) {
		return clz.cast(params.get(key));
	}

	public Integer getServiceAreaId() {
		return aroKey.getServiceAreaId();
	}

	// //

	@Override
	public String toString() {
		return " CacheQuery (" + aroKey.toString()
				+ (extentionKey.equals("") ? "" : "/" + extentionKey) + ")";
	}

	public Long getDeploymentPlanId() {
		return aroKey.getPlanId();
	}

	public String getExtentionKey() {
		return extentionKey;
	}

	public static class Builder {
		private AroKey bsaKey;
		private Map<String, Serializable> params = new HashMap<>();

		public Builder(AroKey bsaKey) {
			super();
			this.bsaKey = bsaKey;
		}

		public Builder add(String key, Serializable value) {
			params.put(key, value);
			return this;
		}

		public CacheQuery build() {
			return new CacheQuery(bsaKey, params, calcExtentionKey(params));
		}
	}

}
