import { AsyncLineReader } from '../lib'
import { PassThrough, Writable } from 'stream'

async function writeSync(stream: Writable, chunk: string | Buffer) {
  return new Promise((resolve, reject) => {
    stream.write(chunk, resolve)
  })
}

async function endSync(stream: Writable) {
  return new Promise((resolve, reject) => {
    stream.end(resolve)
  })
}

describe("Async Line Reader", () => {

  it("Should read buffer that was written before awaiting", async () => {
    const stream = new PassThrough()
    const reader = new AsyncLineReader(stream)

    await writeSync(stream, 'Hello')
    await writeSync(stream, ' test\n')
    await writeSync(stream, 'Authory')
    await endSync(stream)

    expect(await reader.readLine()).toBe('Hello test')
    expect(await reader.readLine()).toBe('Authory')
    expect(await reader.readLine()).toBe(null)
  })

  it("Should read empty lines correctly", async () => {
    const stream = new PassThrough()
    const reader = new AsyncLineReader(stream)

    await writeSync(stream, '\n')
    await writeSync(stream, '\n')
    await writeSync(stream, '\n')
    await endSync(stream)

    expect(await reader.readLine()).toBe('')
    expect(await reader.readLine()).toBe('')
    expect(await reader.readLine()).toBe('')
    expect(await reader.readLine()).toBe(null)
  })

  it("Should read buffer that was written after awaiting", async () => {
    const stream = new PassThrough()
    const reader = new AsyncLineReader(stream)

    const firstPromise = reader.readLine();

    await writeSync(stream, 'Hello')
    await writeSync(stream, ' test\n')
    await writeSync(stream, 'Authory')
    await endSync(stream)

    expect(await firstPromise).toBe('Hello test')
    expect(await reader.readLine()).toBe('Authory')
    expect(await reader.readLine()).toBe(null)
  })

  it("Should handle close correctly after awaiting", async () => {
    const stream = new PassThrough()
    const reader = new AsyncLineReader(stream)

    const firstPromise = reader.readLine();

    await endSync(stream)

    expect(await firstPromise).toBe(null)
  })

  it("Should handle custom separators correctly", async () => {
    const stream = new PassThrough()
    const reader = new AsyncLineReader(stream, 'OOO')

    await writeSync(stream, 'Hello')
    await writeSync(stream, ' testOOO')
    await writeSync(stream, 'Authory')
    await endSync(stream)

    expect(await reader.readLine()).toBe('Hello test')
    expect(await reader.readLine()).toBe('Authory')
    expect(await reader.readLine()).toBe(null)
  })

  it("Should handle custom encoding correctly", async () => {
    const stream = new PassThrough()
    const reader = new AsyncLineReader(stream, '\n', 'ucs-2')

    await writeSync(stream, new Buffer('Hellö', 'ucs-2'))
    await writeSync(stream, new Buffer(' test\n', 'ucs-2'))
    await writeSync(stream, new Buffer('Authöry', 'ucs-2'))
    await endSync(stream)

    expect(await reader.readLine()).toBe('Hellö test')
    expect(await reader.readLine()).toBe('Authöry')
    expect(await reader.readLine()).toBe(null)
  })
})