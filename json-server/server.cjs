const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, 'db.json');

// 工具函数：读写 db.json
function loadDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const json = JSON.parse(raw || '{}');
    if (!Array.isArray(json.users)) json.users = [];
    return json;
  } catch (e) {
    return { users: [] };
  }
}
function saveDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// ===== 登录接口 =====
app.post('/auth/verify', (req, res) => {
  const { phone, password } = req.body || {};
  const failToken = `${phone ?? 'unknown'}fail`;

  if (phone == null || password == null) {
    return res.json({
      ok: false,
      message: '请输入手机号和密码',
      success_token: failToken
    });
  }

  const db = loadDb();
  const users = db.users || [];
  const user = users.find(u => String(u.phone) === String(phone));

  if (!user) {
    return res.json({
      ok: false,
      message: '用户不存在',
      success_token: failToken
    });
  }
  if (String(user.password) !== String(password)) {
    return res.json({
      ok: false,
      message: '密码错误',
      success_token: failToken
    });
  }

  // 登录成功
  const success_token = `${phone}success`;
  return res.json({
    ok: true,
    message: '验证成功',
    success_token
  });
});

// ===== 注册接口 =====
app.post('/auth/register', (req, res) => {
  const { phone, password } = req.body || {};
  const failToken = `${phone ?? 'unknown'}fail`;

  if (phone == null || password == null) {
    return res.json({
      ok: false,
      message: '请输入手机号和密码',
      success_token: failToken
    });
  }

  const db = loadDb();
  const users = db.users || [];

  const exists = users.some(u => String(u.phone) === String(phone));
  if (exists) {
    return res.json({
      ok: false,
      message: '手机号已注册',
      success_token: failToken
    });
  }

  const maxId = users.reduce((m, u) => Math.max(m, Number(u.id) || 0), 0);
  const newUser = {
    id: String(maxId + 1),
    phone: String(phone),
    password
  };
  users.push(newUser);
  db.users = users;
  saveDb(db);

  const success_token = `${phone}success`;

  return res.json({
    ok: true,
    message: '注册成功',
    user: { id: newUser.id, phone: newUser.phone },
    success_token
  });
});

app.get('/health', (_req, res) => res.json({ ok: true, message: 'ok' }));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Auth API running at http://localhost:${PORT}`);
});

