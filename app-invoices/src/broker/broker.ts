import amqp from "amqplib";

if (!process.env.BROKER_URL) {
    console.error("Please set the BROKER_URL environment variable");
}

export const broker = await amqp.connect(process.env.BROKER_URL!);
