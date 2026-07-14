package com.college.voting;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@SpringBootApplication
public class VotingApplication {

    private static final Logger logger = LoggerFactory.getLogger(VotingApplication.class);

    @Value("${app.upload.dir:uploads/}")
    private String uploadDir;

    public static void main(String[] args) {
        SpringApplication.run(VotingApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDirectories() {
        return args -> {
            try {
                // Initialize local directories for candidate and student photo storage
                Path candidatesPath = Paths.get(uploadDir, "candidates");
                if (!Files.exists(candidatesPath)) {
                    Files.createDirectories(candidatesPath);
                    logger.info("Created local uploads directory at {}", candidatesPath.toAbsolutePath());
                } else {
                    logger.info("Local uploads directory exists at {}", candidatesPath.toAbsolutePath());
                }
            } catch (Exception e) {
                logger.error("Failed to initialize server upload folders: {}", e.getMessage());
            }
        };
    }
}
