# Poly-Tech2 Identity Definition

## 1. What Poly-Tech2 IS
Poly-Tech2 is a **local, file-based, cost-free multi-agent orchestration library**.
It is a standardized **Information Architecture** and **Governance Framework** that enables multiple AI agents (e.g., Claude, ChatGPT, Local LLMs) to collaborate within a single repository using the file system as their only medium of communication and coordination.
It functions as a **Project Constitution**, imposing structure on chaos through an 8-Tier Document Hierarchy.

## 2. What Poly-Tech2 is NOT
- It is **NOT** a SaaS platform, Cloud Service, or API Gateway.
- It is **NOT** a "Black Box" agent runner or executable binary.
- It is **NOT** dependent on any specific vendor's orchestration API (e.g., OpenAI Assistants API, LangChain Cloud).
- It is **NOT** a pay-per-use service; it incurs zero overhead costs beyond the user's existing model usage.

## 3. What Problems It Is Designed to Solve
- **Orchestration Cost**: Eliminates the need for expensive middle-layer orchestration services.
- **Vendor Lock-in**: Decouples the orchestration logic from model providers. You can swap models/agents without breaking the workflow.
- **Opacity**: Makes agent interactions 100% transparent. Every "thought" and "action" is a file read or write, visible to the user.
- **Complexity of State**: Manages state through the file system (stateless compute, stateful storage), simplifying debugging and persistence.

## 4. What Problems It Explicitly Does NOT Try to Solve
- **High-Frequency Trading / Real-Time Latency**: Being file-based, it operates at the speed of file I/O and model inference, not millisecond API calls.
- **Compute Provisioning**: It does not provide the GPU/TPU resources; it assumes the user brings their own access (Local or API).
- **Deployment / Hosting**: It is a development workflow and library, not a production hosting environment.
