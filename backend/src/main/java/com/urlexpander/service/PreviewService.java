package com.urlexpander.service;

import com.urlexpander.model.PreviewResponse;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class PreviewService {

    private static final Logger log = LoggerFactory.getLogger(PreviewService.class);

    private static final String USER_AGENT =
        "Mozilla/5.0 (compatible; UnravelBot/1.0; +https://desencurta.vercel.app)";

    private static final int TIMEOUT_MS = 8_000;

    @Cacheable(value = "urlExpansions", key = "'preview:' + #url")
    public PreviewResponse fetchPreview(String url) {
        try {
            Document doc = Jsoup.connect(url)
                .userAgent(USER_AGENT)
                .timeout(TIMEOUT_MS)
                .followRedirects(true)
                .ignoreHttpErrors(true)
                .get();

            String title       = metaOrFallback(doc, "og:title",       doc.title());
            String description = metaOrFallback(doc, "og:description",  meta(doc, "description"));
            String image       = metaOrFallback(doc, "og:image",        "");

            // Garante que a imagem seja uma URL absoluta
            if (image != null && image.startsWith("/")) {
                try {
                    java.net.URI base = new java.net.URI(url);
                    image = base.getScheme() + "://" + base.getHost() + image;
                } catch (Exception ignored) {}
            }

            return new PreviewResponse(
                truncate(title, 80),
                truncate(description, 200),
                image,
                url
            );

        } catch (Exception e) {
            log.warn("Preview fetch failed for {}: {}", url, e.getMessage());
            return new PreviewResponse(null, null, null, url);
        }
    }

    /* Tenta og: primeiro, cai no fallback se vazio */
    private String metaOrFallback(Document doc, String ogProp, String fallback) {
        String val = meta(doc, ogProp);
        return (val != null && !val.isBlank()) ? val : (fallback != null ? fallback : "");
    }

    private String meta(Document doc, String nameOrProp) {
        // Tenta property (og:) primeiro, depois name (description)
        Element el = doc.selectFirst("meta[property=" + nameOrProp + "]");
        if (el == null) el = doc.selectFirst("meta[name=" + nameOrProp + "]");
        if (el == null) return "";
        return el.attr("content").trim();
    }

    private String truncate(String s, int max) {
        if (s == null || s.isBlank()) return null;
        return s.length() > max ? s.substring(0, max) + "…" : s;
    }
}
