package com.inter4sem.controlevestuario.repository;

import com.inter4sem.controlevestuario.entity.HistoricoSistemaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HistoricoSistemaRepository extends JpaRepository<HistoricoSistemaEntity, Long> {
}