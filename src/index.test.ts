import { ServerResponse } from "http"
import { YupEndpointHandler, createYupServer, sendJsonResponse } from "."

describe("createYupServer", () => {
  it("should create a server", () => {
    const mockEndpoints: YupEndpointHandler<any, any>[] = [
      // Mock endpoint configurations
    ]
    const server = createYupServer(mockEndpoints)
    expect(server).toBeDefined()
  })
})

describe("sendJsonResponse", () => {
  let mockResponse: ServerResponse

  beforeEach(() => {
    mockResponse = new ServerResponse({} as any)
    mockResponse.writeHead = jest.fn()
    mockResponse.end = jest.fn()
  })

  it("sends a JSON response with a status code and body", () => {
    const jsonBody = { payload: { message: "success" } }
    sendJsonResponse(mockResponse, 200, jsonBody)
    expect(mockResponse.writeHead).toHaveBeenCalledWith(200, expect.any(Object))
    expect(mockResponse.end).toHaveBeenCalledWith(JSON.stringify(jsonBody))
  })
})
