package com.Haat_Bazar.backup_service.controller;

import com.Haat_Bazar.backup_service.entity.BackupRecord;
import com.Haat_Bazar.backup_service.service.BackupService;
import com.Haat_Bazar.backup_service.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/backup")
@RequiredArgsConstructor
public class BackupController {

    private final BackupService backupService;
    private final ReportService reportService;

    // Manually trigger a full backup
    @PostMapping("/trigger")
    public ResponseEntity<BackupRecord> triggerBackup() {
        BackupRecord record = backupService.performBackup();
        HttpStatus status = "SUCCESS".equals(record.getStatus())
                ? HttpStatus.CREATED
                : HttpStatus.INTERNAL_SERVER_ERROR;
        return ResponseEntity.status(status).body(record);
    }

    // List all backup records, newest first
    @GetMapping
    public ResponseEntity<List<BackupRecord>> listBackups() {
        return ResponseEntity.ok(backupService.listBackups());
    }

    // Download a specific backup file as .sql.gz
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadBackup(@PathVariable Long id) {
        Resource file = backupService.downloadBackup(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + file.getFilename() + "\"")
                .body(file);
    }

    // Delete a backup record and its file
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBackup(@PathVariable Long id) {
        backupService.deleteBackup(id);
        return ResponseEntity.noContent().build();
    }

    // Activity report — aggregates stats from all databases
    @GetMapping("/report")
    public ResponseEntity<Map<String, Object>> getReport() {
        return ResponseEntity.ok(reportService.generateReport());
    }
}
