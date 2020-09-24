import { Readable } from 'stream'

type Resolve<T> = (value?: T | PromiseLike<T>) => void

/**
 * Allows async line-wise reading from a stream.
 */
export class AsyncLineReader {
  // Params
  private stream: Readable
  private separator: string
  private bufferEncoding: BufferEncoding

  // Caches the actual data
  private internalBuffer: string

  // Indicates if the stream has ended
  private ended: boolean

  // Caches stream errors
  private error: Error

  // Callbacks for returned promise.
  private resolve: Resolve<String> | null
  private reject: Resolve<Error> | null

  /**
   * Creates a new AsyncLineReader instance.
   * @param stream The stream to read from.
   * @param separator The line separator.
   * @param bufferEncoding The encoding of the buffer, if the stream is a binary stream.
   */
  public constructor(stream: Readable, separator: string = '\n', bufferEncoding: BufferEncoding = 'utf-8') {
    this.stream = stream
    this.separator = separator
    this.bufferEncoding = bufferEncoding
    this.ended = false
    this.internalBuffer = ''

    this.resolve = null;
    this.reject = null;

    this.stream.on('data', (chunk) => this.onData(chunk))
    this.stream.on('end', () => this.onEnd())
    this.stream.on('error', (err) => this.onError(err))
  }

  /**
   * Checks the type of a chunk and converts it to a string.
   */
  private chunkToString(chunk: any) {
    if(typeof chunk === 'string') {
      return chunk
    }

    if(chunk instanceof Buffer) {
      return chunk.toString(this.bufferEncoding)
    }

    throw new Error(`Invalid buffer type: ${typeof chunk}`)
  }

  /**
   * Called on stream error.
   */
  private onError(err: Error) {
    this.consumeError(err)
  }

  /**
   * Called on stream end.
   */
  private onEnd() {
    this.ended = true

    this.tryNotifyWaiting()
  }

  /**
   * Called in case there is new data in the stream.
   */
  private onData(chunk: Buffer) {
    const data = this.chunkToString(chunk)

    // Store the new data. This could be done faster.
    this.internalBuffer = this.internalBuffer + data

    this.tryNotifyWaiting()
  }

  /**
   * Notifies a waiting promise chain, if any.
   */
  private tryNotifyWaiting() {
    if(this.resolve) {
      const line = this.readNextLineFromBuffer();
      // If the stream has ended, we might send a null. 
      if(line !== null || this.ended) {
        this.resolve(line)

        this.reject = null
        this.resolve = null
      }
    }
  }

  /**
   * Either rejects a waiting promise with the given error,
   * or stores it for later throwing.
   */
  private consumeError(error: Error) {
    if(this.resolve) {
        this.reject(error)

        this.reject = null
        this.resolve = null
    } else {
      this.error = error
    }
  }


  /**
   * Gets the next available line from the buffer. The line is removed from the buffer.
   * 
   * Returns null when there is no data, regardless of the stream has ended or not.
   */
  private readNextLineFromBuffer() {
    const idx = this.internalBuffer.indexOf(this.separator)
    if(idx >= 0) {
      // There is at least one complete line in our buffer.
      const line = this.internalBuffer.substring(0, idx)
      // Update buffer, remove \n
      this.internalBuffer = this.internalBuffer.substring(idx + this.separator.length, this.internalBuffer.length)
      
      return line
    } else if(this.ended) {
      if(this.internalBuffer === '') {
        return null
      }

      // There is no complete line and the stream has ended.
      const line = this.internalBuffer
      this.internalBuffer = ''

      return line
    } else {
      // There is no complete line yet.
      return null
    }
  }

  /**
   * Gets the next line from the stream.
   * Returns either a line, a promise that resolves
   * when the next line becomes available, or null,
   * if the stream has ended and was read completely.
   * This method throws if the underlying stream errors.
   */
  public async readLine(): Promise<string> {
    if(this.error) {
      const err = this.error
      this.error = null
      throw err
    }

    const line = this.readNextLineFromBuffer();

    if(line !== null) {
      // There is data available, return it.
      return line
    } else if(this.ended) {
      // Stream is over, return null.
      return null
    } else {
      // No data, but stream ongoing. Async read operation.
      return new Promise((resolve, reject) => {
        if(this.resolve !== null) {
          reject('Another promise chain is already waiting for the next line.')
        } else {
          this.resolve = resolve
          this.reject = reject
        }
      })
    }
  }
}