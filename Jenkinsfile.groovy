def githubRegistry = "ghcr.io"
def githubRepo = "supercluster-covid-data-portal/api"
def commit = "UNKNOWN"
def version = "UNKNOWN"

pipeline {
  agent {
    kubernetes {
      label 'api-executor'
      yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: node
    image: node:12.13.1
    tty: true
    securityContext:
      runAsUser: 1000
      runAsGroup: 1000
      fsGroup: 1000
  - name: dind-daemon
    image: docker:18.06-dind
    securityContext:
      privileged: true
    env:
    - name: DOCKER_TLS_CERTDIR
      value: ''
    volumeMounts:
      - name: dind-storage
        mountPath: /var/lib/docker
  - name: docker
    image: docker:18-git
    command:
    - cat
    tty: true
    env:
    - name: DOCKER_HOST
      value: tcp://localhost:2375
    - name: HOME
      value: /home/jenkins/agent
    securityContext:
      runAsUser: 1000
      runAsGroup: 1000
      fsGroup: 1000
  volumes:
  - name: dind-storage
    emptyDir: {}
"""
    }
  }

  stages {
    stage('Prepare') {
        steps {
            script {
                commit = sh(returnStdout: true, script: 'git describe --always').trim()
            }
            script {
                version = sh(returnStdout: true, script: 'cat ./package.json | grep version | cut -d \':\' -f2 | sed -e \'s/"//\' -e \'s/",//\'').trim()
            }
        }
    }

    stage('Build & Publish Development Changes') {
      when {
      branch 'develop'
      }
      steps {
        container('docker') {
          withCredentials([usernamePassword(credentialsId:'argoContainers', usernameVariable: 'GITHUB_APP', passwordVariable: 'GITHUB_ACCESS_TOKEN', )]) {
            sh 'echo $GITHUB_ACCESS_TOKEN | docker login ghcr.io -u $GITHUB_APP --password-stdin'
          }
          sh "docker build --network=host -f Dockerfile . -t ${githubRegistry}/${githubRepo}:${commit} -t ${githubRegistry}/${githubRepo}:edge"
          sh "docker push ${githubRegistry}/${githubRepo}:${commit}"
          sh "docker push ${githubRegistry}/${githubRepo}:edge"
        }
      }
    }

    stage('deploy to supercluster-covid-data-portal') {
      when {
        branch "develop"
      }
      steps {
        build(job: "supercluster/update-app-version", parameters: [
          [$class: 'StringParameterValue', name: 'SUPERCLUSTER_ENV', value: 'dev' ],
          [$class: 'StringParameterValue', name: 'TARGET_RELEASE', value: 'api'],
          [$class: 'StringParameterValue', name: 'NEW_APP_VERSION', value: "${commit}" ]
        ])
      }
    }

    stage('Release & Tag') {
      when {
        anyOf {
          branch 'main'
        }
      }
      steps {
        container('docker') {
          withCredentials([usernamePassword(credentialsId: 'supercluster-jenkins', passwordVariable: 'GITHUB_ACCESS_TOKEN', usernameVariable: 'GITHUB_APP')]) {
            sh "git tag ${version}"
            sh "git push https://x-access-token:${GITHUB_ACCESS_TOKEN}@github.com/${githubRepo} --tags"
          }
          withCredentials([usernamePassword(credentialsId:'argoContainers', passwordVariable: 'GITHUB_ACCESS_TOKEN', usernameVariable: 'GITHUB_APP', )]) {
            sh 'echo $GITHUB_ACCESS_TOKEN | docker login ghcr.io -u $GITHUB_APP --password-stdin'
          }
          sh "docker build --network=host -f Dockerfile . -t ${githubRegistry}/${githubRepo}:${version} -t ${githubRegistry}/${githubRepo}:latest"
          sh "docker push ${githubRegistry}/${githubRepo}:${version}"
          sh "docker push ${githubRegistry}/${githubRepo}:latest"
        }
      }
    }
  }
}
