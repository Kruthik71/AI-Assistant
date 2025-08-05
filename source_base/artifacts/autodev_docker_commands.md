
# 🐳 AutoDev IQ – Docker Command Reference

---

## 🔧 Build & Run Containers

### ▶️ Build Docker Images (if not using `docker-compose build`)
```bash
docker build -t autodev-backend ./AutoDev_IQ_BE      # Build backend image
docker build -t autodev-frontend ./autodeviq_app     # Build frontend image
```

### ▶️ Run Frontend Manually
```bash
docker run -d --name autodev-frontend -p 3000:3000 autodev-frontend
```

---

## 🐳 Docker Compose Commands

### 🚀 Start All Services in the Background
```bash
docker-compose up -d
```

### 🔁 Recreate a Specific Service (e.g., backend) with Rebuild
```bash
docker-compose up -d --force-recreate --build backend
```

### 🛑 Stop and Remove All Containers, Networks, Volumes
```bash
docker-compose down
```

---

## 🛠️ Debugging & Logs

### 🐚 Access a Running Container (Interactive Shell)
```bash
docker exec -it autodev-backend bash
```

### 🔍 Print Environment Variables (e.g., OLLAMA)
```bash
docker exec -it autodev-backend env | grep OLLAMA
docker exec -it autodev-backend env | grep MODEL
```

### 📜 View Logs of Containers
```bash
docker logs autodev-backend
docker logs autodev-frontend
```

---

## 📦 Container & Image Management

### 📋 List All Containers
```bash
docker ps -a
```

### ⛔ Stop a Container
```bash
docker container stop autodev-backend
```

### 🗑️ Remove a Container
```bash
docker container rm autodev-backend
```

### 🧹 Remove an Image (after stopping & removing container)
```bash
docker image rm autodev-backend
```

---

## 🤖 Model (Ollama) Management

### 📥 Pull a Model inside the Ollama Container
```bash
docker exec -it ollama ollama pull llama3.2
```

### 📃 List Available Models
```bash
docker exec -it ollama ollama list
```

---

## 🔄 Update & Re-deploy Flow

### 🛠️ Rebuild Backend or Frontend After Code Changes
```bash
docker-compose build backend
docker-compose build frontend
```

### 🔁 Recreate Updated Services
```bash
docker-compose up -d --force-recreate backend
```
