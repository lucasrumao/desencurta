package com.urlexpander.config;

import com.urlexpander.exception.RateLimitException;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitFilter implements Filter {

    // 30 requisições por minuto por IP
    private static final int MAX_REQUESTS_PER_MINUTE = 30;
    private static final long WINDOW_MS = 60_000;

    private final Map<String, RateBucket> buckets = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
        throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        if (req.getRequestURI().startsWith("/expand")) {
            String ip = getClientIp(req);
            if (!allow(ip)) {
                throw new RateLimitException("Rate limit exceeded for IP: " + ip);
            }
        }
        chain.doFilter(request, response);
    }

    private boolean allow(String ip) {
        long now = System.currentTimeMillis();
        RateBucket bucket = buckets.computeIfAbsent(ip, k -> new RateBucket(now));
        return bucket.tryConsume(now);
    }

    private String getClientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) return xff.split(",")[0].trim();
        return req.getRemoteAddr();
    }

    private static class RateBucket {
        private long windowStart;
        private final AtomicInteger count;

        RateBucket(long start) {
            this.windowStart = start;
            this.count = new AtomicInteger(0);
        }

        synchronized boolean tryConsume(long now) {
            if (now - windowStart > WINDOW_MS) {
                windowStart = now;
                count.set(0);
            }
            return count.incrementAndGet() <= MAX_REQUESTS_PER_MINUTE;
        }
    }
}
