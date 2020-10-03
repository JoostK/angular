# Angular Linker

The tooling here is used to "link" partial declarations of components, directives, etc in libraries to produce the full definitions.

The partial declaration format allows library packages to be published to npm without exposing the underlying Ivy instructions.
The tooling here allows application build tools (e.g. CLI) to produce fully compiled components, directives, etc at the point when the application is bundled.
These linked files can be cached outside `node_modules` so it is much more efficient than ngcc and doesn't have the problems of mutating packages in `node_modules`.

## Building

The project is built using Bazel:

```bash
yarn bazel build //packages/compiler-cli/linker
```

## Unit Testing

The unit tests are built and run using Bazel:

```bash
yarn bazel test //packages/compiler-cli/linker/test
```
