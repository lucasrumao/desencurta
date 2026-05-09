package com.urlexpander.controller;

import com.urlexpander.model.PreviewResponse;
import com.urlexpander.service.PreviewService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class PreviewController {

    private static final Logger log = LoggerFactory.getLogger(PreviewController.class);

    private final PreviewService previewService;

    public PreviewController(PreviewService previewService) {
        this.previewService = previewService;
    }

    /**
     * GET /preview?url=<encoded_url>
     * Retorna título, descrição e imagem (og:tags) da página de destino.
     */
    @GetMapping("/preview")
    public ResponseEntity<PreviewResponse> preview(@RequestParam String url) {
        log.info("Fetching preview for: {}", url);
        PreviewResponse response = previewService.fetchPreview(url);
        return ResponseEntity.ok(response);
    }
}