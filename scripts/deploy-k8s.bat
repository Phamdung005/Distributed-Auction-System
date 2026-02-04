@echo off
echo 🚀 Starting Kubernetes Deployment...

echo.
echo 1. Deploying Infrastructure (Redis & MongoDB)...
kubectl apply -f k8s/infrastructure/redis.yaml
kubectl apply -f k8s/infrastructure/mongodb.yaml

echo.
echo 2. Deploying Services...
kubectl apply -f k8s/services/auth-service.yaml
kubectl apply -f k8s/services/auction-service.yaml
kubectl apply -f k8s/services/bidding-service.yaml
kubectl apply -f k8s/services/payment-service.yaml
kubectl apply -f k8s/services/notification-service.yaml
kubectl apply -f k8s/services/community-service.yaml
kubectl apply -f k8s/services/order-service.yaml

echo.
echo 3. Deploying Monitoring (Prometheus)...
kubectl apply -f k8s/monitoring/prometheus.yaml

echo.
echo 4. Deploying Gateway...
kubectl apply -f k8s/ingress/nginx-gateway.yaml

echo.
echo Deployment commands sent to Kubernetes!
echo Please wait a few minutes for all pods to become Ready.
echo You can check status with: kubectl get pods
pause
