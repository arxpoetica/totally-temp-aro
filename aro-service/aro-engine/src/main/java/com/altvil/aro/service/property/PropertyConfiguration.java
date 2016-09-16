package com.altvil.aro.service.property;

import java.util.Set;

public interface PropertyConfiguration {

	Set<SymbolRef> getSymbolReferences();

	SystemProperty getSystemProperty(SymbolRef id);

}
