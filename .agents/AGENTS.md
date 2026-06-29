# Rules

- Always use Test Driven Development (TDD) when making changes: write or update tests to define the expected behavior first, ensure they fail, then implement the changes to make them pass, and verify.
- Always update the correct spec file in the `specs` directory whenever updating the implementation so that the implementation is always in sync with the spec file.
- When running TDD during implementation and testing, run unit tests only (e.g., using `npm run test:unit`) and do not run integration tests (which consume LLM tokens), unless explicitly requested or during final verification.
