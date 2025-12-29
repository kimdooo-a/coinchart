# Project Structure Map

> [!NOTE]
> This file maps the high-level folder structure of the **Poly-Tech2** system.
> **Last Updated**: 2025-12-27

```mermaid
graph TD
    Root["/ (Project Root)"]
    
    %% Core Documentation
    Root --> Docs["docs/"]
    Docs --> Const["00_CONSTITUTION/"]
    Docs --> SharedContext["SHARED_CONTEXT.md"]
    
    %% Communication Channels
    Root --> Comm["communication/"]
    Comm --> Bootstrap["bootstrap/"]
    Bootstrap --> BootAnti["BOOTSTRAP_TO_ANTIGRAVITY.md"]
    Bootstrap --> BootCursor["BOOTSTRAP_TO_CURSOR.md"]
    Bootstrap --> BootClaude["BOOTSTRAP_TO_CLAUDE.md"]
    Bootstrap --> BootVSCode["BOOTSTRAP_TO_VSCODE.md"]
    
    %% Runtime & Execution
    Root --> Runtime["runtime/"]
    Runtime --> Bus["bus/"]
    Bus --> Evidence["(Evidence Files)"]
    
    %% Root Files
    Root --> Readme["README.md (Single Entry Contract)"]
    Root --> ToHuman["TO_HUMAN.md"]
    
    %% Styling
    style Root fill:#f9f,stroke:#333,stroke-width:2px
    style Readme fill:#ff9,stroke:#f66,stroke-width:2px
    style SharedContext fill:#9f9,stroke:#333,stroke-width:2px
```

## detailed Tree View

```text
/
├── README.md                   <-- [Single Entry Contract]
├── TO_HUMAN.md                 <-- [Status Report]
├── PROJECT_STRUCTURE.md        <-- [This File]
├── communication/
│   └── bootstrap/              <-- [Agent Onboarding Templates]
│       ├── BOOTSTRAP_TO_ANTIGRAVITY.md
│       ├── BOOTSTRAP_TO_CLAUDE.md
│       ├── BOOTSTRAP_TO_CURSOR.md
│       └── BOOTSTRAP_TO_VSCODE.md
├── docs/
│   ├── SHARED_CONTEXT.md       <-- [Session Baseline]
│   └── 00_CONSTITUTION/        <-- [Governance Rules]
│       ├── CONSTITUTION.md
│       ├── ROLE_MODEL.md
│       ├── WORKFLOW.md
│       └── ...
├── runtime/
│   └── bus/                    <-- [Execution Evidence]
└── message/                    <-- [Legacy Prompts]
```
