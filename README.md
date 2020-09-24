# Async Read Line

This library provides a convenient way to read line-wise from streams. 

### Installation

```bash
yarn add async-line-reader
# or
npm i async-line-reader
```

### Usage and Examples

Read line-wise from a stream:

```ts
const reader = new AsyncLineReader(stream)

const line = await reader.readLine()
```

Custom separator or encoding.

```ts
const reader = new AsyncLineReader(stream, ';', 'ascii')

const line = await reader.readLine()
```

For more detailed examples, please look into the `examples` and `test` folders.

### Why should I use this?

This module is for your convienence if you want to read a stream line by line in a JS application that utilizes async/await. I did not see another library that proided a similar, convenient interface.
