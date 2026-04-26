import Anthropic from "@anthropic-ai/sdk";
import { CallContext } from "../conversation";
import { ToolResult } from "../claude-client";
import { orderTools, executeOrderTool } from "./order-tools";
import { customerTools, executeCustomerTool } from "./customer-tools";
import { productTools, executeProductTool } from "./product-tools";
import { transferTools, executeTransferTool, TransferHandler } from "./transfer-tools";
import { callLogger } from "../../utils/logger";

export type ToolExecutor = (
  name: string,
  input: Record<string, unknown>,
  context: CallContext
) => Promise<string>;

const executors: Record<string, ToolExecutor> = {};

function register(
  tools: Anthropic.Tool[],
  executor: ToolExecutor
): void {
  for (const tool of tools) {
    executors[tool.name] = executor;
  }
}

register(orderTools, executeOrderTool);
register(customerTools, executeCustomerTool);
register(productTools, executeProductTool);

export function getAllTools(): Anthropic.Tool[] {
  return [...orderTools, ...customerTools, ...productTools, ...transferTools];
}

export function registerTransferHandler(handler: TransferHandler): void {
  register(transferTools, (name, input, context) =>
    executeTransferTool(name, input, context, handler)
  );
}

export async function executeTool(
  name: string,
  toolUseId: string,
  input: Record<string, unknown>,
  context: CallContext
): Promise<ToolResult> {
  const log = callLogger(context.callSid);
  const executor = executors[name];

  if (!executor) {
    log.warn({ tool: name }, "unknown tool requested");
    return {
      tool_use_id: toolUseId,
      content: JSON.stringify({ error: "Unknown tool" }),
      is_error: true,
    };
  }

  try {
    const result = await executor(name, input, context);
    return { tool_use_id: toolUseId, content: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ tool: name, error: message }, "tool execution failed");
    return {
      tool_use_id: toolUseId,
      content: JSON.stringify({ error: message }),
      is_error: true,
    };
  }
}
