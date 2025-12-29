#!/usr/bin/env ts-node

/**
 * Release Validation Script
 * 
 * Validates release tags against:
 * - Tag format (vX.Y.Z only)
 * - CHANGELOG.md entry
 * - Release notes template completeness
 * 
 * Exit codes:
 * 0: Validation passed
 * 1: Validation failed
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

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

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
 * Check 1: Validate tag format (vX.Y.Z)
 */
function validateTagFormat(tag: string): ValidationResult {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
  };
  
  // SemVer regex: vMAJOR.MINOR.PATCH
  const semverRegex = /^v(\d+)\.(\d+)\.(\d+)$/;
  
  if (!semverRegex.test(tag)) {
    result.passed = false;
    result.errors.push(
      `Invalid tag format: "${tag}"`,
      'Expected format: vX.Y.Z (e.g., v1.0.0, v1.2.3)',
      'Valid examples: v1.0.0, v2.1.5, v0.1.0',
      'Invalid examples: v1.0, 1.0.0, v1.0.0-alpha',
    );
  }
  
  return result;
}

/**
 * Check 2: Validate CHANGELOG.md entry
 */
function validateChangelogEntry(tag: string): ValidationResult {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
  };
  
  const changelogPath = 'CHANGELOG.md';
  
  // Check if CHANGELOG.md exists
  if (!fs.existsSync(changelogPath)) {
    result.passed = false;
    result.errors.push(
      'CHANGELOG.md not found',
      'Create CHANGELOG.md in project root',
      'See: docs/RELEASE_VERSIONING.md for format',
    );
    return result;
  }
  
  const changelog = fs.readFileSync(changelogPath, 'utf-8');
  
  // Check for [Unreleased] section
  if (!changelog.includes('[Unreleased]') && !changelog.includes('## [Unreleased]')) {
    result.passed = false;
    result.errors.push(
      'CHANGELOG.md missing [Unreleased] section',
      'Add: ## [Unreleased] at top of changelog',
    );
    return result;
  }
  
  // Extract version from tag (remove 'v' prefix)
  const version = tag.substring(1); // v1.2.3 -> 1.2.3
  
  // Check for version entry
  // Supported formats:
  // - ## [1.2.3] - 2025-12-27
  // - ## [v1.2.3] - 2025-12-27
  const versionPatterns = [
    new RegExp(`## \\[${version}\\]`, 'i'),
    new RegExp(`## \\[v${version}\\]`, 'i'),
  ];
  
  const hasVersionEntry = versionPatterns.some(pattern => pattern.test(changelog));
  
  if (!hasVersionEntry) {
    result.passed = false;
    result.errors.push(
      `CHANGELOG.md missing [${version}] entry for release ${tag}`,
      `Add section to CHANGELOG.md:`,
      `## [${version}] - YYYY-MM-DD`,
      '### Added / Changed / Fixed / Removed',
      '- item 1',
      '- item 2',
    );
    return result;
  }
  
  return result;
}

/**
 * Check 3: Validate Release Notes Template
 */
function validateReleaseTemplate(): ValidationResult {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
  };
  
  const templatePath = 'docs/RELEASE_NOTES_TEMPLATE.md';
  
  // Check if template exists
  if (!fs.existsSync(templatePath)) {
    result.passed = false;
    result.errors.push(
      'docs/RELEASE_NOTES_TEMPLATE.md not found',
      'Create template following docs/RELEASE_VERSIONING.md',
    );
    return result;
  }
  
  const template = fs.readFileSync(templatePath, 'utf-8');
  
  // Required sections (case-insensitive)
  const requiredSections = [
    'Overview',
    'Changes',
    'Operations', // or 'Ops'
    'Risk',       // or 'Risk Assessment' or 'Risk & Rollback'
    'Rollback',
    'Verification',
  ];
  
  const missingSections: string[] = [];
  
  for (const section of requiredSections) {
    // Look for section headers like "## Section" or "### Section"
    const sectionRegex = new RegExp(`^#+\\s+${section}`, 'mi');
    if (!sectionRegex.test(template)) {
      missingSections.push(section);
    }
  }
  
  if (missingSections.length > 0) {
    result.passed = false;
    result.errors.push(
      `Release notes template missing sections: ${missingSections.join(', ')}`,
      'Required sections:',
      '- Overview',
      '- Changes',
      '- Operations',
      '- Risk Assessment',
      '- Rollback',
      '- Verification',
      'See: docs/RELEASE_NOTES_TEMPLATE.md',
    );
    return result;
  }
  
  return result;
}

/**
 * Print validation results
 */
function printResults(
  tag: string,
  results: { name: string; result: ValidationResult }[],
): boolean {
  console.log('');
  console.log('═'.repeat(60));
  console.log('Release Validation Report');
  console.log('═'.repeat(60));
  console.log(`Tag: ${tag}`);
  console.log('');
  
  let allPassed = true;
  
  for (const { name, result } of results) {
    const status = result.passed
      ? `${colors.green}✅ PASS${colors.reset}`
      : `${colors.red}❌ FAIL${colors.reset}`;
    
    console.log(`${status} ${name}`);
    
    if (!result.passed) {
      allPassed = false;
      for (const error of result.errors) {
        console.log(`  ${colors.red}→${colors.reset} ${error}`);
      }
    }
    
    for (const warning of result.warnings) {
      console.log(`  ${colors.yellow}⚠${colors.reset}  ${warning}`);
    }
    
    console.log('');
  }
  
  console.log('═'.repeat(60));
  
  if (allPassed) {
    console.log(
      `${colors.green}[PASS] Release validation passed ✅${colors.reset}`,
    );
    console.log('Ready to deploy!');
  } else {
    console.log(
      `${colors.red}[FAIL] Release validation failed ❌${colors.reset}`,
    );
    console.log('');
    console.log('Fix the errors above before pushing the tag.');
    console.log('See docs/RELEASE_VERSIONING.md for guidance.');
  }
  
  console.log('═'.repeat(60));
  console.log('');
  
  return allPassed;
}

/**
 * Main validation function
 */
async function main() {
  try {
    // Extract tag from environment
    const tag = extractTag();
    console.log(`${colors.blue}Validating release tag: ${tag}${colors.reset}`);
    console.log('');
    
    // Run validation checks
    const results = [
      {
        name: 'Tag Format Validation',
        result: validateTagFormat(tag),
      },
      {
        name: 'CHANGELOG Entry Validation',
        result: validateChangelogEntry(tag),
      },
      {
        name: 'Release Template Validation',
        result: validateReleaseTemplate(),
      },
    ];
    
    // Print results and determine exit code
    const allPassed = printResults(tag, results);
    
    // Save validation report to file
    const reportPath = '.release-validation.log';
    const reportContent = results
      .map(
        ({ name, result }) =>
          `${name}: ${result.passed ? 'PASS' : 'FAIL'}\n${result.errors.join('\n')}`,
      )
      .join('\n\n');
    
    fs.writeFileSync(reportPath, reportContent);
    
    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error(
      `${colors.red}[ERROR] Validation failed with exception:${colors.reset}`,
    );
    console.error(error);
    process.exit(1);
  }
}

// Run validation
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
