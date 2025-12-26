# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## PHP Documentation - Always use Context7

When working with PHP code or answering PHP-related questions, ALWAYS use the **context7** MCP server to retrieve the latest documentation from:

- `php/doc-en` - Official PHP documentation in English
- `websites/php_net_manual_en` - PHP.net manual

### Usage

Use `mcp__context7__get-library-docs` directly with these library IDs:

- `php/doc-en` - for general PHP documentation
- `websites/php_net_manual_en` - for PHP.net manual

No need to use `resolve-library-id`, you can access these library IDs directly.

## Language Rule

- Always respond in Vietnamese
- Do not use English, unless user explicitly requests it
- Technical terms may be kept in English if common (API, token, context window, etc.)

## Import Path Rule

- **ALWAYS** use `@/` alias for all imports from `src/` directory
- **NEVER** use relative imports like `../` or `./`
- Examples:
    - ✅ `import { foo } from '@/components/foo'`
    - ✅ `import API_ENDPOINTS from '@/const/api-endpoint'`
    - ❌ `import { foo } from '../components/foo'`
    - ❌ `import { foo } from './foo'`

## Node.js Rule

- **ALWAYS** use `node:` protocol when importing Node.js built-in modules
- This makes it explicitly clear that you're importing a core Node.js module rather than a third-party package
- Examples:
    - ✅ `import fs from 'node:fs'`
    - ✅ `import path from 'node:path'`
    - ✅ `import { createServer } from 'node:http'`
    - ❌ `import fs from 'fs'`
    - ❌ `import path from 'path'`
