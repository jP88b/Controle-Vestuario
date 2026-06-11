package com.inter4sem.controlevestuario.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "[HistoricoSistema]")
public class HistoricoSistemaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String tabela;

    @Column(nullable = false, length = 30)
    private String acao;

    @Column(name = "registro_id")
    private Long registroId;

    @Column(nullable = false, length = 500)
    private String descricao;

    // Garante que o SQL Server insira o SYSDATETIME() padrão caso o Java envie nulo
    @Column(name = "data_evento", nullable = false, insertable = false, updatable = false, columnDefinition = "DATETIME2 DEFAULT SYSDATETIME()")
    private String dataEvento;

    private String usuario;
}