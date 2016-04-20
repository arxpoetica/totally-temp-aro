package com.altvil.aro.processing.ignite;

import java.util.concurrent.ConcurrentMap;
import org.apache.ignite.Ignite;
import org.apache.ignite.IgniteCache;
import org.apache.ignite.IgniteException;
import org.apache.ignite.Ignition;
import org.apache.ignite.cache.CacheMode;
import org.apache.ignite.configuration.CacheConfiguration;

public class CacheApiExample 
{
    /** Cache name. */
    private static final String CACHE_NAME = CacheApiExample.class.getSimpleName();
    
    public static void main(String[] args) throws IgniteException {
        try (Ignite ignite = Ignition.start("com/altvil/aro/processing/ignite/config/example-ignite.xml")) {
            System.out.println();
            System.out.println(">>> Cache API example started.");

            CacheConfiguration<Integer, String> cfg = new CacheConfiguration<>();

            cfg.setCacheMode(CacheMode.PARTITIONED);
            cfg.setName(CACHE_NAME);

            // Auto-close cache at the end of the example.
            try (IgniteCache<Integer, String> cache = ignite.getOrCreateCache(cfg)) {
                // Demonstrate atomic map operations.
                atomicMapOperations(cache);
            }
            finally {
                // Distributed cache could be removed from cluster only by #destroyCache() call.
                ignite.destroyCache(CACHE_NAME);
            }
        }
    }

    /**
     * Demonstrates cache operations similar to {@link ConcurrentMap} API. Note that
     * cache API is a lot richer than the JDK {@link ConcurrentMap}.
     *
     * @throws IgniteException If failed.
     */
    private static void atomicMapOperations(final IgniteCache<Integer, String> cache) throws IgniteException {
        System.out.println();
        System.out.println(">>> Cache atomic map operation examples.");

        // Put and return previous value.
        String v = cache.getAndPut(1, "1");
        assert v == null;

        // Put and do not return previous value (all methods ending with 'x' return boolean).
        // Performs better when previous value is not needed.
        cache.put(2, "2");

        // Put-if-absent.
        boolean b1 = cache.putIfAbsent(4, "4");
        boolean b2 = cache.putIfAbsent(4, "44");
        assert b1 && !b2;

        // Invoke - assign new value based on previous value.
        cache.put(6, "6");

        cache.invoke(6, (entry, args) -> {
            String val = entry.getValue();

            entry.setValue(val + "6"); // Set new value based on previous value.

            return null;
        });

        // Replace.
        cache.put(7, "7");
        b1 = cache.replace(7, "7", "77");
        b2 = cache.replace(7, "7", "777");
        assert b1 & !b2;
    }

}
