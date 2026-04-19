import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UrbanEase API',
      version: '1.0.0',
      description: 'Community Management Platform — Full API Documentation',
      contact: {
        name: 'UrbanEase Team',
      },
    },
    servers: [
      {
        url: 'https://urbanease-backend-6gff.onrender.com',
        description: 'Production Server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter the JWT token obtained from /login or /api/AdminLogin',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for B2B endpoints. Default demo key: ue-demo-api-key-2024',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT token set as httpOnly cookie on login',
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Login, Logout, OTP verification, Registration' },
      { name: 'Admin - Dashboard', description: 'Admin dashboard and overview' },
      { name: 'Admin - Communities', description: 'Community CRUD and management' },
      { name: 'Admin - Applications', description: 'Interest form applications (approve/reject)' },
      { name: 'Admin - Plans', description: 'Subscription plan management' },
      { name: 'Admin - Profile', description: 'Admin profile and settings' },
      { name: 'Manager', description: 'Community Manager operations' },
      { name: 'Resident', description: 'Resident dashboard, issues, payments' },
      { name: 'Security', description: 'Security guard operations' },
      { name: 'Worker', description: 'Worker issues and dashboard' },
      { name: 'B2B', description: 'API-key protected partner and webhook endpoints' },
      { name: 'Interest & Onboarding', description: 'Public interest forms and onboarding payment' },
      { name: 'Leaves', description: 'Worker leave management' },
    ],
  },
  apis: [
    './server.js',
    './routes/*.js',
    './pipelines/*/router/*.js',
    './configs/swaggerDefinitions.js',
    './models/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
