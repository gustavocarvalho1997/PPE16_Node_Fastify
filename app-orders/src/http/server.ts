import "@opentelemetry/auto-instrumentations-node/register";
import { fastify } from "fastify";
import { randomUUID } from "node:crypto";
import { fastifyCors } from "@fastify/cors";
import { trace } from "@opentelemetry/api";
import { z } from "zod";
import {
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { channels } from "../broker/channels/index.ts";
import { schema } from "../db/schema/index.ts";
import { db } from "../db/client.ts";
import { dispatchOrderCreated } from "../broker/messages/order-created.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.register(fastifyCors, {
    origin: "*",
});

app.get("/health", () => {
    return "OK";
});

app.post(
    "/orders",
    {
        schema: {
            body: z.object({
                amount: z.coerce.number(),
            }),
        },
    },
    async (request, reply) => {
        const { amount } = request.body;
        console.log("Order received:", amount);

        const orderId = randomUUID();

        await db.insert(schema.orders).values({
            id: randomUUID(),
            customerId: "0213d1de-1625-4188-afda-77a7a359eb46",
            amount,
        });

        trace.getActiveSpan()?.setAttribute("order_id", orderId);

        dispatchOrderCreated({
            orderId,
            amount,
            customer: {
                id: "0213d1de-1625-4188-afda-77a7a359eb46",
            },
        });

        return reply.status(201).send();
    }
);
app.listen({ host: "0.0.0.0", port: 3333 }).then(() => {
    console.log("[Orders] Server is running on http://localhost:3333");
});
