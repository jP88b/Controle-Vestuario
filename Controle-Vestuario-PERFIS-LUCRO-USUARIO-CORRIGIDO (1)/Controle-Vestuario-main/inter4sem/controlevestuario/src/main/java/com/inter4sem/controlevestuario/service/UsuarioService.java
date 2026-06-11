package com.inter4sem.controlevestuario.service;

import java.util.List;

import java.util.Optional;
import org.springframework.stereotype.Service;

import com.inter4sem.controlevestuario.entity.UsuarioEntity;
import com.inter4sem.controlevestuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor

public class UsuarioService {
    private final UsuarioRepository usuarioRepository;

    private String normalizarPerfil(String perfil) {
        if (perfil == null || perfil.trim().isEmpty()) return "FUNCIONARIO";
        String valor = perfil.trim().toUpperCase();
        if (valor.equals("FUNCIONÁRIO")) valor = "FUNCIONARIO";
        if (!valor.equals("FUNCIONARIO") && !valor.equals("GERENTE") && !valor.equals("ADMINISTRADOR")) {
            return "FUNCIONARIO";
        }
        return valor;
    }

    public List<UsuarioEntity> listarTodos() {
        return usuarioRepository.findAll();
    }

    public UsuarioEntity editar(int id, UsuarioEntity Usuario) {
        // Verifique se o Usuario existe
        Optional<UsuarioEntity> UsuarioExistente = usuarioRepository.findById(id);

        if (UsuarioExistente.isPresent()) {
            // Atualiza o Usuario
            UsuarioEntity UsuarioAtualizada = UsuarioExistente.get();
            UsuarioAtualizada.setNome(Usuario.getNome()); // Atualiza os campos necessários
            UsuarioAtualizada.setEmail(Usuario.getEmail()); // Atualiza os campos necessários
            UsuarioAtualizada.setSenha(Usuario.getSenha()); // Atualiza os campos necessários
            UsuarioAtualizada.setPerfil(normalizarPerfil(Usuario.getPerfil())); // Perfil de acesso do usuário
            return usuarioRepository.save(UsuarioAtualizada); // Salva o Usuario atualizado
        } else {
            // Caso o Usuario não exista, retorna null
            return null;
        }
    }

    public void excluir(Integer id) {
        usuarioRepository.deleteById(id);
    }

    public UsuarioEntity incluir(UsuarioEntity Usuario) {
        if (Usuario != null) {
            Usuario.setPerfil(normalizarPerfil(Usuario.getPerfil()));
        }
        return usuarioRepository.save(Usuario);
    }
}


