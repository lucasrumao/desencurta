package com.urlexpander.service;

import com.urlexpander.exception.InvalidUrlException;
import com.urlexpander.exception.MaxRedirectsException;
import com.urlexpander.model.ExpandResponse;
import com.urlexpander.model.RedirectHop;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.net.*;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class UrlExpanderService {

    private static final Logger log = LoggerFactory.getLogger(UrlExpanderService.class);

    private static final int MAX_REDIRECTS = 15;
    private static final int CONNECT_TIMEOUT_MS = 8_000;
    private static final int READ_TIMEOUT_MS = 10_000;

    private static final String USER_AGENT =
        "Mozilla/5.0 (compatible; UnravelBot/1.0; +https://unravel.app)";

    private static final List<String> BLOCKED_PATTERNS = List.of(
        "localhost", "127.0.0.1", "0.0.0.0", "10\\.", "192\\.168\\.", "172\\.(1[6-9]|2[0-9]|3[01])\\."
    );

    @Cacheable(value = "urlExpansions", key = "#url", unless = "#result == null")
    public ExpandResponse expand(String url) throws Exception {
        long start = System.currentTimeMillis();

        validateUrl(url);
        checkBlockedHosts(url);

        List<RedirectHop> hops = new ArrayList<>();
        String currentUrl = url;
        int finalStatus = 200;

        for (int i = 0; i <= MAX_REDIRECTS; i++) {
            if (i == MAX_REDIRECTS) {
                throw new MaxRedirectsException("Limite de " + MAX_REDIRECTS + " redirecionamentos atingido");
            }

            HttpURLConnection conn = createConnection(currentUrl);
            int statusCode = conn.getResponseCode();
            String location = conn.getHeaderField("Location");
            conn.disconnect();

            log.debug("Hop {}: {} → {} [{}]", i, currentUrl, location, statusCode);

            if (isRedirect(statusCode)) {
                hops.add(new RedirectHop(currentUrl, statusCode));
                if (location == null || location.isBlank()) break;
                currentUrl = resolveLocation(currentUrl, location);
                checkBlockedHosts(currentUrl);
            } else {
                finalStatus = statusCode;
                break;
            }
        }

        long elapsed = System.currentTimeMillis() - start;
        String domain = extractDomain(currentUrl);

        return new ExpandResponse(url, currentUrl, finalStatus, hops, domain, elapsed);
    }

    private HttpURLConnection createConnection(String url) throws Exception {
        URL u = new URI(url).toURL();
        HttpURLConnection conn = (HttpURLConnection) u.openConnection();
        conn.setInstanceFollowRedirects(false);
        conn.setConnectTimeout(CONNECT_TIMEOUT_MS);
        conn.setReadTimeout(READ_TIMEOUT_MS);
        conn.setRequestMethod("HEAD");
        conn.setRequestProperty("User-Agent", USER_AGENT);
        conn.setRequestProperty("Accept", "*/*");
        conn.setRequestProperty("Accept-Language", "pt-BR,pt;q=0.9,en;q=0.8");
        conn.connect();
        return conn;
    }

    private boolean isRedirect(int statusCode) {
        return statusCode == 301 || statusCode == 302 ||
               statusCode == 303 || statusCode == 307 || statusCode == 308;
    }

    private String resolveLocation(String base, String location) {
        try {
            URI baseUri = new URI(base);
            URI locationUri = new URI(location);
            if (locationUri.isAbsolute()) return location;
            return baseUri.resolve(locationUri).toString();
        } catch (URISyntaxException e) {
            throw new InvalidUrlException("Redirecionamento com URL inválida: " + e.getMessage());
        }
    }

    private void validateUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new InvalidUrlException("URL não pode ser vazia");
        }
        try {
            URI uri = new URI(url);
            String scheme = uri.getScheme();
            if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
                throw new InvalidUrlException("Apenas URLs http:// e https:// são permitidas");
            }
            if (uri.getHost() == null || uri.getHost().isBlank()) {
                throw new InvalidUrlException("URL com host inválido");
            }
        } catch (URISyntaxException e) {
            throw new InvalidUrlException("URL malformada: " + e.getMessage());
        }
    }

    private void checkBlockedHosts(String url) {
        try {
            String host = new URI(url).getHost();
            if (host == null) return;
            for (String pattern : BLOCKED_PATTERNS) {
                if (Pattern.compile(pattern).matcher(host).find()) {
                    throw new InvalidUrlException("Host bloqueado por segurança: " + host);
                }
            }
        } catch (URISyntaxException e) {
            throw new InvalidUrlException("URL inválida durante verificação de segurança");
        }
    }

    private String extractDomain(String url) {
        try {
            return new URI(url).getHost();
        } catch (Exception e) {
            return url;
        }
    }
}