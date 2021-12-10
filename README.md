# Supercluster API

Development of the Data Access Control API

## Documentation

This file is meant as a quick introduction, WIP

- [Getting Started](#getting-started)
  - [Development Setup](#--development-setup)

---

### Getting Started

This app has been tested using NodeJS v^17, yet should work with earlier versions.

#### - Development Setup

Setting up the project, and prepare things to make changes

```bash
# 1. clone the repository
  git clone git@github.com:supercluster-covid-data-portal/api.git

# 2. install the dependencies
  npm ci
```

Now you should be able to start the server from the project's root folder:

```bash
# run the server (on port 8080)
  npm run dev
  # or better yet
  npm run dev:nodemon
  # which also restarts if linked packages are updated (e.g. Arranger)

# NOTE: if using NodeJS v17, you may have to do one of the following:
  NODE_OPTIONS=--openssl-legacy-provider npm run dev
  # or do this, before running the server
  export NODE_OPTIONS=--openssl-legacy-provider
```

The development server will start on port `4000` by default.

#### - Documentation

There is API documentation provided by Swagger, available at [/swagger](http://localhost:4000/swagger).
