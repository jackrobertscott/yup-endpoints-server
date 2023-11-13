import { IncomingMessage, ServerResponse, createServer } from "http"
import { InferType, Schema } from "yup"
import { parseMultipart } from "./multipart"

export type EndpointHandler<I, O> = (
  request: IncomingMessage & { body: I },
  response: ServerResponse
) => Promise<O>

export type Endpoint<I extends Schema = any, O extends Schema = any> = {
  path: string
  in?: I
  out?: O
  hang?: boolean
  handler: EndpointHandler<
    I extends Schema ? InferType<I> : unknown,
    O extends Schema ? InferType<O> : unknown
  >
}

export function createYupServer(endpoints: Endpoint[]) {
  return createServer(async (request, response) => {
    try {
      switch (request.method) {
        case "OPTIONS":
          return sendResponse(response, 204)
        case "POST":
          const slug = request.url?.split("?")[0]
          const endpoint = slug && endpoints.find((i) => i.path === slug)
          if (endpoint) {
            let body: any
            if (endpoint.in instanceof Schema) {
              const formData = await parseMultipart(request)
              body = await endpoint.in.validate(formData, {
                strict: false, // coerce
                stripUnknown: true,
              })
            }
            Object.assign(request, { body })
            const payload = await endpoint.handler(request as any, response)
            if (endpoint.hang) break // endpoint will respond manually
            return sendResponse(response, 200, {
              payload,
            })
          }
          return sendResponse(response, 404, {
            error: "Not found",
          })
        default:
          return sendResponse(response, 405, {
            error: "Method not allowed",
          })
      }
    } catch (error) {
      return sendResponse(response, 400, {
        error: error instanceof Error ? error.message : "Server error",
      })
    }
  })
}

export function sendResponse(
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
