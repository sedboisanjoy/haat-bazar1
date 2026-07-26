package com.Haat_Bazar.backup_service.service;

import com.Haat_Bazar.backup_service.entity.BackupRecord;
import com.Haat_Bazar.backup_service.exception.ResourceNotFoundException;
import com.Haat_Bazar.backup_service.repository.BackupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.zip.GZIPOutputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class BackupService {

    @Value("${backup.directory:/tmp/haat-bazar-backups}")
    private String backupDirectory;

    @Value("${backup.db.host:localhost}")
    private String dbHost;

    @Value("${backup.db.port:3306}")
    private String dbPort;

    @Value("${backup.db.username:root}")
    private String dbUsername;

    @Value("${backup.db.password:root}")
    private String dbPassword;

    // comma-separated list of databases to back up
    @Value("${backup.databases:auth_db,product_db,order_db,payment_db}")
    private String databases;

    private final BackupRepository backupRepository;

    // Runs every day at 2:00 AM by default; override via backup.schedule property
    @Scheduled(cron = "${backup.schedule:0 0 2 * * *}")
    public void scheduledBackup() {
        log.info("Scheduled backup triggered");
        performBackup();
    }

    @Transactional
    public BackupRecord performBackup() {
        String timestamp = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "backup_" + timestamp + ".sql.gz";

        BackupRecord record = BackupRecord.builder()
                .filename(filename)
                .databases(databases)
                .status("IN_PROGRESS")
                .createdAt(LocalDateTime.now())
                .build();
        record = backupRepository.save(record);

        Path outPath = Paths.get(backupDirectory, filename);

        try {
            Files.createDirectories(Paths.get(backupDirectory));

            List<String> command = new ArrayList<>(List.of(
                    "mysqldump",
                    "-h", dbHost,
                    "-P", dbPort,
                    "-u", dbUsername,
                    "-p" + dbPassword,
                    "--databases"
            ));
            command.addAll(Arrays.asList(databases.split(",")));

            Process process = new ProcessBuilder(command).start();

            // Drain stderr on a separate thread to prevent the process from blocking
            StringBuilder errorOutput = new StringBuilder();
            Thread stderrReader = new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(process.getErrorStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        errorOutput.append(line).append(System.lineSeparator());
                    }
                } catch (IOException ignored) {}
            });
            stderrReader.start();

            // Pipe mysqldump stdout → gzip → file
            try (InputStream sql = process.getInputStream();
                 GZIPOutputStream gzip = new GZIPOutputStream(
                         new BufferedOutputStream(Files.newOutputStream(outPath)))) {
                sql.transferTo(gzip);
            }

            stderrReader.join();
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new RuntimeException(
                        "mysqldump exited with code " + exitCode + ": " + errorOutput);
            }

            record.setFileSizeBytes(Files.size(outPath));
            record.setStatus("SUCCESS");
            log.info("Backup completed: {} ({} bytes)", filename, record.getFileSizeBytes());

        } catch (Exception e) {
            log.error("Backup failed: {}", e.getMessage());
            record.setStatus("FAILED");
            record.setErrorMessage(e.getMessage());
            try { Files.deleteIfExists(outPath); } catch (IOException ignored) {}
        }

        return backupRepository.save(record);
    }

    public List<BackupRecord> listBackups() {
        return backupRepository.findAllByOrderByCreatedAtDesc();
    }

    public Resource downloadBackup(Long id) {
        BackupRecord record = backupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Backup not found: " + id));

        if (!"SUCCESS".equals(record.getStatus())) {
            throw new IllegalStateException("Backup " + id + " is not available (status: " + record.getStatus() + ")");
        }

        Path path = Paths.get(backupDirectory, record.getFilename());
        if (!Files.exists(path)) {
            throw new ResourceNotFoundException("Backup file not found on disk: " + record.getFilename());
        }

        return new FileSystemResource(path);
    }

    @Transactional
    public void deleteBackup(Long id) {
        BackupRecord record = backupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Backup not found: " + id));

        try {
            Files.deleteIfExists(Paths.get(backupDirectory, record.getFilename()));
        } catch (IOException e) {
            log.warn("Could not delete backup file {}: {}", record.getFilename(), e.getMessage());
        }

        backupRepository.delete(record);
        log.info("Backup record {} deleted", id);
    }
}
