# AutoDev IQ 🤖

AutoDev IQ is an AI-powered developer assistant that enables natural language interaction with your codebase. It helps developers explore, understand, and test code with ease — all from a single conversational interface.

## ✨ Features

### 🔍 Natural Language Code Search
Ask questions like "Where is payment processing implemented?" or "How does the login flow work?" and get instant, contextual answers from your codebase.

### 🧠 Code Flow Diagram Generation
Automatically generate Mermaid diagrams for services, API flows, or component logic to visualize your code architecture.

### 🧪 Unit Test Generation
Create comprehensive unit tests for React components and Java classes using local LLMs, ensuring your code is well-tested and reliable.

### 💻 UI Test Automation
Generate Playwright test scripts for form inputs, button clicks, and complete user flows to automate your UI testing.

### 🖼️ Visual Regression Testing
Detect UI layout drift using Percy snapshot testing to maintain consistent visual quality across deployments.

## 🏗️ Architecture

| Layer | Tools / Frameworks |
|-------|-------------------|
| **Frontend** | Next.js, Material UI, Mermaid.js |
| **Backend API** | Node.js and Python |
| **LLM Interface** | Local model via Ollama / FastAPI |
| **Embedding Engine** | FAISS, Transformers (CodeBERT, MiniLM) |
| **UI Testing** | Playwright |
| **Visual Testing** | Percy CLI |
| **Diagram Engine** | Mermaid.js (LLM-generated syntax) |
| **Containerization** | Docker, Docker Compose |

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Python (v3.8+)
- Docker & Docker Compose
- Ollama (for local LLM inference)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kruthik71/AI-Assistant.git
   cd AI-Assistant
   ```

2. **Set up the environment**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install Python dependencies
   pip install -r requirements.txt
   ```

3. **Configure Ollama**
   ```bash
   # Pull required models
   ollama pull codellama
   ollama pull mistral
   ```

4. **Start the application**
   ```bash
   # Using Docker Compose
   docker-compose up -d
   
   # Or run manually
   npm run dev  # Frontend
   python app.py  # Backend API
   ```

5. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000`

## 💡 Usage Examples

### Code Search
```
User: "Show me all authentication-related functions"
AutoDev IQ: Found 12 authentication functions across 4 files...
```

### Diagram Generation
```
User: "Generate a flow diagram for the user registration process"
AutoDev IQ: [Generates Mermaid diagram showing the complete registration flow]
```

### Test Generation
```
User: "Create unit tests for the LoginComponent"
AutoDev IQ: [Generates comprehensive Jest/React Testing Library tests]
```

## 🧪 Testing

### Run Unit Tests
```bash
npm test
```

### Run UI Tests
```bash
npx playwright test
```

### Visual Regression Tests
```bash
percy exec -- npx playwright test
```

## 📁 Project Structure

```
AI-Assistant/
├── frontend/          # Next.js frontend application
├── backend/           # Node.js/Python backend services
├── models/            # LLM model configurations
├── tests/             # Test suites (unit, integration, e2e)
├── docker/            # Docker configurations
├── docs/              # Documentation
└── scripts/           # Utility scripts
```

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
API_HOST=localhost
API_PORT=8000

# Database
DATABASE_URL=your_database_url

# LLM Configuration
OLLAMA_HOST=localhost
OLLAMA_PORT=11434

# Percy (for visual testing)
PERCY_TOKEN=your_percy_token
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
```

## 🐛 Known Issues

- Large codebases may take longer to index initially
- Some complex diagram generations might need manual refinement
- Visual regression tests require Percy account setup

## 📊 Performance

- Code search: ~200ms average response time
- Diagram generation: ~2-5s depending on complexity
- Test generation: ~3-10s per component

## 🗺️ Roadmap

- [ ] Support for more programming languages
- [ ] Integration with popular IDEs (VS Code, IntelliJ)
- [ ] Advanced code refactoring suggestions
- [ ] Team collaboration features
- [ ] Cloud deployment options

---

⭐ **If you find AutoDev IQ helpful, please give it a star on GitHub!**
