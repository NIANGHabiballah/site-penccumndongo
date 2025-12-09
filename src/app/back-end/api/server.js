const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cp2i_secret_key';

app.use(cors());
app.use(express.json());

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes d'authentification
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, nom, prenom, telephone, role = 'participant' } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.execute(
      'INSERT INTO users (email, password, nom, prenom, telephone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, nom, prenom, telephone, role]
    );
    
    res.status(201).json({ message: 'Utilisateur créé', userId: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ error: 'Utilisateur non trouvé' });
    
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Mot de passe incorrect' });
    
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET);
    
    await db.execute('UPDATE users SET derniere_connexion = NOW() WHERE id = ?', [user.id]);
    
    res.json({ token, user: { id: user.id, email: user.email, nom: user.nom, prenom: user.prenom, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes des textes
app.post('/api/textes', authenticateToken, async (req, res) => {
  try {
    const { titre, contenu, theme } = req.body;
    const [result] = await db.execute(
      'INSERT INTO textes (participant_id, titre, contenu, theme) VALUES (?, ?, ?, ?)',
      [req.user.userId, titre, contenu, theme]
    );
    res.status(201).json({ message: 'Texte soumis', texteId: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/textes', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT t.*, u.nom, u.prenom FROM textes t JOIN users u ON t.participant_id = u.id';
    let params = [];
    
    if (req.user.role === 'participant') {
      query += ' WHERE t.participant_id = ?';
      params = [req.user.userId];
    }
    
    const [textes] = await db.execute(query, params);
    res.json(textes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes des corrections
app.post('/api/corrections', authenticateToken, async (req, res) => {
  try {
    const { texte_id, note, commentaires, criteres } = req.body;
    const [result] = await db.execute(
      'INSERT INTO corrections (texte_id, correcteur_id, note, commentaires, criteres) VALUES (?, ?, ?, ?, ?)',
      [texte_id, req.user.userId, note, commentaires, JSON.stringify(criteres)]
    );
    
    await db.execute('UPDATE textes SET statut = "corrige", note_finale = ? WHERE id = ?', [note, texte_id]);
    
    res.status(201).json({ message: 'Correction enregistrée', correctionId: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Routes des messages
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { destinataire_id, type, sujet, contenu } = req.body;
    const [result] = await db.execute(
      'INSERT INTO messages (expediteur_id, destinataire_id, type, sujet, contenu) VALUES (?, ?, ?, ?, ?)',
      [req.user.userId, destinataire_id, type, sujet, contenu]
    );
    res.status(201).json({ message: 'Message envoyé', messageId: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const [messages] = await db.execute(
      'SELECT m.*, u.nom, u.prenom FROM messages m JOIN users u ON m.expediteur_id = u.id WHERE m.destinataire_id = ? OR m.destinataire_id IS NULL ORDER BY m.date_envoi DESC',
      [req.user.userId]
    );
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Statistiques pour admin
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    
    const [participants] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "participant"');
    const [correcteurs] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "correcteur"');
    const [textes] = await db.execute('SELECT COUNT(*) as count FROM textes');
    const [corrections] = await db.execute('SELECT COUNT(*) as count FROM corrections');
    
    res.json({
      participants: participants[0].count,
      correcteurs: correcteurs[0].count,
      textes: textes[0].count,
      corrections: corrections[0].count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;