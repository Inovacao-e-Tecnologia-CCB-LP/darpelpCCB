# DARPE – Lençóis Paulista

![Status](https://img.shields.io/badge/status-em%20uso-brightgreen)
![Frontend](https://img.shields.io/badge/frontend-HTML%20%7C%20CSS%20%7C%20JS-blue)
![Backend](https://img.shields.io/badge/backend-Google%20Apps%20Script-green)
![Database](https://img.shields.io/badge/database-Google%20Sheets-orange)

Sistema web simples para **gerenciamento de inscrições em eventos musicais e evangelísticos**, integrado ao **Google Sheets via Google Apps Script**.

Projeto desenvolvido com foco em **usabilidade, simplicidade e acessibilidade**, permitindo o uso até por pessoas sem familiaridade com tecnologia.

---

## 🚀 Funcionalidades

### 📌 Confirmação de Presença

* Seleção de:
  * Local
  * Data / Programação
  * Instrumento (filtrado automaticamente)

* Campo para inserção do nome

* Validações:
  * Instrumentos permitidos por local
  * Limite máximo de inscritos por data
  * Duplicidade de inscrição (nome + instrumento + local + data)

* Salvamento direto no Google Sheets

---

### 👀 Visualização de Inscritos

* Agrupamento por:
  * Local
  * Data do evento

* Lista com nome e instrumento

* Atualização em tempo real

* Opções:
  * Excluir inscrições
  * Copiar endereço
  * Abrir no Google Maps
  * Compartilhar via WhatsApp

---

### 📅 Visualização de Calendário

* Visualização desktop:
  * Nome do local
  * Horário
  * Tipo de visita

* Visualização mobile:
  * Indicadores visuais (bolinhas coloridas)

* Interações:
  * Clique em dia com programação → exibe detalhes
  * Clique em dia vazio → cria nova programação

* Funcionalidades:
  * Copiar endereço
  * Abrir no Google Maps

  * Download de:
    * Imagem
    * PDF

  * Compartilhamento via WhatsApp

---

### 🛠️ Painel Administrativo

* Autenticação por senha
* Controle de acesso às funcionalidades

* Funcionalidades disponíveis:
  * Gerenciamento de locais
  * Gerenciamento de instrumentos
  * Gerenciamento de programações
  * Regras de datas
  * Integrações

* Validações:
  * Senha incorreta ou não informada
  * Botão "Enter" para login
  * Visualização/ocultação de senha

---

### 📍 Locais

* CRUD completo:
  * Criar
  * Listar
  * Editar
  * Excluir

* Regras:
  * Nome único

  * Não permite excluir se houver:
    * Inscrições vinculadas
    * Programações vinculadas

* Atualização automática das inscrições ao editar local

---

### 🎸 Instrumentos

* CRUD completo:
  * Criar
  * Listar
  * Editar
  * Excluir

* Regras:
  * Nome único
  * Não permite excluir se houver inscrições vinculadas

* Atualização automática das inscrições ao editar instrumento

---

### 📊 Relatórios

* Exibição completa de locais e datas

* Campos dinâmicos conforme tipo de visita:
  * Exibe campo **“Palavra”** apenas em visitas de evangelização

* Exportação:
  * PDF

* Compartilhamento via WhatsApp

* Validação de preenchimento correto dos dados

---

### 📆 Regras de Datas

* CRUD de regras
* Geração automática de programações
* Validação de consistência das regras
* Controle de recorrência mensal

---

### 🗓️ Programação

* Criar, editar e excluir programações
* Geração automática baseada em regras
* Remoção automática de programações antigas

* Comportamento:
  * Clique em dia vazio → criar programação
  * Clique em dia com programação → visualizar detalhes

* Integração com:
  * Endereço
  * Google Maps

---

### 🔗 Integrações

* CRUD de integrações
* Controle de acesso via URL
* Isolamento de dados por integração
* Permite diferentes usuários acessarem diferentes contextos

---

## 🧠 Tecnologias Utilizadas

### 🎨 Frontend

* HTML5
* CSS3 (com Bootstrap)
* JavaScript (Vanilla JS)

### ⚙️ Backend

* Google Apps Script
* Google Sheets como banco de dados

---

## 💡 Observações

* Sistema projetado para ser **simples e intuitivo**
* Foco em **baixo custo e alta acessibilidade**
* Sem necessidade de login para usuários finais
* Totalmente integrado ao ecossistema Google