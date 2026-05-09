package com.urlexpander.controller;

import com.urlexpander.model.ExpandResponse;
import com.urlexpander.service.UrlExpanderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/")
public class UrlExpanderController {

    private static final Logger log = LoggerFactory.getLogger(UrlExpanderController.class);

    private final UrlExpanderService service;

    public UrlExpanderController(UrlExpanderService service) {
        this.service = service;
    }

    /**
     * GET /expand?url=<encoded_url>
     * Expande uma URL encurtada e retorna o destino final com a cadeia de redirecionamentos.
     */
    @GetMapping("/expand")
    public ResponseEntity<ExpandResponse> expand(
        @RequestParam String url,
        @RequestHeader(value = "X-Forwarded-For", required = false) String clientIp
    ) throws Exception {
        log.info("Expanding URL: {} from IP: {}", url, clientIp);
        ExpandResponse response = service.expand(url);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
