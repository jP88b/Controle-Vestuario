package com.inter4sem.controlevestuario.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "produtos")
public class ProdutoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String nome;
    private String descricao;

    @Column(name = "preco_custo")
    private double precoCusto;

    @Column(name = "preco_venda")
    private double precoVenda;

    private Integer quantidade;

    @ManyToOne
    @JoinColumn(name = "idcategoria", referencedColumnName = "id")
    private CategoriaEntity categoria;

    @ManyToOne
    @JoinColumn(name = "idfornecedor", referencedColumnName = "id")
    private FornecedorEntity fornecedor;
}
