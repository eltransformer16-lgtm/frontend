package com.microgurity.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@SpringBootApplication
public class DemoApplication {

    @GetMapping("/weatherForecast")
    public String getMessage() {
        return "today is a great sunny day for a java service";
    }

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

}