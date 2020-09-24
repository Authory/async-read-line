import { AsyncLineReader } from '../lib' // 'async-line-reader'

async function main() {
  const reader = new AsyncLineReader(process.stdin)

  console.log('Please enter some numbers, line-wise. Enter a new line when you are done.')

  let line: string | null
  let sum = 0

  while((line = await reader.readLine()) !== '') {
    sum += parseInt(line)
  }

  console.log('Sum: ', sum)
  process.exit(0)
}

main()