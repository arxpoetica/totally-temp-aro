package com.altvil.aro.service.cu.execute;

public interface CancelOperation {

	public interface CancelOperationListener {
		void onCancel() ;
	}
	
	void addListener(CancelOperationListener listener) ;
	
	boolean isCancelled() ;
	
	
}
