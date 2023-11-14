export * from "yup-endpoints"

import { IncomingMessage, Server, ServerResponse, createServer } from "http"
import { InferType, Schema } from "yup"
import { YupEndpoint } from "yup-endpoints"
import { parseMultipart } from "./multipart"

/**
 * Represents an endpoint handler with input validation and output schema.
 * @typeParam I - The input schema type, extending from Yup's Schema.
 * @typeParam O - The output schema type, extending from Yup's Schema.
 */
export type YupEndpointHandler<I extends Schema, O extends Schema> = {
  /**
   * The endpoint configuration which includes input and output validation schemas.
   */
  endpoint: YupEndpoint<I, O>

  /**
   * The handler function that processes the request.
   * @param request - The incoming HTTP request.
   * @param response - The outgoing HTTP response.
   * @param body - The validated and parsed request body, conforming to the input schema.
   * @returns A promise that resolves to the output conforming to the output schema.
   */
  handler: (
    request: IncomingMessage,
    response: ServerResponse,
    body: InferType<I>
  ) => Promise<InferType<O>>
}

/**
 * Creates a Yup endpoint handler with the specified endpoint configuration and handler function.
 * @typeParam I - The input schema type, extending from Yup's Schema.
 * @typeParam O - The output schema type, extending from Yup's Schema.
 * @param endpoint - The endpoint configuration.
 * @param handler - The handler function for the endpoint.
 * @returns An object containing the endpoint configuration and handler.
 */
export function createYupEndpointHandler<I extends Schema, O extends Schema>(
  endpoint: YupEndpointHandler<I, O>["endpoint"],
  handler: YupEndpointHandler<I, O>["handler"]
): YupEndpointHandler<I, O> {
  return {
    endpoint,
    handler,
  }
}

/**
 * Creates an HTTP server configured with specified endpoints using Yup validation.
 * Each endpoint can have its own request handling logic and validation schema.
 * @param {YupEndpoint<any, any>[]} endpoints - An array of endpoint configurations.
 * @returns {Server} - An instance of an HTTP server.
 */
export function createYupServer(
  endpoints: YupEndpointHandler<any, any>[]
): Server {
  return createServer(async (request, response) => {
    try {
      switch (request.method) {
        case "OPTIONS":
          return sendJsonResponse(response, 204)
        case "POST":
          const slug = request.url?.split("?")[0]
          const current =
            slug && endpoints.find((i) => i.endpoint.path === slug)
          if (!current)
            return sendJsonResponse(response, 404, { error: "Not found" })
          let body: any
          if (current.endpoint.in) {
            const formData = await parseMultipart(request)
            body = await current.endpoint.in.validate(formData, {
              strict: false, // coerce
              stripUnknown: true,
            })
          }
          const payload = await current.handler(request, response, body)
          if (current.endpoint.hang) break // endpoint will respond manually
          return sendJsonResponse(response, 200, {
            payload,
          })
        default:
          return sendJsonResponse(response, 405, {
            error: "Method not allowed",
          })
      }
    } catch (error) {
      return sendJsonResponse(response, 400, {
        error: error instanceof Error ? error.message : "Server error",
      })
    }
  })
}

/**
 * Sends a JSON response with specified status code and body.
 * It also sets necessary headers for CORS and content type.
 * @param {ServerResponse} response - The server response object.
 * @param {number} statusCode - The HTTP status code to send.
 * @param {{ error: string } | { payload: unknown }} [jsonBody] - The JSON body of the response, if any.
 */
export function sendJsonResponse(
  response: ServerResponse,
  statusCode: number,
  jsonBody?: { error: string } | { payload: unknown }
) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  })
  if (jsonBody) response.end(JSON.stringify(jsonBody))
}
