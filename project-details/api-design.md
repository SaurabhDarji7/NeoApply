# NeoApply - API Design

## Overview
NeoApply uses a RESTful JSON API with JWT authentication. All endpoints are versioned under `/api/v1/`.

---

## Base Configuration

### Base URL
```
Development: http://localhost:3000/api/v1
Production:  https://api.neoapply.com/api/v1
```

### Request Headers
```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>  # Required for authenticated endpoints
Accept: application/json
```

### Response Format
All responses follow a consistent JSON structure:

**Success Response:**
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2025-11-04T10:30:00Z"
  }
}
```

**Error Response:**
```json
{
  "error": {
    "message": "Resource not found",
    "code": "NOT_FOUND",
    "details": {}
  }
}
```

### HTTP Status Codes
- `200 OK` - Successful GET/PUT/PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Valid token but insufficient permissions
- `404 Not Found` - Resource doesn't exist
- `422 Unprocessable Entity` - Validation errors
- `500 Internal Server Error` - Server-side error

---

## Authentication Endpoints

### Register New User
```http
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "user": {
    "email": "user@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }
}
```

**Success Response (201):**
```json
{
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "created_at": "2025-11-04T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "meta": {
    "message": "Registration successful"
  }
}
```

**Error Response (422):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "email": ["has already been taken"],
      "password": ["is too short (minimum is 8 characters)"]
    }
  }
}
```

---

### Login
```http
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "user": {
    "email": "user@example.com",
    "password": "password123"
  }
}
```

**Success Response (200):**
```json
{
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**
```json
{
  "error": {
    "message": "Invalid email or password",
    "code": "UNAUTHORIZED"
  }
}
```

---

### Logout
```http
DELETE /api/v1/auth/logout
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Success Response (204):**
No content

---

### Get Current User
```http
GET /api/v1/users/me
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2025-11-04T10:30:00Z",
    "resumes_count": 3,
    "job_descriptions_count": 5
  }
}
```

---

### Update Current User
```http
PUT /api/v1/users/me
```

**Request Body:**
```json
{
  "user": {
    "email": "newemail@example.com"
  }
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "email": "newemail@example.com",
    "updated_at": "2025-11-04T11:00:00Z"
  }
}
```

---

## Resume Endpoints

### Create Resume (Upload)
```http
POST /api/v1/resumes
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
```
name: "Software Engineer Resume"
file: [binary file data]
```

**Success Response (201):**
```json
{
  "data": {
    "id": 1,
    "name": "Software Engineer Resume",
    "status": "pending",
    "file": {
      "filename": "resume.pdf",
      "size": 245760,
      "content_type": "application/pdf",
      "url": "/rails/active_storage/blobs/..."
    },
    "parsed_data": null,
    "created_at": "2025-11-04T10:30:00Z",
    "updated_at": "2025-11-04T10:30:00Z"
  },
  "meta": {
    "message": "Resume uploaded successfully. Parsing in progress."
  }
}
```

**Error Response (422):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "file": ["must be attached"],
      "file": ["content type must be PDF, DOCX, or TXT"],
      "file": ["size must be less than 10 MB"]
    }
  }
}
```

---

### List Resumes
```http
GET /api/v1/resumes
```

**Query Parameters:**
- `status` (optional): Filter by status (pending/processing/completed/failed)
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 10, max: 100)

**Example:**
```http
GET /api/v1/resumes?status=completed&page=1&per_page=5
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Software Engineer Resume",
      "status": "completed",
      "file": {
        "filename": "resume.pdf",
        "url": "/rails/active_storage/blobs/..."
      },
      "parsed_data": {
        "personal_info": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "skills": [...]
      },
      "created_at": "2025-11-04T10:30:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 5,
    "total_pages": 2,
    "total_count": 8
  }
}
```

---

### Get Single Resume
```http
GET /api/v1/resumes/:id
```

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "name": "Software Engineer Resume",
    "status": "completed",
    "file": {
      "filename": "resume.pdf",
      "size": 245760,
      "content_type": "application/pdf",
      "url": "/rails/active_storage/blobs/..."
    },
    "parsed_data": {
      "personal_info": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "location": "New York, NY"
      },
      "skills": [
        {
          "name": "Ruby on Rails",
          "category": "Backend"
        }
      ],
      "experience": [...],
      "education": [...]
    },
    "created_at": "2025-11-04T10:30:00Z",
    "updated_at": "2025-11-04T10:35:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "error": {
    "message": "Resume not found",
    "code": "NOT_FOUND"
  }
}
```

---

### Delete Resume
```http
DELETE /api/v1/resumes/:id
```

**Success Response (204):**
No content

---

### Trigger Resume Parsing
```http
POST /api/v1/resumes/:id/parse
```

**Use Case:** Retry parsing if it failed

**Success Response (202 Accepted):**
```json
{
  "data": {
    "id": 1,
    "status": "processing"
  },
  "meta": {
    "message": "Parsing initiated"
  }
}
```

---

### Get Parsing Status
```http
GET /api/v1/resumes/:id/status
```

**Use Case:** Poll for parsing completion

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "status": "completed",
    "progress": 100,
    "error_message": null
  }
}
```

