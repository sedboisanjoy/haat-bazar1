package com.Haat_Bazar.backup_service.repository;

import com.Haat_Bazar.backup_service.entity.BackupRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BackupRepository extends JpaRepository<BackupRecord, Long> {
    List<BackupRecord> findAllByOrderByCreatedAtDesc();
    Optional<BackupRecord> findFirstByOrderByCreatedAtDesc();
}
