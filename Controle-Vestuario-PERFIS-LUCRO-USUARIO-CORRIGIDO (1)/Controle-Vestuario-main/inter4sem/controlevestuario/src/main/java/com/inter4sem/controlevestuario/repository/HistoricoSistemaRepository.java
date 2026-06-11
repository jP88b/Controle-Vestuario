package com.inter4sem.controlevestuario.repository;

import com.inter4sem.controlevestuario.entity.HistoricoSistemaEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HistoricoSistemaRepository extends JpaRepository<HistoricoSistemaEntity, Long> {
    List<HistoricoSistemaEntity> findAllByOrderByIdDesc();
}
