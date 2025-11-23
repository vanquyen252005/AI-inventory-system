# API Examples

## Assets API

### Get all assets
```bash
GET /assets?search=excavator&status=active&page=1&limit=10
Authorization: Bearer <token>
```

Response:
```json
{
  "assets": [
    {
      "id": "AST-001",
      "name": "Excavator CAT 320",
      "category": "Machinery",
      "location": "Site A",
      "status": "active",
      "value": 125000,
      "condition": 92,
      "lastScanned": "2024-01-15",
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Create asset
```bash
POST /assets
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Asset",
  "category": "Equipment",
  "location": "Warehouse A",
  "status": "active",
  "value": 50000,
  "condition": 100
}
```

## Scans API

### Get all scans
```bash
GET /scans?status=completed&page=1&limit=10
Authorization: Bearer <token>
```

Response:
```json
{
  "scans": [
    {
      "id": "SCN-001",
      "assetId": "AST-001",
      "assetName": "Excavator CAT 320",
      "fileName": "scan.mp4",
      "status": "completed",
      "accuracy": 96,
      "detectedItems": 15,
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Upload scan
```bash
POST /scans
Authorization: Bearer <token>
Content-Type: multipart/form-data

assetId: AST-001
file: <video file>
```

### Get scan details
```bash
GET /scans/SCN-001
Authorization: Bearer <token>
```

Response includes detections:
```json
{
  "id": "SCN-001",
  "assetId": "AST-001",
  "assetName": "Excavator CAT 320",
  "fileName": "scan.mp4",
  "status": "completed",
  "accuracy": 96,
  "detectedItems": 15,
  "uploadedAt": "2024-01-15T10:30:00Z",
  "detections": [
    {
      "id": 1,
      "name": "Hydraulic Leak",
      "confidence": 98,
      "location": "Left side cylinder",
      "severity": "high"
    }
  ]
}
```

## Reports API

### Get summary
```bash
GET /reports/summary
Authorization: Bearer <token>
```

Response:
```json
{
  "totalScans": 306,
  "issuesFound": 99,
  "resolved": 88,
  "avgAccuracy": 93.4
}
```

### Get trends
```bash
GET /reports/trends?startDate=2024-01-01&endDate=2024-06-30
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "month": "Jan",
    "scans": 24,
    "issues": 8,
    "resolved": 6
  }
]
```

### Get issue distribution
```bash
GET /reports/issues
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "name": "Hydraulic Issues",
    "value": 35
  },
  {
    "name": "Wear & Tear",
    "value": 28
  }
]
```

