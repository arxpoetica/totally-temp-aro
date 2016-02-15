package com.altvil.aro.service.dao;

import java.util.function.Function;

public interface Accessor<D> {
	
	  <T> T read(Function<D, T> f) ;
	  void modify(Modification<D> mod) ;
	  <T> T returnResult(Function<D, T> f) ;
	  public D modify() ;
	  public D read() ;

}
