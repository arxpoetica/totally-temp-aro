package com.altvil.aro.persistence.repository.model;

import com.altvil.aro.service.model.WireCenter;

public class WireCenterImpl implements WireCenter {
	private final Integer id;
	private final long gid;
	private final String state;
	private final String wireCenter;
	private final String aocn;
	private final String aocnName;
	private final String geog;
	private final String geom;
	
	public WireCenterImpl(Integer id, long gid, String state, String wireCenter, String aocn, String aocnName, String geog,
			String geom) {
		this.id = id;
		this.gid = gid;
		this.state = state;
		this.wireCenter = wireCenter;
		this.aocn = aocn;
		this.aocnName = aocnName;
		this.geog = geog;
		this.geom = geom;
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.model.WireCenter#getId()
	 */
	@Override
	public Integer getId() {
		return id;
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.model.WireCenter#getGid()
	 */
	@Override
	public long getGid() {
		return gid;
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.model.WireCenter#getState()
	 */
	@Override
	public String getState() {
		return state;
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.model.WireCenter#getWireCenter()
	 */
	@Override
	public String getWireCenter() {
		return wireCenter;
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.model.WireCenter#getAocn()
	 */
	@Override
	public String getAocn() {
		return aocn;
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.model.WireCenter#getAocnName()
	 */
	@Override
	public String getAocnName() {
		return aocnName;
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.model.WireCenter#getGeog()
	 */
	@Override
	public String getGeog() {
		return geog;
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.model.WireCenter#getGeom()
	 */
	@Override
	public String getGeom() {
		return geom;
	}
}