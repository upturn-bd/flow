/**
 * Application Configuration
 * Environment-specific settings and configuration values
 */

// ==============================================================================
// Environment Configuration
// ==============================================================================

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test',
} as const;

// ==============================================================================
// API Configuration
// ==============================================================================

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // Request timeouts (in milliseconds)
  TIMEOUT: {
    DEFAULT: 30000, // 30 seconds
    UPLOAD: 60000,  // 60 seconds for file uploads
    DOWNLOAD: 120000, // 2 minutes for downloads
  },
  
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000, // 1 second
    MAX_DELAY: 10000,    // 10 seconds
    BACKOFF_FACTOR: 2,
  },
} as const;

// ==============================================================================
// Database Configuration
// ==============================================================================

export const DB_CONFIG = {
  // Connection pool settings
  POOL: {
    MIN_CONNECTIONS: 5,
    MAX_CONNECTIONS: 20,
    IDLE_TIMEOUT: 30000, // 30 seconds
  },
  
  // Query settings
  QUERY: {
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 1000,
    TIMEOUT: 30000, // 30 seconds
  },
} as const;

// ==============================================================================
// Security Configuration
// ==============================================================================

export const SECURITY_CONFIG = {
  // Session settings
  SESSION: {
    DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    REFRESH_THRESHOLD: 30 * 60 * 1000, // 30 minutes in milliseconds
    MAX_CONCURRENT_SESSIONS: 3,
  },
  
  // Rate limiting
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 100,
    REQUESTS_PER_HOUR: 1000,
    BURST_LIMIT: 20,
  },
  
  // CORS settings
  CORS: {
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },
  
  // File upload security
  UPLOAD: {
    SCAN_FOR_VIRUSES: ENV.IS_PRODUCTION,
    STRIP_METADATA: true,
    VALIDATE_FILE_TYPE: true,
  },
} as const;

// ==============================================================================
// Cache Configuration
// ==============================================================================

export const CACHE_CONFIG = {
  // Redis settings
  REDIS: {
    URL: process.env.REDIS_URL || 'redis://localhost:6379',
    KEY_PREFIX: process.env.CACHE_KEY_PREFIX || 'flow:',
    MAX_MEMORY_POLICY: 'allkeys-lru',
  },
  
  // Cache TTL settings (in seconds)
  TTL: {
    USER_SESSION: 24 * 60 * 60, // 24 hours
    USER_PROFILE: 30 * 60,      // 30 minutes
    COMPANY_DATA: 60 * 60,      // 1 hour
    STATIC_DATA: 24 * 60 * 60,  // 24 hours
    DYNAMIC_DATA: 5 * 60,       // 5 minutes
  },
  
  // Local cache settings
  LOCAL: {
    MAX_SIZE: 100, // Maximum number of items
    TTL: 5 * 60 * 1000, // 5 minutes in milliseconds
  },
} as const;

// ==============================================================================
// Logging Configuration
// ==============================================================================

export const LOGGING_CONFIG = {
  // Log levels
  LEVEL: ENV.IS_PRODUCTION ? 'warn' : 'debug',
  
  // What to log
  LOG_REQUESTS: ENV.IS_DEVELOPMENT,
  LOG_RESPONSES: ENV.IS_DEVELOPMENT,
  LOG_ERRORS: true,
  LOG_PERFORMANCE: true,
  
  // Log retention
  RETENTION: {
    ERROR_LOGS: 90, // days
    ACCESS_LOGS: 30, // days
    DEBUG_LOGS: 7,  // days
  },
  
  // External logging services
  EXTERNAL: {
    ENABLED: ENV.IS_PRODUCTION,
    SERVICE_URL: process.env.LOGGING_SERVICE_URL || '',
    API_KEY: process.env.LOGGING_API_KEY || '',
  },
} as const;

// ==============================================================================
// Feature Flags
// ==============================================================================

