export * from "yup-endpoints"

import { Server, ServerResponse, createServer } from "http"
import { YupEndpoint } from "yup-endpoints"
import { parseMultipart } from "./multipart"

/**
 * Creates an HTTP server configured with specified endpoints using Yup validation.
 * Each endpoint can have its own request handling logic and validation schema.
 * @param {YupEndpoint<any, any>[]} endpoints - An array of endpoint configurations.
 * @returns {Server} - An instance of an HTTP server.
 */
export function createYupServer(endpoints: YupEndpoint<any, any>[]): Server {
  return createServer(async (request, response) => {
    try {
      switch (request.method) {
        case "OPTIONS":
          return sendJsonResponse(response, 204)
        case "POST":
          const slug = request.url?.split("?")[0]
          const endpoint = slug && endpoints.find((i) => i.path === slug)
          if (endpoint) {
            let body: any
            if (endpoint.in) {
              const formData = await parseMultipart(request)
              body = await endpoint.in.validate(formData, {
                strict: false, // coerce
                stripUnknown: true,
              })
            }
            const payload = await endpoint.handler(request, response, body)
            if (endpoint.hang) break // endpoint will respond manually
            return sendJsonResponse(response, 200, { payload })
          }
          return sendJsonResponse(response, 404, { error: "Not found" })
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
