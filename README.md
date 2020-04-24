# OAuth2 / OIDC Mock Server

This server is designed to mock out key endpoints for an OIDC/OAuth 2.0 server to allow for
testing of a system using an external authorization/authentication service. This server will
only work if the underlying system relies on an opague token approach, calling the
`introspection_endpoint` to verify tokens.

## Endpoints

`/.well-known/openid-configuration` returns the other endpoints implemented by the server. 
The following endpoints are currently implemented:
- `authorization_endpoint`
- `token_endpoint`
- `introspection_endpoint`

## Token Creation
Tokens can be created with either the `authorization_endpoint` or `token_endpoint`. At this time the behavior of both is identical. 
A token is created by sending the requested token body payload to either endpoint using a `POST` request. The `response_type` query 
parameter can be used to define the property name or the returned token. By default `id_token` is used.

Example
```
curl -d hello=world <server>/authorize?response_type=id_token
```

Response
```
{
    id_token: <some random string>
}
```

This call will result in a token who's introspection will yield:
```
{
    'hello': 'world'
}
```
See *introspection* below.

The implementation makes no guarantees regarding the format of the token. The client should 
treat it as a random string (opague token) that can be exchanged with the introspection endpoint to return 
valid data. 

## Token Introspection
In order to recieve the data encoded in the token with the authorization/token endpoint the
token must be sent with a `POST` request to the introspection endpoint. The introspection
endpoint will return an object containing the information initially sent to the service.

Example
```
curl -d token=<token> <server>/introspect
```

## Sample
An example using this server from within Javascript

```
const axios = require('axios');  // For HTTP Requests

const AUTH_SERVER_URL = 'http://localhost:3000';

async function main() {
    const { data: endpoints }  = await axios.get(`${AUTH_SERVER_URL}/.well-known/openid-configuration`);
    const {
        authorization_endpoint,
        introspection_endpoint
    } = endpoints;

    const SAMPLE_DATA = {
        hello: 'world',
        foo: 'bar',
        oneTwo: '3 4'
    };

    const { data: { id_token }} = await axios.post(`${authorization_endpoint}`, SAMPLE_DATA)
    console.log(id_token);  // Some random string of data


    const { data } = await axios.post(introspection_endpoint, {token: id_token});

    const equal = (SAMPLE_DATA.hello === data.hello && SAMPLE_DATA.foo === data.foo);
    console.log(equal);     // True

}

main()
    .then(() => console.log('Done'))
    .catch(console.error)
```


