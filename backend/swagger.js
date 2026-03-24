// swagger.js
import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Censo Escolar API',
    version: '1.0.0',
    description: 'API RESTful para acesso aos dados consolidados do Censo Escolar'
  },
  servers: [{ url: '/'}]
};

const options = {
  swaggerDefinition,
  apis: ['./server.js'], // anotações JSDoc nas rotas
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;