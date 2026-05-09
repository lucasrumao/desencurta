package com.urlexpander.exception;

import com.urlexpander.model.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(InvalidUrlException.class)
    public ResponseEntity<ErrorResponse> handleInvalidUrl(InvalidUrlException e) {
        return ResponseEntity.badRequest()
            .body(new ErrorResponse(e.getMessage(), "INVALID_URL"));
    }

    @ExceptionHandler(MaxRedirectsException.class)
    public ResponseEntity<ErrorResponse> handleMaxRedirects(MaxRedirectsException e) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(new ErrorResponse(e.getMessage(), "MAX_REDIRECTS"));
    }

    @ExceptionHandler(SocketTimeoutException.class)
    public ResponseEntity<ErrorResponse> handleTimeout(SocketTimeoutException e) {
        return ResponseEntity.status(HttpStatus.GATEWAY_TIMEOUT)
            .body(new ErrorResponse("A URL não respondeu a tempo. O servidor pode estar lento ou fora do ar.", "TIMEOUT"));
    }

    @ExceptionHandler(ConnectException.class)
    public ResponseEntity<ErrorResponse> handleConnectRefused(ConnectException e) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
            .body(new ErrorResponse(
                "Não foi possível conectar ao servidor de destino. " +
                "O domínio pode estar fora do ar, bloqueado pela sua rede, ou recusando conexões.",
                "CONNECTION_REFUSED"
            ));
    }

    @ExceptionHandler(UnknownHostException.class)
    public ResponseEntity<ErrorResponse> handleUnknownHost(UnknownHostException e) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
            .body(new ErrorResponse(
                "Domínio não encontrado: " + e.getMessage() + ". Verifique se a URL está correta.",
                "UNKNOWN_HOST"
            ));
    }

    @ExceptionHandler(IOException.class)
    public ResponseEntity<ErrorResponse> handleIO(IOException e) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
            .body(new ErrorResponse(
                "Erro de rede ao acessar a URL: " + e.getMessage(),
                "NETWORK_ERROR"
            ));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParam(MissingServletRequestParameterException e) {
        return ResponseEntity.badRequest()
            .body(new ErrorResponse("Parâmetro obrigatório ausente: " + e.getParameterName(), "MISSING_PARAM"));
    }

    @ExceptionHandler(RateLimitException.class)
    public ResponseEntity<ErrorResponse> handleRateLimit(RateLimitException e) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .header("Retry-After", "60")
            .body(new ErrorResponse("Limite de requisições atingido. Tente novamente em 1 minuto.", "RATE_LIMIT"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception e) {
        log.error("Unexpected error expanding URL", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse("Falha ao expandir a URL: " + e.getMessage(), "EXPANSION_ERROR"));
    }
}