# 💬 Connecta — Chat em Tempo Real

> Projeto desenvolvido como trabalho prático da disciplina de **Desenvolvimento de Aplicações Web**  
> Curso de Análise e Desenvolvimento de Sistemas

![Node.js](https://img.shields.io/badge/Node.js-v24-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socketdotio&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/license-ISC-blue?style=flat-square)

---

## 📌 Sobre o Projeto

O **Connecta** é uma aplicação de chat em tempo real que permite a comunicação instantânea entre múltiplos usuários organizados em salas temáticas. O projeto foi desenvolvido com o objetivo de explorar na prática os conceitos de comunicação bidirecional via WebSocket, persistência de dados em banco não relacional e arquitetura MVC aplicada ao backend com Node.js.

A aplicação permite que usuários entrem em salas, troquem mensagens instantâneas, visualizem quem está online e vejam o histórico das últimas 50 mensagens ao entrar em uma sala.

---

## 🎯 Objetivos

- Compreender o funcionamento do protocolo WebSocket e sua diferença em relação ao HTTP tradicional
- Implementar comunicação em tempo real com Socket.IO
- Aplicar o padrão de arquitetura MVC em uma aplicação Node.js
- Integrar um banco de dados NoSQL (MongoDB Atlas) para persistência de mensagens
- Desenvolver um frontend funcional consumindo eventos em tempo real

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Finalidade |
|---|---|---|
| Node.js | v24 | Ambiente de execução JavaScript no servidor |
| Express | 4.x | Framework HTTP para criação de rotas e middlewares |
| Socket.IO | 4.x | Comunicação bidirecional em tempo real via WebSocket |
| MongoDB Atlas | Cloud | Banco de dados NoSQL para persistência de mensagens |
| Mongoose | 8.x | ODM para modelagem de dados com o MongoDB |
| dotenv | 16.x | Gerenciamento de variáveis de ambiente |
| HTML/CSS/JS | — | Interface do usuário (frontend vanilla) |

---

## ⚙️ Funcionalidades

- [x] Entrada em salas com nome de usuário personalizado
- [x] Envio e recebimento de mensagens em tempo real
- [x] Histórico das últimas 50 mensagens ao entrar na sala
- [x] Lista de usuários online atualizada dinamicamente
- [x] Indicador "está digitando..." com debounce
- [x] Notificação de entrada e saída de usuários
- [x] Reconexão automática em caso de queda de conexão
- [x] Persistência de mensagens no banco de dados

---

## 🏗️ Arquitetura do Projeto

O projeto segue o padrão **MVC (Model-View-Controller)** adaptado para aplicações Node.js com WebSocket:

```
Connecta-chat-em-tempo-real/
│
├── public/                  # View — interface do usuário (frontend)
│   ├── index.html           # Estrutura HTML da aplicação
│   ├── chat.js              # Lógica do cliente e eventos Socket.IO
│   └── style.css            # Estilização da interface
│
├── src/
│   ├── config/
│   │   └── database.js      # Configuração e conexão com o MongoDB
│   │
│   ├── models/
│   │   └── Message.js       # Model — schema de mensagens (Mongoose)
│   │
│   ├── routes/
│   │   └── chatRoutes.js    # Controller HTTP — rotas REST (Express)
│   │
│   └── sockets/
│       └── chatSocket.js    # Controller WebSocket — eventos Socket.IO
│
├── .env                     # Variáveis de ambiente (não versionado)
├── .gitignore               # Arquivos ignorados pelo Git
├── package.json             # Dependências e scripts do projeto
└── server.js                # Ponto de entrada da aplicação
```

### Fluxo de comunicação

```
Cliente (Navegador)
    │
    ├── HTTP  ──────────► Express (rotas REST)
    │                         │
    │                         ▼
    │                    chatRoutes.js ──► MongoDB (histórico)
    │
    └── WebSocket ──────► Socket.IO
                              │
                              ▼
                         chatSocket.js ──► MongoDB (salvar msg)
                              │
                              ▼
                     io.to(room).emit() ──► Todos os clientes da sala
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- Conta gratuita no [MongoDB Atlas](https://cloud.mongodb.com)
- Git

### Passo a passo

**1. Clone o repositório**
```bash
git clone https://github.com/ifelix081/Connecta-chat-em-tempo-real.git
cd Connecta-chat-em-tempo-real
```

**2. Instale as dependências**
```bash
npm install
```

**3. Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz do projeto:
```env
PORT=3000
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/connecta-chat
NODE_ENV=development
```

> Para obter a URI do MongoDB, acesse o [MongoDB Atlas](https://cloud.mongodb.com), crie um cluster gratuito e copie a string de conexão em **Database → Connect → Drivers**.

**4. Inicie o servidor**
```bash
# Modo desenvolvimento (com hot reload)
npm run dev

# Modo produção
npm start
```

**5. Acesse a aplicação**

Abra o navegador em: `http://localhost:3000`

---

## 🧪 Como Testar

Para simular múltiplos usuários, abra a aplicação em **duas abas ou navegadores diferentes** e entre na mesma sala:

| Aba | Nome | Sala |
|---|---|---|
| Aba 1 | Alice | geral |
| Aba 2 | Bob | geral |

**Checklist de funcionalidades:**
- [ ] Alice entra → Bob vê "Alice entrou na sala"
- [ ] Alice digita → Bob vê "Alice está digitando..."
- [ ] Alice envia mensagem → aparece para ambos instantaneamente
- [ ] Novo usuário entra → recebe as últimas 50 mensagens
- [ ] Alice fecha a aba → Bob vê "Alice saiu da sala"

---

## 📡 Eventos Socket.IO

| Evento | Direção | Descrição |
|---|---|---|
| `join_room` | Cliente → Servidor | Usuário entra em uma sala |
| `send_message` | Cliente → Servidor | Usuário envia uma mensagem |
| `typing` | Cliente → Servidor | Usuário está digitando |
| `message_history` | Servidor → Cliente | Histórico de mensagens da sala |
| `new_message` | Servidor → Cliente | Nova mensagem recebida |
| `room_users` | Servidor → Cliente | Lista de usuários online |
| `user_joined` | Servidor → Cliente | Notificação de entrada |
| `user_left` | Servidor → Cliente | Notificação de saída |
| `user_typing` | Servidor → Cliente | Indicador de digitação |

---

## 🗄️ Modelo de Dados

### Message

```javascript
{
  room:      String,   // nome da sala
  username:  String,   // nome do usuário
  text:      String,   // conteúdo da mensagem (máx. 1000 caracteres)
  createdAt: Date      // data e hora de envio
}
```

Índice composto em `{ room, createdAt }` para otimização das consultas de histórico.

---

## 📚 Conceitos Aplicados

- **WebSocket vs HTTP:** o WebSocket mantém uma conexão persistente e bidirecional, eliminando a necessidade de o cliente fazer requisições repetidas ao servidor para verificar novas mensagens (polling). O Socket.IO abstrai esse protocolo e adiciona reconexão automática e fallback para HTTP.

- **Padrão MVC:** separação clara entre Model (schema Mongoose), View (HTML/CSS/JS) e Controller (rotas Express + eventos Socket.IO), facilitando manutenção e escalabilidade.

- **Banco NoSQL:** o MongoDB foi escolhido por sua flexibilidade de schema e boa performance para leitura/escrita de documentos como mensagens de chat, onde não há relações complexas entre entidades.

- **Debounce no evento typing:** o indicador "digitando..." usa debounce de 1,5 segundo para evitar sobrecarga no servidor — o evento só é disparado quando o usuário para de digitar, não a cada tecla pressionada.

---

## 👨‍💻 Autor

Desenvolvido por **Italo Felix**  
GitHub: [@ifelix081](https://github.com/ifelix081)

---

## 📄 Licença

Este projeto está sob a licença ISC. Desenvolvido para fins acadêmicos.
