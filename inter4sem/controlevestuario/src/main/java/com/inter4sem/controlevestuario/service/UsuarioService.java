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
        return usuarioRepository.save(Usuario);
    }
}


