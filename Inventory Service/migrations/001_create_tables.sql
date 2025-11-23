-- Create assets table
-- Note: created_by references users.id (if users table exists)
CREATE TABLE IF NOT EXISTS assets (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  value DECIMAL(12, 2),
  condition INTEGER DEFAULT 100 CHECK (condition >= 0 AND condition <= 100),
  description TEXT,
  last_scanned DATE,
  created_by VARCHAR(255), -- References users.id (if exists)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create scans table
CREATE TABLE IF NOT EXISTS scans (
  id VARCHAR(50) PRIMARY KEY,
  asset_id VARCHAR(50) REFERENCES assets(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  accuracy DECIMAL(5, 2) DEFAULT 0 CHECK (accuracy >= 0 AND accuracy <= 100),
  detected_items INTEGER DEFAULT 0,
  error_message TEXT,
  uploaded_by VARCHAR(255), -- References users.id (if exists)
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create detections table
CREATE TABLE IF NOT EXISTS detections (
  id SERIAL PRIMARY KEY,
  scan_id VARCHAR(50) REFERENCES scans(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  confidence DECIMAL(5, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  location VARCHAR(255),
  severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(location);
CREATE INDEX IF NOT EXISTS idx_scans_asset_id ON scans(asset_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_uploaded_at ON scans(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_detections_scan_id ON detections(scan_id);
CREATE INDEX IF NOT EXISTS idx_detections_severity ON detections(severity);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scans_updated_at BEFORE UPDATE ON scans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

