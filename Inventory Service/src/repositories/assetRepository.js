const db = require('../config/db');

class AssetRepository {
  // Lấy danh sách có phân trang và tìm kiếm
  async findAll({ search, category, status,location, limit, offset }) {
    let query = 'SELECT *, count(*) OVER() AS total_count FROM assets WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Tìm kiếm thông minh: Tìm trong Tên, ID hoặc Vị trí
    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR location ILIKE $${paramIndex} OR id::text ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    // --- CODE MỚI: Thêm logic lọc theo phòng (Location) ---
    if (location) {
      // Dùng ILIKE để tìm gần đúng (VD: nhập "201" sẽ ra "GD2 - 201")
      query += ` AND location ILIKE $${paramIndex}`;
      params.push(`%${location}%`);
      paramIndex++;
    }
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    
    // Xử lý kết quả trả về
    const rows = result.rows;
    const total = rows.length > 0 ? parseInt(rows[0].total_count) : 0;
    
    // Loại bỏ field total_count khỏi từng row để object sạch đẹp
    const assets = rows.map(row => {
        const { total_count, ...asset } = row;
        return asset;
    });

    return { assets, total };
  }

  async findById(id) {
    const result = await db.query('SELECT * FROM assets WHERE id = $1', [id]);
    return result.rows[0];
  }

  async create(data) {
    const { name, category, location, status, value, condition, description } = data;
    const query = `
      INSERT INTO assets (name, category, location, status, value, condition, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [name, category, location, status || 'active', value, condition || 100, description];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  async update(id, data) {
    // Xây dựng câu query động chỉ update các trường có dữ liệu
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(data[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE assets 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  async delete(id) {
    await db.query('DELETE FROM assets WHERE id = $1', [id]);
    return true;
  }

  // --- SỬA LỖI Ở ĐÂY: Bỏ từ khóa 'function' và dùng 'db.query' ---
  async createMany(assets) {
    if (!assets || assets.length === 0) return [];

    // Tạo placeholders ($1, $2...), ($8, $9...)...
    const placeholders = [];
    const values = [];
    let paramIndex = 1;

    assets.forEach(asset => {
      placeholders.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6})`);
      values.push(
        asset.name, 
        asset.category, 
        asset.location, 
        asset.status || 'active', 
        asset.value || 0, 
        asset.condition || 100, 
        asset.description || ''
      );
      paramIndex += 7;
    });

    const sql = `
      INSERT INTO assets (name, category, location, status, value, condition, description)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    // Sửa 'query' thành 'db.query'
    const result = await db.query(sql, values);
    return result.rows;
  }
}

module.exports = new AssetRepository();