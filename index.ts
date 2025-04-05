import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const DiceRollSchema = z.object({
  faces: z.number().default(6),
  rolls: z.number().default(1),
});

function rollDice(faces: number, rolls: number) {
  const result: number[] = [];
  for (let i = 0; i < rolls; i++) {
    result.push(Math.floor(Math.random() * faces) + 1);
  }
  const total = result.reduce((a, b) => a + b, 0);
  if (rolls === 1) {
    return total.toString();
  }
  const expr = result.map((r) => r.toString()).join(" + ");
  return `${expr} = ${total}`;
}

const server = new Server(
  {
    name: "dice-roll",
    version: "1.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// difine the tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "roll_dice",
      description: "Roll a dice",
      inputSchema: zodToJsonSchema(DiceRollSchema),
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "roll_dice": {
      const { faces, rolls } = DiceRollSchema.parse(args);
      return {
        content: [{ type: "text", text: rollDice(faces, rolls) }],
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// launch the server
const transport = new StdioServerTransport();
await server.connect(transport);
