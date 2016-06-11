package com.altvil.aro.service.cu.resource;

import java.io.Serializable;
import java.util.Set;

import com.altvil.aro.service.cu.version.VersionType;

public interface ResourceVersion extends Serializable {

	Set<VersionType> keys();

	Long getVersion(VersionType versionType);

}
