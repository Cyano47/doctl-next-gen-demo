# APIs

The folder has two primers and no disagreement between them. *API for Dummies* (PMstack) and *Rest API Fundamentals* (a slide deck) both stop at the same picture.

An API is the contract a caller can depend on. The usual teaching image is a waiter: the customer places an order, the waiter carries it to the kitchen, the kitchen cooks, the waiter brings food back. The customer does not need to know how the kitchen works, or which language the cook speaks. REST, in both files, means that contract is exercised over HTTP: resources have addresses, and the verb (read, create, update, delete) says what should happen.

What the primers do not cover, and what matters once you are writing a real contract:

- **The contract is the promises, not the server.** Callers will bind to status codes, error shapes, pagination, and field names. Changing those is a breaking change even when the database change felt internal.
- **JSON over HTTP is not the whole of REST.** These two files use REST to mean that style. Fielding’s constraints (stateless calls, a uniform interface, hypermedia) are stricter. If a partner says "REST," ask which of those they mean before you argue.
- **Version the promises you cannot keep stable.** Put a version where callers can see it. Additive fields are easier to live with than renamed ones.
- **Auth and scope are part of the contract.** A key that can do everything is not a simpler API. It is an unscoped one.

Product use: an API review is a viability and feasibility risk in Cagan’s sense. Who is the caller, what job are they hiring the API for, and which promise will you still honor in two years? That discovery is in [What to build](what-to-build.md). The technical shape above is the whole overlap of these two PDFs.

## Sources

PMstack, *API for Dummies*. *Rest API Fundamentals* slide deck.
