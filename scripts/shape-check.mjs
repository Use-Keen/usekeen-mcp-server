#!/usr/bin/env node

// Quick local check to verify result envelope shape of helpers
import assert from 'node:assert'
import { formatToolSuccess, formatToolError } from '../dist/helpers.js'

function checkSuccess() {
  const mock = {
    result: {
      results: [
        { content: 'Hello' },
        { text: 'World' },
        { foo: 1 },
      ],
    },
  }
  const out = formatToolSuccess(mock)
  assert(Array.isArray(out.content) && out.content.length === 3, 'content array must have 3 blocks')
  assert(out.content.every((c) => c.type === 'text' && typeof c.text === 'string'), 'all blocks should be text')
  assert(out.structuredContent, 'structuredContent should be present')
}

function checkError() {
  const out = formatToolError('oops')
  assert(out.isError === true, 'isError must be true')
  assert(Array.isArray(out.content) && out.content[0]?.type === 'text', 'error content must include a text block')
}

try {
  checkSuccess()
  checkError()
  console.log('shape-check: PASS')
} catch (err) {
  console.error('shape-check: FAIL:', err?.message || err)
  process.exit(1)
}
