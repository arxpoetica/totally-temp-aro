package com.altvil.interfaces;

import com.altvil.aro.service.entity.FiberType;

public class FiberCableConstructionType {

	private FiberType fiberType;
	private CableConstructionEnum cableConstructionEnum;
	private String code;

	public FiberCableConstructionType(FiberType fiberType,
			CableConstructionEnum cableConstructionEnum) {
		super();
		this.fiberType = fiberType;
		this.cableConstructionEnum = cableConstructionEnum;

		this.code = fiberType.getCode() + "_fiber"  ;
		if(  !cableConstructionEnum.isComputedEstimate() ) {
			this.code += "_"  + cableConstructionEnum.getCodeName();
		}
		
	}

	public FiberType getFiberType() {
		return fiberType;
	}

	public CableConstructionEnum getCableConstructionEnum() {
		return cableConstructionEnum;
	}

	public String getCode() {
		return code;
	}
	
	

	@Override
	public String toString() {
		return code ;
	}

	@Override
	public int hashCode() {
		return code.hashCode();
	}

	@Override
	public boolean equals(Object obj) {

		if (obj == this) {
			return true;
		}

		if (obj instanceof FiberCableConstructionType) {
			return ((FiberCableConstructionType) obj).getCode().equals(
					getCode());
		}

		return false;

	}


	
}
