#!/usr/bin/env ts-node

/**
 * Release Body Generator
 * 
 * Extracts release notes from CHANGELOG.md based on tag version
 * 
 * Input:
 *   GITHUB_REF: refs/tags/vX.Y.Z
 *   CHANGELOG.md: Keep a Changelog format
 * 
 * Output:
 *   release_body.md: Release notes content
 * 
 * Exit codes:
 * 0: Success (release_body.md created)
 * 1: Failure (missing section, empty content, etc.)
 */

import fs from 'fs';
import path from 'path';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

/**
 * Extract tag from GITHUB_REF environment variable
 * Format: refs/tags/vX.Y.Z
 */
function extractTag(): string {
  const ref = process.env.GITHUB_REF;
  
  if (!ref || !ref.startsWith('refs/tags/')) {
    throw new Error('GITHUB_REF not set or invalid format');
  }
  
  return ref.replace('refs/tags/', '');
}

/**
 * Extract version number from tag
 * v1.2.3 → 1.2.3
 */
function extractVersion(tag: string): string {
  // Remove 'v' prefix if present
  return tag.startsWith('v') ? tag.substring(1) : tag;
}

/**
 * Extract release notes section from CHANGELOG.md
 * 
 * Format:
 * ## [1.2.3] - 2025-12-27
 * ### Added
 * - Feature A
 * 
 * ## [1.2.2] - 2025-12-20
 * ← Stop here
 */
function extractReleaseBody(
  changelog: string,
  version: string,
): { success: boolean; body: string; error?: string } {
  // Find the header for this version
  // Support formats:
  // - ## [1.2.3] - 2025-12-27
  // - ## [v1.2.3] - 2025-12-27
  // - ## [1.2.3]
  const versionPatterns = [
    new RegExp(`## \\[${version}\\]`),
    new RegExp(`## \\[v${version}\\]`),
  ];
  
  let startIndex = -1;
  let versionHeaderLine = '';
  
  for (const pattern of versionPatterns) {
    const match = changelog.match(pattern);
    if (match && match.index !== undefined) {
      startIndex = match.index;
      // Find the full line (for output)
      const lineEnd = changelog.indexOf('\n', startIndex);
      versionHeaderLine = changelog.substring(
        startIndex,
        lineEnd === -1 ? changelog.length : lineEnd,
      );
      break;
    }
  }
  
  if (startIndex === -1) {
    return {
      success: false,
      body: '',
      error: `CHANGELOG.md does not contain version [${version}]`,
    };
  }
  
  // Find the next version header (## [X.Y.Z])
  const afterVersion = changelog.substring(startIndex);
  const nextHeaderMatch = afterVersion.match(/\n## \[/);
  
  let endIndex: number;
  if (nextHeaderMatch && nextHeaderMatch.index) {
    // End at the newline before the next header
    endIndex = startIndex + nextHeaderMatch.index;
  } else {
    // No next header, use entire rest of file
    endIndex = changelog.length;
  }
  
  // Extract the section
  const body = changelog
    .substring(startIndex, endIndex)
    .trim();
  
  if (!body || body.length === 0) {
    return {
      success: false,
      body: '',
      error: `Release notes for [${version}] is empty`,
    };
  }
  
  return {
    success: true,
    body,
  };
}

/**
 * Main function
 */
async function main() {
  try {
    console.log(
      `${colors.blue}Generating release body from CHANGELOG.md${colors.reset}`,
    );
    console.log('');
    
    // Extract tag and version
    const tag = extractTag();
    const version = extractVersion(tag);
    
    console.log(`Tag: ${colors.green}${tag}${colors.reset}`);
    console.log(`Version: ${colors.green}${version}${colors.reset}`);
    console.log('');
    
    // Read CHANGELOG.md
    const changelogPath = 'CHANGELOG.md';
    if (!fs.existsSync(changelogPath)) {
      console.error(`${colors.red}[ERROR] CHANGELOG.md not found${colors.reset}`);
      process.exit(1);
    }
    
    const changelog = fs.readFileSync(changelogPath, 'utf-8');
    
    // Extract release body
    const result = extractReleaseBody(changelog, version);
    
    if (!result.success) {
      console.error(
        `${colors.red}[ERROR] Failed to extract release body${colors.reset}`,
      );
      console.error(`Reason: ${result.error}`);
      console.error('');
      console.error(
        'Make sure CHANGELOG.md contains a section like:',
      );
      console.error(`## [${version}] - YYYY-MM-DD`);
      console.error('### Added / Changed / Fixed / Removed');
      console.error('- item 1');
      console.error('');
      process.exit(1);
    }
    
    // Write release body to file
    const outputPath = 'release_body.md';
    fs.writeFileSync(outputPath, result.body, 'utf-8');
    
    console.log(`${colors.green}[SUCCESS] Release body extracted${colors.reset}`);
    console.log(`Output: ${colors.blue}${outputPath}${colors.reset}`);
    console.log('');
    console.log('Content:');
    console.log('─'.repeat(60));
    console.log(result.body);
    console.log('─'.repeat(60));
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error(
      `${colors.red}[ERROR] Failed to generate release body:${colors.reset}`,
    );
    console.error(error);
    process.exit(1);
  }
}

// Run
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
