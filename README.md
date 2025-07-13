# NestJS User Documentation Service

This project is a NestJS-based service designed to manage user data and documentation. It includes features such as user creation, updates, role and status management, and querying user data.

## Project Structure

```
.env
.env.dev
.env.example
.env.prod
.env.qa
.env.staging
.eslintrc.js
.gitignore
.prettierrc
nest-cli.json
package.json
pnpm-lock.yaml
README.md
tsconfig.build.json
tsconfig.json
src/
    app.controller.ts
    app.module.ts
    main.ts
    common/
        index.ts
        config/
            configuration.ts
        constants/
            app.types.ts
        database/
            typeorm.config.ts
            seeds/
        decorators/
            roles.decorator.ts
        guards/
            ...
        interceptors/
            ...
        middlewares/
            ...
    modules/
        auth/
        document/
        ingestion/
        user/
```

### Key Modules

- **Auth**: Handles authentication and authorization.
- **Document**: Manages document-related operations.
- **Ingestion**: Handles data ingestion processes.
- **User**: Manages user-related operations, including CRUD functionality.

### Common Utilities

- **Config**: Centralized configuration management.
- **Constants**: Shared constants across the application.
- **Database**: TypeORM configuration and database seed scripts.
- **Decorators**: Custom decorators for roles and other functionalities.
- **Guards**: Security guards for route protection.
- **Interceptors**: Custom interceptors for request/response handling.
- **Middlewares**: Middleware for request processing.

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` and update the values as needed.

## Running the Application

### Development Mode
```bash
pnpm run start:dev
```

### Production Mode
```bash
pnpm run start:prod
```

## Building the Application

To build the application, run:
```bash
pnpm run build
```

## Testing

Run unit tests:
```bash
pnpm run test
```

Run end-to-end tests:
```bash
pnpm run test:e2e
```

## API Documentation

The project uses Swagger for API documentation. Once the application is running, you can access the documentation at:
```
http://localhost:<port>/api
```

## DTOs Overview

### User DTOs
- **CreateUserDto**: Defines the structure for creating a user.
- **UpdateUserDto**: Defines the structure for updating user details.
- **UpdateUserRoleDto**: Defines the structure for updating user roles.
- **UpdateUserStatusDto**: Defines the structure for updating user statuses.
- **UserQueryDto**: Defines the structure for querying user data.

## License

This project is licensed under the MIT License.