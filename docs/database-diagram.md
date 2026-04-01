# Diagrama ER (schema Prisma)

Renderiza automaticamente no **GitHub** / **GitLab** ao visualizar este arquivo (Mermaid nativo no Markdown).

> **Limite:** sites como [mermaid.live](https://mermaid.live) podem restringir uso; arquivos `.md` no repositório **não** têm limite de diagramas. Alternativas gratuitas locais: VS Code + extensão Mermaid, Obsidian.

```mermaid
erDiagram
  users {
    int id PK
    varchar name
    varchar email UK
    varchar password
    varchar role
    timestamp created_at
    timestamp updated_at
  }

  teams {
    int id PK
    varchar name
    text description
    timestamp created_at
    timestamp updated_at
  }

  team_members {
    int id PK
    int user_id FK
    int team_id FK
    timestamp created_at
  }

  tasks {
    int id PK
    varchar title
    text description
    varchar status
    varchar priority
    int assigned_to FK
    int team_id FK
    timestamp created_at
    timestamp updated_at
  }

  tasks_history {
    int id PK
    int task_id FK
    int changed_by FK
    varchar old_status
    varchar new_status
    timestamp changed_at
  }

  users ||--o{ team_members : user_id
  teams ||--o{ team_members : team_id

  users ||--o{ tasks : assigned_to
  teams ||--o{ tasks : team_id

  tasks ||--o{ tasks_history : task_id
  users ||--o{ tasks_history : changed_by
```
