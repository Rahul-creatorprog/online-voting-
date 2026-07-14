package com.college.voting.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String mailUsername;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String recipientEmail, String studentName, String otp) {
        String subject = "Department Election Verification OTP";
        String body = String.format(
            "Hello %s,\n\n" +
            "Your 6-digit verification code for the Department Online Voting System is: %s\n\n" +
            "This OTP is valid for 5 minutes. Do not share this code with anyone.\n\n" +
            "Regards,\n" +
            "Election Commission",
            studentName, otp
        );

        if ("your-email@gmail.com".equalsIgnoreCase(mailUsername)) {
            logOtpConsoleFallback(recipientEmail, studentName, otp, "Default SMTP credentials configured");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailUsername);
            message.setTo(recipientEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            logger.info("Successfully sent OTP email to {}", recipientEmail);
        } catch (Exception e) {
            logger.warn("Failed to send email via SMTP, falling back to console log. Error: {}", e.getMessage());
            logOtpConsoleFallback(recipientEmail, studentName, otp, e.getMessage());
        }
    }

    private void logOtpConsoleFallback(String email, String name, String otp, String reason) {
        System.out.println("\n");
        System.out.println("==================================================================");
        System.out.println("                   [OTP EMAIL FALLBACK LOG]                       ");
        System.out.println("==================================================================");
        System.out.println("Recipient Name  : " + name);
        System.out.println("Recipient Email : " + email);
        System.out.println("Generated OTP   : " + otp);
        System.out.println("Reason          : " + reason);
        System.out.println("==================================================================");
        System.out.println("\n");
    }
}