**Status Values:**
- `pending` - Not yet started
- `processing` - In progress
- `completed` - Successfully parsed
- `failed` - Parsing failed

---

### Download Resume File
```http
GET /api/v1/resumes/:id/file
```

**Response:**
Binary file download with appropriate headers:
```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="resume.pdf"
```

---

## Job Description Endpoints

### Create Job Description
```http
POST /api/v1/job_descriptions
```

**Option 1: From URL (scraping required)**
```json
{
  "job_description": {
    "url": "https://example.com/careers/job/123"
  }
}
```

**Option 2: Manual text input**
```json
{
  "job_description": {
    "raw_text": "Job Title: Junior Software Developer\n\nWe are looking for..."
  }
}
```

**Success Response (201):**
```json
{
  "data": {
    "id": 1,
    "url": "https://example.com/careers/job/123",
    "title": null,
    "company_name": null,
    "status": "scraping",
    "raw_text": null,
    "attributes": null,
    "created_at": "2025-11-04T10:30:00Z"
  },
  "meta": {
    "message": "Job description created. Scraping in progress."
  }
}
```

---

### List Job Descriptions
```http
GET /api/v1/job_descriptions
```

**Query Parameters:**
- `status` (optional): Filter by status
- `company` (optional): Filter by company name
- `page` (optional): Page number
- `per_page` (optional): Items per page

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "url": "https://example.com/job/123",
      "title": "Junior Software Developer",
      "company_name": "TechCorp",
      "status": "completed",
      "attributes": {
        "title": "Junior Software Developer",
        "experience_level": "Junior",
        "location": "Remote",
        "skills_required": [
          {
            "name": "JavaScript",
            "importance": "Required"
          }
        ]
      },
      "created_at": "2025-11-04T10:30:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 3,
    "total_count": 25
  }
}
```

---

### Get Single Job Description
```http
GET /api/v1/job_descriptions/:id
```

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "url": "https://example.com/job/123",
    "title": "Junior Software Developer",
    "company_name": "TechCorp",
    "status": "completed",
    "raw_text": "Full job description text...",
    "attributes": {
      "title": "Junior Software Developer",
      "company": "TechCorp Inc.",
      "location": "Remote",
      "job_type": "Full-time",
      "experience_level": "Junior",
      "years_of_experience": "1-2 years",
      "salary_range": {
        "min": 60000,
        "max": 80000,
        "currency": "USD",
        "period": "annual"
      },
      "skills_required": [
        {
          "name": "JavaScript",
          "category": "Technical",
          "importance": "Required"
        },
        {
          "name": "React",
          "category": "Technical",
          "importance": "Required"
        }
      ],
      "skills_nice_to_have": ["Docker", "AWS"],
      "responsibilities": [...],
      "benefits": [...]
    },
    "created_at": "2025-11-04T10:30:00Z",
    "updated_at": "2025-11-04T10:35:00Z"
  }
}
```

---

### Delete Job Description
```http
DELETE /api/v1/job_descriptions/:id
```

**Success Response (204):**
No content

---

### Trigger Job Description Parsing
```http
POST /api/v1/job_descriptions/:id/parse
```

**Success Response (202):**
```json
{
  "data": {
    "id": 1,
    "status": "parsing"
  },
  "meta": {
    "message": "Parsing initiated"
  }
}
```

---

