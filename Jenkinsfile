pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  parameters {
    booleanParam(name: 'DEPLOY_FRONTEND', defaultValue: true, description: 'Dispara deploy del frontend (Vercel hook)')
    booleanParam(name: 'DEPLOY_BACKEND', defaultValue: true, description: 'Dispara deploy del backend (Render hook)')
  }

  environment {
    NODE_ENV = 'production'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Verificar herramientas') {
      steps {
        sh 'node --version'
        sh 'npm --version'
      }
    }

    stage('Instalar dependencias') {
      steps {
        sh 'npm ci'
        dir('server') {
          sh 'npm ci'
        }
      }
    }

    stage('Lint frontend') {
      steps {
        sh 'npm run lint'
      }
    }

    stage('Build frontend y backend') {
      steps {
        sh 'npm run build'
        dir('server') {
          sh 'npm run build'
        }
      }
    }

    stage('Deploy frontend (Vercel)') {
      when {
        allOf {
          expression { return params.DEPLOY_FRONTEND }
          branch 'main'
        }
      }
      steps {
        withCredentials([string(credentialsId: 'vercel-deploy-hook-url', variable: 'VERCEL_DEPLOY_HOOK_URL')]) {
          sh 'curl -fsS -X POST "$VERCEL_DEPLOY_HOOK_URL"'
        }
      }
    }

    stage('Deploy backend (Render)') {
      when {
        allOf {
          expression { return params.DEPLOY_BACKEND }
          branch 'main'
        }
      }
      steps {
        withCredentials([string(credentialsId: 'render-deploy-hook-url', variable: 'RENDER_DEPLOY_HOOK_URL')]) {
          sh 'curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL"'
        }
      }
    }
  }

  post {
    success {
      echo 'Pipeline completado: build OK y deploy disparado (si aplica).'
    }
    failure {
      echo 'Pipeline falló. Revisa los logs del stage con error.'
    }
  }
}
