package com.altvil.aro.service.cu.resource;

import java.util.Map;
import java.util.Set;

import com.altvil.aro.service.cu.version.VersionType;

public class CompositeVersion implements ResourceVersion {
    /**
    *
    */
   private static final long serialVersionUID = 1L;
   private Map<VersionType, Long> versions;

   public CompositeVersion(Map<VersionType, Long> versions) {
       super();

       this.versions = versions;
   }

   @Override
   public boolean equals(Object obj) {
       if (obj instanceof CompositeVersion) {
           return versions.equals(((CompositeVersion) obj).versions);
       }
       return false;
   }
   
   


   @Override
	public Set<VersionType> keys() {
		return versions.keySet() ;
	}

	@Override
   public Long getVersion(VersionType versionType) {
       return versions.get(versionType);
   }
}
