import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errors, celebrate, Joi, Segments } from 'celebrate';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import client from 'prom-client';
import pool from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Segurança e observabilidade
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'test' ? 'tiny' : 'combined'));

// Rate limit básico
const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

// Métricas Prometheus
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

app.get('/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS ok');
    return res.json({ status: 'ok', db: rows[0].ok === 2 });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: e.message });
  }
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Docs Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

/**
 * @openapi
 * /api/tables:
 *   get:
 *     summary: Lista tabelas disponíveis no banco
 *     responses:
 *       200:
 *         description: Lista de tabelas
 */
app.get('/api/tables', async (req, res) => {
  try {
    const [rows] = await pool.query("SHOW TABLES");
    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar tabelas:', err);
    res.status(500).json({ error: 'Erro ao listar tabelas.' });
  }
});

/**
 * @openapi
 * /api/:table:
 *   get:
 *     summary: Retorna registros de uma tabela específica
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limite de registros (padrão 100)
 */
app.get('/api/:table',
  celebrate({
    [Segments.PARAMS]: Joi.object({ table: Joi.string().alphanum().min(1).max(64).required() }),
    [Segments.QUERY]: Joi.object({ limit: Joi.number().integer().min(1).max(1000).default(100) })
  }),
  async (req, res) => {
    const { table } = req.params;
    const { limit } = req.query;
    try {
      const [rows] = await pool.query(`SELECT * FROM \`${table}\` LIMIT ?`, [Number(limit)]);
      res.json(rows);
    } catch (err) {
      console.error('Erro ao consultar tabela:', err);
      res.status(500).json({ error: 'Erro ao consultar a tabela.' });
    }
  }
);

// Rota consolidada por UF
/**
 * @openapi
 * /api/relacionado/totais-por-uf:
 *   get:
 *     summary: Agrega total de matrículas por UF
 *     responses:
 *       200:
 *         description: Totais por UF
 */
app.get('/api/relacionado/totais-por-uf', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.SG_UF, SUM(q.QT_MAT_FUND_AF_8 + q.QT_MAT_FUND_AF_9 + q.QT_MAT_MED_PROP_1 + q.QT_MAT_MED_PROP_2 + q.QT_MAT_MED_PROP_3) AS total
      FROM CensoEscolar_UF u
      JOIN CensoEscolar_Municipio m ON m.SG_UF = u.SG_UF
      JOIN CensoEscolar_Quantidades q ON q.CO_MUNICIPIO = m.CO_MUNICIPIO
      GROUP BY u.SG_UF
      ORDER BY u.SG_UF
    `);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao agregar por UF:', err);
    res.status(500).json({ error: 'Erro ao agregar por UF.' });
  }
});

// Import CSV (simples) — exemplo com validação
/**
 * @openapi
 * /api/import:
 *   post:
 *     summary: Importa dados CSV do Censo (pipeline ETL simplificado)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               csvBase64:
 *                 type: string
 *                 description: Conteúdo CSV em base64
 *     responses:
 *       200:
 *         description: Importação concluída
 */
app.post('/api/import',
  celebrate({ [Segments.BODY]: Joi.object({ csvBase64: Joi.string().base64().required() }) }),
  async (req, res) => {
    try {
      // Apenas simulação — aqui entrariam regras de parsing e inserts em lote
      const size = Buffer.from(req.body.csvBase64, 'base64').length;
      return res.json({ ok: true, bytes: size });
    } catch (err) {
      console.error('Erro no import:', err);
      return res.status(500).json({ error: 'Falha na importação.' });
    }
  }
);

// Tratadores de erro (Celebrate)
app.use(errors());

// Fallback 404
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

// Handler final
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Inicializa servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});