### Get Job Description Status
```http
GET /api/v1/job_descriptions/:id/status
```

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "status": "completed",
    "scraping_status": "completed",
    "parsing_status": "completed",
    "error_message": null
  }
}
```

**Status Values:**
- `pending` - Not yet started
- `scraping` - Scraping URL
- `parsing` - Parsing scraped text
- `completed` - Fully processed
- `failed` - Scraping or parsing failed

---

## Application Endpoints (Future MVP Extension)

### Create Application
```http
POST /api/v1/applications
```

**Request Body:**
```json
{
  "application": {
    "resume_id": 1,
    "job_description_id": 5,
    "notes": "Applied via LinkedIn"
  }
}
```

**Success Response (201):**
```json
{
  "data": {
    "id": 1,
    "resume_id": 1,
    "job_description_id": 5,
    "status": "draft",
    "notes": "Applied via LinkedIn",
    "created_at": "2025-11-04T10:30:00Z"
  }
}
```

---

### List Applications
```http
GET /api/v1/applications
```

**Query Parameters:**
- `status` (optional): draft/applied/interview/rejected/offer/accepted
- `resume_id` (optional): Filter by resume
- `job_description_id` (optional): Filter by job

---

### Update Application Status
```http
PATCH /api/v1/applications/:id
```

**Request Body:**
```json
{
  "application": {
    "status": "applied",
    "applied_at": "2025-11-04T12:00:00Z",
    "notes": "Sent follow-up email"
  }
}
```

---

## Error Handling

### Error Response Format
```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid JWT token |
| FORBIDDEN | 403 | User lacks permission |
| NOT_FOUND | 404 | Resource doesn't exist |
| VALIDATION_ERROR | 422 | Invalid input data |
| PARSE_ERROR | 422 | Resume/job parsing failed |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server-side error |

---

## Rate Limiting

### Limits (Future Implementation)
- **Authenticated users**: 100 requests/minute
- **Resume uploads**: 10 uploads/hour
- **Job description creation**: 20 jobs/hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699012800
```

### Rate Limit Exceeded Response (429)
```json
{
  "error": {
    "message": "Rate limit exceeded. Try again in 45 seconds.",
    "code": "RATE_LIMIT_EXCEEDED",
    "details": {
      "retry_after": 45
    }
  }
}
```

---

## Pagination

### Query Parameters
```
page=1          # Page number (1-indexed)
per_page=10     # Items per page (default: 10, max: 100)
```

### Response Meta
```json
{
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total_pages": 5,
    "total_count": 47,
    "next_page": 2,
    "prev_page": null
  }
}
```

### Link Header (Optional)
```http
Link: <https://api.neoapply.com/api/v1/resumes?page=2>; rel="next",
      <https://api.neoapply.com/api/v1/resumes?page=5>; rel="last"
```

---

## Filtering & Sorting

### Filtering Examples
```http
GET /api/v1/resumes?status=completed
GET /api/v1/job_descriptions?company_name=TechCorp
GET /api/v1/applications?status=applied&resume_id=1
```

### Sorting (Future)
```http
GET /api/v1/resumes?sort=created_at&order=desc
GET /api/v1/job_descriptions?sort=company_name&order=asc
```

---

## CORS Configuration

### Allowed Origins
```
Development: http://localhost:5173
Production:  https://app.neoapply.com
```

### Allowed Methods
```
GET, POST, PUT, PATCH, DELETE, OPTIONS
```

### Allowed Headers
```
Content-Type, Authorization, Accept
```

---

## Versioning Strategy

### Current Version: v1
All endpoints are prefixed with `/api/v1/`

### Future Versions
- Breaking changes require new version (e.g., `/api/v2/`)
- Non-breaking changes can be added to existing version
- Deprecation notices sent via response headers:
  ```http
  Deprecation: true
  Sunset: Wed, 11 Nov 2026 11:11:11 GMT
  ```

---

## WebSocket Support (Future)

For real-time updates on parsing status:

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3000/cable')

// Subscribe to resume parsing channel
ws.send(JSON.stringify({
  command: 'subscribe',
  identifier: JSON.stringify({
    channel: 'ResumeParsingChannel',
    resume_id: 1
  })
}))

// Receive updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log(data.message.status) // 'processing', 'completed', 'failed'
}
```

---

## Testing Endpoints

### Health Check
```http
GET /api/v1/health
```

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-11-04T10:30:00Z",
  "version": "1.0.0"
}
```

---

## Example API Usage (JavaScript)

```javascript
// Login
const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user: {
      email: 'test@example.com',
      password: 'password123'
    }
  })
})
const { data } = await loginResponse.json()
const token = data.token

// Upload resume
const formData = new FormData()
formData.append('name', 'My Resume')
formData.append('file', fileInput.files[0])

const uploadResponse = await fetch('http://localhost:3000/api/v1/resumes', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
})
const resume = await uploadResponse.json()

// Poll for parsing completion
const checkStatus = async (resumeId) => {
  const response = await fetch(
    `http://localhost:3000/api/v1/resumes/${resumeId}/status`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  )
  const { data } = await response.json()
  return data.status
}

// Poll every 2 seconds
const interval = setInterval(async () => {
  const status = await checkStatus(resume.data.id)
  if (status === 'completed' || status === 'failed') {
    clearInterval(interval)
    console.log('Parsing done!', status)
  }
}, 2000)
```

---

Last Updated: 2025-11-04
