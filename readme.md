# yup-endpoints-server

A lightweight, efficient server framework for Node.js, designed to simplify the process of creating and handling HTTP endpoints with Yup validation schemas. By leveraging the power of Yup for input validation, this package allows for easy setup of robust and reliable server endpoints, enhancing both development speed and runtime safety.

## Features

- Easy to set up HTTP server with Yup validation.
- Support for various HTTP methods.
- Custom error handling and response formatting.
- Simplified multipart/form-data parsing and validation.
- Flexible and powerful schema validation with Yup.

## Installation

```bash
npm install yup yup-endpoints-server
```

Or, if you prefer using Yarn:

```bash
yarn add yup yup-endpoints-server
```

## Usage

Here's a quick example to get you started:

```typescript
import { createYupServer, fileDataSchema } from 'yup-endpoints-server';
import * as yup from 'yup';

// Define an endpoint
const createUserEndpoint = createYupEndpoint({
  path: '/create-user',
  in: yup.object().shape({
    name: yup.string().required(),
    email: yup.string().required(),
    avatar: fileDataSchema, // form-data file
  }),
  out: yup.object().shape({
    success: yup.boolean().required(),
  }),
});

// Apply the endpoint handler logic
const createUserHandler = createYupEndpointHandler(
  createUserEndpoint,
  async (req, res, body) => {
    console.log(body.avatar.fileName) 
    // create user logic
    return { success: true };
  }
)

// Create and start the server
const server = createYupServer([createUserHandler]);
server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## API Documentation

- `createYupEndpoint<I extends yup.Schema, O extends yup.Schema>(data: YupEndpoint<I, O>)`: Function to create a Yup endpoint with specified input and output validation schemas.

- `createYupServer(endpoints: YupEndpointHandler<any, any>[])`: Creates a new HTTP server with specified endpoints using Yup validation schemas.

- `fileDataSchema`: A Yup schema for validating file data, including buffer, filename, encoding, and MIME type.

- `YupEndpoint<I extends yup.Schema, O extends yup.Schema>`: Type definition for an endpoint, including path, input and output schemas.

- `YupEndpointHandler<I extends yup.Schema, O extends yup.Schema>`: Type for an endpoint handler, where `I` is the input type validated by a Yup schema and `O` is the output type.

- `sendJsonResponse(response: ServerResponse, statusCode: number, jsonBody?: object)`: Utility function to send a JSON response with a specified status code and body.

Refer to the source code for more detailed API documentation.

## Contributing

Contributions are always welcome!

## License

This project is licensed under the [MIT License](LICENSE).

## Support

If you have any questions or issues, feel free to open an issue on the [GitHub repository](https://github.com/your-github/yup-endpoints-server).

## Acknowledgements

Special thanks to the contributors of this project and the Yup library for making input validation simpler and more efficient.
