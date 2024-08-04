import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { ZodError } from 'zod';

const zodPlugin: FastifyPluginAsync = fp(async (fastify) => {
  console.log('4️⃣ registering zod...');

  fastify.setValidatorCompiler((x: any) => {
    return (data) => {
      try {
        return { value: x.schema.parse(data) };
      } catch (error) {
        return { error: error as ZodError };
      }
    };
  });

  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.errors,
      });
    } else {
      reply.send(error);
    }
  });
});

export { zodPlugin };