export const FEATURES = {
  // Authentication features
  AUTH: {
    SOCIAL_LOGIN: process.env.FEATURE_SOCIAL_LOGIN === 'true',
    TWO_FACTOR: process.env.FEATURE_TWO_FACTOR === 'true',
    SSO: process.env.FEATURE_SSO === 'true',
  },
  
  // File management features
  FILES: {
    CLOUD_STORAGE: process.env.FEATURE_CLOUD_STORAGE === 'true',
    IMAGE_PROCESSING: process.env.FEATURE_IMAGE_PROCESSING === 'true',
    VIRUS_SCANNING: process.env.FEATURE_VIRUS_SCANNING === 'true',
  },
  
  // Notification features
  NOTIFICATIONS: {
    EMAIL: process.env.FEATURE_EMAIL_NOTIFICATIONS === 'true',
    SMS: process.env.FEATURE_SMS_NOTIFICATIONS === 'true',
    PUSH: process.env.FEATURE_PUSH_NOTIFICATIONS === 'true',
    IN_APP: true, // Always enabled
  },
  
  // Analytics features
  ANALYTICS: {
    USER_TRACKING: process.env.FEATURE_USER_TRACKING === 'true',
    PERFORMANCE_MONITORING: process.env.FEATURE_PERFORMANCE_MONITORING === 'true',
    ERROR_TRACKING: ENV.IS_PRODUCTION,
  },
  
  // Experimental features
  EXPERIMENTAL: {
    AI_ASSISTANCE: process.env.FEATURE_AI_ASSISTANCE === 'true',
    ADVANCED_SEARCH: process.env.FEATURE_ADVANCED_SEARCH === 'true',
    REAL_TIME_COLLABORATION: process.env.FEATURE_REAL_TIME_COLLABORATION === 'true',
  },
} as const;

// ==============================================================================
// Third-party Service Configuration
// ==============================================================================

export const SERVICES_CONFIG = {
  // Email service
  EMAIL: {
    PROVIDER: process.env.EMAIL_PROVIDER || 'smtp',
    SMTP: {
      HOST: process.env.SMTP_HOST || '',
      PORT: parseInt(process.env.SMTP_PORT || '587'),
      SECURE: process.env.SMTP_SECURE === 'true',
      USER: process.env.SMTP_USER || '',
      PASS: process.env.SMTP_PASS || '',
    },
    FROM_ADDRESS: process.env.EMAIL_FROM || 'noreply@flow.app',
    FROM_NAME: process.env.EMAIL_FROM_NAME || 'Flow Application',
  },
  
  // SMS service
  SMS: {
    PROVIDER: process.env.SMS_PROVIDER || '',
    API_KEY: process.env.SMS_API_KEY || '',
    SENDER_ID: process.env.SMS_SENDER_ID || '',
  },
  
  // File storage service
  STORAGE: {
    PROVIDER: process.env.STORAGE_PROVIDER || 'local',
    LOCAL: {
      UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
      PUBLIC_URL: process.env.PUBLIC_STORAGE_URL || '/uploads',
    },
    S3: {
      BUCKET: process.env.S3_BUCKET || '',
      REGION: process.env.S3_REGION || 'us-east-1',
      ACCESS_KEY: process.env.S3_ACCESS_KEY || '',
      SECRET_KEY: process.env.S3_SECRET_KEY || '',
    },
  },
  
  // Maps service
  MAPS: {
    PROVIDER: process.env.MAPS_PROVIDER || 'google',
    API_KEY: process.env.MAPS_API_KEY || '',
    DEFAULT_CENTER: {
      lat: parseFloat(process.env.DEFAULT_MAP_LAT || '23.8103'),
      lng: parseFloat(process.env.DEFAULT_MAP_LNG || '90.4125'),
    },
    DEFAULT_ZOOM: parseInt(process.env.DEFAULT_MAP_ZOOM || '12'),
  },
} as const;

// ==============================================================================
// Application Metadata
// ==============================================================================

export const APP_INFO = {
  NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Flow',
  VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Flow Application',
  AUTHOR: process.env.NEXT_PUBLIC_APP_AUTHOR || 'Flow Team',
  
  // Build information
  BUILD: {
    DATE: process.env.BUILD_DATE || new Date().toLocaleDateString('sv-SE'),
    COMMIT: process.env.BUILD_COMMIT || 'unknown',
    BRANCH: process.env.BUILD_BRANCH || 'main',
  },
  
  // Support information
  SUPPORT: {
    EMAIL: process.env.SUPPORT_EMAIL || 'support@flow.app',
    PHONE: process.env.SUPPORT_PHONE || '',
    DOCS_URL: process.env.DOCS_URL || '/docs',
    STATUS_PAGE: process.env.STATUS_PAGE_URL || '',
  },
} as const;

// ==============================================================================
// Export Configuration Object
// ==============================================================================

export const CONFIG = {
  ENV,
  API: API_CONFIG,
  DB: DB_CONFIG,
  SECURITY: SECURITY_CONFIG,
  CACHE: CACHE_CONFIG,
  LOGGING: LOGGING_CONFIG,
  FEATURES,
  SERVICES: SERVICES_CONFIG,
  APP: APP_INFO,
} as const;

export default CONFIG;
