package com.inter4sem.controlevestuario.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.inter4sem.controlevestuario.entity.MovimentacaoEntity;

@Repository
public interface MovimentacaoRepository extends JpaRepository<MovimentacaoEntity, Integer> {

}

