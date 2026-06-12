import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from '../../../config/index.js';

// Build server list dynamically based on environment
const servers: swaggerJsdoc.OAS3Definition['servers'] =
  config.NODE_ENV === 'development'
    ? [
        { url: `http://localhost:${config.PORT}`, description: 'Development' },
        { url: config.BACKEND_URL, description: 'Staging' },
      ]
    : [
        { url: config.BACKEND_URL, description: config.NODE_ENV === 'staging' ? 'Staging' : 'Production' },
        { url: `http://localhost:${config.PORT}`, description: 'Development' },
      ];

const swaggerDefinition: swaggerJsdoc.OAS3Definition = {
  openapi: '3.0.3',
  info: {
    title: 'Flex Academy Portal API',
    version: '1.0.0',
    description:
      'Multi-tenant Institute & Salon Management Platform API. All `/api` endpoints require the `X-Tenant-Id` header for tenant resolution.',
    contact: {
      name: 'Flex Academy',
    },
    license: {
      name: 'PRIVATE',
    },
  },
  servers,
  tags: [
    { name: 'Auth', description: 'Authentication & authorization' },
    { name: 'Tenants', description: 'Tenant management (admin only)' },
    { name: 'Students', description: 'Student enrollment & management' },
    { name: 'Courses', description: 'Course management' },
    { name: 'Fees', description: 'Fee & payment management' },
    { name: 'Attendance', description: 'Attendance tracking' },
    { name: 'System', description: 'Health checks, metrics & diagnostics' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token',
      },
    },
    parameters: {
      TenantIdHeader: {
        in: 'header',
        name: 'X-Tenant-Id',
        required: true,
        schema: { type: 'string' },
        description: 'Tenant identifier for multi-tenant resolution',
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' },
            },
          },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object' } },
              total: { type: 'integer' },
              page: { type: 'integer' },
              limit: { type: 'integer' },
            },
          },
        },
      },
    },
  },
  paths: {
    // ──────────────────────────── System ────────────────────────────
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Liveness probe',
        description: 'Returns 200 if the server process is running.',
        responses: {
          '200': {
            description: 'Server is alive',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/ready': {
      get: {
        tags: ['System'],
        summary: 'Readiness probe',
        description: 'Returns 200 if all dependencies (database, etc.) are healthy; 503 otherwise.',
        responses: {
          '200': { description: 'All dependencies healthy' },
          '503': { description: 'One or more dependencies down' },
        },
      },
    },
    '/metrics': {
      get: {
        tags: ['System'],
        summary: 'Prometheus metrics',
        description: 'Returns Prometheus-format metrics for monitoring.',
        responses: {
          '200': {
            description: 'Prometheus metrics text',
            content: { 'text/plain': { schema: { type: 'string' } } },
          },
        },
      },
    },
    '/ews/alerts': {
      get: {
        tags: ['System'],
        summary: 'Early Warning System alerts',
        description: 'Returns currently active EWS alerts (memory, event-loop lag, MongoDB connection).',
        responses: {
          '200': {
            description: 'Active alerts list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        activeAlerts: { type: 'array', items: { type: 'object' } },
                        ruleCount: { type: 'integer', example: 3 },
                        timestamp: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/ping': {
      get: {
        tags: ['System'],
        summary: 'Ping / connectivity check',
        description: 'Returns pong with tenant context and correlation ID.',
        parameters: [{ $ref: '#/components/parameters/TenantIdHeader' }],
        responses: {
          '200': {
            description: 'Pong response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        message: { type: 'string', example: 'pong' },
                        tenantId: { type: 'string', nullable: true },
                        correlationId: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ──────────────────────────── Auth ────────────────────────────
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        parameters: [{ $ref: '#/components/parameters/TenantIdHeader' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 8, maxLength: 128, example: 'StrongP@ss1' },
                  firstName: { type: 'string', maxLength: 50, example: 'John' },
                  lastName: { type: 'string', maxLength: 50, example: 'Doe' },
                  phone: { type: 'string', maxLength: 20, example: '+1234567890' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User registered successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '409': { description: 'Email already exists' },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with credentials',
        parameters: [{ $ref: '#/components/parameters/TenantIdHeader' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', example: 'StrongP@ss1' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful, returns access and refresh tokens',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } },
          },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/api/v1/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        parameters: [{ $ref: '#/components/parameters/TenantIdHeader' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', example: 'eyJhbGciOiJIUz...' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'New access token issued', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '401': { description: 'Invalid or expired refresh token' },
        },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ BearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/TenantIdHeader' }],
        responses: {
          '200': { description: 'Current user details', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout current user',
        security: [{ BearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/TenantIdHeader' }],
        responses: {
          '200': { description: 'Logged out successfully' },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    // ──────────────────────────── Tenants ────────────────────────────
    '/api/v1/tenants': {
      post: {
        tags: ['Tenants'],
        summary: 'Create a new tenant',
        description: 'Admin only. Creates a new tenant organization.',
        security: [{ BearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/TenantIdHeader' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tenantId', 'name', 'slug', 'email'],
                properties: {
                  tenantId: { type: 'string', example: 'tenant-001' },
                  name: { type: 'string', example: 'Acme Academy' },
                  slug: { type: 'string', example: 'acme-academy' },
                  email: { type: 'string', format: 'email', example: 'admin@acme.com' },
                  phone: { type: 'string', example: '+1234567890' },
                  website: { type: 'string', format: 'uri', example: 'https://acme.com' },
                  address: { type: 'object' },
                  logo: { type: 'string', example: 'https://cdn.example.com/logo.png' },
                  config: { type: 'object' },
                  plan: { type: 'string', example: 'premium' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Tenant created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden - admin role required' },
        },
      },
      get: {
        tags: ['Tenants'],
        summary: 'List all tenants',
        description: 'Admin only. Paginated list of tenants.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/TenantIdHeader' },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 }, description: 'Items per page' },
        ],
        responses: {
          '200': { description: 'Paginated tenant list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/api/v1/tenants/{identifier}': {
      get: {
        tags: ['Tenants'],
        summary: 'Get tenant by ID or slug',
        description: 'Admin only. Retrieve a single tenant by its ID or slug.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/TenantIdHeader' },
          { in: 'path', name: 'identifier', required: true, schema: { type: 'string' }, description: 'Tenant ID or slug' },
        ],
        responses: {
          '200': { description: 'Tenant details', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Tenant not found' },
        },
      },
    },
    '/api/v1/tenants/{id}': {
      patch: {
        tags: ['Tenants'],
        summary: 'Update a tenant',
        description: 'Admin only. Partially update tenant details.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/TenantIdHeader' },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Tenant ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  website: { type: 'string' },
                  address: { type: 'object' },
                  logo: { type: 'string' },
                  config: { type: 'object' },
                  plan: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Tenant updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Tenant not found' },
        },
      },
    },

    // ──────────────────────────── Students ────────────────────────────
    '/api/v1/students': {
      post: {
        tags: ['Students'],
        summary: 'Enroll a new student',
        security: [{ BearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/TenantIdHeader' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  dateOfBirth: { type: 'string', format: 'date' },
                  courseId: { type: 'string' },
                  batchId: { type: 'string' },
                  guardianName: { type: 'string' },
                  guardianPhone: { type: 'string' },
                  address: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Student enrolled', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
        },
      },
      get: {
        tags: ['Students'],
        summary: 'List students',
        description: 'Paginated list with optional filters.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/TenantIdHeader' },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'status', schema: { type: 'string' }, description: 'Filter by status (e.g. active, dropout)' },
          { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search by name or email' },
        ],
        responses: {
          '200': { description: 'Paginated student list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/v1/students/{id}': {
      get: {
        tags: ['Students'],
        summary: 'Get student by ID',
        security: [{ BearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/TenantIdHeader' },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Student ID' },
        ],
        responses: {
          '200': { description: 'Student details', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Student not found' },
        },
      },
      put: {
        tags: ['Students'],
        summary: 'Update student',
        security: [{ BearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/TenantIdHeader' },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Student ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  address: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Student updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Student not found' },
        },
      },
    },
    '/api/v1/students/{id}/dropout': {
      patch: {
        tags: ['Students'],
        summary: 'Mark student as dropout',
        security: [{ BearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/TenantIdHeader' },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Student ID' },
        ],
        responses: {
          '200': { description: 'Student marked as dropout', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Student not found' },
        },
      },
    },

    // ──────────────────────────── Courses ────────────────────────────
    '/api/v1/courses': {
      post: {
        tags: ['Courses'],
        summary: 'Create a new course',
        security: [{ BearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/TenantIdHeader' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Full-Stack Web Development' },
                  description: { type: 'string' },
                  category: { type: 'string', example: 'Technology' },
                  duration: { type: 'integer', description: 'Duration in days/hours' },
                  fee: { type: 'number', example: 15000 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Course created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
        },
      },
      get: {
        tags: ['Courses'],
        summary: 'List courses',
        description: 'Paginated course list with optional category filter.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/TenantIdHeader' },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'category', schema: { type: 'string' }, description: 'Filter by category' },
        ],
        responses: {
          '200': { description: 'Paginated course list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/v1/courses/{id}': {
      get: {
        tags: ['Courses'],
        summary: 'Get course by ID',
        security: [{ BearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/TenantIdHeader' },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Course ID' },
        ],
        responses: {
          '200': { description: 'Course details', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Course not found' },
        },
      },
      put: {
        tags: ['Courses'],
        summary: 'Update course',
        security: [{ BearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/TenantIdHeader' },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Course ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  duration: { type: 'integer' },
                  fee: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Course updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Course not found' },
        },
      },
    },

    // ──────────────────────────── Fees ────────────────────────────
    '/api/v1/fees': {
      post: {
        tags: ['Fees'],
        summary: 'Record a fee payment',
        security: [{ BearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/TenantIdHeader' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  studentId: { type: 'string' },
                  amount: { type: 'number', example: 5000 },
                  paymentMethod: { type: 'string', example: 'cash' },
                  description: { type: 'string' },
                  receiptNumber: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Payment recorded', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
        },
      },
      get: {
        tags: ['Fees'],
        summary: 'List fee records',
        description: 'Paginated fee list with optional filters.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/TenantIdHeader' },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'studentId', schema: { type: 'string' }, description: 'Filter by student' },
          { in: 'query', name: 'from', schema: { type: 'string', format: 'date' }, description: 'Start date filter' },
          { in: 'query', name: 'to', schema: { type: 'string', format: 'date' }, description: 'End date filter' },
        ],
        responses: {
          '200': { description: 'Paginated fee list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/v1/fees/student/{studentId}': {
      get: {
        tags: ['Fees'],
        summary: 'Get fee records for a student',
        security: [{ BearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/TenantIdHeader' },
          { in: 'path', name: 'studentId', required: true, schema: { type: 'string' }, description: 'Student ID' },
        ],
        responses: {
          '200': { description: 'Student fee records', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Student not found' },
        },
      },
    },

    // ──────────────────────────── Attendance ────────────────────────────
    '/api/v1/attendance/mark': {
      post: {
        tags: ['Attendance'],
        summary: 'Mark attendance',
        security: [{ BearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/TenantIdHeader' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  batchId: { type: 'string' },
                  date: { type: 'string', format: 'date' },
                  records: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        studentId: { type: 'string' },
                        status: { type: 'string', enum: ['present', 'absent', 'late'] },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Attendance marked', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/v1/attendance/batch/{batchId}': {
      get: {
        tags: ['Attendance'],
        summary: 'Get batch attendance',
        security: [{ BearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/TenantIdHeader' },
          { in: 'path', name: 'batchId', required: true, schema: { type: 'string' }, description: 'Batch ID' },
          { in: 'query', name: 'month', schema: { type: 'integer', minimum: 1, maximum: 12 }, description: 'Month (1-12)' },
          { in: 'query', name: 'year', schema: { type: 'integer' }, description: 'Year (e.g. 2026)' },
        ],
        responses: {
          '200': { description: 'Batch attendance data', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Batch not found' },
        },
      },
    },
    '/api/v1/attendance/student/{studentId}': {
      get: {
        tags: ['Attendance'],
        summary: 'Get student attendance',
        security: [{ BearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/TenantIdHeader' },
          { in: 'path', name: 'studentId', required: true, schema: { type: 'string' }, description: 'Student ID' },
          { in: 'query', name: 'month', schema: { type: 'integer', minimum: 1, maximum: 12 }, description: 'Month (1-12)' },
          { in: 'query', name: 'year', schema: { type: 'integer' }, description: 'Year (e.g. 2026)' },
        ],
        responses: {
          '200': { description: 'Student attendance data', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Student not found' },
        },
      },
    },
  },
};

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: [], // All paths defined inline above
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };
