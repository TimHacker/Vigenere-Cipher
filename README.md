# Vigenère Cipher

A simple app to encrypt and decrypt messages using a hand-written Vigenère Cipher (no libraries).

## Run locally

Requires Node 18+ for tests, and any static file server to run the app:

```sh
npm test      # run the unit tests (node --test)
npm start     # serve on http://localhost:8000 (python3 http.server)
```

ES modules need to be served over HTTP, so opening `index.html` directly from the file system won't work.

## Development approach

- Test-driven development using Node's built-in test runner (`npm test`).
- Key decisions are recorded as ADRs in [`docs/adr`](docs/adr/README.md).
- Project journey and show-and-tell notes: [`docs/JOURNEY.md`](docs/JOURNEY.md).
